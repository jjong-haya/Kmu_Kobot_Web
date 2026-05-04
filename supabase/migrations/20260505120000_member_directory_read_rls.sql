-- Let signed-in KOBOT members read the member directory.
-- Without this, profiles/member_accounts RLS returns only auth.uid(), so /member/members shows one card.

create or replace function public.current_user_can_read_member_directory()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = auth.uid()
      and ma.status in ('active', 'course_member')
  )
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage');
$$;

grant execute on function public.current_user_can_read_member_directory() to authenticated;

drop policy if exists "profiles_select_self_or_member_admins" on public.profiles;
create policy "profiles_select_self_or_member_admins"
on public.profiles
for select
using (
  id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "member_accounts_select_self_or_member_admins" on public.member_accounts;
create policy "member_accounts_select_self_or_member_admins"
on public.member_accounts
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "org_position_assignments_select_self_or_admins" on public.org_position_assignments;
create policy "org_position_assignments_select_self_or_admins"
on public.org_position_assignments
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "team_memberships_select_self_or_admins" on public.team_memberships;
create policy "team_memberships_select_self_or_admins"
on public.team_memberships
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);
