-- Project review/join commands and the first project-linked study log slice.
-- The intent is to keep lifecycle transitions and private study visibility
-- behind RPC/RLS instead of relying on UI fallbacks or direct table writes.

insert into public.permissions (code, description)
values
  ('studies.manage', 'Manage study sessions, records, and materials')
on conflict (code) do update
set description = excluded.description;

create unique index if not exists project_team_join_requests_one_pending_idx
  on public.project_team_join_requests (project_team_id, requester_user_id)
  where status = 'pending';

create index if not exists project_team_join_requests_project_status_idx
  on public.project_team_join_requests (project_team_id, status, created_at desc);

create or replace function public.current_user_can_review_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
    or exists (
      select 1
      from public.project_teams pt
      where pt.id = target_project_team_id
        and pt.official_team_id is not null
        and public.current_user_is_official_team_lead(pt.official_team_id)
    );
$$;

create or replace function public.current_user_can_manage_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or public.current_user_is_project_operator(target_project_team_id)
      or public.current_user_has_project_delegated_scope(target_project_team_id, 'review_join_requests')
      or public.current_user_has_project_delegated_scope(target_project_team_id, 'manage_project_materials')
      or public.current_user_has_project_delegated_scope(target_project_team_id, 'manage_activity_logs')
    );
$$;

create or replace function public.current_user_can_read_project_member_scope(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or exists (
        select 1
        from public.project_team_memberships ptm
        where ptm.project_team_id = target_project_team_id
          and ptm.user_id = auth.uid()
          and ptm.status = 'active'
      )
    );
$$;

drop policy if exists "project_teams_update_admins_or_leads" on public.project_teams;
drop policy if exists "project_teams_update_admins_only" on public.project_teams;
drop policy if exists "project_teams_update_project_managers" on public.project_teams;

drop policy if exists "project_team_memberships_manage_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_insert_admins_leads_or_review_delegates" on public.project_team_memberships;
drop policy if exists "project_team_memberships_update_admins_leads_or_review_delegates" on public.project_team_memberships;
drop policy if exists "project_team_memberships_insert_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_update_admins_or_leads" on public.project_team_memberships;
drop policy if exists "project_team_memberships_delete_admins_or_leads" on public.project_team_memberships;

drop policy if exists "project_team_join_requests_insert_self" on public.project_team_join_requests;
drop policy if exists "project_team_join_requests_update_self_or_leads" on public.project_team_join_requests;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  title text not null,
  description text,
  host_user_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  visibility text not null default 'project' check (visibility in ('member', 'project', 'tag', 'public')),
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'completed', 'canceled')),
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.study_session_audience_tags (
  study_session_id uuid not null references public.study_sessions (id) on delete cascade,
  tag_id uuid not null references public.member_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (study_session_id, tag_id)
);

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  study_session_id uuid references public.study_sessions (id) on delete cascade,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  title text not null,
  material_type text not null default 'link' check (material_type in ('link', 'file', 'note')),
  url text,
  storage_path text,
  visibility text not null default 'project' check (visibility in ('session', 'project', 'member', 'public')),
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (url is null or url ~* '^https://')
);

create table if not exists public.study_records (
  id uuid primary key default gen_random_uuid(),
  study_session_id uuid references public.study_sessions (id) on delete set null,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  occurred_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'reviewed', 'locked')),
  visibility text not null default 'project' check (visibility in ('self', 'project', 'member', 'public')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_sessions_project_time_idx
  on public.study_sessions (project_team_id, starts_at desc nulls last);
create index if not exists study_records_project_time_idx
  on public.study_records (project_team_id, occurred_at desc, created_at desc);
create index if not exists study_records_author_time_idx
  on public.study_records (author_user_id, occurred_at desc, created_at desc);
create index if not exists study_materials_project_idx
  on public.study_materials (project_team_id, created_at desc);

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at before update on public.study_sessions
for each row execute function public.set_updated_at();

drop trigger if exists study_records_set_updated_at on public.study_records;
create trigger study_records_set_updated_at before update on public.study_records
for each row execute function public.set_updated_at();

alter table public.study_sessions enable row level security;
alter table public.study_session_audience_tags enable row level security;
alter table public.study_materials enable row level security;
alter table public.study_records enable row level security;

create or replace function public.current_user_can_read_study_session(target_study_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.study_sessions ss
    where ss.id = target_study_session_id
      and (
        ss.created_by = auth.uid()
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('studies.manage')
        or (
          ss.visibility in ('public', 'member')
          and ss.status <> 'draft'
          and public.current_user_is_active_member()
        )
        or (
          ss.visibility = 'project'
          and ss.project_team_id is not null
          and public.current_user_can_read_project_member_scope(ss.project_team_id)
        )
        or (
          ss.visibility = 'tag'
          and ss.status <> 'draft'
          and public.current_user_is_active_member()
          and exists (
            select 1
            from public.study_session_audience_tags ssat
            join public.member_tag_assignments mta
              on mta.tag_id = ssat.tag_id
            where ssat.study_session_id = ss.id
              and mta.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.current_user_can_manage_study_session(target_study_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.study_sessions ss
    where ss.id = target_study_session_id
      and (
        public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('studies.manage')
        or (
          ss.project_team_id is not null
          and public.current_user_can_manage_project(ss.project_team_id)
        )
      )
  );
$$;

create or replace function public.current_user_can_read_study_record(target_study_record_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.study_records sr
    where sr.id = target_study_record_id
      and (
        sr.author_user_id = auth.uid()
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('studies.manage')
        or (
          sr.status <> 'draft'
          and sr.visibility in ('member', 'public')
          and public.current_user_is_active_member()
        )
        or (
          sr.status <> 'draft'
          and sr.visibility = 'project'
          and sr.project_team_id is not null
          and public.current_user_can_read_project_member_scope(sr.project_team_id)
        )
      )
  );
$$;

drop policy if exists "study_sessions_select_readable" on public.study_sessions;
create policy "study_sessions_select_readable"
on public.study_sessions
for select to authenticated
using (public.current_user_can_read_study_session(id));

drop policy if exists "study_session_audience_tags_select_readable" on public.study_session_audience_tags;
create policy "study_session_audience_tags_select_readable"
on public.study_session_audience_tags
for select to authenticated
using (public.current_user_can_read_study_session(study_session_id));

drop policy if exists "study_materials_select_readable" on public.study_materials;
create policy "study_materials_select_readable"
on public.study_materials
for select to authenticated
using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('studies.manage')
  or (
    study_session_id is not null
    and visibility = 'session'
    and public.current_user_can_read_study_session(study_session_id)
  )
  or (
    project_team_id is not null
    and visibility = 'project'
    and public.current_user_can_read_project_member_scope(project_team_id)
  )
  or (
    visibility in ('member', 'public')
    and public.current_user_is_active_member()
  )
);

drop policy if exists "study_records_select_readable" on public.study_records;
create policy "study_records_select_readable"
on public.study_records
for select to authenticated
using (public.current_user_can_read_study_record(id));

grant select on public.project_team_join_requests to authenticated;
grant select on public.study_sessions, public.study_session_audience_tags, public.study_materials, public.study_records to authenticated;

create or replace function public.review_project_team(
  p_project_team_id uuid,
  p_decision text,
  p_reason text default null
)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_updated public.project_teams;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if not public.current_user_can_review_project(v_project.id) then
    raise exception '프로젝트를 검토할 권한이 없습니다.';
  end if;

  if v_project.status <> 'pending' then
    raise exception '검토중인 프로젝트만 승인하거나 반려할 수 있습니다.';
  end if;

  if v_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  update public.project_teams
  set
    status = case when v_decision = 'approve' then 'active' else 'rejected' end,
    approved_by = case when v_decision = 'approve' then v_actor else null end,
    approved_at = case when v_decision = 'approve' then now() else null end,
    metadata = metadata || jsonb_build_object(
      'lastReview',
      jsonb_build_object(
        'decision', v_decision,
        'reason', v_reason,
        'reviewedBy', v_actor,
        'reviewedAt', now()
      )
    )
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.review',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object('status', v_project.status, 'visibility', v_project.visibility),
    jsonb_build_object('status', v_updated.status, 'visibility', v_updated.visibility),
    v_reason,
    jsonb_build_object('decision', v_decision)
  );

  with recipients as (
    select distinct recipient_id
    from (
      select v_project.created_by as recipient_id
      union all select v_project.owner_user_id
      union all select v_project.lead_user_id
      union all
      select ptm.user_id
      from public.project_team_memberships ptm
      where ptm.project_team_id = v_project.id
        and ptm.status = 'active'
        and ptm.role in ('lead', 'maintainer')
    ) raw
    where recipient_id is not null
      and recipient_id <> v_actor
  )
  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  select
    recipients.recipient_id,
    v_actor,
    case when v_decision = 'approve' then 'project.approved' else 'project.rejected' end,
    case when v_decision = 'approve' then '프로젝트가 승인되었습니다' else '프로젝트가 반려되었습니다' end,
    case
      when v_decision = 'approve' then v_project.name || ' 프로젝트가 진행중 상태로 전환되었습니다.'
      else v_project.name || ' 프로젝트가 반려되었습니다.'
    end,
    'in_app',
    'important',
    'project_teams',
    v_project.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'decision', v_decision)
  from recipients;

  return v_updated;
end;
$$;

create or replace function public.request_project_join(
  p_project_team_id uuid,
  p_reason text default null
)
returns public.project_team_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_request public.project_team_join_requests;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_is_active_member() then
    raise exception '활성 부원만 프로젝트 참여를 신청할 수 있습니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status <> 'active' then
    raise exception '진행중 프로젝트에만 참여를 신청할 수 있습니다.';
  end if;

  if exists (
    select 1
    from public.project_team_memberships ptm
    where ptm.project_team_id = v_project.id
      and ptm.user_id = v_actor
      and ptm.status = 'active'
  ) then
    raise exception '이미 참여중인 프로젝트입니다.';
  end if;

  select *
    into v_request
  from public.project_team_join_requests
  where project_team_id = v_project.id
    and requester_user_id = v_actor
    and status = 'pending'
  for update;

  if v_request.id is not null then
    update public.project_team_join_requests
    set
      reason = coalesce(v_reason, reason),
      updated_at = now()
    where id = v_request.id
    returning * into v_request;
  else
    insert into public.project_team_join_requests (
      project_team_id,
      requester_user_id,
      status,
      reason
    )
    values (
      v_project.id,
      v_actor,
      'pending',
      v_reason
    )
    returning * into v_request;
  end if;

  perform public.create_audit_log(
    'project.join.request',
    v_actor,
    v_project.id,
    null,
    'project_team_join_requests',
    v_request.id,
    null,
    jsonb_build_object('status', v_request.status, 'hasReason', v_request.reason is not null),
    null,
    jsonb_build_object('source', 'request_project_join_rpc')
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  select distinct
    ptm.user_id,
    v_actor,
    'project.join_requested',
    '프로젝트 참여 신청이 도착했습니다',
    v_project.name || ' 프로젝트에 새 참여 신청이 있습니다.',
    'in_app',
    'important',
    'project_team_join_requests',
    v_request.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'requestId', v_request.id)
  from public.project_team_memberships ptm
  where ptm.project_team_id = v_project.id
    and ptm.status = 'active'
    and ptm.role in ('lead', 'maintainer')
    and ptm.user_id <> v_actor;

  return v_request;
end;
$$;

create or replace function public.review_project_join_request(
  p_request_id uuid,
  p_decision text,
  p_reason text default null
)
returns public.project_team_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.project_team_join_requests;
  v_project public.project_teams;
  v_updated public.project_team_join_requests;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
    into v_request
  from public.project_team_join_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '참여 신청을 찾을 수 없습니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = v_request.project_team_id
  for update;

  if not (
    public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
    or public.current_user_is_project_operator(v_request.project_team_id)
    or public.current_user_has_project_delegated_scope(v_request.project_team_id, 'review_join_requests')
  ) then
    raise exception '프로젝트 참여 신청을 검토할 권한이 없습니다.';
  end if;

  if v_project.status <> 'active' then
    raise exception '진행중 프로젝트의 참여 신청만 검토할 수 있습니다.';
  end if;

  if v_request.status <> 'pending' then
    raise exception '대기중인 참여 신청만 검토할 수 있습니다.';
  end if;

  if v_decision not in ('approve', 'reject') then
    raise exception '지원하지 않는 검토 결정입니다.';
  end if;

  update public.project_team_join_requests
  set
    status = case when v_decision = 'approve' then 'approved' else 'rejected' end,
    review_reason = v_reason,
    reviewed_by = v_actor,
    reviewed_at = now(),
    updated_at = now()
  where id = v_request.id
  returning * into v_updated;

  if v_decision = 'approve' then
    insert into public.project_team_memberships (
      project_team_id,
      user_id,
      role,
      status,
      assigned_by,
      joined_at,
      left_at
    )
    values (
      v_request.project_team_id,
      v_request.requester_user_id,
      'member',
      'active',
      v_actor,
      now(),
      null
    )
    on conflict (project_team_id, user_id) do update
    set
      role = case
        when public.project_team_memberships.role in ('lead', 'maintainer')
          then public.project_team_memberships.role
        else 'member'
      end,
      status = 'active',
      assigned_by = excluded.assigned_by,
      joined_at = coalesce(public.project_team_memberships.joined_at, now()),
      left_at = null;
  end if;

  perform public.create_audit_log(
    'project.join.review',
    v_request.requester_user_id,
    v_project.id,
    null,
    'project_team_join_requests',
    v_request.id,
    jsonb_build_object('status', v_request.status),
    jsonb_build_object('status', v_updated.status),
    v_reason,
    jsonb_build_object('decision', v_decision)
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    v_request.requester_user_id,
    v_actor,
    case when v_decision = 'approve' then 'project.join_approved' else 'project.join_rejected' end,
    case when v_decision = 'approve' then '프로젝트 참여가 승인되었습니다' else '프로젝트 참여가 반려되었습니다' end,
    case
      when v_decision = 'approve' then v_project.name || ' 프로젝트에 참여할 수 있습니다.'
      else v_project.name || ' 프로젝트 참여 신청이 반려되었습니다.'
    end,
    'in_app',
    'important',
    'project_team_join_requests',
    v_request.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'requestId', v_request.id, 'decision', v_decision)
  );

  return v_updated;
end;
$$;

create or replace function public.submit_study_record(
  p_project_team_id uuid default null,
  p_study_session_id uuid default null,
  p_title text default null,
  p_body text default null,
  p_duration_minutes integer default null,
  p_occurred_at timestamptz default null,
  p_visibility text default 'project'
)
returns public.study_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project_id uuid := p_project_team_id;
  v_project public.project_teams;
  v_session public.study_sessions;
  v_record public.study_records;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_visibility text := lower(btrim(coalesce(p_visibility, 'project')));
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_is_active_member() then
    raise exception '활성 부원만 스터디 기록을 작성할 수 있습니다.';
  end if;

  if v_title = '' then
    raise exception '스터디 기록 제목을 입력해 주세요.';
  end if;

  if char_length(v_title) > 120 then
    raise exception '스터디 기록 제목은 120자 이하로 입력해 주세요.';
  end if;

  if v_body is not null and char_length(v_body) > 20000 then
    raise exception '스터디 기록 내용이 너무 깁니다.';
  end if;

  if p_duration_minutes is not null and (p_duration_minutes < 0 or p_duration_minutes > 1440) then
    raise exception '스터디 시간은 0분 이상 1440분 이하로 입력해 주세요.';
  end if;

  if v_visibility not in ('self', 'project', 'member', 'public') then
    raise exception '지원하지 않는 스터디 기록 공개 범위입니다.';
  end if;

  if p_study_session_id is not null then
    select *
      into v_session
    from public.study_sessions
    where id = p_study_session_id;

    if v_session.id is null then
      raise exception '스터디 세션을 찾을 수 없습니다.';
    end if;

    if v_session.status = 'canceled' then
      raise exception '취소된 스터디 세션에는 기록을 추가할 수 없습니다.';
    end if;

    if v_session.project_team_id is not null then
      if v_project_id is not null and v_project_id <> v_session.project_team_id then
        raise exception '스터디 세션과 프로젝트가 일치하지 않습니다.';
      end if;

      v_project_id := v_session.project_team_id;
    end if;
  end if;

  if v_project_id is not null then
    select *
      into v_project
    from public.project_teams
    where id = v_project_id;

    if v_project.id is null then
      raise exception '프로젝트를 찾을 수 없습니다.';
    end if;

    if v_project.status not in ('pending', 'active') then
      raise exception '진행 가능한 프로젝트에만 스터디 기록을 추가할 수 있습니다.';
    end if;

    if not exists (
      select 1
      from public.project_team_memberships ptm
      where ptm.project_team_id = v_project_id
        and ptm.user_id = v_actor
        and ptm.status = 'active'
    ) then
      raise exception '프로젝트 멤버만 프로젝트 스터디 기록을 작성할 수 있습니다.';
    end if;
  elsif v_visibility = 'project' then
    raise exception '프로젝트 공개 기록에는 프로젝트가 필요합니다.';
  end if;

  insert into public.study_records (
    study_session_id,
    project_team_id,
    author_user_id,
    title,
    body,
    duration_minutes,
    occurred_at,
    status,
    visibility
  )
  values (
    p_study_session_id,
    v_project_id,
    v_actor,
    v_title,
    v_body,
    p_duration_minutes,
    coalesce(p_occurred_at, now()),
    'submitted',
    v_visibility
  )
  returning * into v_record;

  perform public.create_audit_log(
    'study.record.submit',
    v_actor,
    v_project_id,
    null,
    'study_records',
    v_record.id,
    null,
    jsonb_build_object(
      'title', v_record.title,
      'visibility', v_record.visibility,
      'projectTeamId', v_record.project_team_id,
      'studySessionId', v_record.study_session_id
    ),
    null,
    jsonb_build_object('source', 'submit_study_record_rpc')
  );

  if v_project_id is not null then
    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      type,
      title,
      body,
      channel,
      importance,
      related_entity_table,
      related_entity_id,
      href,
      metadata
    )
    select distinct
      ptm.user_id,
      v_actor,
      'study.record_submitted',
      '프로젝트 스터디 기록이 등록되었습니다',
      v_project.name || ' 프로젝트에 새 스터디 기록이 올라왔습니다.',
      'in_app',
      'normal',
      'study_records',
      v_record.id,
      '/member/projects/' || v_project.slug::text,
      jsonb_build_object('projectTeamId', v_project.id, 'studyRecordId', v_record.id)
    from public.project_team_memberships ptm
    where ptm.project_team_id = v_project_id
      and ptm.status = 'active'
      and ptm.role in ('lead', 'maintainer')
      and ptm.user_id <> v_actor;
  end if;

  return v_record;
end;
$$;

revoke all on function public.current_user_can_review_project(uuid) from public, anon;
revoke all on function public.current_user_can_manage_project(uuid) from public, anon;
revoke all on function public.current_user_can_read_project_member_scope(uuid) from public, anon;
revoke all on function public.current_user_can_read_study_session(uuid) from public, anon;
revoke all on function public.current_user_can_manage_study_session(uuid) from public, anon;
revoke all on function public.current_user_can_read_study_record(uuid) from public, anon;
revoke all on function public.review_project_team(uuid, text, text) from public, anon;
revoke all on function public.request_project_join(uuid, text) from public, anon;
revoke all on function public.review_project_join_request(uuid, text, text) from public, anon;
revoke all on function public.submit_study_record(uuid, uuid, text, text, integer, timestamptz, text) from public, anon;

grant execute on function public.current_user_can_review_project(uuid) to authenticated;
grant execute on function public.current_user_can_manage_project(uuid) to authenticated;
grant execute on function public.current_user_can_read_project_member_scope(uuid) to authenticated;
grant execute on function public.current_user_can_read_study_session(uuid) to authenticated;
grant execute on function public.current_user_can_manage_study_session(uuid) to authenticated;
grant execute on function public.current_user_can_read_study_record(uuid) to authenticated;
grant execute on function public.review_project_team(uuid, text, text) to authenticated;
grant execute on function public.request_project_join(uuid, text) to authenticated;
grant execute on function public.review_project_join_request(uuid, text, text) to authenticated;
grant execute on function public.submit_study_record(uuid, uuid, text, text, integer, timestamptz, text) to authenticated;
