-- Prevent overlapping space bookings at the data boundary.
--
-- Root cause:
--   create_space_booking and direct space_bookings inserts only validated
--   end_time > start_time. Nothing checked same-day interval overlap, so two
--   writes could reserve the room for the same time range.

create index if not exists space_bookings_date_time_idx
  on public.space_bookings (booking_date, start_time, end_time);

create or replace function public.find_space_booking_time_conflict(
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_ignore_booking_id uuid default null
)
returns table (
  booking_date date,
  start_time time,
  end_time time
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select sb.booking_date, sb.start_time, sb.end_time
  from public.space_bookings sb
  where sb.booking_date = p_booking_date
    and (p_ignore_booking_id is null or sb.id <> p_ignore_booking_id)
    and sb.start_time < p_end_time
    and sb.end_time > p_start_time
  order by sb.start_time asc, sb.end_time asc
  limit 1;
$function$;

revoke all on function public.find_space_booking_time_conflict(date, time, time, uuid)
  from public, anon;
grant execute on function public.find_space_booking_time_conflict(date, time, time, uuid)
  to authenticated;

create or replace function public.prevent_space_booking_overlap()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_conflict record;
begin
  if new.end_time <= new.start_time then
    raise exception 'space_booking_invalid_time_range';
  end if;

  perform pg_advisory_xact_lock(hashtext('space_bookings:' || new.booking_date::text));

  select sb.booking_date, sb.start_time, sb.end_time
    into v_conflict
  from public.space_bookings sb
  where sb.booking_date = new.booking_date
    and (new.id is null or sb.id <> new.id)
    and sb.start_time < new.end_time
    and sb.end_time > new.start_time
  order by sb.start_time asc, sb.end_time asc
  limit 1;

  if found then
    raise exception using
      message = 'space_booking_time_conflict',
      detail = new.booking_date::text
        || '|'
        || to_char(v_conflict.start_time, 'HH24:MI')
        || '|'
        || to_char(v_conflict.end_time, 'HH24:MI'),
      hint = 'Choose a non-overlapping time range.';
  end if;

  return new;
end;
$function$;

drop trigger if exists space_bookings_prevent_overlap
  on public.space_bookings;
create trigger space_bookings_prevent_overlap
  before insert or update of booking_date, start_time, end_time
  on public.space_bookings
  for each row execute function public.prevent_space_booking_overlap();
