-- Tag-driven role system.
-- Each tag bundles 0..N permissions + 0..N sidebar nav paths.
-- Tags are assigned to members; their effective capabilities are the union
-- of all assigned tags plus any direct user-level permission grants.
--
-- "is_system = true" rows (KOBOT, KOSS) are seeded from the legacy
-- ACTIVE_MEMBER_BASE_PERMISSIONS / COURSE_MEMBER_BASE_PERMISSIONS sets and
-- migrated from nav_visibility. The 회장 cannot delete system tags but can
-- still tweak their grants (color, label, permissions, nav) freely.

create table if not exists public.member_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text,
  color text not null default '#6b7280',
  is_system boolean not null default false,
  auto_status text check (auto_status in ('active', 'course_member')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists member_tags_slug_idx on public.member_tags (slug);
create index if not exists member_tags_auto_status_idx on public.member_tags (auto_status);

create table if not exists public.member_tag_permissions (
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  permission text not null,
  primary key (tag_id, permission)
);

create table if not exists public.member_tag_nav (
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  href text not null,
  primary key (tag_id, href)
);

create table if not exists public.member_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  unique (user_id, tag_id)
);

create index if not exists member_tag_assignments_user_idx
  on public.member_tag_assignments (user_id);
create index if not exists member_tag_assignments_tag_idx
  on public.member_tag_assignments (tag_id);

alter table public.member_tags enable row level security;
alter table public.member_tag_permissions enable row level security;
alter table public.member_tag_nav enable row level security;
alter table public.member_tag_assignments enable row level security;

drop policy if exists "member_tags_select_authenticated" on public.member_tags;
create policy "member_tags_select_authenticated" on public.member_tags
  for select to authenticated using (true);

drop policy if exists "member_tags_write_admin" on public.member_tags;
create policy "member_tags_write_admin" on public.member_tags
  for all to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_tag_permissions_select_authenticated" on public.member_tag_permissions;
create policy "member_tag_permissions_select_authenticated" on public.member_tag_permissions
  for select to authenticated using (true);

drop policy if exists "member_tag_permissions_write_admin" on public.member_tag_permissions;
create policy "member_tag_permissions_write_admin" on public.member_tag_permissions
  for all to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_tag_nav_select_authenticated" on public.member_tag_nav;
create policy "member_tag_nav_select_authenticated" on public.member_tag_nav
  for select to authenticated using (true);

drop policy if exists "member_tag_nav_write_admin" on public.member_tag_nav;
create policy "member_tag_nav_write_admin" on public.member_tag_nav
  for all to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_tag_assignments_select_self_or_admin" on public.member_tag_assignments;
create policy "member_tag_assignments_select_self_or_admin" on public.member_tag_assignments
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_can_read_member_directory()
  );

drop policy if exists "member_tag_assignments_write_admin" on public.member_tag_assignments;
create policy "member_tag_assignments_write_admin" on public.member_tag_assignments
  for all to authenticated
  using (
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  )
  with check (
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  );

grant select on public.member_tags to authenticated;
grant insert, update, delete on public.member_tags to authenticated;
grant select, insert, update, delete on public.member_tag_permissions to authenticated;
grant select, insert, update, delete on public.member_tag_nav to authenticated;
grant select, insert, update, delete on public.member_tag_assignments to authenticated;

-- ============================================================================
-- Seed system tags
-- ============================================================================
insert into public.member_tags (slug, label, color, is_system, auto_status, description) values
  ('kobot', 'KOBOT', '#0f172a', true, 'active', '정규 부원에게 자동으로 부여되는 시스템 태그'),
  ('koss', 'KOSS', '#7c3aed', true, 'course_member', 'KOSS 수강생에게 자동으로 부여되는 시스템 태그')
on conflict (slug) do update set
  label = excluded.label,
  color = excluded.color,
  is_system = excluded.is_system,
  auto_status = excluded.auto_status,
  description = coalesce(public.member_tags.description, excluded.description);

-- KOBOT permissions (= legacy ACTIVE_MEMBER_BASE_PERMISSIONS)
insert into public.member_tag_permissions (tag_id, permission)
select t.id, p.permission
from public.member_tags t
cross join (values
  ('dashboard.read'),
  ('notifications.read'),
  ('announcements.read'),
  ('members.read'),
  ('projects.read'),
  ('resources.read'),
  ('events.read')
) as p(permission)
where t.slug = 'kobot'
on conflict do nothing;

-- KOSS permissions (= legacy COURSE_MEMBER_BASE_PERMISSIONS)
insert into public.member_tag_permissions (tag_id, permission)
select t.id, p.permission
from public.member_tags t
cross join (values
  ('dashboard.read'),
  ('notifications.read'),
  ('announcements.read'),
  ('members.read')
) as p(permission)
where t.slug = 'koss'
on conflict do nothing;

-- KOBOT nav (= every standard 부원 menu, including those gated by permissions)
insert into public.member_tag_nav (tag_id, href)
select t.id, p.href
from public.member_tags t
cross join (values
  ('/member'),
  ('/member/notifications'),
  ('/member/announcements'),
  ('/member/contact-requests'),
  ('/member/study-log'),
  ('/member/study-playlist'),
  ('/member/projects'),
  ('/member/events'),
  ('/member/members'),
  ('/member/resources'),
  ('/member/space-booking'),
  ('/member/equipment'),
  ('/member/votes')
) as p(href)
where t.slug = 'kobot'
on conflict do nothing;

-- KOSS nav (= existing nav_visibility values, fallback to default seed)
insert into public.member_tag_nav (tag_id, href)
select t.id, coalesce(nv.href, p.href)
from public.member_tags t
cross join lateral (values
  ('/member'),
  ('/member/notifications'),
  ('/member/announcements'),
  ('/member/contact-requests'),
  ('/member/members'),
  ('/member/space-booking')
) as p(href)
left join public.nav_visibility nv
  on nv.role_key = 'course_member'
  and nv.href = p.href
  and nv.visible = true
where t.slug = 'koss'
on conflict do nothing;

-- Auto-assign system tags to existing members
insert into public.member_tag_assignments (user_id, tag_id)
select ma.user_id, t.id
from public.member_accounts ma
join public.member_tags t
  on t.auto_status = ma.status
where ma.status in ('active', 'course_member')
on conflict (user_id, tag_id) do nothing;

-- ============================================================================
-- Trigger: keep system tag assignments in sync with member_accounts.status
-- ============================================================================
create or replace function public.sync_member_status_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tag_id uuid;
begin
  -- remove auto tags that no longer match new status
  delete from public.member_tag_assignments mta
  using public.member_tags t
  where mta.tag_id = t.id
    and mta.user_id = new.user_id
    and t.auto_status is not null
    and t.auto_status <> new.status;

  -- add the auto tag for the new status (if any)
  if new.status in ('active', 'course_member') then
    select id into v_tag_id from public.member_tags where auto_status = new.status limit 1;
    if v_tag_id is not null then
      insert into public.member_tag_assignments (user_id, tag_id)
      values (new.user_id, v_tag_id)
      on conflict (user_id, tag_id) do nothing;
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists sync_member_status_tags on public.member_accounts;
create trigger sync_member_status_tags
  after insert or update of status on public.member_accounts
  for each row execute function public.sync_member_status_tags();

-- ============================================================================
-- Helper RPCs
-- ============================================================================

-- Effective permissions for the current authenticated user (union of every
-- tag they hold). Used by the client to merge with direct user_permissions.
create or replace function public.current_user_tag_permissions()
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select distinct mtp.permission
  from public.member_tag_permissions mtp
  join public.member_tag_assignments mta on mta.tag_id = mtp.tag_id
  where mta.user_id = auth.uid();
$function$;

grant execute on function public.current_user_tag_permissions() to authenticated;

-- Effective nav paths for the current authenticated user.
create or replace function public.current_user_tag_nav_paths()
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select distinct mtn.href
  from public.member_tag_nav mtn
  join public.member_tag_assignments mta on mta.tag_id = mtn.tag_id
  where mta.user_id = auth.uid();
$function$;

grant execute on function public.current_user_tag_nav_paths() to authenticated;

-- ============================================================================
-- Deprecate nav_visibility (the previous one-role-key table)
-- ============================================================================
-- Keep for now as a cold backup; new code reads from member_tag_nav.
comment on table public.nav_visibility is
  'DEPRECATED — superseded by member_tag_nav. Kept for one release as cold backup.';
