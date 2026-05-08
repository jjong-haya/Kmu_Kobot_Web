-- Public read-only surface for the space booking calendar.
--
-- The member page stays behind /member auth and keeps the full reservation
-- workflow. Anonymous users only get this view, which exposes the minimum
-- fields needed to render occupied calendar slots and does not grant access to
-- participant, tag, team, profile, or write paths.

revoke select on public.space_bookings from anon;
revoke all on public.space_booking_participants from anon;
revoke all on public.space_booking_audience_tags from anon;
revoke all on public.space_booking_audience_teams from anon;

create or replace view public.public_space_booking_calendar
with (security_invoker = false)
as
select
  id,
  title,
  booking_date,
  start_time,
  end_time,
  organizer_name,
  type,
  scope,
  attendees
from public.space_bookings;

revoke all on public.public_space_booking_calendar from public, anon, authenticated;
grant select on public.public_space_booking_calendar to anon, authenticated;

notify pgrst, 'reload schema';
