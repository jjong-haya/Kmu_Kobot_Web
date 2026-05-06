-- 초대코드 동아리 파생과 멤버 대표 동아리 선택.
--
-- 정책:
--   * 초대코드의 동아리는 별도 자유 텍스트가 아니라 default_tags 중 is_club=true 태그에서 파생한다.
--   * 동아리 태그가 여러 개면 코드 식별자인 slug ASC 첫 항목을 기본 소속 텍스트로 쓴다.
--   * 멤버 카드에서 어떤 동아리를 대표로 보여 줄지는 각 사용자가 선택할 수 있다.

alter table public.profiles
  add column if not exists display_club_tag_id uuid
    references public.member_tags(id) on delete set null;

comment on column public.profiles.display_club_tag_id is
  '멤버 디렉토리에서 대표 동아리로 보여 줄 member_tags.id. 실제 표시 전 member_tag_assignments + is_club=true 로 다시 검증한다.';

create index if not exists profiles_display_club_tag_id_idx
  on public.profiles(display_club_tag_id);

-- 레거시 초대 코드에서 "동아리/조직 이름"으로 쓰이던 값과 같은 slug/label 의 태그는
-- 특정 이름을 하드코딩하지 않고 동아리 태그로 승격한다.
with legacy_club_values as (
  select lower(btrim(club_affiliation)) as value
    from public.course_invite_codes
    where nullif(btrim(coalesce(club_affiliation, '')), '') is not null
  union
  select lower(btrim(default_club_affiliation)) as value
    from public.invitation_codes
    where nullif(btrim(coalesce(default_club_affiliation, '')), '') is not null
)
update public.member_tags mt
   set is_club = true,
       updated_at = now()
  from legacy_club_values legacy
 where lower(btrim(mt.slug)) = legacy.value
    or lower(btrim(mt.label)) = legacy.value;

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
  v_default_club_label text;
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

  -- default_tags slug → member_tag_assignments. club_affiliation 텍스트는 더 이상 태그 부여 입력으로 쓰지 않는다.
  foreach v_tag_slug in array coalesce(v_code.default_tags, array[]::text[]) loop
    insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
    select v_caller, mt.id, v_caller
      from public.member_tags mt
      where lower(mt.slug) = lower(v_tag_slug)
    on conflict (user_id, tag_id) do nothing;
  end loop;

  -- 프로필 소속 텍스트는 default_tags 중 동아리 태그에서 파생한다. 여러 개면 slug ASC 첫 항목.
  select mt.label into v_default_club_label
    from unnest(coalesce(v_code.default_tags, array[]::text[])) as selected_tag(slug)
    join public.member_tags mt
      on lower(mt.slug) = lower(selected_tag.slug)
    where mt.is_club = true
    order by lower(mt.slug), mt.slug
    limit 1;

  update public.profiles p
    set club_affiliation = coalesce(v_default_club_label, p.club_affiliation),
        updated_at = now()
    where p.id = v_caller;

  if v_inserted_redemption then
    return query select true, coalesce(v_caller_status, 'pending')::text, '코드가 적용되었습니다. 정보를 입력해 주세요.'::text;
  else
    return query select true, coalesce(v_caller_status, 'pending')::text, '이미 적용된 코드입니다.'::text;
  end if;
end;
$function$;

grant execute on function public.redeem_course_invite(text) to authenticated;
