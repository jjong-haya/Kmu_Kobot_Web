# Kobot Web — 작업 인수인계 (HANDOFF)

작업 중 멈춘 지점, 다음 작업자(다른 AI 또는 사람)를 위한 가이드입니다.

---

## 0.5. 🚀 출시 전 필수 체크리스트 (2026-05-04 업데이트)

| 항목 | 상태 | 비고 |
|---|---|---|
| 테스트 우회 라우트 (`/preview/*`) | ✅ 제거됨 | routes.tsx |
| `?preview=1` 가드 우회 | ✅ 제거됨 | Welcome.tsx |
| Math.random → crypto.getRandomValues | ✅ 적용 | invite-codes.ts |
| Cookie SameSite/Secure | ✅ 적용 | sidebar.tsx |
| 보안 헤더 (HSTS/CSP/XFO 등) | ✅ vercel.json | 배포 후 검증 필요 |
| Source map 운영 비활성 | ✅ vite.config.ts | |
| console.log 운영 자동 제거 | ✅ esbuild.drop | |
| 에러 메시지 sanitizer | ✅ utils/sanitize-error.ts | console 노출 없음 |
| 의존성 CVE | ✅ npm audit fix 완료 | production = 0 |
| **마이그레이션 적용** | ❌ 사용자 작업 | 아래 참조 |
| **Supabase Auth Rate Limit** | ❌ 사용자 작업 | Studio에서 활성 |
| **Cloudflare 프록시** | ❌ 사용자 작업 | Free 플랜으로 충분 |
| **OAuth Redirect URL 화이트리스트** | ❌ 사용자 작업 | Studio에서 좁히기 |
| **`profiles.club_affiliation` 컬럼 존재** | ❓ 확인 필요 | 없으면 RPC 실패 |

---

## 0. ⚠️ 적용 안 된 마이그레이션 = 코드 노출 위험

`redeem_course_invite` RPC 등 일부 기능은 마이그레이션 미적용 시 다음과 같은 에러를 사용자에게 노출했습니다:
> "Could not find the function public.redeem_course_invite(invite_code) in the schema cache"

이건 스키마/함수명을 그대로 클라이언트에 보여줘서 정보 노출입니다.

**조치 (이미 적용 완료):**
- `src/app/utils/sanitize-error.ts` 추가 — 위험 패턴(`public.X`, `schema cache`, `relation/column/function does not exist`, `RLS`, `pg_*`, `supabase`, `jwt`, `invalid_grant`, `code verifier`, 240자 초과 등)이 매칭되면 사용자에게는 친화적 fallback 메시지만 표시, 원문은 `console.warn` 으로만 남김
- 적용된 파일: `Welcome.tsx`, `Profile.tsx`, `Security.tsx`, `AccountInfo.tsx`, `SpaceBooking.tsx`

**여전히 마이그레이션은 빨리 적용해야 함** (그렇지 않으면 기능이 작동 안 함).

---

## 1. Supabase 마이그레이션 적용

새로 추가된 마이그레이션 3개가 **DB에 반영되어야** 정상 작동합니다.

| 파일 | 테이블/함수 | 용도 |
|---|---|---|
| `supabase/migrations/20260503090000_profile_change_requests.sql` | `profile_change_requests` | 학번/학과/이름 등 read-only 정보 변경 요청 |
| `supabase/migrations/20260503100000_space_bookings.sql` | `space_bookings` | 동아리실 공간 예약 캘린더 데이터 |
| `supabase/migrations/20260504040000_course_invite_codes.sql` | `course_invite_codes` + `course_invite_redemptions` + `redeem_course_invite()` RPC | 코스 회원 초대 링크 시스템 |

### 적용 방법
```bash
# Supabase CLI 사용 시
npx supabase db push

# 또는 Supabase Studio → SQL Editor에서 위 파일 내용 직접 실행
```

### 확인 사항: `has_permission(text)` RBAC helper 함수
두 마이그레이션 모두 `public.has_permission('members.manage')` 함수를 RLS 정책에 사용합니다.
- **이 함수가 이미 존재해야 함** (기존 RBAC 시스템에 포함되어 있어야 함)
- 만약 함수 이름이 다르면 (`has_permission_for`, `auth_can` 등) RLS 정책의 `using/with check` 구문을 맞게 수정 필요
- 확인: `select pg_get_functiondef(oid) from pg_proc where proname = 'has_permission';`

---

## 2. 현재 DB 연결 상태

| 페이지 | 경로 | DB 연결 | 비고 |
|---|---|---|---|
| 프로필 | `/member/profile` | ✅ | 기존 `useAuth().saveProfileSettings()` 재사용 |
| 계정 보안 | `/member/security` | ✅ | `supabase.auth.signInWithPassword` + `updateUser` |
| 회원 정보 | `/member/account-info` | ✅ | `profile_change_requests` 테이블 insert |
| 공간 예약 | `/member/space-booking` | ✅ | `space_bookings` 테이블 select/insert |
| 알림 | `/member/notifications` | ❌ | mock 데이터 |
| 연락 요청 | `/member/contact-requests` | ❌ | mock 데이터 |
| 공지 | `/member/announcements` | ❌ | mock 데이터 |
| 프로젝트 | `/member/projects` & `/projects/:slug` | ❌ | mock 데이터 |

---

## 3. 공간 예약 (Space Booking) — 추가 필요 작업

현재는 read/insert만 구현됐습니다.

### 우선순위 높음
- [ ] **충돌 검증** — 같은 시간대 + scope=`exclusive` 예약 차단 (DB trigger 또는 클라이언트 검증)
  ```sql
  -- 예시: trigger로 같은 날 exclusive 예약 시간 겹침 차단
  create function public.prevent_exclusive_booking_overlap() ...
  ```
- [ ] **삭제 UI** — 예약 detail에서 본인 예약일 경우 "삭제" 버튼 노출 (`deleteBooking()` 함수는 이미 `src/app/api/space-bookings.ts`에 있음)
- [ ] **수정 UI** — 본인 예약 시간/제목 수정 (현재는 update API 미작성)

### 우선순위 중간
- [ ] **Realtime 구독** — 다른 부원이 예약 추가하면 즉시 캘린더에 반영 (`supabase.channel().on('postgres_changes', ...)`)
- [ ] **반복 예약** — "매주 화요일 19시" 같은 반복 일정 (`recurrence_rule` 컬럼 추가)
- [ ] **예약 취소 알림** — 본인 예약 취소 시 다른 참여 예정자에게 알림

### 우선순위 낮음
- [ ] 캘린더 ICS export
- [ ] 예약 통계 (월별 사용량, 타입별 분포)

---

## 3.5. 코스 회원 초대 링크 시스템 — 운영진 작업 필요

`course_member` 상태(제한된 권한 회원)를 위한 초대 링크 플로우를 구현했습니다.

### 사용자 플로우 (이미 구현됨)
1. 운영진이 코드 발급 → 부원에게 `https://app/invite/course?code=ABC123` 전달
2. 사용자가 링크 클릭 → `/invite/course` 페이지 (Google 로그인 버튼)
3. localStorage에 invite code 저장 → Google OAuth 시작
4. `/auth/callback` 복귀 → `redeem_course_invite(invite_code)` RPC 호출
5. RPC가 status를 `course_member`로 설정, 사용 횟수 증가, 감사 로그 기록
6. 사용자는 사이드바에서 5개 메뉴만 보임 (대시보드 / 알림 / 공지 / 연락 요청 / 멤버)

### 운영진 작업 필요
- [ ] **초대 코드 발급 UI 구현** — 현재는 SQL Editor에서 직접 INSERT 해야 함:
  ```sql
  insert into public.course_invite_codes (code, label, max_uses, expires_at)
    values ('SLAM2026', '2026 봄 SLAM 코스', 30, '2026-09-01');
  ```
- [ ] **`profiles.account_status` 컬럼 확인** — 마이그레이션은 이 컬럼이 text라고 가정. 만약 enum 타입이면 enum에 `course_member` 값을 ALTER TYPE으로 추가 필요:
  ```sql
  -- profiles의 status 컬럼이 enum인 경우
  alter type member_status_enum add value if not exists 'course_member';
  ```
- [ ] **부원 ↔ 코스 회원 변환 UI** — 코스 회원을 정식 부원으로 승격 또는 만료 시 비활성화하는 운영진 페이지

### 코드 위치
- 페이지: `src/app/pages/public/InviteCourse.tsx`
- 라우트: `/invite/course` (top-level, public)
- 콜백 redeem 로직: `src/app/pages/public/AuthCallback.tsx` (line ~263 근처)
- 사이드바 필터: `src/app/layouts/MemberLayout.tsx` — `COURSE_MEMBER_ALLOWED_PATHS` 상수
- 상태 라벨: "동아리 코스" (`getMemberStatusLabel`)

### 코스 회원이 보는 메뉴 (사이드바 필터)
```
- 대시보드        (/member)
- 알림            (/member/notifications)
- 공지            (/member/announcements)
- 연락 요청       (/member/contact-requests)
- 멤버            (/member/members)
- 프로필 / 보안 / 회원 정보 (계정 페이지는 모두 접근)
```

### 주의 사항
- `redeem_course_invite` RPC는 **이미 active/project_only 상태인 사용자는 다운그레이드하지 않음** (정식 부원이 실수로 코드 사용해도 status 안 바뀜)
- localStorage key: `kobot:course-invite-code` (공유: `InviteCourse.tsx`와 `AuthCallback.tsx`)

---

## 4. 회원 정보 변경 요청 — 운영진 화면 미구현

`profile_change_requests` 테이블에 데이터는 쌓이지만, **운영진이 검토할 화면이 없음**.

### 필요한 페이지
- `/member/permissions` 또는 신규 `/member/admin/change-requests`
- 기능:
  - pending 상태 요청 목록 조회 (테이블)
  - 각 요청 승인/거절 (status 업데이트 + 승인 시 `profiles` 테이블 실제 업데이트 필요)
  - 거절 시 `reviewer_note` 입력
- 권한: `members.manage` 권한 보유자만 접근

---

## 5. 사이드바 권한 계층

현재 사이드바는 4단계 권한으로 구성:
- **부원** (모든 active 멤버)
- **공식팀장** (`projects.manage`, `resources.manage`)
- **부회장** (별도 권한 미설정 — 모두에게 보임 ⚠️)
- **회장** (`forms.manage`, `integrations.manage`, `permissions.manage`)

### 작업 필요
- [ ] 부회장 섹션 항목들에 적절한 permission 코드 부여 (현재 권한 없이 모두 노출됨)
  - `로드맵`, `회고`, `변경 기록` → 적절한 코드 (예: `operations.manage`) 추가 필요

---

## 6. 디자인 시스템 일관성

각 페이지가 인라인 스타일로 작성되어 있어 디자인 토큰이 흩어져 있음.

### 정리 후보
- [ ] 카드 컨테이너 스타일 (`CONTAINER_STYLE` / `ACCOUNT_CARD`)을 공통 컴포넌트로
- [ ] 필터 pill 버튼 컴포넌트 추출 (Notifications, ContactRequests, Announcements, SpaceBooking 모두 동일 패턴)
- [ ] 페이지 헤더 (eyebrow + 제목 + 카운트) 패턴 추출

---

## 7. 모바일 대응 상태

| 페이지 | 모바일 OK | 비고 |
|---|---|---|
| 대시보드 | ⚠️ 일부 | 캘린더 위젯 좁아질 수 있음 |
| 알림 | ✅ | |
| 공지 | ✅ | |
| 연락 요청 | ✅ | |
| 공간 예약 | ✅ | dot 컬러칩 + 토글 detail |
| 프로필/보안/회원정보 | ✅ | `AccountResponsiveStyles` 사용 |
| 프로젝트 리스트/상세 | ⚠️ | 칸별 뷰가 좁은 화면에서 4열 유지됨 (수평 스크롤) |

---

## 8. 환경 변수

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
설정 안 되어 있으면 `getSupabaseBrowserClient()`가 throw함.

---

## 9. 알려진 이슈

- **`hu0315` 로그인 ID** — ID 변경은 회원 정보 페이지 변경 요청 플로우로만 가능
- **Q&A 페이지 삭제됨** — 라우트와 import 정리됨, 파일은 `src/app/pages/member/QnA.tsx`로 남아 있음 (나중에 안 쓰면 삭제)
- **스터디 플레이리스트 미정** — 사용자가 유지/삭제 결정 안 함, 현재 그대로 둠

---

## 10. 다음 우선순위 추천

1. ⚡ **Supabase 마이그레이션 두 개 적용** (1순위)
2. 🔧 **`has_permission` 함수명 매핑 확인** (마이그레이션 적용 전 필수)
3. 🛡️ **공간 예약 충돌 검증** (exclusive 모드 시간 겹침 방지)
4. 📋 **운영진 변경 요청 검토 페이지** (관리자 UX)
5. 🔔 **부회장 권한 코드 정의 및 적용**

---

> 마지막 업데이트: 2026-05-03
> 작업자: 함종하 (회장 / 개발자)
