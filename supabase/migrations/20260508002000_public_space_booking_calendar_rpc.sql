-- Replace the anonymous public calendar view with a narrow RPC.
--
-- Root cause:
--   The first public calendar migration exposed only minimal fields through a
--   view, but Supabase's advisor still flags security-definer views. Anonymous
--   calendar reads should not require granting direct table SELECT, and they
--   should not expose organizer_id, participants, tag audiences, teams, or
--   write paths.

drop view if exists public.public_space_booking_calendar;

revoke select on public.space_bookings from anon;
revoke all on public.space_booking_participants from anon;
revoke all on public.space_booking_audience_tags from anon;
revoke all on public.space_booking_audience_teams from anon;

create or replace function public.list_public_space_booking_calendar(
  p_from_date date,
  p_to_date date
)
returns table (
  id uuid,
  title text,
  booking_date date,
  start_time time,
  end_time time,
  organizer_name text,
  type text,
  scope text,
  attendees integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    sb.id,
    sb.title,
    sb.booking_date,
    sb.start_time,
    sb.end_time,
    sb.organizer_name,
    sb.type,
    sb.scope,
    sb.attendees
  from public.space_bookings sb
  where sb.booking_date >= p_from_date
    and sb.booking_date <= p_to_date
  order by sb.booking_date asc, sb.start_time asc;
$function$;

revoke all on function public.list_public_space_booking_calendar(date, date)
  from public, anon, authenticated;
grant execute on function public.list_public_space_booking_calendar(date, date)
  to anon, authenticated;

notify pgrst, 'reload schema';
