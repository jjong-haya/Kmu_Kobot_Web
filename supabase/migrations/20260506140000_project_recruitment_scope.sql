-- Project recruitment is not a lifecycle status. A project can be active and
-- either closed to new members or open for recruitment.

alter table public.project_teams
  add column if not exists recruitment_status text not null default 'closed';

alter table public.project_teams
  add column if not exists recruitment_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_teams_recruitment_status_check'
  ) then
    alter table public.project_teams
      add constraint project_teams_recruitment_status_check
      check (recruitment_status in ('closed', 'open'));
  end if;
end;
$$;

create index if not exists project_teams_recruitment_idx
  on public.project_teams (status, visibility, recruitment_status, updated_at desc);

update public.project_teams
set recruitment_status = 'open'
where status = 'active'
  and visibility = 'public'
  and lower(coalesce(metadata->>'recruitmentOpen', 'false')) in ('true', '1', 'yes', 'open');

update public.project_teams
set
  recruitment_status = 'open',
  recruitment_note = coalesce(
    recruitment_note,
    case
      when slug::text = 'demo-robot-arm' then '제어, 시뮬레이션, 실험 기록을 함께 정리할 참여자를 모집합니다.'
      when slug::text = 'demo-vision-lab' then '데이터 라벨링과 모델 비교 실험을 같이 진행할 참여자를 모집합니다.'
      else recruitment_note
    end
  )
where slug::text in ('demo-robot-arm', 'demo-vision-lab')
  and status = 'active';

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
        public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('projects.manage')
        or exists (
          select 1
          from public.project_team_memberships ptm
          where ptm.project_team_id = pt.id
            and ptm.user_id = auth.uid()
            and ptm.status = 'active'
        )
        or (
          pt.status = 'active'
          and pt.visibility = 'public'
          and pt.recruitment_status = 'open'
          and public.current_user_is_active_member()
        )
      )
  );
$$;

create or replace function public.create_project_team(
  input_slug text,
  input_name text,
  input_summary text default null,
  input_description text default null,
  input_project_type text default 'autonomous',
  input_visibility text default 'private',
  input_metadata jsonb default '{}'::jsonb
)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_org_id uuid;
  v_requested_slug text := lower(btrim(coalesce(input_slug, '')));
  v_name text := btrim(coalesce(input_name, ''));
  v_slug_base text;
  v_slug_candidate text;
  v_suffix integer := 1;
  v_project public.project_teams;
  v_metadata jsonb := coalesce(input_metadata, '{}'::jsonb);
  v_recruitment_status text := case
    when lower(coalesce(input_metadata->>'recruitmentOpen', 'false')) in ('true', '1', 'yes', 'open')
      then 'open'
    else 'closed'
  end;
  v_recruitment_note text := nullif(btrim(coalesce(input_metadata->>'recruitmentNote', '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select ma.organization_id
    into v_org_id
  from public.member_accounts ma
  where ma.user_id = v_actor
    and ma.status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception '활성 부원만 프로젝트를 생성할 수 있습니다.';
  end if;

  if not (
    public.current_user_has_permission('projects.create')
    or public.current_user_has_permission('projects.manage')
  ) then
    raise exception '프로젝트 생성 권한이 없습니다.';
  end if;

  if v_name = '' then
    raise exception '프로젝트 이름을 입력해야 합니다.';
  end if;

  if input_project_type not in ('official_based', 'personal', 'autonomous') then
    raise exception '지원하지 않는 프로젝트 유형입니다.';
  end if;

  if input_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  if v_requested_slug <> '' then
    if v_requested_slug !~ '^[a-z][a-z0-9_-]{1,30}$' then
      raise exception '프로젝트 slug는 영어 소문자로 시작하고 소문자/숫자/하이픈/언더스코어만 2~31자로 입력해야 합니다.';
    end if;
    v_slug_candidate := v_requested_slug;
  else
    v_slug_base := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug_base := regexp_replace(v_slug_base, '(^-+|-+$)', '', 'g');
    v_slug_base := regexp_replace(v_slug_base, '-{2,}', '-', 'g');

    if char_length(v_slug_base) < 2 or v_slug_base !~ '^[a-z]' then
      v_slug_base := 'project';
    end if;

    v_slug_base := left(v_slug_base, 24);
    v_slug_candidate := v_slug_base;

    while exists (
      select 1
      from public.project_teams pt
      where pt.organization_id = v_org_id
        and lower(pt.slug::text) = v_slug_candidate
    ) loop
      v_suffix := v_suffix + 1;
      v_slug_candidate := left(v_slug_base, greatest(2, 30 - char_length(v_suffix::text))) || '-' || v_suffix::text;
    end loop;
  end if;

  insert into public.project_teams (
    organization_id,
    slug,
    name,
    summary,
    description,
    project_type,
    visibility,
    status,
    recruitment_status,
    recruitment_note,
    owner_user_id,
    lead_user_id,
    created_by,
    metadata
  )
  values (
    v_org_id,
    v_slug_candidate::citext,
    v_name,
    nullif(btrim(coalesce(input_summary, '')), ''),
    nullif(btrim(coalesce(input_description, '')), ''),
    input_project_type,
    case when v_recruitment_status = 'open' then 'public' else input_visibility end,
    'pending',
    v_recruitment_status,
    v_recruitment_note,
    v_actor,
    v_actor,
    v_actor,
    v_metadata
  )
  returning * into v_project;

  insert into public.project_team_memberships (
    project_team_id,
    user_id,
    role,
    status,
    assigned_by
  )
  values (
    v_project.id,
    v_actor,
    'lead',
    'active',
    v_actor
  )
  on conflict (project_team_id, user_id) do update
  set
    role = excluded.role,
    status = excluded.status,
    assigned_by = excluded.assigned_by,
    left_at = null;

  perform public.create_audit_log(
    'project.create',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    null,
    jsonb_build_object(
      'id', v_project.id,
      'slug', v_project.slug,
      'name', v_project.name,
      'status', v_project.status,
      'visibility', v_project.visibility,
      'recruitmentStatus', v_project.recruitment_status
    ),
    null,
    jsonb_build_object('source', 'create_project_team_rpc', 'slugGenerated', v_requested_slug = '')
  );

  return v_project;
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

  if v_project.visibility <> 'public' or v_project.recruitment_status <> 'open' then
    raise exception '모집중인 프로젝트에만 참여를 신청할 수 있습니다.';
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

create or replace function public.set_project_recruitment(
  p_project_team_id uuid,
  p_recruitment_status text,
  p_recruitment_note text default null
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
  v_status text := lower(btrim(coalesce(p_recruitment_status, '')));
  v_note text := nullif(btrim(coalesce(p_recruitment_note, '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_status not in ('closed', 'open') then
    raise exception '지원하지 않는 모집 상태입니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status <> 'active' then
    raise exception '진행중 프로젝트만 모집 상태를 바꿀 수 있습니다.';
  end if;

  if not public.current_user_can_manage_project(v_project.id) then
    raise exception '프로젝트 모집 상태를 변경할 권한이 없습니다.';
  end if;

  update public.project_teams
  set
    recruitment_status = v_status,
    recruitment_note = case when v_status = 'open' then v_note else recruitment_note end,
    visibility = case when v_status = 'open' then 'public' else visibility end,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'recruitmentOpen',
      v_status = 'open',
      'recruitmentNote',
      v_note
    ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.recruitment.update',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object(
      'recruitmentStatus', v_project.recruitment_status,
      'visibility', v_project.visibility
    ),
    jsonb_build_object(
      'recruitmentStatus', v_updated.recruitment_status,
      'visibility', v_updated.visibility
    ),
    null,
    jsonb_build_object('source', 'set_project_recruitment_rpc')
  );

  return v_updated;
end;
$$;

revoke all on function public.can_read_private_project(uuid) from public, anon;
revoke all on function public.create_project_team(text, text, text, text, text, text, jsonb) from public, anon;
revoke all on function public.request_project_join(uuid, text) from public, anon;
revoke all on function public.set_project_recruitment(uuid, text, text) from public, anon;

grant execute on function public.can_read_private_project(uuid) to authenticated;
grant execute on function public.create_project_team(text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.request_project_join(uuid, text) to authenticated;
grant execute on function public.set_project_recruitment(uuid, text, text) to authenticated;
