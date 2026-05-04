-- course_invite_codes (generic invite codes for any club / org / cohort)
-- 운영진이 코드 발급 → 사용자가 /invite/course?code=CODE 로 접속 → Google 로그인 →
-- AuthCallback이 redeem_course_invite(code) RPC 호출 → status=course_member 부여 +
-- profile.club_affiliation = invite.club_affiliation 자동 세팅.

create table if not exists public.course_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,                              -- 사람이 읽을 수 있는 별명 ("2026 봄 KOSS 코스")
  club_affiliation text,                   -- 부여될 동아리/조직 이름 ("KOSS", "AI Society", null)
  max_uses integer,                        -- null이면 무제한
  uses integer not null default 0,
  expires_at timestamptz,                  -- null이면 무기한
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_invite_codes_code_idx
  on public.course_invite_codes (code);

create or replace function public.set_course_invite_code_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists course_invite_codes_set_updated_at
  on public.course_invite_codes;
create trigger course_invite_codes_set_updated_at
  before update on public.course_invite_codes
  for each row execute function public.set_course_invite_code_updated_at();

-- audit history
create table if not exists public.course_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid not null references public.course_invite_codes(id) on delete cascade,
  redeemed_by uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (invite_code_id, redeemed_by)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.course_invite_codes enable row level security;
alter table public.course_invite_redemptions enable row level security;

-- SECURITY: 일반 사용자가 코드 목록을 조회하면 미사용 코드 스캔 가능 → 운영진만 read
drop policy if exists "any auth user can read invite codes"
  on public.course_invite_codes;
drop policy if exists "ops can read invite codes"
  on public.course_invite_codes;
create policy "ops can read invite codes"
  on public.course_invite_codes
  for select
  using (public.has_permission('members.manage'));

drop policy if exists "ops can manage invite codes"
  on public.course_invite_codes;
create policy "ops can manage invite codes"
  on public.course_invite_codes
  for all
  using (public.has_permission('members.manage'))
  with check (public.has_permission('members.manage'));

drop policy if exists "members can read own redemptions"
  on public.course_invite_redemptions;
create policy "members can read own redemptions"
  on public.course_invite_redemptions
  for select
  using (auth.uid() = redeemed_by);

drop policy if exists "ops can read all redemptions"
  on public.course_invite_redemptions;
create policy "ops can read all redemptions"
  on public.course_invite_redemptions
  for select
  using (public.has_permission('members.manage'));

-- ============================================================
-- Brute force throttle: 1분당 5회, 실패 포함 카운트
-- ============================================================
create table if not exists public.invite_redeem_attempts (
  id bigserial primary key,
  attempted_by uuid references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists invite_redeem_attempts_user_idx
  on public.invite_redeem_attempts (attempted_by, attempted_at);
alter table public.invite_redeem_attempts enable row level security;
-- (no policies → only definer functions can write)

-- ============================================================
-- RPC: redeem an invite code (called by AuthCallback / Welcome page)
-- Returns success / failure + sets profile.account_status + club_affiliation
-- ============================================================
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

  -- Rate limit: 5 attempts per minute per user
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

  -- already redeemed by this user → idempotent
  if exists (
    select 1 from public.course_invite_redemptions
      where invite_code_id = v_code.id and redeemed_by = v_caller
  ) then
    update public.profiles
      set account_status = 'course_member',
          club_affiliation = coalesce(v_code.club_affiliation, club_affiliation),
          updated_at = now()
      where id = v_caller and account_status not in ('active', 'project_only');
    return query select true, 'course_member'::text, '이미 적용된 초대입니다.'::text;
    return;
  end if;

  insert into public.course_invite_redemptions (invite_code_id, redeemed_by)
    values (v_code.id, v_caller);

  update public.course_invite_codes
    set uses = uses + 1, updated_at = now()
    where id = v_code.id;

  -- 동아리 affiliation도 같이 세팅. 이미 active/project_only인 사용자는 status는 안 바꿈.
  update public.profiles
    set account_status = 'course_member',
        club_affiliation = coalesce(v_code.club_affiliation, club_affiliation),
        updated_at = now()
    where id = v_caller and account_status not in ('active', 'project_only');

  return query select true, 'course_member'::text, '가입이 완료되었습니다.'::text;
end;
$$;

grant execute on function public.redeem_course_invite(text) to authenticated;

-- NOTE: profiles.account_status & profiles.club_affiliation 컬럼 존재 가정.
-- enum 타입이면 alter type ... add value 필요할 수 있음.
