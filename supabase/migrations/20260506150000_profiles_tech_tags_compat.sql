-- Compatibility shim for stale profile clients.
--
-- 20260506040000 intentionally removed profiles.tech_tags as an authority or
-- display source after tags moved to member_tag_assignments. Some already
-- loaded browser bundles can still select or PATCH the old column while the
-- user is completing profile setup, which makes PostgREST return 400 before
-- the real profile save flow can continue.
--
-- Keep this column as inert compatibility storage only. New code must continue
-- to use member_tag_assignments/member_tags for tags, permissions, navigation,
-- club affiliation, and display badges.

alter table public.profiles
  add column if not exists tech_tags text[] not null default '{}'::text[];

comment on column public.profiles.tech_tags is
  'Deprecated compatibility column. Do not use for authority or tag display; use member_tag_assignments/member_tags.';

notify pgrst, 'reload schema';
