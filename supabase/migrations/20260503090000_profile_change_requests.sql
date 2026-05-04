-- profile_change_requests
-- Allows members to request changes to read-only fields (name, student_id, department, etc.)
-- Operations team reviews and applies changes manually.

create table if not exists public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  field text not null,
  current_value text,
  requested_value text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_change_requests_requester_idx
  on public.profile_change_requests(requester_id);
create index if not exists profile_change_requests_status_idx
  on public.profile_change_requests(status);

-- updated_at trigger
create or replace function public.set_profile_change_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profile_change_requests_set_updated_at
  on public.profile_change_requests;
create trigger profile_change_requests_set_updated_at
  before update on public.profile_change_requests
  for each row execute function public.set_profile_change_request_updated_at();

-- Row Level Security
alter table public.profile_change_requests enable row level security;

-- members can insert their own request
drop policy if exists "members can insert own change request"
  on public.profile_change_requests;
create policy "members can insert own change request"
  on public.profile_change_requests
  for insert
  with check (auth.uid() = requester_id);

-- members can read their own requests
drop policy if exists "members can read own change requests"
  on public.profile_change_requests;
create policy "members can read own change requests"
  on public.profile_change_requests
  for select
  using (auth.uid() = requester_id);

-- members can withdraw (update status) their own pending request
drop policy if exists "members can withdraw own pending request"
  on public.profile_change_requests;
create policy "members can withdraw own pending request"
  on public.profile_change_requests
  for update
  using (auth.uid() = requester_id and status = 'pending')
  with check (auth.uid() = requester_id and status in ('pending', 'withdrawn'));

-- ops can read & manage all (reuse existing permission check fn if available)
-- Uses the same RBAC helper as the rest of the workspace policies.
drop policy if exists "ops can manage change requests"
  on public.profile_change_requests;
create policy "ops can manage change requests"
  on public.profile_change_requests
  for all
  using (public.current_user_has_permission('members.manage'))
  with check (public.current_user_has_permission('members.manage'));
