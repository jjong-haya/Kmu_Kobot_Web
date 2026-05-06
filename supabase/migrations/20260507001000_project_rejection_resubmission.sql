-- Rejected project lifecycle:
-- - creators/operators can revise rejected project data and request review again
-- - reviewers can restore a mistaken rejection back to the review queue

create or replace function public.resubmit_project_team(
  p_project_team_id uuid,
  p_name text,
  p_summary text default null,
  p_description text default null,
  p_project_type text default 'autonomous',
  p_visibility text default 'private',
  p_metadata jsonb default '{}'::jsonb
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
  v_name text := btrim(coalesce(p_name, ''));
  v_project_type text := lower(btrim(coalesce(p_project_type, 'autonomous')));
  v_visibility text := lower(btrim(coalesce(p_visibility, 'private')));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_recruitment_status text := case
    when lower(coalesce(v_metadata->>'recruitmentOpen', 'false')) in ('true', '1', 'yes', 'open')
      then 'open'
    else 'closed'
  end;
  v_recruitment_note text := nullif(btrim(coalesce(v_metadata->>'recruitmentNote', '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_name = '' then
    raise exception '프로젝트 이름을 입력해야 합니다.';
  end if;

  if char_length(v_name) > 160 then
    raise exception '프로젝트 이름은 160자 이하로 입력해 주세요.';
  end if;

  if v_project_type not in ('official_based', 'personal', 'autonomous') then
    raise exception '지원하지 않는 프로젝트 유형입니다.';
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status <> 'rejected' then
    raise exception '반려된 프로젝트만 수정 후 재심사를 요청할 수 있습니다.';
  end if;

  if not (
    v_project.created_by = v_actor
    or v_project.owner_user_id = v_actor
    or v_project.lead_user_id = v_actor
    or public.current_user_can_manage_project(v_project.id)
  ) then
    raise exception '프로젝트 재심사를 요청할 권한이 없습니다.';
  end if;

  update public.project_teams
  set
    name = v_name,
    summary = nullif(btrim(coalesce(p_summary, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    project_type = v_project_type,
    visibility = case when v_recruitment_status = 'open' then 'public' else v_visibility end,
    status = 'pending',
    recruitment_status = v_recruitment_status,
    recruitment_note = v_recruitment_note,
    approved_by = null,
    approved_at = null,
    metadata = coalesce(metadata, '{}'::jsonb)
      || v_metadata
      || jsonb_build_object(
        'lastReviewRequest',
        jsonb_build_object(
          'requestedBy', v_actor,
          'requestedAt', now(),
          'fromStatus', v_project.status,
          'toStatus', 'pending'
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.review.request',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object(
      'name', v_project.name,
      'summary', v_project.summary,
      'description', v_project.description,
      'projectType', v_project.project_type,
      'visibility', v_project.visibility,
      'status', v_project.status,
      'recruitmentStatus', v_project.recruitment_status,
      'metadata', v_project.metadata
    ),
    jsonb_build_object(
      'name', v_updated.name,
      'summary', v_updated.summary,
      'description', v_updated.description,
      'projectType', v_updated.project_type,
      'visibility', v_updated.visibility,
      'status', v_updated.status,
      'recruitmentStatus', v_updated.recruitment_status,
      'metadata', v_updated.metadata
    ),
    null,
    jsonb_build_object('source', 'resubmit_project_team_rpc')
  );

  return v_updated;
end;
$$;

create or replace function public.restore_rejected_project_team(
  p_project_team_id uuid,
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

  if v_project.status <> 'rejected' then
    raise exception '반려된 프로젝트만 복구할 수 있습니다.';
  end if;

  if not public.current_user_can_review_project(v_project.id) then
    raise exception '프로젝트를 복구할 권한이 없습니다.';
  end if;

  update public.project_teams
  set
    status = 'pending',
    approved_by = null,
    approved_at = null,
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'lastRestore',
        jsonb_build_object(
          'restoredBy', v_actor,
          'restoredAt', now(),
          'reason', v_reason,
          'fromStatus', v_project.status,
          'toStatus', 'pending'
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.rejection.restore',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object('status', v_project.status, 'metadata', v_project.metadata),
    jsonb_build_object('status', v_updated.status, 'metadata', v_updated.metadata),
    v_reason,
    jsonb_build_object('source', 'restore_rejected_project_team_rpc')
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
    'project.rejection_restored',
    '프로젝트가 검토중으로 복구되었습니다',
    v_project.name || ' 프로젝트가 다시 검토 대기 상태가 되었습니다.',
    'in_app',
    'important',
    'project_teams',
    v_project.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'fromStatus', v_project.status, 'nextStatus', 'pending')
  from recipients;

  return v_updated;
end;
$$;

revoke all on function public.resubmit_project_team(uuid, text, text, text, text, text, jsonb) from public, anon;
revoke all on function public.restore_rejected_project_team(uuid, text) from public, anon;

grant execute on function public.resubmit_project_team(uuid, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.restore_rejected_project_team(uuid, text) to authenticated;
