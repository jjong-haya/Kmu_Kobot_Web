-- Limit space booking categories to meeting/study only.
--
-- Root cause:
--   The reservation type lived in three write/read surfaces: the React form,
--   create_space_booking(), and the space_bookings.type check constraint. All
--   three still allowed "personal", so hiding the button alone would let the
--   removed category come back through RPC or direct table writes.

update public.space_bookings
set type = 'study'
where type = 'personal';

alter table public.space_bookings
  drop constraint if exists space_bookings_type_check;

alter table public.space_bookings
  add constraint space_bookings_type_check
  check (type in ('meeting', 'study'));

create or replace function public.create_space_booking(
  p_title text,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_organizer_name text,
  p_type text,
  p_scope text,
  p_attendees integer default 1,
  p_participant_user_ids uuid[] default '{}'::uuid[],
  p_audience_tag_ids uuid[] default '{}'::uuid[],
  p_audience_team_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid := auth.uid();
  v_booking_id uuid;
  v_participants uuid[];
  v_tags uuid[];
  v_teams uuid[];
  v_attendees integer;
begin
  if v_caller is null then
    raise exception 'login_required';
  end if;

  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'space_booking_title_required';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'space_booking_invalid_time_range';
  end if;

  if p_type not in ('meeting', 'study') then
    raise exception 'space_booking_invalid_type';
  end if;

  if p_scope not in ('exclusive', 'desk', 'open') then
    raise exception 'space_booking_invalid_scope';
  end if;

  select coalesce(array_agg(distinct user_id), '{}'::uuid[])
    into v_participants
  from unnest(coalesce(p_participant_user_ids, '{}'::uuid[])) as selected(user_id)
  where selected.user_id is not null;

  if exists (
    select 1
    from unnest(v_participants) as selected(user_id)
    left join public.member_accounts ma
      on ma.user_id = selected.user_id
     and ma.status in ('active', 'course_member', 'project_only')
    where ma.user_id is null
  ) then
    raise exception 'space_booking_participant_not_active_member';
  end if;

  select coalesce(array_agg(distinct tag_id), '{}'::uuid[])
    into v_tags
  from unnest(coalesce(p_audience_tag_ids, '{}'::uuid[])) as selected(tag_id)
  where selected.tag_id is not null;

  if exists (
    select 1
    from unnest(v_tags) as selected(tag_id)
    left join public.member_tags mt
      on mt.id = selected.tag_id
     and mt.is_club = true
    left join public.member_tag_assignments mta
      on mta.tag_id = selected.tag_id
     and mta.user_id = v_caller
    where mt.id is null or mta.tag_id is null
  ) then
    raise exception 'space_booking_tag_not_owned_club_tag';
  end if;

  select coalesce(array_agg(distinct team_id), '{}'::uuid[])
    into v_teams
  from unnest(coalesce(p_audience_team_ids, '{}'::uuid[])) as selected(team_id)
  where selected.team_id is not null;

  if exists (
    select 1
    from unnest(v_teams) as selected(team_id)
    left join public.team_memberships tm
      on tm.team_id = selected.team_id
     and tm.user_id = v_caller
     and tm.active = true
    where tm.team_id is null
  ) then
    raise exception 'space_booking_team_not_owned';
  end if;

  v_attendees := greatest(1, coalesce(p_attendees, 1));

  insert into public.space_bookings (
    title,
    booking_date,
    start_time,
    end_time,
    organizer_id,
    organizer_name,
    type,
    scope,
    attendees
  ) values (
    btrim(p_title),
    p_booking_date,
    p_start_time,
    p_end_time,
    v_caller,
    coalesce(nullif(btrim(p_organizer_name), ''), '예약자'),
    p_type,
    p_scope,
    v_attendees
  )
  returning id into v_booking_id;

  insert into public.space_booking_participants (booking_id, user_id, added_by)
  select v_booking_id, selected.user_id, v_caller
  from unnest(v_participants) as selected(user_id)
  on conflict (booking_id, user_id) do nothing;

  insert into public.space_booking_audience_tags (booking_id, tag_id, created_by)
  select v_booking_id, selected.tag_id, v_caller
  from unnest(v_tags) as selected(tag_id)
  on conflict (booking_id, tag_id) do nothing;

  insert into public.space_booking_audience_teams (booking_id, team_id, created_by)
  select v_booking_id, selected.team_id, v_caller
  from unnest(v_teams) as selected(team_id)
  on conflict (booking_id, team_id) do nothing;

  return v_booking_id;
end;
$function$;

revoke all on function public.create_space_booking(
  text, date, time, time, text, text, text, integer, uuid[], uuid[], uuid[]
) from public, anon;
grant execute on function public.create_space_booking(
  text, date, time, time, text, text, text, integer, uuid[], uuid[], uuid[]
) to authenticated;
