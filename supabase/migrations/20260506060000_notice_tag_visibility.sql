-- Tag-scoped notice visibility.
-- Public notices remain a first-class audience; published tag_in notices are
-- visible only to active authenticated members assigned to one of the selected
-- audience tags. Announcement managers can read and manage every notice.

alter table public.notices
  add column if not exists audience_mode text not null default 'public';

update public.notices
set audience_mode = 'public'
where audience_mode is null;

alter table public.notices
  alter column audience_mode set default 'public',
  alter column audience_mode set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_audience_mode_check'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_audience_mode_check
      check (audience_mode in ('public', 'tag_in'));
  end if;
end $$;

create table if not exists public.notice_audience_tags (
  notice_id uuid not null references public.notices(id) on delete cascade,
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  primary key (notice_id, tag_id)
);

create index if not exists notice_audience_tags_tag_idx
  on public.notice_audience_tags(tag_id);

alter table public.notice_audience_tags enable row level security;

create or replace function public.current_user_can_read_notice(p_notice_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_can_manage_announcements()
    or exists (
      select 1
      from public.notices n
      where n.id = p_notice_id
        and n.status = 'published'
        and (
          n.audience_mode = 'public'
          or (
            n.audience_mode = 'tag_in'
            and exists (
              select 1
              from public.member_accounts ma
              join public.member_tag_assignments mta
                on mta.user_id = ma.user_id
              join public.notice_audience_tags nat
                on nat.tag_id = mta.tag_id
              where ma.user_id = auth.uid()
                and ma.status = 'active'
                and nat.notice_id = n.id
            )
          )
        )
    );
$$;

grant execute on function public.current_user_can_read_notice(uuid) to authenticated;

drop policy if exists "notices_admin_delete" on public.notices;
drop policy if exists "notices_admin_insert" on public.notices;
drop policy if exists "notices_admin_update" on public.notices;
drop policy if exists "notices_public_read" on public.notices;
drop policy if exists "notices_read_published_or_manage" on public.notices;
drop policy if exists "notices_insert_team_leads" on public.notices;
drop policy if exists "notices_update_team_leads" on public.notices;
drop policy if exists "notices_delete_team_leads" on public.notices;
drop policy if exists "notices_anon_read_published" on public.notices;
drop policy if exists "notices_authenticated_read_published_or_manage" on public.notices;
drop policy if exists "notices_managers_insert" on public.notices;
drop policy if exists "notices_managers_update" on public.notices;
drop policy if exists "notices_managers_delete" on public.notices;
drop policy if exists "notices_anon_read_published_public" on public.notices;
drop policy if exists "notices_authenticated_read_visible" on public.notices;

create policy "notices_anon_read_published_public"
on public.notices
for select
to anon
using (
  status = 'published'
  and audience_mode = 'public'
);

create policy "notices_authenticated_read_visible"
on public.notices
for select
to authenticated
using (public.current_user_can_read_notice(id));

create policy "notices_managers_insert"
on public.notices
for insert
to authenticated
with check (
  public.current_user_can_manage_announcements()
  and author_id = auth.uid()
);

create policy "notices_managers_update"
on public.notices
for update
to authenticated
using (public.current_user_can_manage_announcements())
with check (public.current_user_can_manage_announcements());

create policy "notices_managers_delete"
on public.notices
for delete
to authenticated
using (public.current_user_can_manage_announcements());

grant select on public.notices to authenticated;
grant insert, update, delete on public.notices to authenticated;
revoke select on public.notices from anon;

drop policy if exists "notice_comments_select_members" on public.notice_comments;
drop policy if exists "notice_comments_insert_members" on public.notice_comments;

create policy "notice_comments_select_members"
on public.notice_comments
for select
to authenticated
using (
  public.current_user_can_read_notice(notice_id)
);

create policy "notice_comments_insert_members"
on public.notice_comments
for insert
to authenticated
with check (
  public.current_user_has_permission('announcements.read')
  and author_id = auth.uid()
  and public.current_user_can_read_notice(notice_id)
);

drop policy if exists "notice_audience_tags_select_readable" on public.notice_audience_tags;
drop policy if exists "notice_audience_tags_managers_insert" on public.notice_audience_tags;
drop policy if exists "notice_audience_tags_managers_update" on public.notice_audience_tags;
drop policy if exists "notice_audience_tags_managers_delete" on public.notice_audience_tags;

create policy "notice_audience_tags_select_readable"
on public.notice_audience_tags
for select
to authenticated
using (
  public.current_user_can_read_notice(notice_id)
  or public.current_user_can_manage_announcements()
);

create policy "notice_audience_tags_managers_insert"
on public.notice_audience_tags
for insert
to authenticated
with check (public.current_user_can_manage_announcements());

create policy "notice_audience_tags_managers_update"
on public.notice_audience_tags
for update
to authenticated
using (public.current_user_can_manage_announcements())
with check (public.current_user_can_manage_announcements());

create policy "notice_audience_tags_managers_delete"
on public.notice_audience_tags
for delete
to authenticated
using (public.current_user_can_manage_announcements());

revoke all on public.notice_audience_tags from anon;
grant select, insert, update, delete on public.notice_audience_tags to authenticated;

create or replace view public.public_notices
with (security_invoker = false)
as
select id, title, body, created_at
from public.notices
where status = 'published'
  and audience_mode = 'public';

grant select on public.public_notices to anon, authenticated;
