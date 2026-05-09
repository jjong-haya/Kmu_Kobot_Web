create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default '',
  organizer text not null default '',
  capacity_label text not null default '',
  image_tone text not null default 'navy',
  image_tones text[] not null default array['navy']::text[],
  schedule jsonb not null default '[]'::jsonb,
  features jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_range_check check (starts_at < ends_at),
  constraint events_image_tone_check check (image_tone in ('navy', 'amber', 'green', 'slate', 'red')),
  constraint events_schedule_array_check check (jsonb_typeof(schedule) = 'array'),
  constraint events_features_object_check check (jsonb_typeof(features) = 'object')
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_created_by_idx on public.events (created_by);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "events_select_active_members" on public.events;
create policy "events_select_active_members" on public.events
for select
to authenticated
using (
  public.current_user_is_active_member()
  or public.current_user_has_permission('events.read')
  or public.current_user_has_permission('events.manage')
);

drop policy if exists "events_insert_creators" on public.events;
create policy "events_insert_creators" on public.events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.current_user_has_permission('events.create')
    or public.current_user_has_permission('events.manage')
  )
);

drop policy if exists "events_update_creators_or_managers" on public.events;
create policy "events_update_creators_or_managers" on public.events
for update
to authenticated
using (
  created_by = auth.uid()
  or public.current_user_has_permission('events.manage')
)
with check (
  created_by = auth.uid()
  or public.current_user_has_permission('events.manage')
);

drop policy if exists "events_delete_managers" on public.events;
create policy "events_delete_managers" on public.events
for delete
to authenticated
using (public.current_user_has_permission('events.manage'));

grant select, insert, update, delete on public.events to authenticated;
