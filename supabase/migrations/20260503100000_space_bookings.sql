-- space_bookings
-- 동아리실 공간 예약 (회의/스터디/개인). 캘린더 기반 예약 시스템.

create table if not exists public.space_bookings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  organizer_name text not null,                  -- snapshot of name at time of booking
  type text not null
    check (type in ('meeting', 'study', 'personal')),
  scope text not null
    check (scope in ('exclusive', 'desk', 'open')),
  attendees integer not null default 1
    check (attendees >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint space_bookings_time_order check (end_time > start_time)
);

create index if not exists space_bookings_date_idx
  on public.space_bookings (booking_date);
create index if not exists space_bookings_organizer_idx
  on public.space_bookings (organizer_id);

-- updated_at trigger
create or replace function public.set_space_booking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists space_bookings_set_updated_at
  on public.space_bookings;
create trigger space_bookings_set_updated_at
  before update on public.space_bookings
  for each row execute function public.set_space_booking_updated_at();

-- Row Level Security
alter table public.space_bookings enable row level security;

-- any authenticated active member can read all bookings (calendar visibility)
drop policy if exists "members can read all bookings"
  on public.space_bookings;
create policy "members can read all bookings"
  on public.space_bookings
  for select
  using (auth.uid() is not null);

-- members can insert their own booking
drop policy if exists "members can insert own booking"
  on public.space_bookings;
create policy "members can insert own booking"
  on public.space_bookings
  for insert
  with check (auth.uid() = organizer_id);

-- members can update/delete their own booking (within reason — adjust later)
drop policy if exists "members can update own booking"
  on public.space_bookings;
create policy "members can update own booking"
  on public.space_bookings
  for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

drop policy if exists "members can delete own booking"
  on public.space_bookings;
create policy "members can delete own booking"
  on public.space_bookings
  for delete
  using (auth.uid() = organizer_id);

-- ops can manage everything
drop policy if exists "ops can manage all bookings"
  on public.space_bookings;
create policy "ops can manage all bookings"
  on public.space_bookings
  for all
  using (public.has_permission('members.manage'))
  with check (public.has_permission('members.manage'));
