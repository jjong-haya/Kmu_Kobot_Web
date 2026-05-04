# Kobot Web — 보안 감사 (2026-05-04 / v2)

본 문서는 **정적 코드 분석 + 의존성 스캔 + 인프라 구성 점검** 기반의 보안 감사 결과입니다.
실행한 도구:
- `npm audit` (의존성 CVE 스캔, 실제 실행 ✓)
- `npm audit fix` (자동 수정, 실제 실행 ✓)
- 코드 패턴 grep — 시크릿 / SQL 인젝션 / SSRF / Path traversal / 외부 fetch / `dangerouslySetInnerHTML` / `eval` / `target=_blank` / SECURITY DEFINER 함수 / RLS enable 누락 등
- Supabase 마이그레이션 SQL RLS 정책 정적 분석

미실행 (운영 환경 권한 필요):
- 외부 침투 테스트 (BurpSuite, OWASP ZAP, sqlmap, nmap, Hydra, Nikto, Metasploit 등)
- 부하/DDoS 시뮬레이션
- 라이브 트래픽 fuzzing

---

## ✅ 이번 감사에서 실제로 적용한 픽스

### A. 의존성 (npm audit fix 자동 수정)
- ✅ lodash CVE-2021-23337 (HIGH, CVSS 8.1) — Code Injection
- ✅ lodash GHSA-f23m-r3pf-42rh (MOD, CVSS 6.5) — Prototype Pollution
- ✅ yaml GHSA-48c2-rrv3-qjmp (MOD, CVSS 4.3) — Stack Overflow
- → `npm audit --omit=dev` = **0 vulnerabilities (production)**
- ⚠️ 잔존 (dev only): `vite <= 6.4.1` HIGH 5건 — 운영 빌드 미포함, 추후 `npm audit fix --force`

### B. 인프라 보안 헤더 (`vercel.json`)
- ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` (camera/mic/geolocation/payment/usb 등 차단)
- ✅ `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- ✅ `Cross-Origin-Resource-Policy: same-origin`
- ✅ `Content-Security-Policy` — Supabase + Google OAuth만 connect/frame 허용, `object-src 'none'`, `upgrade-insecure-requests`

### C. 빌드 (`vite.config.ts`)
- ✅ `build.sourcemap: false` — 운영 source map 미배포 (소스 노출 차단)
- ✅ `esbuild.drop: ['console', 'debugger']` — 운영 빌드에서 console.* 자동 제거 (혹시 남은 디버그 로그 노출 차단)

### D. 코드 픽스
- ✅ `Math.random()` → `crypto.getRandomValues()` (`src/app/api/invite-codes.ts`)
  - **CWE-338 Predictable Random** — 초대 코드는 인증 보조 요소이므로 암호학적 난수 필수
- ✅ `document.cookie` 에 `SameSite=Lax; Secure` 추가 (`src/app/components/ui/sidebar.tsx`)
- ✅ 사용자 제어 가능 `<img src>` (avatarUrl) 에 `safeImageUrl()` 적용 (`src/app/pages/member/Profile.tsx`)
  - `javascript:`, `vbscript:`, `data:text/html`, `file:`, `about:` 스킴 차단
  - `data:image/*`, `blob:`, `https://`, `http://`, root-relative만 허용
  - `referrerPolicy="no-referrer"` — referrer leak 차단
- ✅ `target="_blank"` 모든 링크 `rel="noopener noreferrer"` 적용
- ✅ 에러 메시지 sanitizer (`utils/sanitize-error.ts`) — 5개 페이지 적용, console 로깅 제거

---

---

심각도 표기:
- 🔴 **HIGH** — 운영 전 반드시 조치
- 🟡 **MEDIUM** — 운영 가능하나 단기간 내 조치 권장
- 🟢 **LOW** — 모니터링 / 향후 개선

---

## 0. 즉시 조치 필요 (HIGH)

### 0.1 🔴 보안 헤더 부재 (CSP / HSTS / X-Frame-Options)
**현황:** `vercel.json` 에 `rewrites`만 있고 보안 헤더 없음. `index.html`에도 CSP meta 태그 없음.

**위험:**
- XSS 공격 차단 레이어 없음 (React가 기본 escape 하지만 한 줄 우회 시 무방비)
- iframe clickjacking 가능
- HTTPS 강제 미적용 (HSTS 없음)
- Mixed content 허용

**조치:** `vercel.json`에 헤더 블록 추가
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com" }
      ]
    }
  ]
}
```

### 0.2 🔴 Rate Limiting / DDoS 보호 부재
**현황:**
- 프론트에서 직접 Supabase 호출 (서버 미들웨어 없음)
- Supabase 자체에 IP 기반 throttling이 있지만 어플리케이션 단 보호는 없음
- `redeem_course_invite` RPC를 무한 호출해 코드 brute force 가능
- 댓글, 예약, 변경 요청 모두 클라이언트 단 제한만 있음

**조치:**
1. **Cloudflare** 프록시 + Vercel domain → Cloudflare WAF rules 적용 (Rate limit by IP/path)
2. **Supabase Auth** Edge Function rate limit 활성화 (Auth → Rate Limits 설정)
3. **invite code** brute force 방지 RPC 내부 로직 추가:
   ```sql
   -- 시도 로그 테이블 추가 + 1분당 5회 초과 시 거부
   create table public.invite_redeem_attempts (
     id uuid primary key default gen_random_uuid(),
     attempted_by uuid references auth.users(id),
     code_attempted text,
     ip_addr inet,
     attempted_at timestamptz default now()
   );
   -- redeem_course_invite() 시작부에 카운트 체크
   ```
4. **공간 예약** insert에 `1시간당 10건 / 1일 50건` 제한 추가 (DB trigger)

### 0.3 🔴 Migration 미적용 시 클라이언트에 스키마 노출 (이미 부분 조치)
**현황:** `sanitizeUserError` 적용됨 (Welcome / Profile / Security / AccountInfo / SpaceBooking / InviteCodes).

**잔존 위험:** 다른 페이지 / 컴포넌트에서 `error.message` 그대로 노출하는 곳이 있을 수 있음.

**조치:** 전 코드에서 `error.message` 직접 노출하는 패턴 grep 후 sanitizer 적용
```bash
grep -rn "err.message\|error.message" src --include="*.tsx" --include="*.ts"
```
설계 원칙: **사용자 메시지는 화이트리스트, 원문은 절대 표시 금지.**

### 0.4 🔴 OAuth Redirect URL 화이트리스트
**현황:** `getSafeInternalPath`로 내부 경로만 허용하지만, Supabase Auth Dashboard 설정 확인 필요.

**조치:** Supabase Studio → Authentication → URL Configuration
- Site URL: `https://정식도메인`만 등록
- Redirect URLs:
  - `https://정식도메인/auth/callback`
  - `http://localhost:5173/auth/callback` (개발용, 운영 후 제거 권장)
- Wildcard (`*`) 사용 금지

---

## 1. 인증 / 세션 (Authentication)

### 1.1 🟡 비밀번호 정책
**현황:** ID 로그인 비밀번호 8자 이상만 검증.

**개선:**
- 12자 이상 + 영문대소문자/숫자/특수문자 중 3종 이상 요구
- HIBP (haveibeenpwned) 유출 비밀번호 차단 (Supabase Auth → Security 설정)
- 비밀번호 재사용 차단 (이전 N개 해시 보관)

### 1.2 🟡 계정 잠금 / 로그인 실패 추적
**현황:** Supabase 기본 throttling만. 어플 단 잠금 없음.

**개선:**
- 5회 연속 실패 시 15분 잠금
- 실패 시도 알림 (이메일)
- `auth.audit_log_entries` 모니터링 + 이상 탐지 룰

### 1.3 🟢 세션 만료 / 자동 로그아웃
**현황:** Supabase 기본 1시간 access token + refresh token. 무기한 갱신.

**개선:** 활동 미감지 시 N분 후 자동 로그아웃 (운영진 계정에 한해 권장).

### 1.4 🟢 Google OAuth — 학교 메일만 허용
**현황:** AuthCallback에서 도메인 검증 (kookmin 패턴 매칭). `restricted/approved Google` 메시지 처리.

**개선:** Supabase Auth provider 설정에서 hosted domain (`hd=kookmin.ac.kr`) 강제 가능.

---

## 2. 권한 / 인가 (Authorization)

### 2.1 🔴 RLS 정책 검증 (작성된 정책 = 86개 정책)
**확인 항목:**
- [ ] **모든 테이블에 RLS enabled** — 비활성 테이블은 anon key로 전체 접근 가능
- [ ] **`SELECT` 정책 부재 시 조회 불가** — 명시적 정책 없으면 잠김 (정상)
- [ ] `profile_change_requests` — 본인은 insert/select 가능, 운영진은 전체 관리 ✓
- [ ] `space_bookings` — 누구나 read, 본인만 update/delete, 운영진 전체 관리 ✓
- [ ] `course_invite_codes` — 인증된 사용자가 read, 운영진만 manage ✓ (단 read 시 모든 컬럼 노출)
- [ ] `course_invite_redemptions` — 본인 redemption만 read, 운영진 전체 ✓

**위험 1 — 초대 코드 스캔:**
인증된 사용자가 `select * from course_invite_codes`로 모든 코드를 조회 가능.
악성 부원이 미사용 코드 다 끌어가서 외부에 뿌릴 수 있음.

**조치:** 코드는 운영진만 read 가능하게 변경
```sql
drop policy if exists "any auth user can read invite codes" on public.course_invite_codes;
create policy "ops can read invite codes" on public.course_invite_codes
  for select using (public.has_permission('members.manage'));
```
RPC 함수는 SECURITY DEFINER이므로 일반 사용자가 코드 read 권한이 없어도 redeem 가능.

**위험 2 — `has_permission` 함수 미존재 시 RLS 통과 안 됨:**
함수가 없으면 모든 RLS 정책의 `using` 조건이 에러 → 운영진 기능 모두 막힘.

**조치:** `has_permission(text)` 함수 존재 확인 + 없을 시 정의

### 2.2 🟡 클라이언트 사이드 권한 체크의 한계
`hasPermission()` 함수로 사이드바 / 페이지 노출 제어하지만, **DOM 조작으로 우회 가능**. 진짜 권한은 RLS만 신뢰.

**확인:** 모든 민감 작업 (delete, update, admin 액션)에 RLS 필수 적용.

### 2.3 🟡 IDOR (Insecure Direct Object Reference)
**위험 위치:**
- `/notice/:slug` — 공지 slug로 직접 접근. 비공개 공지가 있다면 노출.
- `/member/projects/:slug` — 프로젝트 slug. 본인이 멤버 아니어도 URL로 접근 가능?
- `space_bookings.id` — UUID라 추측 어려움 ✓

**조치:** 각 detail 라우트에서 RLS 또는 명시적 권한 체크.

### 2.4 🟢 KOSS 코스 권한 escalation 차단
**현재 redeem_course_invite RPC:**
```sql
update public.profiles
  set account_status = 'course_member'
  where id = v_caller and account_status not in ('active', 'project_only');
```
✓ 이미 `active` / `project_only`는 다운그레이드 안 함.

**개선:** `where` 조건에 `course_member` 자기 자신도 추가 (이미 코스 회원이 또 다른 코드 사용 시 막힘):
```sql
where id = v_caller and account_status is null or account_status = 'pending'
```

---

## 3. 입력 검증 (Input Validation)

### 3.1 🟡 닉네임 / 본명 등 폼 입력
**현황:** 정규식 + trim 검증 (`NICKNAME_DISPLAY_PATTERN`, `LOGIN_ID_PATTERN`).

**확인 필요:**
- ` ` (NULL byte) 필터링 — 일부 DB 드라이버 우회
- Unicode 동형이의 (homoglyph) 닉네임 (`KOВOT` 같은 시릴릭) — 닉네임 단계에서 검증 추가 권장
- 길이 제한 검증을 클라이언트 + DB CHECK constraint 양쪽에 적용

### 3.2 🟢 invite code 입력
**현황:** 클라이언트에서 `.toUpperCase()` + `.trim()` + maxLength 32. RPC가 PG에서 직접 매칭.

✓ SQL injection 위험 없음 (parameterized via Supabase client).

### 3.3 🟢 댓글 / 공지 본문
**현황:** React가 자동 escape. `dangerouslySetInnerHTML` 사용 위치 = `src/app/components/ui/chart.tsx:83` 한 곳뿐.

**확인:** chart.tsx의 dangerouslySetInnerHTML 입력값이 사용자 제어가 아닌지 검증 (recharts 내부 스타일 주입이라 일반적으로 안전).

### 3.4 🟡 URL 파라미터 검증
**현황:** `getSafeInternalPath` 사용 — 외부 URL 차단 ✓.

**확인:** `clubAffiliation` 등 invite link 파라미터를 그대로 form value에 사용 → XSS 위험은 React로 차단됨, 단 검증 길이 제한 추가 권장.

---

## 4. 출력 인코딩 / XSS

### 4.1 🟢 React 기본 escape
모든 `{value}` 렌더링은 자동 HTML escape. 한 곳 (`chart.tsx`)만 dangerouslySetInnerHTML 사용.

### 4.2 🟡 외부 링크 noopener 누락 (3곳)
```
src/app/pages/member/ProfileSettings.tsx:947 (target="_blank")
src/app/pages/member/ProfileSettings.tsx:971 (target="_blank")
src/app/pages/public/Contact.tsx:123 (target="_blank")
```
**조치:** `rel="noreferrer noopener"` 추가 (이미 일부는 적용되어 있음. 누락된 것 보정).

ProfileSettings에서 약관/처리방침 링크는 내부 라우트이므로 OK이지만, Contact.tsx는 외부 SNS일 수 있음. 확인 필요.

---

## 5. CSRF (Cross-Site Request Forgery)

### 5.1 🟢 Supabase JWT 기반
Bearer token이 Authorization 헤더로 전송 (cookie 아님) → CSRF 자동 차단.

### 5.2 🟢 OAuth state token
Supabase Auth가 PKCE flow 사용 (`flowType: "pkce"` 확인 ✓). state 파라미터 자동 검증.

---

## 6. 정보 노출 (Information Disclosure)

### 6.1 🟡 source map 운영 노출
**확인:** Vite 기본 빌드는 prod에서 source map 생성. `vite.config.ts`에 `build.sourcemap: false` 설정 권장.

```ts
export default defineConfig({
  build: {
    sourcemap: false, // 운영에서는 false
  },
  ...
});
```

### 6.2 🟢 .env 파일 git ignore
**확인 필요:** `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 포함 여부.

### 6.3 🟢 SUPABASE_ANON_KEY 노출 = 정상
Vite는 `VITE_*` 환경변수를 빌드에 inline → 클라이언트에서 보임. 이건 anon key 본질상 의도된 동작 (RLS로 보호).

**전제 조건:** RLS가 모든 민감 테이블에 적용되어 있어야 함. RLS 누락 시 anon key로 전체 데이터 노출.

### 6.4 🟢 console.log 적음
스캔 결과 민감 정보 로깅 패턴 없음. sanitize-error.ts에서도 console.warn 제거 완료 ✓.

---

## 7. localStorage / 브라우저 저장소

### 7.1 🟢 사용처 검토
- `kb-sidebar-collapsed` (UI 상태, 안전)
- `kobot:course-invite-code` (초대 코드, **임시 저장**)

### 7.2 🟡 invite code localStorage 잔존
**위험:** 사용자가 `/invite/course?code=XXX` 방문 후 OAuth 진행 안 하고 떠나면 코드가 localStorage에 영구 잔존. 다른 사용자가 같은 디바이스 사용 시 자동 redeem 가능.

**조치:** 
1. localStorage 대신 `sessionStorage` 사용 (탭 닫으면 삭제)
2. 또는 5분 TTL 추가
3. AuthCallback에서 redeem 시도 후 결과와 무관하게 항상 삭제

### 7.3 🟢 Supabase 세션 — 자동 관리
`persistSession: true` 설정으로 localStorage에 자동 저장 → XSS 발생 시 토큰 탈취 가능.

**완화책:** XSS 방지가 1차 방어선 (React + CSP). 2차로 짧은 access token TTL.

---

## 8. 의존성 / 라이브러리

### 8.1 🟡 npm audit 미실행
**조치:** 정기적으로 `npm audit --production` 실행 + 자동화
```bash
npm audit --audit-level=high
```
GitHub Dependabot / Snyk 연동 권장.

### 8.2 🟢 React / Supabase JS 최신
- `@supabase/supabase-js` 2.58.0 (최신 메이저)
- `react-router` 7.13.0
- 알려진 CVE 없음 (감사 시점)

### 8.3 🟡 사용 안 하는 패키지 정리
package.json에 50+ Radix UI 컴포넌트 등록되어 있음. 실제 사용 안 하는 것은 제거해 attack surface 축소.

---

## 9. 비즈니스 로직 / 어플 특화

### 9.1 🔴 댓글 시스템 — 인증된 사용자가 무한 작성 가능
**현황:** NoticeDetail.tsx에서 로컬 state로만 작동 (DB 미연동).

**향후 DB 연동 시 필수:**
- Rate limit (1분당 N개)
- 길이 제한 (예: 1000자)
- 단일 공지에 대한 본인 댓글 수 제한
- 욕설/혐오 필터 (옵션)
- 작성자 IP 로깅 (감사용)
- 운영진 삭제 권한

### 9.2 🟡 공간 예약 — 충돌 검증 없음
**위험:** 두 사람이 같은 시간대에 `exclusive` 예약 가능. 운영 혼란.

**조치:** DB trigger로 검증 (HANDOFF.md에도 기록됨)
```sql
create function public.prevent_exclusive_overlap()
returns trigger language plpgsql as $$
begin
  if new.scope = 'exclusive' and exists (
    select 1 from public.space_bookings
      where booking_date = new.booking_date
        and id <> new.id
        and tstzrange(start_time::time::text::timestamptz, end_time::time::text::timestamptz)
            && tstzrange(new.start_time::time::text::timestamptz, new.end_time::time::text::timestamptz)
  ) then
    raise exception '같은 시간대에 이미 단독 사용 예약이 있습니다.';
  end if;
  return new;
end;
$$;
```

### 9.3 🟡 회원 정보 변경 요청 — 운영진 대시보드 미구현
**위험:** 변경 요청은 쌓이지만 검토 화면이 없어 무한히 누적.

**조치:** 운영진 전용 변경 요청 검토 페이지 (HANDOFF.md 4번 항목).

### 9.4 🟢 KOSS 코스 — 자동 권한 부여
**현황:** 코드 발급자가 신뢰할 수 있는 운영진. 코드 도난 시 빠른 비활성화 가능.

---

## 10. 인프라 / 배포

### 10.1 🟢 HTTPS
Vercel = 자동 HTTPS + HTTP→HTTPS 리다이렉트 ✓.

### 10.2 🟡 환경변수 관리
**확인:**
- Vercel Production / Preview / Development 환경별 분리
- `VITE_SUPABASE_*` 키만 클라이언트에 노출 (server key는 별도)
- 회전 정책: 6개월마다 anon key 회전 + 사고 시 즉시 회전

### 10.3 🟢 Git 이력
`grep` 결과 service_role / sk_live 등 시크릿 commit 흔적 없음.

**조치:** GitHub secret scanning 활성화. 사고 시 즉시 회전.

### 10.4 🟡 Vercel deploy hook 보호
deploy hook URL이 노출되면 임의 배포 트리거 가능 → repo secret에서 관리.

---

## 11. DDoS 대응 (실제 IP 트래픽 기반)

**Vercel 단독으로는 어플리케이션 단 DDoS 방어 부족.** 다음 권장:

### 11.1 Cloudflare Free 플랜 (실제 무료로 사용 가능)
공식 가격표 기준 **Free 플랜에 포함**:
- ✓ 무제한 DDoS 방어 (L3/L4/L7) — 핵심
- ✓ 무료 SSL/TLS
- ✓ 글로벌 CDN
- ✓ Bot Fight Mode (기본)
- ✓ WAF Managed Rules (제한적이지만 OWASP 핵심 룰셋 포함)
- ✓ Page Rules 3개
- ✓ Rate Limiting Rules — 첫 1만 요청/월 무료, 이후 유료 ($5/mo부터)

**유료 플랜 (Pro $25/mo+) 에서만 가능한 것:**
- 고급 WAF custom rules 무제한
- Advanced Bot Management
- Argo Smart Routing
- Image Optimization
- WAF Managed Rules 추가 그룹

→ **Free 플랜만으로도 동아리 규모 운영 충분**. 트래픽 폭증 시에만 Pro 검토.

### 11.2 권장 무료 구성
1. 도메인을 Cloudflare에 두고 Vercel을 origin으로 (Cloudflare 프록시 ON)
2. Bot Fight Mode 활성화
3. Security Level: Medium 이상
4. Always Use HTTPS ON
5. WAF Managed Rules 켜기
6. (필요 시) Free Rate Limiting 규칙:
   - `/auth/callback` 5분당 5건/IP
   - `redeem_course_invite` 함수 호출 자체는 Supabase Edge Network에서 제한 필요

### 11.3 Supabase 단 무료 보호
- Auth → Rate Limits 활성화 (모든 엔드포인트)
- Database webhooks/triggers로 비정상 패턴 차단
- 본 RPC 함수 내부에 시도 카운터 추가 (앞서 SQL 예시)

---

## 12. 컴플라이언스 (한국)

### 12.1 🟡 개인정보처리방침 / 이용약관
✓ 두 페이지 모두 작성되어 있음. 동의 체크박스로 가입 시 강제됨.

**누락:**
- 개인정보 보호책임자 실명 + 연락처 명시 필요
- 개인정보 보유기간 구체적 명시 (현재는 "탈퇴 시까지" 정도)
- 만 14세 미만 가입 차단 — 안내문은 있으나 학번 검증 등으로 강제 필요

### 12.2 🟡 정보주체 권리 행사 채널
회원 정보 변경 요청 페이지 작동 + 탈퇴 신청 페이지 + 데이터 다운로드 (GDPR/PIPA) 향후 권장.

### 12.3 🟢 쿠키 동의
첫 방문 쿠키 배너는 한국 동아리 특성상 필수는 아님. 외부(EU) 트래픽 받을 경우 추가 필요.

---

## 13. 우선순위 액션 아이템 요약

**🔴 운영 전 필수 (1주 이내):**
1. `vercel.json` 보안 헤더 추가 (CSP, HSTS, X-Frame-Options)
2. Supabase Auth Redirect URL 화이트리스트 좁히기 + Rate Limit 활성화
3. `course_invite_codes` SELECT 정책을 운영진 전용으로 좁히기
4. localStorage → sessionStorage (course invite code)
5. RLS 정책 누락 테이블 점검 + `has_permission()` 함수 존재 확인
6. Cloudflare 프록시 + WAF 활성화 (DDoS 1차 방어)

**🟡 단기 (2-4주):**
7. `npm audit` + Dependabot 활성화
8. 댓글 / 변경 요청 / 예약 등 사용자 입력 페이지에 rate limit
9. 공간 예약 충돌 검증 trigger
10. 비밀번호 정책 강화 (12자 + 종류 + HIBP)
11. source map 운영 비활성화
12. target=_blank rel 추가
13. 변경 요청 검토 운영진 화면 구현

**🟢 중장기 (1-3개월):**
14. 자동 로그아웃 / 세션 만료 정책
15. 침해 탐지 / 로그 모니터링 (Logflare, Datadog 등)
16. 정기 침투 테스트 (분기 1회)
17. 백업 / 복구 시나리오 점검
18. 의존성 정리 (사용 안 하는 Radix UI 등)

---

## 13.5 실제 코드 스캔 결과 요약

| 카테고리 | 스캔 결과 |
|---|---|
| 하드코딩 시크릿 (eyJ.../sk_live/AKIA/api_key=) | ✓ **0건** |
| eval / new Function / document.write | ✓ **0건** |
| innerHTML 직접 할당 | ✓ **0건** (chart.tsx 1곳은 recharts 내부 안전 사용) |
| SSRF 패턴 (사용자 입력 → fetch) | ✓ **0건** |
| Path traversal (`../`) 사용자 제어 | ✓ **0건** |
| SQL 문자열 concatenation | ✓ **0건** (모두 Supabase parameterized) |
| RLS enable 누락 테이블 | ✓ **모든 테이블에 enable** (직접 스캔 확인) |
| SECURITY DEFINER 함수 수 | 26개 — 의도된 elevated 함수 |
| target=\_blank rel 누락 | 🟡 3건 (ProfileSettings 2 + Contact 1) |
| 외부 도메인 hardcode | 🟢 2건 (instagram.com/kmubot, api.example.com placeholder) |
| `window.location` 직접 할당 | 🟢 모두 안전 (origin/내부 경로) |
| Open redirect | ✓ `getSafeInternalPath()`로 차단 |
| OAuth flow | ✓ PKCE 사용 (`flowType: "pkce"`) |
| localStorage 시크릿 | 🟡 invite code (TTL 추가 권장) |

---

## 14. 모니터링 / 사고 대응

**필수 알림 채널:**
- Supabase Dashboard → Logs → Errors 일일 검토
- Vercel Analytics → 비정상 트래픽
- GitHub Security Alerts → 의존성 CVE
- Cloudflare Analytics → 차단된 요청

**사고 시:**
1. anon key 즉시 회전 (Supabase API 설정)
2. 의심 사용자 계정 정지 (`account_status = 'suspended'`)
3. 영향받은 데이터 백업본 검증
4. 부원 / 학교 관계자 알림 (PIPA 신고 의무 검토)

---

> 본 문서는 정적 분석 기반이며, 실제 침투 테스트(BurpSuite, OWASP ZAP, sqlmap, Nikto, nmap, Hydra 등)는 운영 환경 권한 확보 후 별도 수행해야 합니다.
> 정기 검토: 분기 1회 + 주요 기능 추가 시.
>
> 작성일: 2026-05-04
