-- Course invite links carry system tags such as KOSS.
-- The redeem RPC merges these tags into profiles.tech_tags so the member directory
-- can show the same tag after sign-in.

alter table public.course_invite_codes
  add column if not exists default_tags text[] not null default array['KOSS']::text[];

update public.course_invite_codes
set default_tags = array['KOSS']::text[]
where default_tags is null or cardinality(default_tags) = 0;

create or replace function public.merge_profile_tags(existing_tags text[], added_tags text[])
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(tag order by first_seen), '{}'::text[])
  from (
    select min(ord) as first_seen, btrim(tag) as tag
    from unnest(coalesce(existing_tags, '{}'::text[]) || coalesce(added_tags, '{}'::text[]))
      with ordinality as raw(tag, ord)
    where btrim(tag) <> ''
    group by lower(btrim(tag)), btrim(tag)
  ) deduped;
$$;

create or replace function public.redeem_course_invite(invite_code text)
returns table (
  success boolean,
  status text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid;
  v_code course_invite_codes%rowtype;
  v_recent_attempts integer;
begin
  v_caller := auth.uid();
  if v_caller is null then
    return query select false, null::text, '로그인이 필요합니다.'::text;
    return;
  end if;

  select count(*) into v_recent_attempts
    from public.invite_redeem_attempts
    where attempted_by = v_caller
      and attempted_at > now() - interval '1 minute';
  if v_recent_attempts >= 5 then
    return query select false, null::text, '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해 주세요.'::text;
    return;
  end if;

  insert into public.invite_redeem_attempts (attempted_by) values (v_caller);

  select * into v_code
    from public.course_invite_codes
    where code = invite_code
    limit 1;

  if not found then
    return query select false, null::text, '존재하지 않는 초대 코드입니다.'::text;
    return;
  end if;

  if v_code.is_active = false then
    return query select false, null::text, '비활성화된 초대 코드입니다.'::text;
    return;
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return query select false, null::text, '만료된 초대 코드입니다.'::text;
    return;
  end if;

  if v_code.max_uses is not null and v_code.uses >= v_code.max_uses then
    return query select false, null::text, '사용 한도를 초과한 초대 코드입니다.'::text;
    return;
  end if;

  if exists (
    select 1 from public.course_invite_redemptions
      where invite_code_id = v_code.id and redeemed_by = v_caller
  ) then
    update public.member_accounts
      set status = 'course_member', updated_at = now()
      where user_id = v_caller and status not in ('active', 'project_only');

    update public.profiles p
      set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
          tech_tags = public.merge_profile_tags(p.tech_tags, v_code.default_tags),
          updated_at = now()
      where p.id = v_caller;

    return query select true, 'course_member'::text, '이미 적용된 초대입니다.'::text;
    return;
  end if;

  insert into public.course_invite_redemptions (invite_code_id, redeemed_by)
    values (v_code.id, v_caller);

  update public.course_invite_codes
    set uses = uses + 1, updated_at = now()
    where id = v_code.id;

  update public.member_accounts
    set status = 'course_member', updated_at = now()
    where user_id = v_caller and status not in ('active', 'project_only');

  update public.profiles p
    set club_affiliation = coalesce(v_code.club_affiliation, p.club_affiliation),
        tech_tags = public.merge_profile_tags(p.tech_tags, v_code.default_tags),
        updated_at = now()
    where p.id = v_caller;

  return query select true, 'course_member'::text, '가입이 완료되었습니다.'::text;
end;
$$;

grant execute on function public.merge_profile_tags(text[], text[]) to authenticated;
grant execute on function public.redeem_course_invite(text) to authenticated;
