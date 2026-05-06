-- Project leaders can control run/recruitment/completion status from settings.
-- Project type is intentionally fixed after creation/review and is not part of this RPC.

drop function if exists public.update_project_team_settings(uuid, text, text, text, text, jsonb);

create or replace function public.update_project_team_settings(
  p_project_team_id uuid,
  p_summary text default null,
  p_description text default null,
  p_visibility text default 'private',
  p_metadata jsonb default '{}'::jsonb,
  p_is_running boolean default true,
  p_is_recruiting boolean default false,
  p_is_completed boolean default false
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
  v_visibility text := lower(btrim(coalesce(p_visibility, 'private')));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_is_running boolean := coalesce(p_is_running, false);
  v_is_recruiting boolean := coalesce(p_is_recruiting, false);
  v_is_completed boolean := coalesce(p_is_completed, false);
  v_next_status text;
  v_next_recruitment_status text;
  v_recruitment_note text := nullif(btrim(coalesce(v_metadata->>'recruitmentNote', '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  if not v_is_completed and not v_is_running and not v_is_recruiting then
    raise exception '진행중, 모집중, 종료 중 하나는 선택해 주세요.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status not in ('active', 'recruiting') then
    raise exception '승인되어 진행 중인 프로젝트만 설정을 수정할 수 있습니다.';
  end if;

  if not public.current_user_can_manage_project(v_project.id) then
    raise exception '프로젝트 설정을 수정할 권한이 없습니다.';
  end if;

  if v_is_completed then
    v_next_status := 'archived';
    v_next_recruitment_status := 'closed';
    v_is_running := false;
    v_is_recruiting := false;
  else
    v_next_status := case when v_is_running then 'active' else 'recruiting' end;
    v_next_recruitment_status := case when v_is_recruiting then 'open' else 'closed' end;
  end if;

  update public.project_teams
  set
    summary = nullif(btrim(coalesce(p_summary, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    status = v_next_status,
    visibility = case when v_next_recruitment_status = 'open' then 'public' else v_visibility end,
    recruitment_status = v_next_recruitment_status,
    recruitment_note = case when v_next_recruitment_status = 'open' then v_recruitment_note else null end,
    archived_at = case when v_next_status = 'archived' then now() else null end,
    metadata = coalesce(metadata, '{}'::jsonb)
      || v_metadata
      || jsonb_build_object(
        'recruitmentOpen',
        v_next_recruitment_status = 'open',
        'recruitmentNote',
        case when v_next_recruitment_status = 'open' then v_recruitment_note else null end,
        'runStatus',
        v_next_status,
        'isRunning',
        v_is_running,
        'isRecruiting',
        v_is_recruiting,
        'isCompleted',
        v_is_completed,
        'lastSettingsUpdate',
        jsonb_build_object(
          'updatedBy',
          v_actor,
          'updatedAt',
          now()
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.settings.update',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object(
      'name', v_project.name,
      'summary', v_project.summary,
      'description', v_project.description,
      'projectType', v_project.project_type,
      'status', v_project.status,
      'visibility', v_project.visibility,
      'recruitmentStatus', v_project.recruitment_status,
      'metadata', v_project.metadata
    ),
    jsonb_build_object(
      'name', v_updated.name,
      'summary', v_updated.summary,
      'description', v_updated.description,
      'projectType', v_updated.project_type,
      'status', v_updated.status,
      'visibility', v_updated.visibility,
      'recruitmentStatus', v_updated.recruitment_status,
      'metadata', v_updated.metadata
    ),
    null,
    jsonb_build_object('source', 'update_project_team_settings_rpc', 'typeLocked', true)
  );

  return v_updated;
end;
$$;

revoke all on function public.update_project_team_settings(uuid, text, text, text, jsonb, boolean, boolean, boolean) from public, anon;
grant execute on function public.update_project_team_settings(uuid, text, text, text, jsonb, boolean, boolean, boolean) to authenticated;
