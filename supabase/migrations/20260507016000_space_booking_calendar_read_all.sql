-- Make the space-booking page a shared reservation calendar again.
--
-- Root cause:
--   20260507007000_space_booking_audience_scope replaced the original calendar
--   read policy with participant/tag/team audience visibility. That made sense
--   for private schedule feeds, but the space-booking page is the room
--   reservation board: members must see all reserved time ranges to avoid
--   collisions. Personal filtering now belongs only to dashboard UI state.

create or replace function public.current_user_can_read_space_booking_calendar()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select auth.uid() is not null and (
    public.current_user_has_permission('members.manage')
    or exists (
      select 1
      from public.member_accounts ma
      where ma.user_id = auth.uid()
        and ma.status in ('active', 'course_member', 'project_only')
    )
  );
$function$;

revoke all on function public.current_user_can_read_space_booking_calendar()
  from public, anon;
grant execute on function public.current_user_can_read_space_booking_calendar()
  to authenticated;

create or replace function public.current_user_can_read_space_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select public.current_user_can_read_space_booking_calendar();
$function$;

revoke all on function public.current_user_can_read_space_booking(uuid)
  from public, anon;
grant execute on function public.current_user_can_read_space_booking(uuid)
  to authenticated;

drop policy if exists "members can read all bookings"
  on public.space_bookings;
drop policy if exists "booking audience can read bookings"
  on public.space_bookings;
drop policy if exists "calendar users can read all bookings"
  on public.space_bookings;
create policy "calendar users can read all bookings"
  on public.space_bookings
  for select
  using (public.current_user_can_read_space_booking_calendar());

drop policy if exists "booking audience can read participants"
  on public.space_booking_participants;
drop policy if exists "calendar users can read booking participants"
  on public.space_booking_participants;
create policy "calendar users can read booking participants"
  on public.space_booking_participants
  for select
  using (public.current_user_can_read_space_booking_calendar());

drop policy if exists "booking audience can read audience tags"
  on public.space_booking_audience_tags;
drop policy if exists "calendar users can read booking audience tags"
  on public.space_booking_audience_tags;
create policy "calendar users can read booking audience tags"
  on public.space_booking_audience_tags
  for select
  using (public.current_user_can_read_space_booking_calendar());

drop policy if exists "booking audience can read audience teams"
  on public.space_booking_audience_teams;
drop policy if exists "calendar users can read booking audience teams"
  on public.space_booking_audience_teams;
create policy "calendar users can read booking audience teams"
  on public.space_booking_audience_teams
  for select
  using (public.current_user_can_read_space_booking_calendar());
