-- Project review notifications are outcome notifications, not reviewer work
-- notifications. If the project creator is also the reviewer, they still need
-- the approval/rejection result toast.

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

revoke all on function public.review_project_team(uuid, text, text) from public, anon;
grant execute on function public.review_project_team(uuid, text, text) to authenticated;
