
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
-- Uses the same RBAC helper as the rest of the workspace policies.
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
-- Returns success / failure + sets member_accounts.status + profile.club_affiliation
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

-- NOTE: profiles.club_affiliation 컬럼 존재 가정.
-- enum 타입이면 alter type ... add value 필요할 수 있음.

-- =============================================================================
-- 20260504144000_active_member_base_permissions.sql
-- =============================================================================

-- Give regular active KOBOT members the base read permissions that match
-- the member sidebar section. Course members keep a smaller invite-based set.

create or replace function public.current_user_has_permission(requested_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with current_account as (
    select ma.user_id, ma.status, ma.is_bootstrap_admin
    from public.member_accounts ma
    where ma.user_id = auth.uid()
  ),
  base_permissions as (
    select base_permission.code
    from current_account ca
    cross join (
      values
        ('dashboard.read'),
        ('notifications.read'),
        ('announcements.read'),
        ('members.read'),
        ('projects.read'),
        ('resources.read'),
        ('events.read')
    ) as base_permission(code)
    where ca.status = 'active'

    union

    select base_permission.code
    from current_account ca
    cross join (
      values
        ('dashboard.read'),
        ('notifications.read'),
        ('announcements.read'),
        ('members.read')
    ) as base_permission(code)
    where ca.status = 'course_member'
  ),
  position_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.org_position_assignments opa
      on opa.user_id = ca.user_id
     and opa.active = true
    join public.org_position_permissions opp
      on opp.org_position_id = opa.org_position_id
    join public.permissions perm
      on perm.id = opp.permission_id
    where ca.status = 'active'
  ),
  team_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.team_memberships tm
      on tm.user_id = ca.user_id
     and tm.active = true
    join public.team_role_permissions trp
      on trp.team_role_id = tm.team_role_id
    join public.permissions perm
      on perm.id = trp.permission_id
    where ca.status = 'active'
  )
  select exists (
    select 1
    from current_account ca
    where ca.status in ('active', 'course_member')
      and (
        (ca.status = 'active' and ca.is_bootstrap_admin)
        or requested_code in (select code from base_permissions)
        or requested_code in (select code from position_permissions)
        or requested_code in (select code from team_permissions)
      )
  );
$$;

create or replace function public.get_my_authorization_context()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      p.id,
      p.email::text as email,
      p.display_name,
      p.nickname_display,
      p.nickname_slug::text as nickname_slug,
      p.full_name,
      p.student_id,
      p.phone,
      p.college,
      p.department,
      p.club_affiliation,
      p.public_credit_name_mode,
      p.tech_tags,
      p.avatar_url,
      p.login_id::text as login_id,
      ma.status,
      ma.has_login_password,
      ma.is_bootstrap_admin,
      org.id as organization_id,
      org.slug::text as organization_slug,
      org.name as organization_name
    from public.profiles p
    left join public.member_accounts ma
      on ma.user_id = p.id
    left join public.organizations org
      on org.id = ma.organization_id
    where p.id = auth.uid()
  )
  select jsonb_build_object(
    'profile',
    (
      select jsonb_build_object(
        'id', b.id,
        'email', b.email,
        'displayName', coalesce(b.nickname_display, b.display_name),
        'nicknameDisplay', b.nickname_display,
        'nicknameSlug', b.nickname_slug,
        'fullName', b.full_name,
        'studentId', b.student_id,
        'phone', b.phone,
        'college', b.college,
        'department', b.department,
        'clubAffiliation', b.club_affiliation,
        'publicCreditNameMode', b.public_credit_name_mode,
        'techTags', coalesce(to_jsonb(b.tech_tags), '[]'::jsonb),
        'avatarUrl', b.avatar_url,
        'loginId', b.login_id
      )
      from base b
    ),
    'account',
    (
      select jsonb_build_object(
        'status', b.status,
        'hasLoginPassword', b.has_login_password,
        'isBootstrapAdmin', b.is_bootstrap_admin
      )
      from base b
    ),
    'organization',
    (
      select jsonb_build_object(
        'id', b.organization_id,
        'slug', b.organization_slug,
        'name', b.organization_name
      )
      from base b
    ),
    'orgPositions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', op.id,
            'slug', op.slug,
            'name', op.name
          )
          order by op.name
        )
        from public.org_position_assignments opa
        join public.org_positions op
          on op.id = opa.org_position_id
        where opa.user_id = auth.uid()
          and opa.active = true
      ),
      '[]'::jsonb
    ),
    'teamMemberships',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'teamId', t.id,
            'teamSlug', t.slug,
            'teamName', t.name,
            'roleId', tr.id,
            'roleSlug', tr.slug,
            'roleName', tr.name
          )
          order by t.name
        )
        from public.team_memberships tm
        join public.teams t
          on t.id = tm.team_id
        left join public.team_roles tr
          on tr.id = tm.team_role_id
        where tm.user_id = auth.uid()
          and tm.active = true
      ),
      '[]'::jsonb
    ),
    'permissions',
    coalesce(
      (
        select jsonb_agg(code order by code)
        from (
          select base_permission.code
          from public.member_accounts ma
          cross join (
            values
              ('dashboard.read'),
              ('notifications.read'),
              ('announcements.read'),
              ('members.read'),
              ('projects.read'),
              ('resources.read'),
              ('events.read')
          ) as base_permission(code)
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select base_permission.code
          from public.member_accounts ma
          cross join (
            values
              ('dashboard.read'),
              ('notifications.read'),
              ('announcements.read'),
              ('members.read')
          ) as base_permission(code)
          where ma.user_id = auth.uid()
            and ma.status = 'course_member'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.org_position_assignments opa
            on opa.user_id = ma.user_id
           and opa.active = true
          join public.org_position_permissions opp
            on opp.org_position_id = opa.org_position_id
          join public.permissions perm
            on perm.id = opp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.team_memberships tm
            on tm.user_id = ma.user_id
           and tm.active = true
          join public.team_role_permissions trp
            on trp.team_role_id = tm.team_role_id
          join public.permissions perm
            on perm.id = trp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select 'admin.access'
          from public.member_accounts ma
          where ma.user_id = auth.uid()
            and ma.status = 'active'
            and ma.is_bootstrap_admin = true
        ) permission_codes
      ),
      '[]'::jsonb
    )
  );
$$;

-- =============================================================================
-- 20260505093000_member_directory_profile.sql
-- =============================================================================

-- Member directory profile extensions and per-user favorites.
-- Domain terms:
-- - tag: a member-facing directory label, not only a technical label.
-- - favorite: a private bookmark from one viewer to one member profile.

alter table public.profiles
  add column if not exists profile_bio text,
  add column if not exists public_email citext,
  add column if not exists github_url text,
  add column if not exists linkedin_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_profile_bio_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_profile_bio_length
      check (
        profile_bio is null
        or char_length(btrim(profile_bio)) <= 160
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_public_email_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_public_email_format
      check (
        public_email is null
        or public_email::text ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_github_url_safe'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_github_url_safe
      check (
        github_url is null
        or (
          char_length(github_url) <= 200
          and github_url ~ '^https://'
          and github_url !~ '[[:space:]]'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_linkedin_url_safe'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_linkedin_url_safe
      check (
        linkedin_url is null
        or (
          char_length(linkedin_url) <= 200
          and linkedin_url ~ '^https://'
          and linkedin_url !~ '[[:space:]]'
        )
      );
  end if;
end $$;

create table if not exists public.member_favorite_profiles (
  viewer_user_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (viewer_user_id, target_user_id),
  constraint member_favorite_profiles_no_self check (viewer_user_id <> target_user_id)
);

create index if not exists member_favorite_profiles_target_idx
  on public.member_favorite_profiles (target_user_id);

alter table public.member_favorite_profiles enable row level security;

drop policy if exists "member_favorites_select_own"
  on public.member_favorite_profiles;
create policy "member_favorites_select_own"
  on public.member_favorite_profiles
  for select
  using (viewer_user_id = auth.uid());

drop policy if exists "member_favorites_insert_own"
  on public.member_favorite_profiles;
create policy "member_favorites_insert_own"
  on public.member_favorite_profiles
  for insert
  with check (
    viewer_user_id = auth.uid()
    and public.current_user_has_permission('members.read')
  );

drop policy if exists "member_favorites_delete_own"
  on public.member_favorite_profiles;
create policy "member_favorites_delete_own"
  on public.member_favorite_profiles
  for delete
  using (viewer_user_id = auth.uid());

-- 20260505120000_member_directory_read_rls.sql
-- Let signed-in KOBOT members read the member directory.
-- Without this, profiles/member_accounts RLS returns only auth.uid(), so /member/members shows one card.

create or replace function public.current_user_can_read_member_directory()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = auth.uid()
      and ma.status in ('active', 'course_member')
  )
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage');
$$;

grant execute on function public.current_user_can_read_member_directory() to authenticated;

drop policy if exists "profiles_select_self_or_member_admins" on public.profiles;
create policy "profiles_select_self_or_member_admins"
on public.profiles
for select
using (
  id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "member_accounts_select_self_or_member_admins" on public.member_accounts;
create policy "member_accounts_select_self_or_member_admins"
on public.member_accounts
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "org_position_assignments_select_self_or_admins" on public.org_position_assignments;
create policy "org_position_assignments_select_self_or_admins"
on public.org_position_assignments
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);

drop policy if exists "team_memberships_select_self_or_admins" on public.team_memberships;
create policy "team_memberships_select_self_or_admins"
on public.team_memberships
for select
using (
  user_id = auth.uid()
  or public.current_user_can_read_member_directory()
);

-- 20260505123000_course_invite_default_tags.sql
-- Course invite links carry system tags such as KOSS.

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

-- ============================================================
-- 20260505133000_assign_current_president_position
-- ============================================================

-- Assign the current president as data.
-- UI badges must derive from org_position_assignments, not from login_id checks.

with target_profile as (
  select id
  from public.profiles
  where login_id = 'hu0315'::citext
  limit 1
),
target_position as (
  select
    op.organization_id,
    op.id as org_position_id
  from public.org_positions op
  join public.organizations org
    on org.id = op.organization_id
  where org.slug = 'kobot'::citext
    and op.slug = 'president'::citext
  limit 1
)
insert into public.org_position_assignments (
  organization_id,
  user_id,
  org_position_id,
  active
)
select
  target_position.organization_id,
  target_profile.id,
  target_position.org_position_id,
  true
from target_profile
cross join target_position
on conflict (organization_id, user_id, org_position_id) do update
set
  active = true,
  assigned_at = case
    when public.org_position_assignments.active then public.org_position_assignments.assigned_at
    else now()
  end;

-- ============================================================
-- 20260505143000_announcements_permissions_and_comments
-- ============================================================

insert into public.permissions (code, description)
values
  ('announcements.manage', 'Create and manage announcements')
on conflict (code) do update
set description = excluded.description;

with role_targets as (
  select tr.id as team_role_id
  from public.team_roles tr
  where tr.slug = 'team-lead'::citext
),
permission_targets as (
  select id as permission_id
  from public.permissions
  where code = 'announcements.manage'
)
insert into public.team_role_permissions (team_role_id, permission_id)
select role_targets.team_role_id, permission_targets.permission_id
from role_targets
cross join permission_targets
on conflict do nothing;

create or replace function public.current_user_can_manage_announcements()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_has_permission('announcements.manage');
$$;

grant execute on function public.current_user_can_manage_announcements() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_author_id_fkey'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_author_id_fkey
      foreign key (author_id)
      references public.profiles(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notices_status_check'
      and conrelid = 'public.notices'::regclass
  ) then
    alter table public.notices
      add constraint notices_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

alter table public.notices enable row level security;

drop policy if exists "notices_admin_delete" on public.notices;
drop policy if exists "notices_admin_insert" on public.notices;
drop policy if exists "notices_admin_update" on public.notices;
drop policy if exists "notices_public_read" on public.notices;
drop policy if exists "notices_read_published_or_manage" on public.notices;
drop policy if exists "notices_insert_team_leads" on public.notices;
drop policy if exists "notices_update_team_leads" on public.notices;
drop policy if exists "notices_delete_team_leads" on public.notices;

create policy "notices_read_published_or_manage"
on public.notices
for select
using (
  status = 'published'
  or public.current_user_can_manage_announcements()
);

create policy "notices_insert_team_leads"
on public.notices
for insert
with check (
  public.current_user_can_manage_announcements()
  and author_id = auth.uid()
);

create policy "notices_update_team_leads"
on public.notices
for update
using (public.current_user_can_manage_announcements())
with check (public.current_user_can_manage_announcements());

create policy "notices_delete_team_leads"
on public.notices
for delete
using (public.current_user_can_manage_announcements());

create table if not exists public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notice_comments_body_length check (
    char_length(btrim(body)) between 1 and 1000
  )
);

create index if not exists notice_comments_notice_created_idx
  on public.notice_comments(notice_id, created_at);

create index if not exists notice_comments_author_idx
  on public.notice_comments(author_id);

create or replace function public.set_notice_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notice_comments_set_updated_at
  on public.notice_comments;
create trigger notice_comments_set_updated_at
  before update on public.notice_comments
  for each row execute function public.set_notice_comment_updated_at();

alter table public.notice_comments enable row level security;

drop policy if exists "notice_comments_select_members" on public.notice_comments;
drop policy if exists "notice_comments_insert_members" on public.notice_comments;
drop policy if exists "notice_comments_update_own" on public.notice_comments;
drop policy if exists "notice_comments_delete_own_or_manage" on public.notice_comments;

create policy "notice_comments_select_members"
on public.notice_comments
for select
using (
  public.current_user_has_permission('announcements.read')
  and exists (
    select 1
    from public.notices n
    where n.id = notice_comments.notice_id
      and (
        n.status = 'published'
        or public.current_user_can_manage_announcements()
      )
  )
);

create policy "notice_comments_insert_members"
on public.notice_comments
for insert
with check (
  public.current_user_has_permission('announcements.read')
  and author_id = auth.uid()
  and exists (
    select 1
    from public.notices n
    where n.id = notice_comments.notice_id
      and (
        n.status = 'published'
        or public.current_user_can_manage_announcements()
      )
  )
);

create policy "notice_comments_update_own"
on public.notice_comments
for update
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.current_user_has_permission('announcements.read')
);

create policy "notice_comments_delete_own_or_manage"
on public.notice_comments
for delete
using (
  author_id = auth.uid()
  or public.current_user_can_manage_announcements()
);

grant select, insert, update, delete on public.notice_comments to authenticated;

-- 20260505152000_contact_requests_rpc_and_rls.sql

create or replace function public.current_user_can_use_contact_requests()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = auth.uid()
      and ma.status in ('active', 'course_member')
  );
$$;

create or replace function public.create_contact_request(
  recipient_user_id_input uuid,
  reason_input text,
  requested_contact_methods_input text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_reason text := nullif(btrim(reason_input), '');
  normalized_methods text[];
  request_id uuid;
  requester_profile public.profiles%rowtype;
  recipient_exists boolean;
  requester_payload jsonb;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_can_use_contact_requests() then
    raise exception '연락 요청을 사용할 수 있는 계정이 아닙니다.';
  end if;

  if recipient_user_id_input is null or recipient_user_id_input = current_user_id then
    raise exception '요청 대상을 확인해 주세요.';
  end if;

  if normalized_reason is null or char_length(normalized_reason) < 5 then
    raise exception '요청 사유를 5자 이상 입력해 주세요.';
  end if;

  select array_agg(distinct method order by method)
  into normalized_methods
  from (
    select lower(btrim(value)) as method
    from unnest(coalesce(requested_contact_methods_input, '{}'::text[])) as value
  ) methods
  where method in ('email', 'phone');

  if coalesce(array_length(normalized_methods, 1), 0) = 0 then
    raise exception '공개할 연락처 종류를 선택해 주세요.';
  end if;

  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = recipient_user_id_input
      and ma.status in ('active', 'course_member')
  )
  into recipient_exists;

  if not recipient_exists then
    raise exception '요청 대상이 연락 요청을 받을 수 있는 상태가 아닙니다.';
  end if;

  select *
  into requester_profile
  from public.profiles
  where id = current_user_id;

  requester_payload := jsonb_strip_nulls(jsonb_build_object(
    'email', case when 'email' = any(normalized_methods) then nullif(requester_profile.email::text, '') end,
    'phone', case when 'phone' = any(normalized_methods) then nullif(requester_profile.phone, '') end
  ));

  insert into public.contact_requests (
    requester_user_id,
    recipient_user_id,
    status,
    reason,
    requested_contact_methods,
    requester_contact_payload
  )
  values (
    current_user_id,
    recipient_user_id_input,
    'pending',
    normalized_reason,
    normalized_methods,
    requester_payload
  )
  returning id into request_id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    new_status,
    reason,
    metadata
  )
  values (
    request_id,
    current_user_id,
    'created',
    'pending',
    normalized_reason,
    jsonb_build_object('requestedContactMethods', normalized_methods)
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    recipient_user_id_input,
    current_user_id,
    'contact_request_created',
    '연락 요청이 도착했습니다',
    left(normalized_reason, 160),
    'in_app',
    'important',
    'contact_requests',
    request_id,
    '/member/contact-requests',
    jsonb_build_object('contactRequestId', request_id)
  );

  return request_id;
end;
$$;

create or replace function public.decide_contact_request(
  contact_request_id_input uuid,
  decision_input text,
  decision_reason_input text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_decision text := lower(btrim(decision_input));
  normalized_reason text := nullif(btrim(decision_reason_input), '');
  request_record public.contact_requests%rowtype;
  responder_profile public.profiles%rowtype;
  responder_payload jsonb := '{}'::jsonb;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if normalized_decision not in ('accepted', 'rejected') then
    raise exception '수락 또는 거절만 처리할 수 있습니다.';
  end if;

  select *
  into request_record
  from public.contact_requests
  where id = contact_request_id_input
  for update;

  if not found then
    raise exception '연락 요청을 찾을 수 없습니다.';
  end if;

  if request_record.status <> 'pending' then
    raise exception '이미 처리된 요청입니다.';
  end if;

  if request_record.recipient_user_id <> current_user_id
     and not public.current_user_has_permission('members.manage') then
    raise exception '연락 요청을 처리할 권한이 없습니다.';
  end if;

  if normalized_decision = 'accepted' then
    select *
    into responder_profile
    from public.profiles
    where id = current_user_id;

    responder_payload := jsonb_strip_nulls(jsonb_build_object(
      'email', case when 'email' = any(request_record.requested_contact_methods) then nullif(responder_profile.email::text, '') end,
      'phone', case when 'phone' = any(request_record.requested_contact_methods) then nullif(responder_profile.phone, '') end
    ));

    if responder_payload = '{}'::jsonb then
      raise exception '선택된 연락처가 프로필에 없습니다.';
    end if;
  end if;

  update public.contact_requests
  set status = normalized_decision,
      responder_contact_payload = case
        when normalized_decision = 'accepted' then responder_payload
        else '{}'::jsonb
      end,
      decision_reason = normalized_reason,
      decided_by = current_user_id,
      decided_at = now()
  where id = request_record.id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    previous_status,
    new_status,
    reason,
    metadata
  )
  values (
    request_record.id,
    current_user_id,
    'decided',
    request_record.status,
    normalized_decision,
    normalized_reason,
    jsonb_build_object('decision', normalized_decision)
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    request_record.requester_user_id,
    current_user_id,
    'contact_request_decided',
    case
      when normalized_decision = 'accepted' then '연락 요청이 수락되었습니다'
      else '연락 요청이 거절되었습니다'
    end,
    normalized_reason,
    'in_app',
    'normal',
    'contact_requests',
    request_record.id,
    '/member/contact-requests',
    jsonb_build_object('contactRequestId', request_record.id, 'decision', normalized_decision)
  );

  return true;
end;
$$;

create or replace function public.report_contact_request_spam(
  contact_request_id_input uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  request_record public.contact_requests%rowtype;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into request_record
  from public.contact_requests
  where id = contact_request_id_input
  for update;

  if not found then
    raise exception '연락 요청을 찾을 수 없습니다.';
  end if;

  if request_record.recipient_user_id <> current_user_id
     and not public.current_user_has_permission('members.manage') then
    raise exception '신고할 권한이 없습니다.';
  end if;

  update public.contact_requests
  set status = case when status = 'pending' then 'rejected' else status end,
      decision_reason = coalesce(decision_reason, '스팸 또는 반복 요청으로 신고됨'),
      decided_by = coalesce(decided_by, current_user_id),
      decided_at = coalesce(decided_at, now()),
      spam_reported_at = now(),
      spam_reported_by = current_user_id
  where id = request_record.id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    previous_status,
    new_status,
    reason,
    metadata
  )
  values (
    request_record.id,
    current_user_id,
    'spam_reported',
    request_record.status,
    case when request_record.status = 'pending' then 'rejected' else request_record.status end,
    '스팸 또는 반복 요청으로 신고됨',
    '{}'::jsonb
  );

  return true;
end;
$$;

drop policy if exists "contact_requests_insert_active_requester" on public.contact_requests;
drop policy if exists "contact_requests_insert_members_requester" on public.contact_requests;
create policy "contact_requests_insert_members_requester" on public.contact_requests
for insert with check (
  requester_user_id = auth.uid()
  and public.current_user_can_use_contact_requests()
);

drop policy if exists "contact_requests_update_participants_or_admins" on public.contact_requests;
drop policy if exists "contact_requests_update_no_direct_client" on public.contact_requests;
create policy "contact_requests_update_no_direct_client" on public.contact_requests
for update using (false) with check (false);

drop policy if exists "contact_request_events_insert_participants_or_admins" on public.contact_request_events;
drop policy if exists "contact_request_events_insert_no_direct_client" on public.contact_request_events;
create policy "contact_request_events_insert_no_direct_client" on public.contact_request_events
for insert with check (false);

grant execute on function public.current_user_can_use_contact_requests() to authenticated;
grant execute on function public.create_contact_request(uuid, text, text[]) to authenticated;
grant execute on function public.decide_contact_request(uuid, text, text) to authenticated;
grant execute on function public.report_contact_request_spam(uuid) to authenticated;
