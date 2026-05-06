-- Approved project settings can be edited without changing the project name.
-- Name is intentionally not part of this RPC contract.

create or replace function public.update_project_team_settings(
  p_project_team_id uuid,
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

  if v_project.status not in ('active', 'recruiting') then
    raise exception '승인된 프로젝트만 설정을 수정할 수 있습니다.';
  end if;

  if not public.current_user_can_manage_project(v_project.id) then
    raise exception '프로젝트 설정을 수정할 권한이 없습니다.';
  end if;

  update public.project_teams
  set
    summary = nullif(btrim(coalesce(p_summary, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    project_type = v_project_type,
    visibility = case when v_recruitment_status = 'open' then 'public' else v_visibility end,
    recruitment_status = v_recruitment_status,
    recruitment_note = v_recruitment_note,
    metadata = coalesce(metadata, '{}'::jsonb)
      || v_metadata
      || jsonb_build_object(
        'lastSettingsUpdate',
        jsonb_build_object(
          'updatedBy', v_actor,
          'updatedAt', now()
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.settings.update',
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
      'recruitmentStatus', v_project.recruitment_status,
      'metadata', v_project.metadata
    ),
    jsonb_build_object(
      'name', v_updated.name,
      'summary', v_updated.summary,
      'description', v_updated.description,
      'projectType', v_updated.project_type,
      'visibility', v_updated.visibility,
      'recruitmentStatus', v_updated.recruitment_status,
      'metadata', v_updated.metadata
    ),
    null,
    jsonb_build_object('source', 'update_project_team_settings_rpc')
  );

  return v_updated;
end;
$$;

revoke all on function public.update_project_team_settings(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.update_project_team_settings(uuid, text, text, text, text, jsonb) to authenticated;
