-- DB-backed sidebar visibility per role tier.
-- Phase 1: only course_member is configurable. 부원/공식팀장/부회장/회장
-- (active member tiers) keep using the permission system.

create table if not exists public.nav_visibility (
  id uuid primary key default gen_random_uuid(),
  role_key text not null check (role_key in ('course_member')),
  href text not null,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique (role_key, href)
);

create index if not exists nav_visibility_role_key_idx
  on public.nav_visibility (role_key);

alter table public.nav_visibility enable row level security;

drop policy if exists "nav_visibility_select_authenticated" on public.nav_visibility;
create policy "nav_visibility_select_authenticated"
  on public.nav_visibility
  for select
  to authenticated
  using (true);

drop policy if exists "nav_visibility_write_admin" on public.nav_visibility;
create policy "nav_visibility_write_admin"
  on public.nav_visibility
  for all
  to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

grant select on public.nav_visibility to authenticated;
grant insert, update, delete on public.nav_visibility to authenticated;

-- Seed with the same set that was previously hard-coded as
-- COURSE_MEMBER_ALLOWED_PATHS in MemberLayout. Account pages
-- (/member/profile etc.) are NOT toggleable: every signed-in user can
-- see their own account regardless of role.
insert into public.nav_visibility (role_key, href, visible) values
  ('course_member', '/member', true),
  ('course_member', '/member/notifications', true),
  ('course_member', '/member/announcements', true),
  ('course_member', '/member/contact-requests', true),
  ('course_member', '/member/members', true),
  ('course_member', '/member/space-booking', true),
  ('course_member', '/member/study-log', false),
  ('course_member', '/member/study-playlist', false),
  ('course_member', '/member/projects', false),
  ('course_member', '/member/events', false),
  ('course_member', '/member/resources', false),
  ('course_member', '/member/equipment', false),
  ('course_member', '/member/votes', false)
on conflict (role_key, href) do nothing;
