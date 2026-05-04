
-- ======================================================================
-- 0) member_accounts.status CHECK 제약을 확장: 'course_member' 추가
-- ======================================================================
alter table public.member_accounts
  drop constraint if exists member_accounts_status_check;
alter table public.member_accounts
  add constraint member_accounts_status_check
  check (status in (
    'pending','active','suspended','rejected','alumni',
    'project_only','course_member','withdrawn'
  ));

-- ============================================================
-- KOBOT — 통합 마이그레이션 적용 스크립트
-- 생성일: 2026-05-04
-- 적용 대상 프로젝트: tqidhnjmjbvrzdeiqlqo
--
-- 사용법:
--   1. https://supabase.com/dashboard/project/tqidhnjmjbvrzdeiqlqo/sql 접속
--   2. New query 클릭
--   3. 이 파일 전체 내용 붙여넣기
--   4. Run 클릭
-- ============================================================

-- ###### 1) profile_change_requests ######
-- profile_change_requests
-- Allows members to request changes to read-only fields (name, student_id, department, etc.)
-- Operations team reviews and applies changes manually.

create table if not exists public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  field text not null,
  current_value text,
  requested_value text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_change_requests_requester_idx
  on public.profile_change_requests(requester_id);
create index if not exists profile_change_requests_status_idx
  on public.profile_change_requests(status);

-- updated_at trigger
create or replace function public.set_profile_change_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profile_change_requests_set_updated_at
  on public.profile_change_requests;
create trigger profile_change_requests_set_updated_at
  before update on public.profile_change_requests
  for each row execute function public.set_profile_change_request_updated_at();

-- Row Level Security
alter table public.profile_change_requests enable row level security;

-- members can insert their own request
drop policy if exists "members can insert own change request"
  on public.profile_change_requests;
create policy "members can insert own change request"
  on public.profile_change_requests
  for insert
  with check (auth.uid() = requester_id);

-- members can read their own requests
drop policy if exists "members can read own change requests"
  on public.profile_change_requests;
create policy "members can read own change requests"
  on public.profile_change_requests
  for select
  using (auth.uid() = requester_id);

-- members can withdraw (update status) their own pending request
drop policy if exists "members can withdraw own pending request"
  on public.profile_change_requests;
create policy "members can withdraw own pending request"
  on public.profile_change_requests
  for update
  using (auth.uid() = requester_id and status = 'pending')
  with check (auth.uid() = requester_id and status in ('pending', 'withdrawn'));

-- ops can read & manage all (reuse existing permission check fn if available)
-- Replace `public.current_user_has_permission(text)` with whatever rbac helper exists.
drop policy if exists "ops can manage change requests"
  on public.profile_change_requests;
create policy "ops can manage change requests"
  on public.profile_change_requests
  for all
  using (public.current_user_has_permission('members.manage'))
  with check (public.current_user_has_permission('members.manage'));

-- ###### 2) space_bookings ######
-- space_bookings
-- 동아리실 공간 예약 (회의/스터디/개인). 캘린더 기반 예약 시스템.

create table if not exists public.space_bookings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  organizer_name text not null,                  -- snapshot of name at time of booking
  type text not null
    check (type in ('meeting', 'study', 'personal')),
  scope text not null
    check (scope in ('exclusive', 'desk', 'open')),
  attendees integer not null default 1
    check (attendees >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint space_bookings_time_order check (end_time > start_time)
);

create index if not exists space_bookings_date_idx
  on public.space_bookings (booking_date);
create index if not exists space_bookings_organizer_idx
  on public.space_bookings (organizer_id);

-- updated_at trigger
create or replace function public.set_space_booking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists space_bookings_set_updated_at
  on public.space_bookings;
create trigger space_bookings_set_updated_at
  before update on public.space_bookings
  for each row execute function public.set_space_booking_updated_at();

-- Row Level Security
alter table public.space_bookings enable row level security;

-- any authenticated active member can read all bookings (calendar visibility)
drop policy if exists "members can read all bookings"
  on public.space_bookings;
create policy "members can read all bookings"
  on public.space_bookings
  for select
  using (auth.uid() is not null);

-- members can insert their own booking
drop policy if exists "members can insert own booking"
  on public.space_bookings;
create policy "members can insert own booking"
  on public.space_bookings
  for insert
  with check (auth.uid() = organizer_id);

-- members can update/delete their own booking (within reason — adjust later)
drop policy if exists "members can update own booking"
  on public.space_bookings;
create policy "members can update own booking"
  on public.space_bookings
  for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

drop policy if exists "members can delete own booking"
  on public.space_bookings;
create policy "members can delete own booking"
  on public.space_bookings
  for delete
  using (auth.uid() = organizer_id);

-- ops can manage everything
drop policy if exists "ops can manage all bookings"
  on public.space_bookings;
create policy "ops can manage all bookings"
  on public.space_bookings
  for all
  using (public.current_user_has_permission('members.manage'))
  with check (public.current_user_has_permission('members.manage'));

-- ###### 3) course_invite_codes (with rate limit + club_affiliation) ######
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
  using (public.current_user_has_permission('members.manage'));

drop policy if exists "ops can manage invite codes"
  on public.course_invite_codes;
create policy "ops can manage invite codes"
  on public.course_invite_codes
  for all
  using (public.current_user_has_permission('members.manage'))
  with check (public.current_user_has_permission('members.manage'));

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
  using (public.current_user_has_permission('members.manage'));

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
    update public.member_accounts
      set status = 'course_member', updated_at = now()
      where user_id = v_caller and status not in ('active', 'project_only');
    update public.profiles
      set club_affiliation = coalesce(v_code.club_affiliation, club_affiliation), updated_at = now()
      where id = v_caller;
    return query select true, 'course_member'::text, '이미 적용된 초대입니다.'::text;
    return;
  end if;

  insert into public.course_invite_redemptions (invite_code_id, redeemed_by)
    values (v_code.id, v_caller);

  update public.course_invite_codes
    set uses = uses + 1, updated_at = now()
    where id = v_code.id;

  -- 동아리 affiliation도 같이 세팅. 이미 active/project_only인 사용자는 status는 안 바꿈.
  update public.member_accounts
      set status = 'course_member', updated_at = now()
      where user_id = v_caller and status not in ('active', 'project_only');
    update public.profiles
      set club_affiliation = coalesce(v_code.club_affiliation, club_affiliation), updated_at = now()
      where id = v_caller;

  return query select true, 'course_member'::text, '가입이 완료되었습니다.'::text;
end;
$$;

grant execute on function public.redeem_course_invite(text) to authenticated;

-- NOTE: profiles.account_status & profiles.club_affiliation 컬럼 존재 가정.
-- enum 타입이면 alter type ... add value 필요할 수 있음.
