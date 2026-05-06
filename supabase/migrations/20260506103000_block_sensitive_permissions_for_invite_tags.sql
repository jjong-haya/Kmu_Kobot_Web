-- Close the delayed-escalation path:
-- a safe tag could be added to an invite code first, then receive a sensitive
-- permission later. That would make future invite redemption grant authority.

delete from public.member_tag_permissions mtp
using public.member_tags mt
where mt.id = mtp.tag_id
  and public.is_sensitive_member_permission(mtp.permission)
  and exists (
    select 1
      from public.course_invite_codes cic
     where exists (
       select 1
         from unnest(coalesce(cic.default_tags, '{}'::text[])) as selected(slug)
        where lower(selected.slug) = lower(mt.slug)
     )
  );

create or replace function public.prevent_sensitive_permissions_on_club_tags()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_is_club boolean;
  v_slug text;
begin
  select mt.is_club, mt.slug
    into v_is_club, v_slug
    from public.member_tags mt
   where mt.id = new.tag_id;

  if public.is_sensitive_member_permission(new.permission) then
    if coalesce(v_is_club, false) then
      raise exception 'sensitive_permission_not_allowed_for_club_tag';
    end if;

    if exists (
      select 1
        from public.course_invite_codes cic
       where exists (
         select 1
           from unnest(coalesce(cic.default_tags, '{}'::text[])) as selected(slug)
          where lower(selected.slug) = lower(v_slug)
       )
    ) then
      raise exception 'sensitive_permission_not_allowed_for_invite_default_tag';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.prevent_sensitive_permissions_on_club_tags() from public, anon;
grant execute on function public.prevent_sensitive_permissions_on_club_tags() to authenticated;
