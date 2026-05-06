-- RLS already denies anonymous project task rows, but table privileges should not be open.

revoke all on public.project_tasks from anon;
revoke all on public.project_tasks from public;
grant select, delete on public.project_tasks to authenticated;

revoke all on function public.create_project_task(uuid, text, text, text, text, uuid, date) from public, anon;
revoke all on function public.set_project_task_status(uuid, text) from public, anon;
grant execute on function public.create_project_task(uuid, text, text, text, text, uuid, date) to authenticated;
grant execute on function public.set_project_task_status(uuid, text) to authenticated;
