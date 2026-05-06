-- Prelude for announcements migrations.
-- 20260505143000_announcements_permissions_and_comments.sql adds policies and
-- constraints to public.notices, so a fresh migration chain needs the table
-- before that file references public.notices::regclass.

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null default 'draft',
  audience_mode text not null default 'public',
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_status_check check (status in ('draft', 'published')),
  constraint notices_audience_mode_check check (audience_mode in ('public', 'tag_in'))
);

create index if not exists notices_status_created_at_idx
  on public.notices (status, created_at desc);

create index if not exists notices_author_created_at_idx
  on public.notices (author_id, created_at desc);

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
before update on public.notices
for each row execute function public.set_updated_at();
