-- Announcements domain rules:
-- - Members can read published notices and write comments.
-- - Official team leads and higher roles can create/manage notices.
-- - UI visibility is convenience only; RLS is the source of truth.

insert into public.permissions (code, description)
values
  ('announcements.manage', 'Create and manage announcements')
on conflict (code) do update
set description = excluded.description;

with role_targets as (
  select tr.id as team_role_id
  from public.team_roles tr
  where tr.slug = 'team-lead'::citext
),
permission_targets as (
  select id as permission_id
  from public.permissions
  where code = 'announcements.manage'
)
insert into public.team_role_permissions (team_role_id, permission_id)
select role_targets.team_role_id, permission_targets.permission_id
from role_targets
cross join permission_targets
on conflict do nothing;

create or replace function public.current_user_can_manage_announcements()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('announcements.manage');
$$;

grant execute on function public.current_user_can_manage_announcements() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_author_id_fkey'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_author_id_fkey
      foreign key (author_id)
      references public.profiles(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_status_check'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

alter table public.notices enable row level security;

drop policy if exists "notices_admin_delete" on public.notices;
drop policy if exists "notices_admin_insert" on public.notices;
drop policy if exists "notices_admin_update" on public.notices;
drop policy if exists "notices_public_read" on public.notices;
drop policy if exists "notices_read_published_or_manage" on public.notices;
drop policy if exists "notices_insert_team_leads" on public.notices;
drop policy if exists "notices_update_team_leads" on public.notices;
drop policy if exists "notices_delete_team_leads" on public.notices;

create policy "notices_read_published_or_manage"
on public.notices
for select
using (
  status = 'published'
  or public.current_user_can_manage_announcements()
);

create policy "notices_insert_team_leads"
on public.notices
for insert
with check (
  public.current_user_can_manage_announcements()
  and author_id = auth.uid()
);

create policy "notices_update_team_leads"
on public.notices
for update
using (public.current_user_can_manage_announcements())
with check (public.current_user_can_manage_announcements());

create policy "notices_delete_team_leads"
on public.notices
for delete
using (public.current_user_can_manage_announcements());

create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notice_comments_body_length check (
    char_length(btrim(body)) between 1 and 1000
  )
);

create index if not exists notice_comments_notice_created_idx
  on public.notice_comments(notice_id, created_at);

create index if not exists notice_comments_author_idx
  on public.notice_comments(author_id);

create or replace function public.set_notice_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notice_comments_set_updated_at
  on public.notice_comments;
create trigger notice_comments_set_updated_at
  before update on public.notice_comments
  for each row execute function public.set_notice_comment_updated_at();

alter table public.notice_comments enable row level security;

drop policy if exists "notice_comments_select_members" on public.notice_comments;
drop policy if exists "notice_comments_insert_members" on public.notice_comments;
drop policy if exists "notice_comments_update_own" on public.notice_comments;
drop policy if exists "notice_comments_delete_own_or_manage" on public.notice_comments;

create policy "notice_comments_select_members"
on public.notice_comments
for select
using (
  public.current_user_has_permission('announcements.read')
  and exists (
    select 1
    from public.notices n
    where n.id = notice_comments.notice_id
      and (
        n.status = 'published'
        or public.current_user_can_manage_announcements()
      )
  )
);

create policy "notice_comments_insert_members"
on public.notice_comments
for insert
with check (
  public.current_user_has_permission('announcements.read')
  and author_id = auth.uid()
  and exists (
    select 1
    from public.notices n
    where n.id = notice_comments.notice_id
      and (
        n.status = 'published'
        or public.current_user_can_manage_announcements()
      )
  )
);

create policy "notice_comments_update_own"
on public.notice_comments
for update
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.current_user_has_permission('announcements.read')
);

create policy "notice_comments_delete_own_or_manage"
on public.notice_comments
for delete
using (
  author_id = auth.uid()
  or public.current_user_can_manage_announcements()
);

grant select, insert, update, delete on public.notice_comments to authenticated;
