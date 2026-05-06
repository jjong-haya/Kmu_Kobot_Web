-- "course_member" status 폐기.
--
-- 동아리(KOBOT/KOSS) 구분은 태그가 한다 (docs/product/tag-system.md). status 는
-- 순수 lifecycle 만 표현한다 (docs/product/member-status.md):
--   pending → active → (rejected | withdrawn)
--
-- 기존에 course_member 였던 사용자(=초대코드로 가입한 KOSS 부원들)는 활동중인
-- 멤버이므로 'active' 로 합친다. 동아리 식별은 KOSS 태그가 그대로 들고 간다.
--
-- 변경:
--   1) 기존 course_member 행 → active 로 일괄 이동 (+ approved_at 보정)
--   2) apply_course_invite_after_application: 가입 신청 후 status 를 'active' 로
--      바로 승격 (기존엔 course_member 로 보냈음)
--   3) admin_set_member_status: 유효 enum 에서 course_member 제거
--   4) redeem_course_invite: '이미 정규 부원' 가드 메시지에서 course_member 의미 제거.

-- 1) 백필
update public.member_accounts
   set status = 'active',
       approved_at = coalesce(approved_at, now()),
       updated_at = now()
 where status = 'course_member';

-- 2) apply_course_invite_after_application 재작성
create or replace function public.apply_course_invite_after_application()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
  v_has_redemption boolean;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;

  select exists (
    select 1 from public.course_invite_redemptions
     where redeemed_by = v_caller
  ) into v_has_redemption;

  if not v_has_redemption then
    return false;
  end if;

  update public.member_accounts
     set status = 'active',
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
   where user_id = v_caller
     and status not in ('active', 'rejected', 'withdrawn');

  return true;
end;
$function$;

grant execute on function public.apply_course_invite_after_application() to authenticated;

-- 3) admin_set_member_status: course_member 제거
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
  if new_status not in ('pending', 'active', 'rejected', 'withdrawn') then
    raise exception 'invalid_status';
  end if;

  update public.member_accounts
    set status = new_status,
        approved_at = case
          when new_status = 'active' and approved_at is null then now()
          else approved_at
        end,
        approved_by = case
          when new_status = 'active' and approved_by is null then v_caller
          else approved_by
        end,
        updated_at = now()
    where user_id = target_user_id;

  if not found then
    raise exception 'member_account_not_found';
  end if;
  return true;
end;
$function$;

grant execute on function public.admin_set_member_status(uuid, text) to authenticated;

-- 4) redeem_course_invite: course_member 가드 → active 만 차단
--    (이미 active 인 사람에게 코드 적용은 의미 없음 — 태그 부여만 하고 status 는 안 건드림.
--     단 신규 redemption 행도 안 만든다.)
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
    return query select false, null::text, '코드 사용 한도를 모두 소진했습니다.'::text;
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

  -- profiles 메타(레거시 호환)
  update public.profiles p
    set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
        tech_tags = public.merge_profile_tags(p.tech_tags, v_code.default_tags),
        updated_at = now()
    where p.id = v_caller;

  -- default_tags slug → member_tag_assignments
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
