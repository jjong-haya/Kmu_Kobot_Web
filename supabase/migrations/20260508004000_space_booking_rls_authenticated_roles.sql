-- Restrict space-booking mutation policies to signed-in users.
--
-- Root cause:
--   The original space-booking RLS policies omitted an explicit TO role, so
--   Postgres stored them as PUBLIC policies. Anonymous users still lacked table
--   grants for writes, but security advisors correctly reported those write
--   policies as applicable to anon. Keep the public calendar read policy narrow
--   and make every booking mutation/audience policy authenticated-only.

drop policy if exists "calendar users can read all bookings"
  on public.space_bookings;
create policy "calendar users can read all bookings"
  on public.space_bookings
  for select
  to authenticated
  using ((select public.current_user_can_read_space_booking_calendar()));

drop policy if exists "members can insert own booking"
  on public.space_bookings;
create policy "members can insert own booking"
  on public.space_bookings
  for insert
  to authenticated
  with check ((select auth.uid()) = organizer_id);

drop policy if exists "members can update own booking"
  on public.space_bookings;
create policy "members can update own booking"
  on public.space_bookings
  for update
  to authenticated
  using ((select auth.uid()) = organizer_id)
  with check ((select auth.uid()) = organizer_id);

drop policy if exists "members can delete own booking"
  on public.space_bookings;
create policy "members can delete own booking"
  on public.space_bookings
  for delete
  to authenticated
  using ((select auth.uid()) = organizer_id);

drop policy if exists "ops can manage all bookings"
  on public.space_bookings;
create policy "ops can manage all bookings"
  on public.space_bookings
  for all
  to authenticated
  using ((select public.current_user_has_permission('members.manage'::text)))
  with check ((select public.current_user_has_permission('members.manage'::text)));

drop policy if exists "calendar users can read booking participants"
  on public.space_booking_participants;
create policy "calendar users can read booking participants"
  on public.space_booking_participants
  for select
  to authenticated
  using ((select public.current_user_can_read_space_booking_calendar()));

drop policy if exists "booking organizer can manage participants"
  on public.space_booking_participants;
create policy "booking organizer can manage participants"
  on public.space_booking_participants
  for all
  to authenticated
  using (
    (select public.current_user_has_permission('members.manage'::text))
    or exists (
      select 1
      from public.space_bookings sb
      where sb.id = space_booking_participants.booking_id
        and sb.organizer_id = (select auth.uid())
    )
  )
  with check (
    (select public.current_user_has_permission('members.manage'::text))
    or exists (
      select 1
      from public.space_bookings sb
      where sb.id = space_booking_participants.booking_id
        and sb.organizer_id = (select auth.uid())
    )
  );

drop policy if exists "calendar users can read booking audience tags"
  on public.space_booking_audience_tags;
create policy "calendar users can read booking audience tags"
  on public.space_booking_audience_tags
  for select
  to authenticated
  using ((select public.current_user_can_read_space_booking_calendar()));

drop policy if exists "booking organizer can manage owned club tags"
  on public.space_booking_audience_tags;
create policy "booking organizer can manage owned club tags"
  on public.space_booking_audience_tags
  for all
  to authenticated
  using (
    (select public.current_user_has_permission('members.manage'::text))
    or exists (
      select 1
      from public.space_bookings sb
      where sb.id = space_booking_audience_tags.booking_id
        and sb.organizer_id = (select auth.uid())
    )
  )
  with check (
    (select public.current_user_has_permission('members.manage'::text))
    or (
      exists (
        select 1
        from public.space_bookings sb
        where sb.id = space_booking_audience_tags.booking_id
          and sb.organizer_id = (select auth.uid())
      )
      and exists (
        select 1
        from public.member_tags mt
        join public.member_tag_assignments mta
          on mta.tag_id = mt.id
         and mta.user_id = (select auth.uid())
        where mt.id = space_booking_audience_tags.tag_id
          and mt.is_club = true
      )
    )
  );

drop policy if exists "calendar users can read booking audience teams"
  on public.space_booking_audience_teams;
create policy "calendar users can read booking audience teams"
  on public.space_booking_audience_teams
  for select
  to authenticated
  using ((select public.current_user_can_read_space_booking_calendar()));

drop policy if exists "booking organizer can manage own teams"
  on public.space_booking_audience_teams;
create policy "booking organizer can manage own teams"
  on public.space_booking_audience_teams
  for all
  to authenticated
  using (
    (select public.current_user_has_permission('members.manage'::text))
    or exists (
      select 1
      from public.space_bookings sb
      where sb.id = space_booking_audience_teams.booking_id
        and sb.organizer_id = (select auth.uid())
    )
  )
  with check (
    (select public.current_user_has_permission('members.manage'::text))
    or (
      exists (
        select 1
        from public.space_bookings sb
        where sb.id = space_booking_audience_teams.booking_id
          and sb.organizer_id = (select auth.uid())
      )
      and exists (
        select 1
        from public.team_memberships tm
        where tm.team_id = space_booking_audience_teams.team_id
          and tm.user_id = (select auth.uid())
          and tm.active = true
      )
    )
  );

revoke insert, update, delete on public.space_bookings from anon;
revoke all on public.space_booking_participants from anon;
revoke all on public.space_booking_audience_tags from anon;
revoke all on public.space_booking_audience_teams from anon;

notify pgrst, 'reload schema';
