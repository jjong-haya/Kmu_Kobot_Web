-- Public invite landing preview.
--
-- Root cause:
--   /invite/course rendered "KOSS" from hard-coded frontend copy even though
--   invite ownership is now derived from course_invite_codes.default_tags and
--   member_tags.is_club. Public visitors cannot read course_invite_codes
--   directly because invite management is an ops-only table, so the landing
--   page needs a narrow read model.

create or replace function public.get_course_invite_preview(invite_code text)
returns table (
  code text,
  label text,
  club_label text,
  default_tags text[],
  is_available boolean
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with normalized as (
    select upper(regexp_replace(btrim(coalesce(invite_code, '')), '\s+', '', 'g')) as code
  )
  select
    cic.code,
    cic.label,
    (
      select mt.label
      from unnest(coalesce(cic.default_tags, '{}'::text[])) as selected_tag(slug)
      join public.member_tags mt
        on lower(mt.slug) = lower(selected_tag.slug)
      where mt.is_club = true
      order by lower(mt.slug), mt.slug
      limit 1
    ) as club_label,
    coalesce(cic.default_tags, '{}'::text[]) as default_tags,
    (
      cic.is_active = true
      and (cic.expires_at is null or cic.expires_at >= now())
      and (cic.max_uses is null or cic.uses < cic.max_uses)
    ) as is_available
  from public.course_invite_codes cic
  join normalized on normalized.code = cic.code
  limit 1;
$function$;

revoke all on function public.get_course_invite_preview(text) from public, anon, authenticated;
grant execute on function public.get_course_invite_preview(text) to anon, authenticated;
