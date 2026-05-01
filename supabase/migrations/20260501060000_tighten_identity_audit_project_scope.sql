-- Tighten KOBOT member workspace authorization boundaries.
-- This migration is intentionally additive/overriding: it does not delete data.

do $$
declare
  status_constraint record;
begin
  for status_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.member_accounts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
      and pg_get_constraintdef(oid) like '%pending%'
  loop
    execute format(
      'alter table public.member_accounts drop constraint %I',
      status_constraint.conname
    );
  end loop;

  alter table public.member_accounts
    add constraint member_accounts_status_check
    check (
      status in (
        'pending',
        'active',
        'suspended',
        'rejected',
        'alumni',
        'project_only',
        'withdrawn'
      )
    );
end;
$$;

create or replace function public.normalize_nickname_slug(input_nickname text)
returns text
language plpgsql
immutable
as $$
declare
  trimmed text;
  squashed text;
begin
  if input_nickname is null then
    return null;
  end if;

  trimmed := btrim(input_nickname);
  if trimmed = '' then
    return null;
  end if;

  if position('_' in trimmed) > 0 then
    raise exception 'Nickname cannot contain underscores. Use spaces instead.';
  end if;

  squashed := regexp_replace(trimmed, '[[:space:]]+', ' ', 'g');
  if char_length(squashed) < 2 or char_length(squashed) > 12 then
    raise exception 'Nickname must be between 2 and 12 characters.';
  end if;

  if squashed !~ U&'^[0-9A-Za-z\AC00-\D7A3 ]+$' then
    raise exception 'Nickname can contain only Korean, English letters, numbers, and spaces.';
  end if;

  return lower(regexp_replace(squashed, '[[:space:]]+', '_', 'g'));
end;
$$;

create or replace function public.resolve_login_email(login_id_input text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.email::text
  from public.profiles p
  join public.member_accounts ma
    on ma.user_id = p.id
  where p.login_id = lower(trim(login_id_input))::citext
    and p.login_id is not null
    and ma.has_login_password = true
    and ma.status = 'active'
  limit 1;
$$;

create or replace function public.current_user_is_project_team_lead(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_is_active_member()
    and exists (
      select 1
      from public.project_team_memberships ptm
      where ptm.project_team_id = target_project_team_id
        and ptm.user_id = auth.uid()
        and ptm.status = 'active'
        and ptm.role = 'lead'
    );
$$;

create or replace function public.current_user_is_project_operator(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_is_active_member()
    and exists (
      select 1
      from public.project_team_memberships ptm
      where ptm.project_team_id = target_project_team_id
        and ptm.user_id = auth.uid()
        and ptm.status = 'active'
        and ptm.role in ('lead', 'maintainer')
    );
$$;

create or replace function public.current_user_has_project_delegated_scope(
  target_project_team_id uuid,
  requested_scope text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_is_active_member()
    and requested_scope is not null
    and exists (
      select 1
      from public.authority_delegations ad
      where ad.project_team_id = target_project_team_id
        and ad.delegate_user_id = auth.uid()
        and ad.status = 'accepted'
        and ad.starts_at <= now()
        and ad.expires_at > now()
        and ad.scope @> array[requested_scope]::text[]
    );
$$;

create or replace function public.current_user_is_official_team_lead(target_official_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_is_active_member()
    and exists (
      select 1
      from public.team_memberships tm
      join public.team_roles tr
        on tr.id = tm.team_role_id
      where tm.team_id = target_official_team_id
        and tm.user_id = auth.uid()
        and tm.active = true
        and tr.slug = 'team-lead'
    );
$$;

create or replace function public.current_user_can_review_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or exists (
      select 1
      from public.project_teams pt
      where pt.id = target_project_team_id
        and pt.official_team_id is not null
        and public.current_user_is_official_team_lead(pt.official_team_id)
    );
$$;

create or replace function public.can_read_private_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_teams pt
    where pt.id = target_project_team_id
      and (
        (pt.status = 'active' and pt.visibility = 'public' and public.current_user_is_active_member())
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or exists (
          select 1
          from public.project_team_memberships ptm
          where ptm.project_team_id = pt.id
            and ptm.user_id = auth.uid()
            and ptm.status = 'active'
        )
      )
  );
$$;

create or replace function public.current_user_can_read_project_audit(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_is_project_team_lead(target_project_team_id);
$$;

grant execute on function public.normalize_nickname_slug(text) to anon, authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant execute on function public.current_user_is_project_team_lead(uuid) to authenticated;
grant execute on function public.current_user_is_project_operator(uuid) to authenticated;
grant execute on function public.current_user_has_project_delegated_scope(uuid, text) to authenticated;
grant execute on function public.current_user_is_official_team_lead(uuid) to authenticated;
grant execute on function public.current_user_can_review_project(uuid) to authenticated;
grant execute on function public.current_user_can_read_project_audit(uuid) to authenticated;
grant execute on function public.can_read_private_project(uuid) to authenticated;

revoke execute on function public.create_audit_log(
  text,
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  jsonb,
  jsonb,
  text,
  jsonb
) from public, anon, authenticated;

drop policy if exists "audit_logs_select_admins_or_project_leads" on public.audit_logs;
create policy "audit_logs_select_admins_or_project_leads" on public.audit_logs
for select using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or (
    target_project_team_id is not null
    and public.current_user_can_read_project_audit(target_project_team_id)
  )
);

drop policy if exists "audit_logs_insert_active_members" on public.audit_logs;

drop policy if exists "project_teams_update_admins_or_leads" on public.project_teams;
create policy "project_teams_update_admins_or_leads" on public.project_teams
for update using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(id)
) with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(id)
);

drop policy if exists "project_team_memberships_manage_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_insert_admins_leads_or_review_delegates" on public.project_team_memberships;
drop policy if exists "project_team_memberships_update_admins_leads_or_review_delegates" on public.project_team_memberships;
drop policy if exists "project_team_memberships_insert_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_update_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_delete_admins_or_leads" on public.project_team_memberships;

create policy "project_team_memberships_insert_admins_or_leads"
on public.project_team_memberships
for insert with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

create policy "project_team_memberships_update_admins_or_leads"
on public.project_team_memberships
for update using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
) with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

create policy "project_team_memberships_delete_admins_or_leads"
on public.project_team_memberships
for delete using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "project_team_join_requests_select_self_or_leads" on public.project_team_join_requests;
create policy "project_team_join_requests_select_self_or_leads" on public.project_team_join_requests
for select using (
  requester_user_id = auth.uid()
  or public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
  or public.current_user_has_project_delegated_scope(project_team_id, 'review_join_requests')
);

drop policy if exists "project_team_join_requests_update_self_or_leads" on public.project_team_join_requests;
create policy "project_team_join_requests_update_self_or_leads" on public.project_team_join_requests
for update using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
) with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "invitation_codes_select_admins_or_leads" on public.invitation_codes;
create policy "invitation_codes_select_admins_or_leads" on public.invitation_codes
for select using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('teams.manage')
  or (
    project_team_id is not null
    and (
      public.current_user_is_project_team_lead(project_team_id)
      or public.current_user_has_project_delegated_scope(project_team_id, 'invite_members')
    )
  )
);

drop policy if exists "invitation_codes_manage_admins_or_leads" on public.invitation_codes;
create policy "invitation_codes_manage_admins_or_leads" on public.invitation_codes
for all using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('teams.manage')
  or (
    project_team_id is not null
    and (
      public.current_user_is_project_team_lead(project_team_id)
      or public.current_user_has_project_delegated_scope(project_team_id, 'invite_members')
    )
  )
) with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('teams.manage')
  or (
    project_team_id is not null
    and (
      public.current_user_is_project_team_lead(project_team_id)
      or public.current_user_has_project_delegated_scope(project_team_id, 'invite_members')
    )
  )
);

drop policy if exists "votes_manage_admins_or_leads" on public.votes;
create policy "votes_manage_admins_or_leads" on public.votes
for all using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or (
    project_team_id is not null
    and public.current_user_is_project_team_lead(project_team_id)
  )
) with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or (
    project_team_id is not null
    and public.current_user_is_project_team_lead(project_team_id)
  )
);

drop policy if exists "vote_options_manage_vote_managers" on public.vote_options;
create policy "vote_options_manage_vote_managers" on public.vote_options
for all using (
  exists (
    select 1
    from public.votes v
    where v.id = vote_id
      and (
        public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or (
          v.project_team_id is not null
          and public.current_user_is_project_team_lead(v.project_team_id)
        )
      )
  )
) with check (
  exists (
    select 1
    from public.votes v
    where v.id = vote_id
      and (
        public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or (
          v.project_team_id is not null
          and public.current_user_is_project_team_lead(v.project_team_id)
        )
      )
  )
);

drop policy if exists "authority_delegations_select_involved_or_leads" on public.authority_delegations;
create policy "authority_delegations_select_involved_or_leads" on public.authority_delegations
for select using (
  delegator_user_id = auth.uid()
  or delegate_user_id = auth.uid()
  or public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "authority_delegations_manage_involved_or_leads" on public.authority_delegations;
drop policy if exists "authority_delegations_insert_admins_or_project_leads" on public.authority_delegations;
drop policy if exists "authority_delegations_update_admins_or_delegators" on public.authority_delegations;
drop policy if exists "authority_delegations_delete_admins_or_delegators" on public.authority_delegations;

create policy "authority_delegations_insert_admins_or_project_leads"
on public.authority_delegations
for insert with check (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or (
    delegator_user_id = auth.uid()
    and public.current_user_is_project_team_lead(project_team_id)
  )
);

create policy "authority_delegations_update_admins_or_delegators"
on public.authority_delegations
for update using (
  delegator_user_id = auth.uid()
  or public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
) with check (
  delegator_user_id = auth.uid()
  or public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

create policy "authority_delegations_delete_admins_or_delegators"
on public.authority_delegations
for delete using (
  delegator_user_id = auth.uid()
  or public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);
