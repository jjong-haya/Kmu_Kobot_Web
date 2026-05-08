-- Finalize anonymous public calendar access with column-level grants.
--
-- Root cause:
--   The view and RPC variants both kept anonymous reads away from private
--   booking relations, but Supabase security advisors flag security-definer
--   public surfaces. The public calendar can be modeled directly as a narrow
--   column grant plus a read-only anon RLS policy instead.

drop view if exists public.public_space_booking_calendar;

revoke all on function public.list_public_space_booking_calendar(date, date)
  from public, anon, authenticated;
drop function if exists public.list_public_space_booking_calendar(date, date);

drop policy if exists "anon can read public booking calendar fields"
  on public.space_bookings;
create policy "anon can read public booking calendar fields"
  on public.space_bookings
  for select
  to anon
  using (true);

revoke all on public.space_bookings from anon;
grant select (
  id,
  title,
  booking_date,
  start_time,
  end_time,
  organizer_name,
  type,
  scope,
  attendees
) on public.space_bookings to anon;

revoke all on public.space_booking_participants from anon;
revoke all on public.space_booking_audience_tags from anon;
revoke all on public.space_booking_audience_teams from anon;

notify pgrst, 'reload schema';
