-- Project management tab can recover or change a project lead.
-- This command owns the write path for lead_user_id and lead memberships.

create or replace function public.set_project_team_lead(
  p_project_team_id uuid,
  p_lead_user_id uuid
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
  v_profile public.profiles;
  v_display_name text;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_project_team_id is null or p_lead_user_id is null then
    raise exception '프로젝트와 새 리드를 모두 선택해 주세요.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if not (
    public.current_user_has_permission('admin.access')
    or public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('projects.manage')
    or (
      v_project.official_team_id is not null
      and public.current_user_is_official_team_lead(v_project.official_team_id)
    )
  ) then
    raise exception '프로젝트 리드를 변경할 권한이 없습니다.';
  end if;

  select p.*
    into v_profile
  from public.profiles p
  join public.member_accounts ma
    on ma.user_id = p.id
  where p.id = p_lead_user_id
    and ma.organization_id = v_project.organization_id
    and ma.status = 'active'
  limit 1;

  if v_profile.id is null then
    raise exception '새 리드는 같은 조직의 활성 부원이어야 합니다.';
  end if;

  v_display_name := coalesce(
    nullif(btrim(v_profile.nickname_display), ''),
    nullif(btrim(v_profile.display_name), ''),
    nullif(btrim(v_profile.full_name), ''),
    split_part(v_profile.email::text, '@', 1),
    '이름 없음'
  );

  update public.project_team_memberships
  set
    role = 'maintainer',
    assigned_by = v_actor,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'previousRole', 'lead',
      'changedBy', v_actor,
      'changedAt', now(),
      'changeReason', 'project_lead_transfer'
    )
  where project_team_id = v_project.id
    and user_id <> p_lead_user_id
    and status = 'active'
    and role = 'lead';

  insert into public.project_team_memberships (
    project_team_id,
    user_id,
    role,
    status,
    nickname_snapshot,
    display_name_snapshot,
    assigned_by,
    left_at,
    metadata
  )
  values (
    v_project.id,
    p_lead_user_id,
    'lead',
    'active',
    v_profile.nickname_display,
    v_display_name,
    v_actor,
    null,
    jsonb_build_object(
      'changedBy', v_actor,
      'changedAt', now(),
      'changeReason', 'project_lead_transfer'
    )
  )
  on conflict (project_team_id, user_id) do update
  set
    role = 'lead',
    status = 'active',
    nickname_snapshot = excluded.nickname_snapshot,
    display_name_snapshot = excluded.display_name_snapshot,
    assigned_by = excluded.assigned_by,
    joined_at = case
      when project_team_memberships.status = 'active' then project_team_memberships.joined_at
      else now()
    end,
    left_at = null,
    metadata = coalesce(project_team_memberships.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'changedBy', v_actor,
        'changedAt', now(),
        'changeReason', 'project_lead_transfer'
      );

  update public.project_teams
  set
    lead_user_id = p_lead_user_id,
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'lastLeadUpdate',
        jsonb_build_object(
          'previousLeadUserId', v_project.lead_user_id,
          'nextLeadUserId', p_lead_user_id,
          'updatedBy', v_actor,
          'updatedAt', now()
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.lead.update',
    p_lead_user_id,
    v_project.id,
    v_project.official_team_id,
    'project_teams',
    v_project.id,
    jsonb_build_object(
      'leadUserId', v_project.lead_user_id
    ),
    jsonb_build_object(
      'leadUserId', v_updated.lead_user_id
    ),
    null,
    jsonb_build_object('source', 'set_project_team_lead_rpc')
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
    p_lead_user_id,
    v_actor,
    'project.lead_assigned',
    '프로젝트 리드로 지정되었습니다',
    v_project.name || ' 프로젝트의 리드가 되었습니다.',
    'in_app',
    'important',
    'project_teams',
    v_project.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object(
      'projectTeamId', v_project.id,
      'previousLeadUserId', v_project.lead_user_id,
      'nextLeadUserId', p_lead_user_id
    )
  );

  return v_updated;
end;
$$;

revoke all on function public.set_project_team_lead(uuid, uuid) from public, anon;
grant execute on function public.set_project_team_lead(uuid, uuid) to authenticated;
