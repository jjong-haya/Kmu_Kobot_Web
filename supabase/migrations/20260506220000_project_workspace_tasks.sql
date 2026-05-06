-- Jira-style task workspace for joined project members.

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid not null references public.project_teams (id) on delete cascade,
  task_number integer,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  sort_order integer not null default 0,
  due_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_team_id, task_number)
);

create index if not exists project_tasks_project_status_idx
  on public.project_tasks (project_team_id, status, sort_order, created_at desc);

create index if not exists project_tasks_assignee_idx
  on public.project_tasks (assignee_user_id, status, updated_at desc);

create or replace function public.assign_project_task_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.task_number is null then
    select coalesce(max(task_number), 0) + 1
      into new.task_number
    from public.project_tasks
    where project_team_id = new.project_team_id;
  end if;

  return new;
end;
$$;

drop trigger if exists project_tasks_assign_number on public.project_tasks;
create trigger project_tasks_assign_number
before insert on public.project_tasks
for each row execute function public.assign_project_task_number();

drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

create or replace function public.current_user_is_project_member(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_team_memberships ptm
    where ptm.project_team_id = target_project_team_id
      and ptm.user_id = auth.uid()
      and ptm.status = 'active'
  );
$$;

alter table public.project_tasks enable row level security;

drop policy if exists "project_tasks_select_project_members" on public.project_tasks;
create policy "project_tasks_select_project_members"
on public.project_tasks
for select
to authenticated
using (
  public.current_user_can_read_project_member_scope(project_team_id)
);

drop policy if exists "project_tasks_insert_project_members" on public.project_tasks;
create policy "project_tasks_insert_project_members"
on public.project_tasks
for insert
to authenticated
with check (
  public.current_user_is_project_member(project_team_id)
);

drop policy if exists "project_tasks_update_project_members" on public.project_tasks;
create policy "project_tasks_update_project_members"
on public.project_tasks
for update
to authenticated
using (
  public.current_user_is_project_member(project_team_id)
)
with check (
  public.current_user_is_project_member(project_team_id)
);

drop policy if exists "project_tasks_delete_operators_or_creator" on public.project_tasks;
create policy "project_tasks_delete_operators_or_creator"
on public.project_tasks
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.current_user_can_manage_project(project_team_id)
);

grant select, insert, update, delete on public.project_tasks to authenticated;

revoke all on function public.assign_project_task_number() from public, anon;
revoke all on function public.current_user_is_project_member(uuid) from public, anon;
grant execute on function public.current_user_is_project_member(uuid) to authenticated;
