-- Make redeem_course_invite() idempotent against race conditions.
--
-- course_invite_redemptions has a UNIQUE(invite_code_id, redeemed_by) index.
-- If the client double-clicks, two concurrent calls can both pass the
-- "if exists" check, then race on the INSERT — second one fails with 23505
-- (unique_violation) → PostgREST returns HTTP 409 Conflict.
--
-- Fix: ON CONFLICT DO NOTHING on the redemption insert. The duplicate call
-- still receives the same success response.

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

  -- Idempotent insert: if a concurrent request already wrote the row, the
  -- ON CONFLICT branch silently swallows the duplicate.
  insert into public.course_invite_redemptions (invite_code_id, redeemed_by)
    values (v_code.id, v_caller)
    on conflict (invite_code_id, redeemed_by) do nothing
    returning true into v_inserted_redemption;

  if v_inserted_redemption then
    update public.course_invite_codes
      set uses = uses + 1, updated_at = now()
      where id = v_code.id;
  end if;

  update public.member_accounts ma
    set status = 'course_member', updated_at = now()
    where ma.user_id = v_caller and ma.status not in ('active', 'project_only');

  update public.profiles p
    set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
        tech_tags = public.merge_profile_tags(p.tech_tags, v_code.default_tags),
        updated_at = now()
    where p.id = v_caller;

  if v_inserted_redemption then
    return query select true, 'course_member'::text, '코드가 적용되었습니다.'::text;
  else
    return query select true, 'course_member'::text, '이미 적용된 코드입니다.'::text;
  end if;
end;
$function$;

grant execute on function public.redeem_course_invite(text) to authenticated;
