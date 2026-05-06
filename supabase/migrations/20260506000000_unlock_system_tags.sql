-- Unlock KOBOT/KOSS so the 회장 can delete or rename them like any other tag,
-- and make sure the legacy status→tag auto-sync is gone (so manually assigning
-- KOBOT to a 'pending' member doesn't get auto-revoked by an old trigger).
--
-- This migration is idempotent: it can run on a DB where clarify_tags_vs_status
-- already ran (no-op) or on one that skipped it (cleans up).

-- 1. Strip the old trigger + function if it still exists.
drop trigger if exists sync_member_status_tags on public.member_accounts;
drop function if exists public.sync_member_status_tags();

-- 2. Clear auto_status on every tag so no future trigger can re-attach itself
--    via the auto_status column.
update public.member_tags
set auto_status = null
where auto_status is not null;

-- 3. Unlock the seeded system tags so the 회장 can delete/rename like any tag.
update public.member_tags
set is_system = false
where slug in ('kobot', 'koss');
