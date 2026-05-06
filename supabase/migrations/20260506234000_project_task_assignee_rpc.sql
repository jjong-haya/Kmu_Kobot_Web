-- Let project members change task ownership through a checked RPC.

create or replace function public.set_project_task_assignee(
  p_task_id uuid,
  p_assignee_user_id uuid default null
)
returns public.project_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_task public.project_tasks;
  v_updated public.project_tasks;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  select *
    into v_task
  from public.project_tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception '작업을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if not public.current_user_is_project_member(v_task.project_team_id) then
    raise exception '프로젝트 멤버만 담당자를 바꿀 수 있습니다.' using errcode = '42501';
  end if;

  if p_assignee_user_id is not null and not exists (
    select 1
    from public.project_team_memberships ptm
    where ptm.project_team_id = v_task.project_team_id
      and ptm.user_id = p_assignee_user_id
      and ptm.status = 'active'
  ) then
    raise exception '담당자는 프로젝트 멤버 중에서 선택해 주세요.' using errcode = '42501';
  end if;

  if v_task.assignee_user_id is not distinct from p_assignee_user_id then
    return v_task;
  end if;

  update public.project_tasks
  set assignee_user_id = p_assignee_user_id
  where id = p_task_id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.task.assignee.update',
    v_actor,
    v_task.project_team_id,
    null,
    'project_tasks',
    v_task.id,
    jsonb_build_object('assigneeUserId', v_task.assignee_user_id),
    jsonb_build_object('assigneeUserId', v_updated.assignee_user_id),
    null,
    jsonb_build_object('source', 'set_project_task_assignee_rpc')
  );

  return v_updated;
end;
$$;

revoke all on function public.set_project_task_assignee(uuid, uuid) from public, anon;
grant execute on function public.set_project_task_assignee(uuid, uuid) to authenticated;
