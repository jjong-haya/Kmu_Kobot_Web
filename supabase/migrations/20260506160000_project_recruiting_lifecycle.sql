-- Separate project run lifecycle from recruitment openness.
-- recruiting = approved and recruiting, but not yet running.
-- active + recruitment_status=open = running and still recruiting.

alter table public.project_teams
  drop constraint if exists project_teams_status_check;

alter table public.project_teams
  add constraint project_teams_status_check
  check (status in ('pending', 'recruiting', 'active', 'rejected', 'archived'));

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
          pt.status in ('active', 'recruiting')
          and pt.visibility = 'public'
          and pt.recruitment_status = 'open'
          and public.current_user_is_active_member()
        )
      )
  );
$$;

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
  v_next_status text;
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

  v_next_status := case
    when v_decision = 'reject' then 'rejected'
    when v_project.recruitment_status = 'open' then 'recruiting'
    else 'active'
  end;

  update public.project_teams
  set
    status = v_next_status,
    visibility = case when v_next_status = 'recruiting' then 'public' else visibility end,
    approved_by = case when v_decision = 'approve' then v_actor else null end,
    approved_at = case when v_decision = 'approve' then now() else null end,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'lastReview',
      jsonb_build_object(
        'decision', v_decision,
        'reason', v_reason,
        'reviewedBy', v_actor,
        'reviewedAt', now(),
        'nextStatus', v_next_status
      )
    ),
    updated_at = now()
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
    jsonb_build_object('decision', v_decision, 'nextStatus', v_next_status)
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
      when v_decision = 'approve' and v_next_status = 'recruiting' then v_project.name || ' 프로젝트가 모집중 상태로 전환되었습니다.'
      when v_decision = 'approve' then v_project.name || ' 프로젝트가 진행중 상태로 전환되었습니다.'
      else v_project.name || ' 프로젝트가 반려되었습니다.'
    end,
    'in_app',
    'important',
    'project_teams',
    v_project.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'decision', v_decision, 'nextStatus', v_next_status)
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

  if v_project.status not in ('active', 'recruiting') then
    raise exception '모집중인 프로젝트에만 참여를 신청할 수 있습니다.';
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

create or replace function public.set_project_run_status(
  p_project_team_id uuid,
  p_status text
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
  v_status text := lower(btrim(coalesce(p_status, '')));
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_status not in ('recruiting', 'active') then
    raise exception '지원하지 않는 프로젝트 진행 상태입니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status not in ('recruiting', 'active') then
    raise exception '승인된 프로젝트만 진행 상태를 변경할 수 있습니다.';
  end if;

  if not public.current_user_can_manage_project(v_project.id) then
    raise exception '프로젝트 진행 상태를 변경할 권한이 없습니다.';
  end if;

  update public.project_teams
  set
    status = v_status,
    recruitment_status = case when v_status = 'recruiting' then 'open' else recruitment_status end,
    visibility = case when v_status = 'recruiting' then 'public' else visibility end,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('runStatus', v_status),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.run_status.update',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object('status', v_project.status, 'recruitmentStatus', v_project.recruitment_status),
    jsonb_build_object('status', v_updated.status, 'recruitmentStatus', v_updated.recruitment_status),
    null,
    jsonb_build_object('source', 'set_project_run_status_rpc')
  );

  return v_updated;
end;
$$;

update public.project_teams
set
  status = 'recruiting',
  visibility = 'public',
  recruitment_status = 'open',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('demoState', 'recruiting_only'),
  updated_at = now()
where slug::text = 'demo-vision-lab'
  and status in ('active', 'pending')
  and recruitment_status = 'open';

revoke all on function public.can_read_private_project(uuid) from public, anon;
revoke all on function public.review_project_team(uuid, text, text) from public, anon;
revoke all on function public.request_project_join(uuid, text) from public, anon;
revoke all on function public.set_project_run_status(uuid, text) from public, anon;

grant execute on function public.can_read_private_project(uuid) to authenticated;
grant execute on function public.review_project_team(uuid, text, text) to authenticated;
grant execute on function public.request_project_join(uuid, text) to authenticated;
grant execute on function public.set_project_run_status(uuid, text) to authenticated;
