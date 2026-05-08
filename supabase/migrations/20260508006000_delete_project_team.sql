-- Project deletion is a destructive project-domain command.
-- Keep it behind an authenticated RPC so the browser cannot directly delete
-- project_teams rows and so the database remains the final permission boundary.

create or replace function public.delete_project_team(p_project_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if not (
    public.current_user_can_manage_project(v_project.id)
    or v_project.created_by = v_actor
    or v_project.owner_user_id = v_actor
    or v_project.lead_user_id = v_actor
  ) then
    raise exception '프로젝트를 삭제할 권한이 없습니다.' using errcode = '42501';
  end if;

  perform public.create_audit_log(
    'project.delete',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    to_jsonb(v_project),
    null,
    null,
    jsonb_build_object(
      'deletedBy', v_actor,
      'deletedAt', now()
    )
  );

  delete from public.project_teams
  where id = v_project.id;
end;
$$;

revoke all on function public.delete_project_team(uuid) from public, anon, authenticated;
grant execute on function public.delete_project_team(uuid) to authenticated;
