-- Invite links and role-tag boundary cleanup.
--
-- Root cause:
--   * course invite preview exposed only a boolean, so the client could not
--     distinguish expired links from blocked/deleted links.
--   * invite write paths treated empty default_tags as KOSS, letting legacy
--     course-member defaults revive in a KOBOT club flow.
--   * president / vice-president display tags could receive permissions even
--     though actual organization authority already belongs to org_position_*.

drop function if exists public.get_course_invite_preview(text);

create function public.get_course_invite_preview(invite_code text)
returns table (
  code text,
  label text,
  club_label text,
  default_tags text[],
  is_available boolean,
  availability_status text
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
    ) as is_available,
    case
      when cic.is_active = false then 'blocked'
      when cic.expires_at is not null and cic.expires_at < now() then 'expired'
      when cic.max_uses is not null and cic.uses >= cic.max_uses then 'exhausted'
      else 'available'
    end as availability_status
  from public.course_invite_codes cic
  join normalized on normalized.code = cic.code
  limit 1;
$function$;

revoke all on function public.get_course_invite_preview(text) from public, anon, authenticated;
grant execute on function public.get_course_invite_preview(text) to anon, authenticated;

-- KOSS is not a KOBOT club invite target. Keep a legacy tag row if present,
-- but remove it from the club/invite domain so it cannot be selected again.
update public.member_tags
   set is_club = false,
       description = coalesce(description, 'Legacy KOSS tag') || ' (초대코드 동아리 후보 아님)',
       updated_at = now()
 where lower(slug) = 'koss'
   and is_club = true;

-- Existing invite codes that inherited KOSS are migrated to the KOBOT club tag
-- when possible. Other non-club or authority-bearing tags are removed from the
-- invite default list instead of being silently ignored by the client.
with all_codes as (
  select id from public.course_invite_codes
),
selected as (
  select
    cic.id,
    selected_tag.ord,
    case
      when lower(btrim(selected_tag.slug)) = 'koss' then 'kobot'
      else btrim(selected_tag.slug)
    end as requested_slug
  from public.course_invite_codes cic
  left join lateral unnest(coalesce(cic.default_tags, '{}'::text[]))
    with ordinality as selected_tag(slug, ord)
    on true
),
matched as (
  select
    selected.id,
    selected.ord,
    mt.slug,
    mt.label
  from selected
  join public.member_tags mt
    on lower(mt.slug) = lower(selected.requested_slug)
  where mt.is_club = true
    and not exists (
      select 1
      from public.member_tag_permissions mtp
      where mtp.tag_id = mt.id
        and public.is_sensitive_member_permission(mtp.permission)
    )
),
deduped as (
  select distinct on (id, lower(slug))
    id,
    slug,
    label,
    ord
  from matched
  order by id, lower(slug), ord
),
rolled as (
  select
    id,
    array_agg(slug order by ord) as tags,
    (array_agg(label order by lower(slug), slug))[1] as club_label
  from deduped
  group by id
),
cleaned as (
  select
    all_codes.id,
    coalesce(rolled.tags, '{}'::text[]) as tags,
    rolled.club_label
  from all_codes
  left join rolled on rolled.id = all_codes.id
)
update public.course_invite_codes cic
   set default_tags = cleaned.tags,
       club_affiliation = cleaned.club_label,
       updated_at = now()
  from cleaned
 where cleaned.id = cic.id;

create or replace function public.prevent_sensitive_invite_default_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tags text[] := coalesce(new.default_tags, '{}'::text[]);
begin
  if cardinality(v_tags) = 0 then
    raise exception 'invite_default_tags_required';
  end if;

  if exists (
    select 1
      from unnest(v_tags) as selected(slug)
      left join public.member_tags mt
        on lower(mt.slug) = lower(selected.slug)
     where mt.id is null
  ) then
    raise exception 'invite_default_tag_not_found';
  end if;

  if exists (
    select 1
      from unnest(v_tags) as selected(slug)
      join public.member_tags mt
        on lower(mt.slug) = lower(selected.slug)
     where mt.is_club is not true
  ) then
    raise exception 'invite_default_tag_must_be_club';
  end if;

  if exists (
    select 1
      from unnest(v_tags) as selected(slug)
      join public.member_tags mt
        on lower(mt.slug) = lower(selected.slug)
      join public.member_tag_permissions mtp
        on mtp.tag_id = mt.id
     where public.is_sensitive_member_permission(mtp.permission)
  ) then
    raise exception 'invite_default_tag_has_sensitive_permission';
  end if;

  return new;
end;
$function$;

revoke all on function public.prevent_sensitive_invite_default_tags() from public, anon;
grant execute on function public.prevent_sensitive_invite_default_tags() to authenticated;

drop trigger if exists prevent_sensitive_invite_default_tags on public.course_invite_codes;
create trigger prevent_sensitive_invite_default_tags
before insert or update of default_tags on public.course_invite_codes
for each row execute function public.prevent_sensitive_invite_default_tags();

-- 회장/부회장 태그는 표시용 역할 태그다. 실제 권한은 org_position_assignments
-- + org_position_permissions 에서만 계산되며, 태그 권한 매핑으로 복제하지 않는다.
delete from public.member_tag_permissions mtp
using public.member_tags mt
where mt.id = mtp.tag_id
  and lower(mt.slug) in ('president', 'vice_president', 'vice-president');

update public.member_tags
   set description = case
     when lower(slug) = 'president'
       then '회장 표시용 역할 태그. 실제 권한은 org_position_permissions에서만 계산한다.'
     when lower(slug) in ('vice_president', 'vice-president')
       then '부회장 표시용 역할 태그. 실제 권한은 org_position_permissions에서만 계산한다.'
     else description
   end,
       updated_at = now()
 where lower(slug) in ('president', 'vice_president', 'vice-president');

create or replace function public.prevent_permissions_on_position_display_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_slug text;
begin
  select lower(mt.slug)
    into v_slug
    from public.member_tags mt
   where mt.id = new.tag_id;

  if v_slug in ('president', 'vice_president', 'vice-president') then
    raise exception 'position_display_tag_cannot_have_permissions';
  end if;

  return new;
end;
$function$;

revoke all on function public.prevent_permissions_on_position_display_tags() from public, anon;
grant execute on function public.prevent_permissions_on_position_display_tags() to authenticated;

drop trigger if exists prevent_permissions_on_position_display_tags on public.member_tag_permissions;
create trigger prevent_permissions_on_position_display_tags
before insert or update of tag_id on public.member_tag_permissions
for each row execute function public.prevent_permissions_on_position_display_tags();
