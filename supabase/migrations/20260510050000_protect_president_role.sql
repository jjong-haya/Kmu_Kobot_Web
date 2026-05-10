-- Protect the President role from being modified by anyone other than a
-- sitting President (or the bootstrap admin). Vice President now has the
-- same RBAC permissions as President, so we have to guard the *target*
-- side: who can be demoted, who can lose their account, whose perms can
-- be touched.
--
-- Rules enforced by triggers below:
--   1. org_position_assignments: only a President can INSERT/UPDATE/DELETE
--      a row whose org_position_id is the President position.
--   2. org_position_permissions: only a President can mutate the perm
--      grants attached to the President position (so VP can't yank
--      permissions.manage off President).
--   3. member_accounts: only a President can DELETE a member who currently
--      holds the President position, or downgrade their status away from
--      'active'. (Self-demotion is allowed because the actor IS President.)
--
-- Bootstrap admin is treated as President for the purposes of these
-- guards so the original installer can always recover.

-- ---------------------------------------------------------------------------
-- Helper — is the given user effectively a President right now?
-- ---------------------------------------------------------------------------
create or replace function public.user_is_president(uid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.org_position_assignments opa
    join public.org_positions op on op.id = opa.org_position_id
    where opa.user_id = uid
      and opa.active = true
      and op.slug = 'president'
  )
  or exists (
    select 1 from public.member_accounts ma
    where ma.user_id = uid and ma.is_bootstrap_admin = true
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Position assignment guard
-- ---------------------------------------------------------------------------
create or replace function public.protect_president_position_assignment()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  president_id uuid;
begin
  select id into president_id from public.org_positions where slug = 'president' limit 1;
  if president_id is null then
    return coalesce(NEW, OLD);
  end if;

  if TG_OP in ('UPDATE', 'DELETE') and OLD.org_position_id = president_id then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_modify_president_assignment';
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') and NEW.org_position_id = president_id then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_assign_president';
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists protect_president_assignment on public.org_position_assignments;
create trigger protect_president_assignment
before insert or update or delete on public.org_position_assignments
for each row execute function public.protect_president_position_assignment();

-- ---------------------------------------------------------------------------
-- 2. Position permissions guard (so VP can't strip President's perms)
-- ---------------------------------------------------------------------------
create or replace function public.protect_president_position_permissions()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  president_id uuid;
begin
  select id into president_id from public.org_positions where slug = 'president' limit 1;
  if president_id is null then
    return coalesce(NEW, OLD);
  end if;

  if TG_OP in ('UPDATE', 'DELETE') and OLD.org_position_id = president_id then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_modify_president_permissions';
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') and NEW.org_position_id = president_id then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_modify_president_permissions';
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists protect_president_permissions on public.org_position_permissions;
create trigger protect_president_permissions
before insert or update or delete on public.org_position_permissions
for each row execute function public.protect_president_position_permissions();

-- ---------------------------------------------------------------------------
-- 3. Member account guard (delete + status downgrade)
-- ---------------------------------------------------------------------------
create or replace function public.protect_president_member_account()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  president_id uuid;
  target_is_president boolean;
begin
  select id into president_id from public.org_positions where slug = 'president' limit 1;
  if president_id is null then
    return coalesce(NEW, OLD);
  end if;

  select exists (
    select 1
    from public.org_position_assignments opa
    where opa.user_id = OLD.user_id
      and opa.org_position_id = president_id
      and opa.active = true
  ) into target_is_president;

  if not target_is_president then
    return coalesce(NEW, OLD);
  end if;

  if TG_OP = 'DELETE' then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_delete_president';
    end if;
  end if;

  if TG_OP = 'UPDATE'
     and OLD.status = 'active'
     and NEW.status is distinct from 'active' then
    if not public.user_is_president(auth.uid()) then
      raise exception 'forbidden:cannot_demote_president';
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists protect_president_account on public.member_accounts;
create trigger protect_president_account
before update or delete on public.member_accounts
for each row execute function public.protect_president_member_account();

notify pgrst, 'reload schema';
