-- Member directory profile extensions and per-user favorites.
-- Domain terms:
-- - tag: a member-facing directory label, not only a technical label.
-- - favorite: a private bookmark from one viewer to one member profile.

alter table public.profiles
  add column if not exists profile_bio text,
  add column if not exists public_email citext,
  add column if not exists github_url text,
  add column if not exists linkedin_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_profile_bio_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_profile_bio_length
      check (
        profile_bio is null
        or char_length(btrim(profile_bio)) <= 160
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_public_email_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_public_email_format
      check (
        public_email is null
        or public_email::text ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_github_url_safe'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_github_url_safe
      check (
        github_url is null
        or (
          char_length(github_url) <= 200
          and github_url ~ '^https://'
          and github_url !~ '[[:space:]]'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_linkedin_url_safe'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_linkedin_url_safe
      check (
        linkedin_url is null
        or (
          char_length(linkedin_url) <= 200
          and linkedin_url ~ '^https://'
          and linkedin_url !~ '[[:space:]]'
        )
      );
  end if;
end $$;

create table if not exists public.member_favorite_profiles (
  viewer_user_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewer_user_id, target_user_id),
  constraint member_favorite_profiles_no_self check (viewer_user_id <> target_user_id)
);

create index if not exists member_favorite_profiles_target_idx
  on public.member_favorite_profiles (target_user_id);

alter table public.member_favorite_profiles enable row level security;

drop policy if exists "member_favorites_select_own"
  on public.member_favorite_profiles;
create policy "member_favorites_select_own"
  on public.member_favorite_profiles
  for select
  using (viewer_user_id = auth.uid());

drop policy if exists "member_favorites_insert_own"
  on public.member_favorite_profiles;
create policy "member_favorites_insert_own"
  on public.member_favorite_profiles
  for insert
  with check (
    viewer_user_id = auth.uid()
    and public.current_user_has_permission('members.read')
  );

drop policy if exists "member_favorites_delete_own"
  on public.member_favorite_profiles;
create policy "member_favorites_delete_own"
  on public.member_favorite_profiles
  for delete
  using (viewer_user_id = auth.uid());
