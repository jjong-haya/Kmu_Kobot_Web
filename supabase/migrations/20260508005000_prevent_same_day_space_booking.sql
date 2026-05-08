-- Prevent same-day space bookings at the data boundary.
--
-- Root cause:
--   The reservation form could select today's date, and direct table writes
--   could bypass any UI-only guard. Same-day reservations must be rejected by
--   the persisted write path, not merely hidden in the modal.

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

  if new.booking_date <= (now() at time zone 'Asia/Seoul')::date then
    raise exception 'space_booking_same_day_not_allowed';
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
