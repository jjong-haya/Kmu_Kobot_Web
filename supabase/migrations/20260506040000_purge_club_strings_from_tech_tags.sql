-- profiles.tech_tags 컬럼 완전 폐기.
--
-- 두 개의 태그 시스템이 공존하던 게 혼란의 근원이었다:
--   • profiles.tech_tags  (text[] — 옛날 디자인, 자유 문자열, 권한·메뉴 없음)
--   • member_tags + member_tag_assignments  (새 디자인, 권한·메뉴·색·관리 다 됨)
--
-- 단일 진리원천을 member_tag_assignments 로 옮긴 이상 tech_tags 컬럼은 더 이상 필요 없다.
-- 이 마이그레이션:
--   1) redeem_course_invite() 재작성 — tech_tags 의존 제거 (이미 member_tag_assignments 로 부여 중)
--   2) profiles.tech_tags 컬럼 DROP
--   3) merge_profile_tags() 함수 DROP

-- 1) redeem_course_invite — tech_tags 업데이트 라인 제거
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

  -- profile 의 club_affiliation 텍스트만 호환용 갱신 (이것도 점진 폐기 대상)
  update public.profiles p
    set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
        updated_at = now()
    where p.id = v_caller;

  -- 진짜 태그 부여 — default_tags slug → member_tag_assignments
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

-- 2) profiles.tech_tags 컬럼 DROP
alter table public.profiles
  drop column if exists tech_tags;

-- 3) merge_profile_tags 함수 DROP (더 이상 호출하는 코드 없음)
drop function if exists public.merge_profile_tags(text[], text[]);
