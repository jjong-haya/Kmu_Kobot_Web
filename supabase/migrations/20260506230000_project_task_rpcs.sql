-- Keep the Jira-style project workspace behind member-checked RPCs.

revoke insert, update on public.project_tasks from authenticated;
grant select, delete on public.project_tasks to authenticated;

create or replace function public.create_project_task(
  p_project_team_id uuid,
  p_title text,
  p_description text default null,
  p_status text default 'todo',
  p_priority text default 'medium',
  p_assignee_user_id uuid default null,
  p_due_at date default null
)
returns public.project_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_status text := coalesce(nullif(btrim(coalesce(p_status, '')), ''), 'todo');
  v_priority text := coalesce(nullif(btrim(coalesce(p_priority, '')), ''), 'medium');
  v_description text := case
    when p_description is null or btrim(p_description) = '' then null
    else p_description
  end;
  v_task public.project_tasks;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 160 then
    raise exception '작업 제목은 1자 이상 160자 이하로 입력해 주세요.' using errcode = '22023';
  end if;

  if v_status not in ('todo', 'in_progress', 'review', 'done') then
    raise exception '지원하지 않는 작업 상태입니다.' using errcode = '22023';
  end if;

  if v_priority not in ('low', 'medium', 'high') then
    raise exception '지원하지 않는 우선순위입니다.' using errcode = '22023';
  end if;

  if not public.current_user_is_project_member(p_project_team_id) then
    raise exception '프로젝트 멤버만 작업을 만들 수 있습니다.' using errcode = '42501';
  end if;

  if p_assignee_user_id is not null and not exists (
    select 1
    from public.project_team_memberships ptm
    where ptm.project_team_id = p_project_team_id
      and ptm.user_id = p_assignee_user_id
      and ptm.status = 'active'
  ) then
    raise exception '담당자는 프로젝트 멤버 중에서 선택해 주세요.' using errcode = '42501';
  end if;

  insert into public.project_tasks (
    project_team_id,
    title,
    description,
    status,
    priority,
    assignee_user_id,
    due_at,
    created_by
  )
  values (
    p_project_team_id,
    v_title,
    v_description,
    v_status,
    v_priority,
    p_assignee_user_id,
    p_due_at,
    v_actor
  )
  returning * into v_task;

  perform public.create_audit_log(
    'project.task.create',
    v_actor,
    p_project_team_id,
    null,
    'project_tasks',
    v_task.id,
    null,
    jsonb_build_object(
      'title', v_task.title,
      'status', v_task.status,
      'priority', v_task.priority,
      'assigneeUserId', v_task.assignee_user_id
    ),
    null,
    jsonb_build_object('source', 'create_project_task_rpc')
  );

  return v_task;
end;
$$;

create or replace function public.set_project_task_status(
  p_task_id uuid,
  p_status text
)
returns public.project_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_status text := coalesce(nullif(btrim(coalesce(p_status, '')), ''), 'todo');
  v_task public.project_tasks;
  v_updated public.project_tasks;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  if v_status not in ('todo', 'in_progress', 'review', 'done') then
    raise exception '지원하지 않는 작업 상태입니다.' using errcode = '22023';
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
    raise exception '프로젝트 멤버만 작업 상태를 바꿀 수 있습니다.' using errcode = '42501';
  end if;

  if v_task.status = v_status then
    return v_task;
  end if;

  update public.project_tasks
  set status = v_status
  where id = p_task_id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.task.status.update',
    v_actor,
    v_task.project_team_id,
    null,
    'project_tasks',
    v_task.id,
    jsonb_build_object('status', v_task.status),
    jsonb_build_object('status', v_updated.status),
    null,
    jsonb_build_object('source', 'set_project_task_status_rpc')
  );

  return v_updated;
end;
$$;

revoke all on function public.create_project_task(uuid, text, text, text, text, uuid, date) from public, anon;
revoke all on function public.set_project_task_status(uuid, text) from public, anon;
grant execute on function public.create_project_task(uuid, text, text, text, text, uuid, date) to authenticated;
grant execute on function public.set_project_task_status(uuid, text) to authenticated;
