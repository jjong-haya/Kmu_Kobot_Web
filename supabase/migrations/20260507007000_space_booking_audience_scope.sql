-- Space booking audience scoping.
--
-- Root cause being fixed:
--   space_bookings stored only a numeric attendee count and the select policy
--   allowed every authenticated user to read every booking. Calendar visibility
--   must be based on explicit participants or owned audience groups.

create table if not exists public.space_booking_participants (
  booking_id uuid not null references public.space_bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (booking_id, user_id)
);

create table if not exists public.space_booking_audience_tags (
  booking_id uuid not null references public.space_bookings(id) on delete cascade,
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (booking_id, tag_id)
);

create table if not exists public.space_booking_audience_teams (
  booking_id uuid not null references public.space_bookings(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (booking_id, team_id)
);

create index if not exists space_booking_participants_user_idx
  on public.space_booking_participants(user_id, booking_id);
create index if not exists space_booking_audience_tags_tag_idx
  on public.space_booking_audience_tags(tag_id, booking_id);
create index if not exists space_booking_audience_teams_team_idx
  on public.space_booking_audience_teams(team_id, booking_id);

insert into public.space_booking_participants (booking_id, user_id, added_by)
select id, organizer_id, organizer_id
from public.space_bookings
on conflict (booking_id, user_id) do nothing;

create or replace function public.current_user_can_read_space_booking(p_booking_id uuid)
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
      from public.space_bookings sb
      where sb.id = p_booking_id
        and sb.organizer_id = auth.uid()
    )
    or exists (
      select 1
      from public.space_booking_participants sbp
      where sbp.booking_id = p_booking_id
        and sbp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.space_booking_audience_tags sbat
      join public.member_tag_assignments mta
        on mta.tag_id = sbat.tag_id
       and mta.user_id = auth.uid()
      where sbat.booking_id = p_booking_id
    )
    or exists (
      select 1
      from public.space_booking_audience_teams sbat
      join public.team_memberships tm
        on tm.team_id = sbat.team_id
       and tm.user_id = auth.uid()
       and tm.active = true
      where sbat.booking_id = p_booking_id
    )
  );
$function$;

revoke all on function public.current_user_can_read_space_booking(uuid) from public, anon;
grant execute on function public.current_user_can_read_space_booking(uuid) to authenticated;

drop policy if exists "members can read all bookings"
  on public.space_bookings;
drop policy if exists "booking audience can read bookings"
  on public.space_bookings;
create policy "booking audience can read bookings"
  on public.space_bookings
  for select
  using (public.current_user_can_read_space_booking(id));

alter table public.space_booking_participants enable row level security;
alter table public.space_booking_audience_tags enable row level security;
alter table public.space_booking_audience_teams enable row level security;

drop policy if exists "booking audience can read participants"
  on public.space_booking_participants;
create policy "booking audience can read participants"
  on public.space_booking_participants
  for select
  using (public.current_user_can_read_space_booking(booking_id));

drop policy if exists "booking audience can read audience tags"
  on public.space_booking_audience_tags;
create policy "booking audience can read audience tags"
  on public.space_booking_audience_tags
  for select
  using (public.current_user_can_read_space_booking(booking_id));

drop policy if exists "booking audience can read audience teams"
  on public.space_booking_audience_teams;
create policy "booking audience can read audience teams"
  on public.space_booking_audience_teams
  for select
  using (public.current_user_can_read_space_booking(booking_id));

drop policy if exists "booking organizer can manage participants"
  on public.space_booking_participants;
create policy "booking organizer can manage participants"
  on public.space_booking_participants
  for all
  using (
    public.current_user_has_permission('members.manage')
    or exists (
      select 1 from public.space_bookings sb
      where sb.id = booking_id and sb.organizer_id = auth.uid()
    )
  )
  with check (
    public.current_user_has_permission('members.manage')
    or exists (
      select 1 from public.space_bookings sb
      where sb.id = booking_id and sb.organizer_id = auth.uid()
    )
  );

drop policy if exists "booking organizer can manage owned club tags"
  on public.space_booking_audience_tags;
create policy "booking organizer can manage owned club tags"
  on public.space_booking_audience_tags
  for all
  using (
    public.current_user_has_permission('members.manage')
    or exists (
      select 1 from public.space_bookings sb
      where sb.id = booking_id and sb.organizer_id = auth.uid()
    )
  )
  with check (
    public.current_user_has_permission('members.manage')
    or (
      exists (
        select 1 from public.space_bookings sb
        where sb.id = booking_id and sb.organizer_id = auth.uid()
      )
      and exists (
        select 1
        from public.member_tags mt
        join public.member_tag_assignments mta
          on mta.tag_id = mt.id
         and mta.user_id = auth.uid()
        where mt.id = tag_id
          and mt.is_club = true
      )
    )
  );

drop policy if exists "booking organizer can manage own teams"
  on public.space_booking_audience_teams;
create policy "booking organizer can manage own teams"
  on public.space_booking_audience_teams
  for all
  using (
    public.current_user_has_permission('members.manage')
    or exists (
      select 1 from public.space_bookings sb
      where sb.id = booking_id and sb.organizer_id = auth.uid()
    )
  )
  with check (
    public.current_user_has_permission('members.manage')
    or (
      exists (
        select 1 from public.space_bookings sb
        where sb.id = booking_id and sb.organizer_id = auth.uid()
      )
      and exists (
        select 1
        from public.team_memberships tm
        where tm.team_id = team_id
          and tm.user_id = auth.uid()
          and tm.active = true
      )
    )
  );

grant select, insert, update, delete on public.space_booking_participants to authenticated;
grant select, insert, update, delete on public.space_booking_audience_tags to authenticated;
grant select, insert, update, delete on public.space_booking_audience_teams to authenticated;

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

  if p_type not in ('meeting', 'study', 'personal') then
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
