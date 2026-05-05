-- Admin actions for the 회장 to manage members from the UI:
--   * admin_set_member_status(target_user_id, new_status)
--   * admin_update_member_profile(target_user_id, payload jsonb)
--   * admin_delete_member(target_user_id)
--
-- All gated by permissions.manage OR members.manage (the 회장 has both).
-- A trigger also auto-strips the academic suffix Google OAuth glues to the
-- display name (e.g. "‍김현수(학부생-인공지능전공)" → "김현수") at row insert time
-- so future signups stop showing the raw kookmin name.

create or replace function public.clean_kookmin_profile_name(input text)
returns text
language sql
immutable
as $function$
  select case
    when input is null then null
    else regexp_replace(
      regexp_replace(trim(input), '[​-‍﻿]', '', 'g'),
      '\s*\(([^)]*)\)\s*$',
      '',
      'g'
    )
  end;
$function$;

create or replace function public.profiles_clean_oauth_name()
returns trigger
language plpgsql
as $function$
declare
  v_clean text;
begin
  if new.full_name is not null and new.full_name ~ '\([^)]*\)\s*$' then
    v_clean := public.clean_kookmin_profile_name(new.full_name);
    if v_clean is not null and v_clean <> '' then
      new.full_name := v_clean;
      if new.display_name is null
         or new.display_name = ''
         or new.display_name ~ '\([^)]*\)\s*$' then
        new.display_name := v_clean;
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists profiles_clean_oauth_name_trigger on public.profiles;
create trigger profiles_clean_oauth_name_trigger
  before insert or update of display_name, full_name on public.profiles
  for each row execute function public.profiles_clean_oauth_name();

-- ============================================================================
-- admin_set_member_status
-- ============================================================================
create or replace function public.admin_set_member_status(
  target_user_id uuid,
  new_status text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;
  if not (
    public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('permissions.manage')
  ) then
    raise exception 'forbidden';
  end if;
  if new_status not in ('pending', 'active', 'course_member', 'project_only', 'rejected', 'withdrawn') then
    raise exception 'invalid_status';
  end if;

  insert into public.member_accounts (user_id, status, updated_at)
  values (target_user_id, new_status, now())
  on conflict (user_id) do update
    set status = excluded.status, updated_at = now();
  return true;
end;
$function$;

grant execute on function public.admin_set_member_status(uuid, text) to authenticated;

-- ============================================================================
-- admin_update_member_profile
-- ============================================================================
create or replace function public.admin_update_member_profile(
  target_user_id uuid,
  patch jsonb
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
  v_keys text[];
  v_query text;
  v_set text[] := array[]::text[];
  v_key text;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;
  if not (
    public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('permissions.manage')
  ) then
    raise exception 'forbidden';
  end if;

  -- Whitelist of editable columns. Anything else is silently ignored.
  v_keys := array[
    'display_name','nickname_display','full_name',
    'student_id','phone','college','department',
    'club_affiliation','public_credit_name_mode','login_id',
    'profile_bio','public_email','github_url','linkedin_url'
  ];

  foreach v_key in array v_keys loop
    if patch ? v_key then
      v_set := v_set || format('%I = %L', v_key, patch->>v_key);
    end if;
  end loop;

  if array_length(v_set, 1) is null then
    return false;
  end if;

  v_query := format(
    'update public.profiles set %s, updated_at = now() where id = %L',
    array_to_string(v_set, ', '),
    target_user_id
  );
  execute v_query;
  return true;
end;
$function$;

grant execute on function public.admin_update_member_profile(uuid, jsonb) to authenticated;

-- ============================================================================
-- admin_delete_member  (cascades through auth.users → profiles, member_accounts, etc.)
-- ============================================================================
create or replace function public.admin_delete_member(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;
  if v_caller = target_user_id then
    raise exception 'cannot_delete_self';
  end if;
  if not (
    public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('permissions.manage')
  ) then
    raise exception 'forbidden';
  end if;

  delete from auth.users where id = target_user_id;
  return true;
end;
$function$;

grant execute on function public.admin_delete_member(uuid) to authenticated;
