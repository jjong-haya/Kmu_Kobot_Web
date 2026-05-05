-- Status vs tag separation cleanup.
--
-- Why:
--   * status is a lifecycle column (pending / active / course_member / rejected / withdrawn).
--   * Club affiliation (KOBOT, KOSS, future clubs) is a TAG concept, edited by 회장.
--   * Auto-assigning KOSS based on status=course_member double-labelled the UI
--     (status pill said "KOSS" AND tag chip said "KOSS"). It also took the
--     decision out of 회장's hands.
--
-- This migration:
--   1. Drops sync_member_status_tags trigger so status changes no longer auto
--      attach KOBOT/KOSS tags.
--   2. Clears auto_status on existing system tags so the "정규 부원에게
--      자동 부여" hint no longer appears.
--   3. Rewrites redeem_course_invite() to assign tags via member_tag_assignments
--      by matching course_invite_codes.default_tags slugs (and the
--      club_affiliation slug) against member_tags.slug. So an invite code
--      now drives tag assignment explicitly through course-invite metadata.

drop trigger if exists sync_member_status_tags on public.member_accounts;
drop function if exists public.sync_member_status_tags();

update public.member_tags set auto_status = null where auto_status is not null;

create or replace function public.redeem_course_invite(invite_code text)
returns table(success boolean, status text, message text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
  v_caller_status text;
  v_code course_invite_codes%rowtype;
  v_recent_attempts integer;
  v_inserted_redemption boolean;
  v_tag_slug text;
begin
  v_caller := auth.uid();
  if v_caller is null then
    return query select false, null::text, '로그인이 필요합니다.'::text;
    return;
  end if;

  select ma.status into v_caller_status
    from public.member_accounts ma
    where ma.user_id = v_caller
    limit 1;

  if v_caller_status in ('active', 'project_only') then
    return query select false, v_caller_status, '이미 정규 부원이라 KOSS 코드를 적용할 수 없습니다.'::text;
    return;
  end if;

  select count(*) into v_recent_attempts
    from public.invite_redeem_attempts
    where attempted_by = v_caller
      and attempted_at > now() - interval '1 minute';
  if v_recent_attempts >= 5 then
    return query select false, null::text, '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.'::text;
    return;
  end if;

  insert into public.invite_redeem_attempts (attempted_by) values (v_caller);

  select * into v_code
    from public.course_invite_codes
    where code = invite_code
    limit 1;

  if not found then
    return query select false, null::text, '존재하지 않는 코드입니다.'::text;
    return;
  end if;

  if v_code.is_active = false then
    return query select false, null::text, '비활성화된 코드입니다.'::text;
    return;
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return query select false, null::text, '만료된 코드입니다.'::text;
    return;
  end if;

  if v_code.max_uses is not null and v_code.uses >= v_code.max_uses then
    return query select false, null::text, '사용 한도에 도달한 코드입니다.'::text;
    return;
  end if;

  insert into public.course_invite_redemptions (invite_code_id, redeemed_by)
    values (v_code.id, v_caller)
    on conflict (invite_code_id, redeemed_by) do nothing
    returning true into v_inserted_redemption;

  if v_inserted_redemption then
    update public.course_invite_codes
      set uses = uses + 1, updated_at = now()
      where id = v_code.id;
  end if;

  -- profiles 메타(레거시 호환): club_affiliation 텍스트, tech_tags 머지
  update public.profiles p
    set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
        tech_tags = public.merge_profile_tags(p.tech_tags, v_code.default_tags),
        updated_at = now()
    where p.id = v_caller;

  -- 새 모델: 초대 코드의 default_tags slug + club_affiliation slug 를 실제
  -- member_tag_assignments 로 부여한다. slug 매칭 안 되는 값은 무시.
  if v_code.default_tags is not null then
    foreach v_tag_slug in array v_code.default_tags loop
      insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
      select v_caller, mt.id, v_caller
        from public.member_tags mt
        where lower(mt.slug) = lower(v_tag_slug)
      on conflict (user_id, tag_id) do nothing;
    end loop;
  end if;

  if v_code.club_affiliation is not null and v_code.club_affiliation <> '' then
    insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
    select v_caller, mt.id, v_caller
      from public.member_tags mt
      where lower(mt.slug) = lower(v_code.club_affiliation)
    on conflict (user_id, tag_id) do nothing;
  end if;

  if v_inserted_redemption then
    return query select true, coalesce(v_caller_status, 'pending')::text, '코드가 적용되었습니다. 정보를 입력해 주세요.'::text;
  else
    return query select true, coalesce(v_caller_status, 'pending')::text, '이미 적용된 코드입니다.'::text;
  end if;
end;
$function$;

grant execute on function public.redeem_course_invite(text) to authenticated;

-- ============================================================================
-- View helper: latest application status per user (for /member/member-admin)
-- ============================================================================
create or replace function public.admin_member_application_status(user_ids uuid[])
returns table(user_id uuid, application_status text, submitted_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select ma.user_id, ma.status::text, ma.submitted_at
  from public.membership_applications ma
  where ma.user_id = any(user_ids);
$function$;

grant execute on function public.admin_member_application_status(uuid[]) to authenticated;
