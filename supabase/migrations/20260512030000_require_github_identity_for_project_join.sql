-- Require a valid GitHub profile URL before creating project join requests.
-- The frontend also blocks the button, but this RPC guard prevents direct calls.

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
  v_has_github_identity boolean := false;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_is_active_member() then
    raise exception '활성 부원만 프로젝트 참여를 신청할 수 있습니다.';
  end if;

  v_has_github_identity := public.refresh_member_github_identity(v_actor);
  if not v_has_github_identity then
    raise exception '프로젝트 참여 신청 전에 프로필에 GitHub URL을 등록해야 합니다.' using errcode = '42501';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.deleted_at is not null then
    raise exception '휴지통에 있는 프로젝트에는 참여를 신청할 수 없습니다.';
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

revoke all on function public.request_project_join(uuid, text) from public, anon;
grant execute on function public.request_project_join(uuid, text) to authenticated;

notify pgrst, 'reload schema';
