-- Tag policy safety guards.
--
-- member_tags is the IAM-group-like aggregate:
--   member_tags             = group
--   member_tag_permissions  = attached permission policy
--   member_tag_nav          = attached navigation policy
--   member_tag_assignments  = user/group membership
--
-- Club tags and invite-code default tags must not carry dangerous authority.

create or replace function public.is_sensitive_member_permission(p_permission text)
returns boolean
language sql
immutable
set search_path to 'public'
as $function$
  select
    lower(btrim(coalesce(p_permission, ''))) = 'admin.access'
    or lower(btrim(coalesce(p_permission, ''))) like '%.manage';
$function$;

revoke all on function public.is_sensitive_member_permission(text) from public, anon;
grant execute on function public.is_sensitive_member_permission(text) to authenticated;

delete from public.member_tag_permissions mtp
using public.member_tags mt
where mt.id = mtp.tag_id
  and mt.is_club = true
  and public.is_sensitive_member_permission(mtp.permission);

create or replace function public.prevent_sensitive_permissions_on_club_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_is_club boolean;
begin
  select mt.is_club
    into v_is_club
    from public.member_tags mt
   where mt.id = new.tag_id;

  if coalesce(v_is_club, false) and public.is_sensitive_member_permission(new.permission) then
    raise exception 'sensitive_permission_not_allowed_for_club_tag';
  end if;

  return new;
end;
$function$;

revoke all on function public.prevent_sensitive_permissions_on_club_tags() from public, anon;
grant execute on function public.prevent_sensitive_permissions_on_club_tags() to authenticated;

drop trigger if exists prevent_sensitive_permissions_on_club_tags on public.member_tag_permissions;
create trigger prevent_sensitive_permissions_on_club_tags
before insert or update on public.member_tag_permissions
for each row execute function public.prevent_sensitive_permissions_on_club_tags();

create or replace function public.prevent_club_tag_with_sensitive_permissions()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.is_club = true and exists (
    select 1
      from public.member_tag_permissions mtp
     where mtp.tag_id = new.id
       and public.is_sensitive_member_permission(mtp.permission)
  ) then
    raise exception 'club_tag_cannot_have_sensitive_permissions';
  end if;

  return new;
end;
$function$;

revoke all on function public.prevent_club_tag_with_sensitive_permissions() from public, anon;
grant execute on function public.prevent_club_tag_with_sensitive_permissions() to authenticated;

drop trigger if exists prevent_club_tag_with_sensitive_permissions on public.member_tags;
create trigger prevent_club_tag_with_sensitive_permissions
before insert or update of is_club on public.member_tags
for each row execute function public.prevent_club_tag_with_sensitive_permissions();

with normalized_invites as (
  select
    cic.id,
    coalesce(
      array_agg(selected.slug order by selected.ord)
        filter (
          where mt.id is not null
            and not exists (
              select 1
                from public.member_tag_permissions mtp
               where mtp.tag_id = mt.id
                 and public.is_sensitive_member_permission(mtp.permission)
            )
        ),
      '{}'::text[]
    ) as safe_tags
  from public.course_invite_codes cic
  left join lateral unnest(coalesce(cic.default_tags, '{}'::text[]))
    with ordinality as selected(slug, ord)
    on true
  left join public.member_tags mt
    on lower(mt.slug) = lower(selected.slug)
  group by cic.id
)
update public.course_invite_codes cic
   set default_tags = case
     when cardinality(normalized_invites.safe_tags) > 0 then normalized_invites.safe_tags
     else array['KOSS']::text[]
   end,
       updated_at = now()
  from normalized_invites
 where normalized_invites.id = cic.id;

create or replace function public.prevent_sensitive_invite_default_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tags text[] := coalesce(new.default_tags, array['KOSS']::text[]);
begin
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
      join public.member_tag_permissions mtp
        on mtp.tag_id = mt.id
     where public.is_sensitive_member_permission(mtp.permission)
  ) then
    raise exception 'invite_default_tag_has_sensitive_permission';
  end if;

  new.default_tags := v_tags;
  return new;
end;
$function$;

revoke all on function public.prevent_sensitive_invite_default_tags() from public, anon;
grant execute on function public.prevent_sensitive_invite_default_tags() to authenticated;

drop trigger if exists prevent_sensitive_invite_default_tags on public.course_invite_codes;
create trigger prevent_sensitive_invite_default_tags
before insert or update of default_tags on public.course_invite_codes
for each row execute function public.prevent_sensitive_invite_default_tags();
