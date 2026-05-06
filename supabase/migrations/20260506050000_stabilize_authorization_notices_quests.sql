-- First DDD stabilization batch: authorization context, notices, and quest completion hardening.

-- ============================================================================
-- Effective server-side permission checks
-- ============================================================================
create or replace function public.current_user_has_permission(requested_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with current_account as (
    select ma.user_id, ma.status, ma.is_bootstrap_admin
    from public.member_accounts ma
    where ma.user_id = auth.uid()
  ),
  position_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.org_position_assignments opa
      on opa.user_id = ca.user_id
     and opa.active = true
    join public.org_position_permissions opp
      on opp.org_position_id = opa.org_position_id
    join public.permissions perm
      on perm.id = opp.permission_id
    where ca.status = 'active'
  ),
  team_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.team_memberships tm
      on tm.user_id = ca.user_id
     and tm.active = true
    join public.team_role_permissions trp
      on trp.team_role_id = tm.team_role_id
    join public.permissions perm
      on perm.id = trp.permission_id
    where ca.status = 'active'
  ),
  tag_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.member_tag_assignments mta
      on mta.user_id = ca.user_id
    join public.member_tag_permissions mtp
      on mtp.tag_id = mta.tag_id
    join public.permissions perm
      on perm.code = mtp.permission
    where ca.status = 'active'
  )
  select exists (
    select 1
    from current_account ca
    where ca.status = 'active'
      and (
        ca.is_bootstrap_admin
        or requested_code in (select code from position_permissions)
        or requested_code in (select code from team_permissions)
        or requested_code in (select code from tag_permissions)
      )
  );
$$;

-- ============================================================================
-- Authorization context: remove legacy profile tag array dependency.
-- ============================================================================
create or replace function public.get_my_authorization_context()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      p.id,
      p.email::text as email,
      p.display_name,
      p.nickname_display,
      p.nickname_slug::text as nickname_slug,
      p.full_name,
      p.student_id,
      p.phone,
      p.college,
      p.department,
      p.club_affiliation,
      p.public_credit_name_mode,
      p.avatar_url,
      p.login_id::text as login_id,
      ma.status,
      ma.has_login_password,
      ma.is_bootstrap_admin,
      org.id as organization_id,
      org.slug::text as organization_slug,
      org.name as organization_name
    from public.profiles p
    left join public.member_accounts ma
      on ma.user_id = p.id
    left join public.organizations org
      on org.id = ma.organization_id
    where p.id = auth.uid()
  )
  select jsonb_build_object(
    'profile',
    (
      select jsonb_build_object(
        'id', b.id,
        'email', b.email,
        'displayName', coalesce(b.nickname_display, b.display_name),
        'nicknameDisplay', b.nickname_display,
        'nicknameSlug', b.nickname_slug,
        'fullName', b.full_name,
        'studentId', b.student_id,
        'phone', b.phone,
        'college', b.college,
        'department', b.department,
        'clubAffiliation', b.club_affiliation,
        'publicCreditNameMode', b.public_credit_name_mode,
        'avatarUrl', b.avatar_url,
        'loginId', b.login_id
      )
      from base b
    ),
    'account',
    (
      select jsonb_build_object(
        'status', b.status,
        'hasLoginPassword', b.has_login_password,
        'isBootstrapAdmin', b.is_bootstrap_admin
      )
      from base b
    ),
    'organization',
    (
      select jsonb_build_object(
        'id', b.organization_id,
        'slug', b.organization_slug,
        'name', b.organization_name
      )
      from base b
    ),
    'orgPositions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', op.id,
            'slug', op.slug,
            'name', op.name
          )
          order by op.name
        )
        from public.org_position_assignments opa
        join public.org_positions op
          on op.id = opa.org_position_id
        where opa.user_id = auth.uid()
          and opa.active = true
      ),
      '[]'::jsonb
    ),
    'teamMemberships',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'teamId', t.id,
            'teamSlug', t.slug,
            'teamName', t.name,
            'roleId', tr.id,
            'roleSlug', tr.slug,
            'roleName', tr.name
          )
          order by t.name
        )
        from public.team_memberships tm
        join public.teams t
          on t.id = tm.team_id
        left join public.team_roles tr
          on tr.id = tm.team_role_id
        where tm.user_id = auth.uid()
          and tm.active = true
      ),
      '[]'::jsonb
    ),
    'permissions',
    coalesce(
      (
        select jsonb_agg(code order by code)
        from (
          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.org_position_assignments opa
            on opa.user_id = ma.user_id
           and opa.active = true
          join public.org_position_permissions opp
            on opp.org_position_id = opa.org_position_id
          join public.permissions perm
            on perm.id = opp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.team_memberships tm
            on tm.user_id = ma.user_id
           and tm.active = true
          join public.team_role_permissions trp
            on trp.team_role_id = tm.team_role_id
          join public.permissions perm
            on perm.id = trp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.member_tag_assignments mta
            on mta.user_id = ma.user_id
          join public.member_tag_permissions mtp
            on mtp.tag_id = mta.tag_id
          join public.permissions perm
            on perm.code = mtp.permission
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select 'admin.access'
          from public.member_accounts ma
          where ma.user_id = auth.uid()
            and ma.status = 'active'
            and ma.is_bootstrap_admin = true
        ) permission_codes
      ),
      '[]'::jsonb
    )
  );
$$;

grant execute on function public.get_my_authorization_context() to authenticated;

create or replace function public.current_user_can_manage_announcements()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('announcements.manage');
$$;

grant execute on function public.current_user_can_manage_announcements() to authenticated;

-- Keep the frontend tag read models aligned with server authority. Old
-- definitions returned tag grants for any assigned user regardless of account
-- lifecycle status.
create or replace function public.current_user_tag_permissions()
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select distinct perm.code::text
  from public.member_accounts ma
  join public.member_tag_assignments mta
    on mta.user_id = ma.user_id
  join public.member_tag_permissions mtp
    on mtp.tag_id = mta.tag_id
  join public.permissions perm
    on perm.code = mtp.permission
  where ma.user_id = auth.uid()
    and ma.status = 'active';
$function$;

grant execute on function public.current_user_tag_permissions() to authenticated;

create or replace function public.current_user_tag_nav_paths()
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select distinct mtn.href
  from public.member_accounts ma
  join public.member_tag_assignments mta
    on mta.user_id = ma.user_id
  join public.member_tag_nav mtn
    on mtn.tag_id = mta.tag_id
  where ma.user_id = auth.uid()
    and ma.status = 'active';
$function$;

grant execute on function public.current_user_tag_nav_paths() to authenticated;

-- ============================================================================
-- Notices table and landing/admin RLS.
-- ============================================================================
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  audience_mode text not null default 'public' check (audience_mode in ('public', 'tag_in')),
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_status_created_at_idx
  on public.notices (status, created_at desc);

create index if not exists notices_author_created_at_idx
  on public.notices (author_id, created_at desc);

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'drop trigger if exists notices_set_updated_at on public.notices';
    execute 'create trigger notices_set_updated_at before update on public.notices for each row execute function public.set_updated_at()';
  else
    execute '
      create or replace function public.notices_set_updated_at()
      returns trigger
      language plpgsql
      as $body$
      begin
        new.updated_at := now();
        return new;
      end;
      $body$';
    execute 'drop trigger if exists notices_set_updated_at on public.notices';
    execute 'create trigger notices_set_updated_at before update on public.notices for each row execute function public.notices_set_updated_at()';
  end if;
end $$;

alter table public.notices enable row level security;

drop policy if exists "notices_admin_delete" on public.notices;
drop policy if exists "notices_admin_insert" on public.notices;
drop policy if exists "notices_admin_update" on public.notices;
drop policy if exists "notices_public_read" on public.notices;
drop policy if exists "notices_read_published_or_manage" on public.notices;
drop policy if exists "notices_insert_team_leads" on public.notices;
drop policy if exists "notices_update_team_leads" on public.notices;
drop policy if exists "notices_delete_team_leads" on public.notices;
drop policy if exists "notices_anon_read_published" on public.notices;
drop policy if exists "notices_authenticated_read_published_or_manage" on public.notices;
drop policy if exists "notices_managers_insert" on public.notices;
drop policy if exists "notices_managers_update" on public.notices;
drop policy if exists "notices_managers_delete" on public.notices;

create policy "notices_anon_read_published"
on public.notices
for select
to anon
using (status = 'published');

create policy "notices_authenticated_read_published_or_manage"
on public.notices
for select
to authenticated
using (
  status = 'published'
  or public.current_user_can_manage_announcements()
);

create policy "notices_managers_insert"
on public.notices
for insert
to authenticated
with check (
  public.current_user_can_manage_announcements()
  and author_id = auth.uid()
);

create policy "notices_managers_update"
on public.notices
for update
to authenticated
using (public.current_user_can_manage_announcements())
with check (public.current_user_can_manage_announcements());

create policy "notices_managers_delete"
on public.notices
for delete
to authenticated
using (public.current_user_can_manage_announcements());

grant select on public.notices to authenticated;
grant insert, update, delete on public.notices to authenticated;
revoke select on public.notices from anon;

create or replace view public.public_notices
with (security_invoker = false)
as
select id, title, body, created_at
from public.notices
where status = 'published';

grant select on public.public_notices to anon, authenticated;

-- ============================================================================
-- Quest completion direct insert hardening.
-- ============================================================================
create or replace function public.normalize_member_quest_completion_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and new.user_id = auth.uid() then
    new.status := 'submitted';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists member_quest_completions_normalize_insert
  on public.member_quest_completions;
create trigger member_quest_completions_normalize_insert
  before insert on public.member_quest_completions
  for each row execute function public.normalize_member_quest_completion_insert();

drop policy if exists "member_quest_completions_insert_self" on public.member_quest_completions;
create policy "member_quest_completions_insert_self"
  on public.member_quest_completions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_can_see_quest(quest_id)
    and status = 'submitted'
    and reviewed_by is null
    and reviewed_at is null
    and review_reason is null
  );
