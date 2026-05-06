-- GitHub project repository integration.
-- GitHub belongs to its own integration domain. Project lifecycle tables only
-- enqueue sync work; repository links, teams, identities, and provider events
-- are stored separately.

create table if not exists public.member_github_identities (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  github_login citext,
  github_user_id bigint,
  github_url text,
  connection_status text not null default 'linked'
    check (connection_status in ('linked', 'disconnected', 'invalid')),
  source text not null default 'profile_url'
    check (source in ('profile_url', 'oauth', 'admin')),
  last_resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists member_github_identities_login_idx
  on public.member_github_identities (github_login)
  where github_login is not null and connection_status = 'linked';

create table if not exists public.project_github_links (
  project_team_id uuid primary key references public.project_teams (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  github_org text not null default 'Kookmin-Kobot',
  repo_name text not null,
  repo_full_name text,
  repo_id bigint,
  html_url text,
  default_branch text not null default 'main',
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  permission_state text not null default 'normal'
    check (permission_state in ('normal', 'read_only', 'disabled')),
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'synced', 'failed', 'read_only')),
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (github_org, repo_name)
);

create table if not exists public.project_github_teams (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid not null references public.project_teams (id) on delete cascade,
  github_org text not null default 'Kookmin-Kobot',
  team_kind text not null check (team_kind in ('leads', 'members')),
  github_team_id bigint,
  team_slug text not null,
  team_name text not null,
  repository_permission text not null
    check (repository_permission in ('pull', 'triage', 'push', 'maintain', 'admin')),
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_team_id, team_kind),
  unique (github_org, team_slug)
);

create table if not exists public.github_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  job_type text not null check (
    job_type in (
      'project_repo_provision',
      'project_member_invite',
      'project_member_remove',
      'project_repo_freeze'
    )
  ),
  status text not null default 'pending'
    check (status in ('pending', 'blocked', 'processing', 'succeeded', 'failed', 'skipped', 'canceled')),
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists github_sync_jobs_ready_idx
  on public.github_sync_jobs (status, run_after, created_at)
  where status = 'pending';

create index if not exists github_sync_jobs_project_idx
  on public.github_sync_jobs (project_team_id, created_at desc);

create table if not exists public.github_sync_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.github_sync_jobs (id) on delete cascade,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  status text not null default 'recorded'
    check (status in ('recorded', 'warning', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists github_sync_events_project_idx
  on public.github_sync_events (project_team_id, created_at desc);

drop trigger if exists member_github_identities_set_updated_at on public.member_github_identities;
create trigger member_github_identities_set_updated_at
before update on public.member_github_identities
for each row execute function public.set_updated_at();

drop trigger if exists project_github_links_set_updated_at on public.project_github_links;
create trigger project_github_links_set_updated_at
before update on public.project_github_links
for each row execute function public.set_updated_at();

drop trigger if exists project_github_teams_set_updated_at on public.project_github_teams;
create trigger project_github_teams_set_updated_at
before update on public.project_github_teams
for each row execute function public.set_updated_at();

drop trigger if exists github_sync_jobs_set_updated_at on public.github_sync_jobs;
create trigger github_sync_jobs_set_updated_at
before update on public.github_sync_jobs
for each row execute function public.set_updated_at();

alter table public.member_github_identities enable row level security;
alter table public.project_github_links enable row level security;
alter table public.project_github_teams enable row level security;
alter table public.github_sync_jobs enable row level security;
alter table public.github_sync_events enable row level security;

drop policy if exists "member_github_identities_select_own_or_admin"
  on public.member_github_identities;
create policy "member_github_identities_select_own_or_admin"
  on public.member_github_identities
  for select
  using (
    user_id = auth.uid()
    or public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
  );

drop policy if exists "project_github_links_select_project_scope"
  on public.project_github_links;
create policy "project_github_links_select_project_scope"
  on public.project_github_links
  for select
  using (public.current_user_can_read_project_member_scope(project_team_id));

drop policy if exists "project_github_teams_select_project_scope"
  on public.project_github_teams;
create policy "project_github_teams_select_project_scope"
  on public.project_github_teams
  for select
  using (public.current_user_can_read_project_member_scope(project_team_id));

drop policy if exists "github_sync_jobs_select_related"
  on public.github_sync_jobs;
create policy "github_sync_jobs_select_related"
  on public.github_sync_jobs
  for select
  using (
    user_id = auth.uid()
    or public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
    or (
      project_team_id is not null
      and public.current_user_can_manage_project(project_team_id)
    )
  );

drop policy if exists "github_sync_events_select_related"
  on public.github_sync_events;
create policy "github_sync_events_select_related"
  on public.github_sync_events
  for select
  using (
    user_id = auth.uid()
    or public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
    or (
      project_team_id is not null
      and public.current_user_can_manage_project(project_team_id)
    )
  );

grant select on public.member_github_identities to authenticated;
grant select on public.project_github_links to authenticated;
grant select on public.project_github_teams to authenticated;
grant select on public.github_sync_jobs to authenticated;
grant select on public.github_sync_events to authenticated;

create or replace function public.extract_github_login(p_github_url text)
returns text
language plpgsql
immutable
as $$
declare
  v_url text := btrim(coalesce(p_github_url, ''));
  v_matches text[];
  v_login text;
begin
  if v_url = '' then
    return null;
  end if;

  v_matches := regexp_match(v_url, '^https://github\.com/([^/?#]+)(?:[/?#].*)?$');
  if v_matches is null then
    return null;
  end if;

  v_login := lower(v_matches[1]);

  if v_login in (
    'about', 'apps', 'blog', 'collections', 'contact', 'customer-stories',
    'enterprise', 'events', 'explore', 'features', 'github', 'login',
    'marketplace', 'new', 'notifications', 'orgs', 'organizations', 'pricing',
    'pulls', 'search', 'settings', 'sponsors', 'topics'
  ) then
    return null;
  end if;

  if v_login !~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$' then
    return null;
  end if;

  return v_login;
end;
$$;

create or replace function public.refresh_member_github_identity(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_login text;
  v_actor uuid := auth.uid();
begin
  if p_user_id is null then
    return false;
  end if;

  if v_actor is not null
    and v_actor <> p_user_id
    and not (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or exists (
        select 1
        from public.project_team_memberships ptm
        where ptm.user_id = p_user_id
          and ptm.status = 'active'
          and public.current_user_can_manage_project(ptm.project_team_id)
      )
    ) then
    raise exception 'You can only refresh your own GitHub identity.';
  end if;

  select github_url
    into v_url
  from public.profiles
  where id = p_user_id;

  v_login := public.extract_github_login(v_url);

  if v_login is null then
    update public.member_github_identities
    set
      github_url = nullif(btrim(coalesce(v_url, '')), ''),
      connection_status = case
        when nullif(btrim(coalesce(v_url, '')), '') is null then 'disconnected'
        else 'invalid'
      end,
      updated_at = now()
    where user_id = p_user_id;

    update public.github_sync_jobs
    set
      status = 'blocked',
      last_error = 'missing_github_identity',
      updated_at = now()
    where user_id = p_user_id
      and job_type = 'project_member_invite'
      and status in ('pending', 'failed');

    return false;
  end if;

  insert into public.member_github_identities (
    user_id,
    github_login,
    github_url,
    connection_status,
    source
  )
  values (
    p_user_id,
    v_login,
    v_url,
    'linked',
    'profile_url'
  )
  on conflict (user_id) do update
  set
    github_login = excluded.github_login,
    github_url = excluded.github_url,
    connection_status = 'linked',
    source = 'profile_url',
    updated_at = now();

  update public.github_sync_jobs
  set
    status = 'pending',
    run_after = now(),
    last_error = null,
    updated_at = now()
  where user_id = p_user_id
    and job_type = 'project_member_invite'
    and status = 'blocked';

  return true;
end;
$$;

create or replace function public.enqueue_github_sync_job(
  p_job_type text,
  p_project_team_id uuid default null,
  p_user_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.project_teams;
  v_status text := 'pending';
  v_last_error text;
  v_key text;
  v_job_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_has_identity boolean := true;
  v_actor uuid := auth.uid();
begin
  if v_actor is not null
    and not (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or (
        p_project_team_id is not null
        and public.current_user_can_manage_project(p_project_team_id)
      )
    ) then
    raise exception 'You cannot enqueue GitHub sync jobs for this project.';
  end if;

  if p_job_type not in (
    'project_repo_provision',
    'project_member_invite',
    'project_member_remove',
    'project_repo_freeze'
  ) then
    raise exception 'Unsupported GitHub sync job type.';
  end if;

  if p_project_team_id is not null then
    select *
      into v_project
    from public.project_teams
    where id = p_project_team_id;

    if v_project.id is null then
      raise exception 'Project not found for GitHub sync.';
    end if;
  end if;

  if p_job_type = 'project_member_invite' and p_user_id is not null then
    v_has_identity := public.refresh_member_github_identity(p_user_id);
    if not v_has_identity then
      v_status := 'blocked';
      v_last_error := 'missing_github_identity';
    end if;
  end if;

  v_key := p_job_type
    || ':project=' || coalesce(p_project_team_id::text, 'none')
    || ':user=' || coalesce(p_user_id::text, 'none');

  insert into public.github_sync_jobs (
    organization_id,
    project_team_id,
    user_id,
    job_type,
    status,
    idempotency_key,
    payload,
    run_after,
    last_error
  )
  values (
    case when p_project_team_id is null then null else v_project.organization_id end,
    p_project_team_id,
    p_user_id,
    p_job_type,
    v_status,
    v_key,
    v_payload,
    now(),
    v_last_error
  )
  on conflict (idempotency_key) do update
  set
    status = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.status
      when github_sync_jobs.status = 'succeeded'
        and excluded.status = 'pending'
        and excluded.job_type in ('project_repo_provision') then github_sync_jobs.status
      else excluded.status
    end,
    payload = excluded.payload,
    run_after = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.run_after
      else now()
    end,
    attempts = case
      when github_sync_jobs.status in ('failed', 'blocked', 'skipped') then 0
      else github_sync_jobs.attempts
    end,
    last_error = excluded.last_error,
    completed_at = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.completed_at
      when github_sync_jobs.status = 'succeeded'
        and excluded.job_type in ('project_repo_provision') then github_sync_jobs.completed_at
      else null
    end,
    updated_at = now()
  returning id into v_job_id;

  perform public.create_audit_log(
    'github.sync.enqueue',
    p_user_id,
    p_project_team_id,
    null,
    'github_sync_jobs',
    v_job_id,
    null,
    jsonb_build_object('jobType', p_job_type, 'status', v_status),
    v_last_error,
    jsonb_build_object('source', 'github_sync_enqueue')
  );

  return v_job_id;
end;
$$;

create or replace function public.handle_profile_github_identity_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_member_github_identity(new.id);
  return new;
end;
$$;

drop trigger if exists profiles_sync_github_identity on public.profiles;
create trigger profiles_sync_github_identity
after insert or update of github_url on public.profiles
for each row execute function public.handle_profile_github_identity_sync();

create or replace function public.handle_project_github_status_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status in ('active', 'recruiting') then
    perform public.enqueue_github_sync_job(
      'project_repo_provision',
      new.id,
      null,
      jsonb_build_object(
        'githubOrg', 'Kookmin-Kobot',
        'visibility', 'private',
        'leadPermission', 'maintain',
        'memberPermission', 'push'
      )
    );
  elsif tg_op = 'UPDATE' then
    if old.status = 'pending' and new.status in ('active', 'recruiting') then
      perform public.enqueue_github_sync_job(
        'project_repo_provision',
        new.id,
        null,
        jsonb_build_object(
          'githubOrg', 'Kookmin-Kobot',
          'visibility', 'private',
          'leadPermission', 'maintain',
          'memberPermission', 'push'
        )
      );
    end if;

    if old.status is distinct from 'archived' and new.status = 'archived' then
      perform public.enqueue_github_sync_job(
        'project_repo_freeze',
        new.id,
        null,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'permission', 'pull')
      );
    end if;

    if new.lead_user_id is not null
      and old.lead_user_id is distinct from new.lead_user_id
      and new.status in ('active', 'recruiting') then
      perform public.enqueue_github_sync_job(
        'project_member_invite',
        new.id,
        new.lead_user_id,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'projectRole', 'lead')
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists project_teams_github_status_sync on public.project_teams;
create trigger project_teams_github_status_sync
after insert or update of status, lead_user_id on public.project_teams
for each row execute function public.handle_project_github_status_sync();

create or replace function public.handle_project_membership_github_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.project_teams;
  v_project_team_id uuid;
begin
  if tg_op = 'DELETE' then
    v_project_team_id := old.project_team_id;
  else
    v_project_team_id := new.project_team_id;
  end if;

  select *
    into v_project
  from public.project_teams
  where id = v_project_team_id;

  if v_project.id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.status = 'active'
      and v_project.status in ('active', 'recruiting')
      and (
        tg_op = 'INSERT'
        or old.status is distinct from new.status
        or old.role is distinct from new.role
      ) then
      perform public.enqueue_github_sync_job(
        'project_member_invite',
        new.project_team_id,
        new.user_id,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'projectRole', new.role)
      );
    elsif tg_op = 'UPDATE'
      and old.status = 'active'
      and new.status <> 'active'
      and v_project.status in ('active', 'recruiting', 'archived') then
      perform public.enqueue_github_sync_job(
        'project_member_remove',
        old.project_team_id,
        old.user_id,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'previousRole', old.role)
      );
    end if;
  elsif tg_op = 'DELETE' and old.status = 'active' then
    perform public.enqueue_github_sync_job(
      'project_member_remove',
      old.project_team_id,
      old.user_id,
      jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'previousRole', old.role)
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists project_team_memberships_github_sync on public.project_team_memberships;
create trigger project_team_memberships_github_sync
after insert or update of status, role or delete on public.project_team_memberships
for each row execute function public.handle_project_membership_github_sync();

revoke all on function public.extract_github_login(text) from public, anon;
revoke all on function public.refresh_member_github_identity(uuid) from public, anon;
revoke all on function public.enqueue_github_sync_job(text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.handle_profile_github_identity_sync() from public, anon;
revoke all on function public.handle_project_github_status_sync() from public, anon;
revoke all on function public.handle_project_membership_github_sync() from public, anon;

grant execute on function public.extract_github_login(text) to authenticated;
grant execute on function public.refresh_member_github_identity(uuid) to authenticated;

do $$
declare
  v_profile record;
  v_project record;
begin
  for v_profile in
    select id from public.profiles where github_url is not null
  loop
    perform public.refresh_member_github_identity(v_profile.id);
  end loop;

  for v_project in
    select id from public.project_teams where status in ('active', 'recruiting')
  loop
    perform public.enqueue_github_sync_job(
      'project_repo_provision',
      v_project.id,
      null,
      jsonb_build_object(
        'githubOrg', 'Kookmin-Kobot',
        'visibility', 'private',
        'leadPermission', 'maintain',
        'memberPermission', 'push',
        'backfill', true
      )
    );
  end loop;
end;
$$;
