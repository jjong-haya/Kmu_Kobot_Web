# KOBOT Web 보안 종합 점검 보고서

- 점검일: 2026-05-04
- 점검 대상: `C:\Users\jongh\Desktop\kook\2026-1\코봇\Web_final` 로컬 저장소
- 추정 환경: Vite + React SPA, Supabase Auth/Postgres/RLS, Vercel 정적 배포
- 수행 범위: 정적 코드 분석, Supabase SQL/RLS 정책 검토, 보안 헤더 설정 검토, 의존성 audit, 프로덕션 빌드 검증
- 미수행 범위: 외부 도메인 정찰, 서브도메인 열거, TLS/DNS/CAA/SPF/DKIM/DMARC, 실제 운영 Supabase 동적 호출, 파괴적/변조성 테스트
- 원칙: URL/도메인과 명시적 외부 점검 범위가 비어 있어 로컬/정적/비파괴 검증으로 제한했다.

## Executive Summary

현재 코드베이스는 기본적인 보안 의식이 꽤 잘 반영되어 있다. Vercel 보안 헤더가 구성되어 있고, 프로덕션 소스맵은 꺼져 있으며, OAuth 리다이렉트는 내부 경로로 제한된다. Supabase RLS도 대부분의 주요 테이블에 적용되어 있고, 오류 메시지 sanitizing, `target="_blank"`의 `rel`, 초대 코드 생성의 `crypto.getRandomValues()` 사용 같은 좋은 조치가 보인다.

다만 실제 보안 경계가 Supabase RLS/RPC에 있는 구조이므로, 클라이언트 라우트 가드보다 넓은 DB 정책은 바로 취약점이 된다. 이번 점검에서 가장 중요한 문제는 `space_bookings` RLS가 모든 로그인 사용자에게 조회/자기 예약 생성/수정/삭제를 허용한다는 점이다. 화면은 active member 중심으로 막지만, Supabase REST/RPC를 직접 호출하면 pending/rejected/suspended 계정도 접근할 수 있는 구조다.

두 번째 핵심 문제는 초대 코드 사용 횟수 처리의 동시성이다. `max_uses`를 검사한 뒤 `uses = uses + 1`로 갱신하지만 행 잠금이나 원자적 update 조건이 없어, 동시 요청에서 제한 횟수를 초과할 수 있다. 또한 `resolve_login_email` RPC가 `anon`에게 열려 있어 로그인 ID로 이메일을 확인할 수 있고, 로그인/계정 타겟팅에 악용될 수 있다.

운영 번들 의존성 audit은 0건이지만, 전체 audit에서는 Vite dev server 취약점이 1건 확인되었다. dev server가 외부에 노출되지 않으면 운영 영향은 낮지만, Windows 환경에서 개발 서버 파일 읽기 계열 취약점이 포함되어 있어 업데이트가 필요하다.

## 점검 요약

| 영역 | 결과 |
| --- | --- |
| 프로덕션 빌드 | Pass: `npm run build` 성공 |
| 운영 의존성 취약점 | Pass: `npm audit --omit=dev` 0건 |
| 전체 의존성 취약점 | Fail: Vite dev dependency 1건 |
| 보안 헤더 설정 | Partial: 주요 헤더 있음, CSP `script-src 'unsafe-inline'` 약점 |
| 소스맵 노출 | Pass: `dist` 내 `.map` 파일 없음 |
| `.env` 노출 | Pass in build: `dist`에 `.env` 없음. `.env.local`은 로컬에 존재하나 `.gitignore` 대상 |
| 인증/OAuth | Partial: PKCE/내부 redirect 검증 있음, Supabase token localStorage 지속 저장 구조 |
| RLS/권한 | Fail: `space_bookings` 정책이 화면 가드보다 넓음 |
| 비즈니스 로직 | Fail: 초대 코드 `max_uses` 동시성 보호 부족 |

## 발견 사항 목록

### F-01. 공간 예약 RLS가 모든 인증 사용자에게 열려 있음

- 위험도: High, CVSS 3.1 8.1
- 카테고리: OWASP A01 Broken Access Control, API 보안, 비즈니스 로직
- 상태: 확정, 코드/마이그레이션 근거 있음

영향:
승인되지 않은 로그인 사용자, 예를 들어 pending/rejected/suspended 상태 계정도 Supabase REST API를 직접 호출하면 공간 예약 목록을 조회하고 자기 `organizer_id`로 예약을 생성/수정/삭제할 수 있다. 클라이언트 라우트는 보안 경계가 아니므로 DB RLS에서 동일한 조건을 강제해야 한다.

근거:
- `src/app/routes.tsx:181`에서 `/member/space-booking`은 `memberElement(SpaceBooking)`으로 보호된다.
- `src/app/auth/guards.tsx:70-75`는 기본적으로 `memberStatus === "active"`만 허용한다.
- 그러나 `supabase/migrations/20260503100000_space_bookings.sql:52-63`은 select/insert를 `auth.uid()` 존재 여부 또는 `organizer_id` 일치만으로 허용한다.
- `supabase/migrations/20260503100000_space_bookings.sql:68-79`는 update/delete도 `organizer_id` 일치만 확인한다.

재현 절차, 스테이징에서만 실행:

```bash
curl "$SUPABASE_URL/rest/v1/space_bookings?select=id,title,booking_date,organizer_name" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PENDING_USER_ACCESS_TOKEN"

curl -X POST "$SUPABASE_URL/rest/v1/space_bookings" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $PENDING_USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title":"unauthorized booking probe",
    "booking_date":"2026-05-10",
    "start_time":"19:00:00",
    "end_time":"20:00:00",
    "organizer_id":"<pending-user-uuid>",
    "organizer_name":"pending user",
    "type":"study",
    "scope":"desk",
    "attendees":1
  }'
```

수정 권고:

```sql
create or replace function public.current_user_can_use_space_booking()
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
      and ma.status = 'active'
  );
$$;

drop policy if exists "members can read all bookings" on public.space_bookings;
create policy "active members can read all bookings"
on public.space_bookings
for select
using (public.current_user_can_use_space_booking());

drop policy if exists "members can insert own booking" on public.space_bookings;
create policy "active members can insert own booking"
on public.space_bookings
for insert
with check (
  organizer_id = auth.uid()
  and public.current_user_can_use_space_booking()
);
```

참고 자료: CWE-284, CWE-862, OWASP A01.

### F-02. 초대 코드 `max_uses`가 동시 요청에서 초과될 수 있음

- 위험도: High, CVSS 3.1 7.1
- 카테고리: OWASP A04 Insecure Design, 비즈니스 로직, Race Condition
- 상태: 확정, 코드 근거 있음

영향:
`max_uses = 1`인 코드라도 두 명 이상의 사용자가 거의 동시에 `redeem_course_invite`를 호출하면 각 트랜잭션이 같은 `uses` 값을 보고 모두 통과할 수 있다. 그 결과 초대 코드 사용 제한이 초과되고 의도보다 많은 계정에 `course_member` 상태가 부여될 수 있다.

근거:
- `supabase/migrations/20260504040000_course_invite_codes.sql:151-154`에서 코드를 조회하지만 `for update`가 없다.
- `supabase/migrations/20260504040000_course_invite_codes.sql:171-174`에서 `uses >= max_uses`를 검사한다.
- `supabase/migrations/20260504040000_course_invite_codes.sql:194-199`에서 redemption insert 후 `uses = uses + 1`로 갱신한다.

재현 절차, 스테이징에서만 실행:

```bash
# 전제: max_uses=1인 VALID_CODE, 서로 다른 사용자 access token 2개
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/redeem_course_invite" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invite_code":"VALID_CODE"}' &

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/redeem_course_invite" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invite_code":"VALID_CODE"}' &
wait
```

수정 권고:

```sql
select * into v_code
from public.course_invite_codes
where code = invite_code
for update;

-- 또는 더 강한 원자적 갱신
update public.course_invite_codes
set uses = uses + 1, updated_at = now()
where id = v_code.id
  and is_active = true
  and (expires_at is null or expires_at >= now())
  and (max_uses is null or uses < max_uses)
returning * into v_code;

if not found then
  return query select false, null::text, '사용 가능한 초대 코드가 아닙니다.'::text;
  return;
end if;
```

참고 자료: CWE-362, CWE-667, OWASP A04.

### F-03. 익명 RPC로 `login_id`에서 이메일 주소를 확인할 수 있음

- 위험도: Medium, CVSS 3.1 5.3
- 카테고리: OWASP A07 Identification & Authentication Failures, API 보안
- 상태: 확정, 코드 근거 있음

영향:
공격자는 `resolve_login_email`을 반복 호출해 유효한 로그인 ID와 연결된 이메일을 확인할 수 있다. 화면에서는 “아이디 또는 비밀번호가 올바르지 않습니다”로 숨기지만, RPC 자체는 이메일을 반환한다. 이는 계정 열거, 피싱, 비밀번호 추측 대상 선정에 쓰일 수 있다.

근거:
- `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql:73-89`가 `login_id_input`으로 이메일을 반환한다.
- `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql:228`에서 `anon, authenticated`에게 실행 권한을 부여한다.
- `src/app/auth/AuthProvider.tsx:711-728`에서 이 이메일로 `signInWithPassword`를 수행한다.

재현 절차:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/resolve_login_email" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"login_id_input":"knownid"}'
```

수정 권고:
- 단기: RPC 내부에 시도 로그와 IP/사용자 기반 rate limit을 추가한다. Supabase RPC에서는 IP 확보가 제한적이므로 Edge Function 또는 WAF rate limit을 권장한다.
- 중기: 로그인 ID 인증을 서버/Edge Function으로 옮기고 클라이언트에는 이메일을 반환하지 않는다.
- 장기: Supabase Auth의 email/password 모델에 직접 의존하지 않는 별도 식별자 설계를 검토한다.

참고 자료: CWE-203, CWE-204, OWASP A07.

### F-04. CSP가 `script-src 'unsafe-inline'`을 허용하고 세션 토큰은 브라우저 저장소에 지속 저장됨

- 위험도: Medium, CVSS 3.1 5.4
- 카테고리: 클라이언트 사이드, 인증/세션, OWASP A03/A05
- 상태: 확정, 설정 근거 있음

영향:
현재 구조는 Supabase 클라이언트가 세션을 브라우저 저장소에 지속 저장한다. 브라우저 기반 SPA에서는 흔한 구조지만, XSS가 발생하면 토큰 탈취 영향이 커진다. 그런데 CSP도 `script-src 'unsafe-inline'`을 허용하고 있어 XSS 방어층이 약해진다.

근거:
- `src/app/auth/supabase.ts:31-35`에서 `persistSession: true`가 설정되어 있다.
- `vercel.json:45-46`의 CSP에 `script-src 'self' 'unsafe-inline'`이 포함되어 있다.

수정 권고:
- 프로덕션 빌드에 inline script가 없다면 `script-src 'unsafe-inline'`을 제거한다.
- React inline style과 `<style>` 동적 삽입 때문에 `style-src 'unsafe-inline'`은 당장 제거가 어려울 수 있으니, 우선 script부터 줄인다.
- XSS 민감 영역에는 Trusted Types 도입을 검토한다.
- 장기적으로 BFF/서버 세션 구조를 쓰면 refresh token을 HttpOnly 쿠키로 옮길 수 있다.

참고 자료: CWE-79, CWE-693, OWASP A03, OWASP A05.

### F-05. Vite dev server 취약 버전 사용

- 위험도: Medium, CVSS 3.1 6.5
- 카테고리: OWASP A06 Vulnerable and Outdated Components
- 상태: 확정, `npm audit` 근거 있음

영향:
운영 번들에는 영향이 없지만, 개발 서버가 같은 네트워크나 외부에 노출되면 파일 읽기/경로 우회 계열 취약점이 문제가 될 수 있다. 특히 이 저장소는 Windows 경로에서 개발 중이라 `server.fs.deny` 우회 이슈와 조건이 맞을 수 있다.

근거:
- `package.json:71`에서 `vite: 6.3.5`를 사용한다.
- `npm audit --json` 결과 `vite <= 6.4.1` 범위의 advisories가 5건 묶여 있고, fix는 `vite@6.4.2`로 제시되었다.
- `npm audit --omit=dev --json` 결과 운영 의존성 취약점은 0건이다.

수정 권고:

```bash
npm install -D vite@6.4.2
npm run build
npm audit
```

참고 자료: GHSA-g4jq-h2w9-997c, GHSA-jqfw-vq24-v9c3, GHSA-93m4-6634-74q7, GHSA-4w7w-66w2-5vf9, GHSA-p9ff-h696-f583.

### F-06. 버전 관리 마이그레이션과 통합 SQL의 상태 모델이 불일치함

- 위험도: Medium, CVSS 3.1 5.5
- 카테고리: OWASP A04 Insecure Design, Software/Data Integrity
- 상태: 확정, 파일 간 근거 있음

영향:
`course_member` 상태를 코드에서 사용하지만, 버전 관리된 마이그레이션 파일에는 `member_accounts.status` check constraint에 `course_member`가 없다. 별도의 `COMBINED_MIGRATIONS.sql`에는 constraint 확장이 들어 있으나, 일반적인 `supabase db push`/마이그레이션 순서만 믿으면 초대 코드 redemption이 실패할 수 있다. 권한 상태 모델이 파일별로 달라지면 운영 DB와 저장소 사이의 진실원이 갈라진다.

근거:
- `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql:22-34`에는 `course_member`가 없다.
- `supabase/migrations/20260504040000_course_invite_codes.sql:181-204`는 `member_accounts.status = 'course_member'`로 업데이트한다.
- `supabase/COMBINED_MIGRATIONS.sql:5-12`에는 `course_member` constraint 추가가 들어 있으나, 이는 버전 관리 마이그레이션 흐름과 별개 파일이다.

재현 절차:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.member_accounts'::regclass
  and conname = 'member_accounts_status_check';
```

수정 권고:
- `supabase/migrations/20260504xxxx_add_course_member_status.sql` 같은 정식 migration을 추가한다.
- `COMBINED_MIGRATIONS.sql`의 임시/수동 적용 내용은 정식 migrations와 동기화한다.
- CI에서 migration drift 검증을 추가한다.

참고 자료: CWE-345, CWE-440, OWASP A08.

### F-07. 아바타 URL 허용 정책이 `data:image/svg+xml`/`blob:`까지 넓음

- 위험도: Low, CVSS 3.1 3.1
- 카테고리: 클라이언트 사이드, 공급망/프라이버시
- 상태: 확정, 코드 근거 있음

영향:
`<img>`의 SVG 스크립트 실행은 현대 브라우저에서 대체로 제한되지만, SVG/data/blob 이미지는 추적, 대용량 payload, 예외적 렌더링 경로의 위험을 넓힌다. 사용자 프로필 이미지가 외부 공급자에서 들어오는 구조라면 이미지 URL 허용 범위를 HTTPS 기반 이미지/CDN으로 좁히는 것이 좋다.

근거:
- `src/app/utils/safe-image-url.ts:27-37`에서 `blob:`과 `data:image/svg+xml`을 허용한다.
- `src/app/pages/public/Landing.tsx:86-93`에도 별도 allowlist가 있으며 `data:image/`, `blob:`을 허용한다.

수정 권고:
- 아바타는 `https://`, root-relative, 신뢰한 Supabase Storage/CDN 도메인만 허용한다.
- `data:`와 `blob:`은 기본 차단하고, 필요한 경우 업로드 시 서버 측 이미지 변환으로 정규화한다.

참고 자료: CWE-20, CWE-79.

## 안전하게 구성된 영역

- 보안 헤더: `vercel.json:12-46`에 HSTS, `nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy, COOP/CORP가 구성되어 있다.
- 소스맵: `vite.config.ts:23-25`에서 `sourcemap: false`, `dist`에 `.map` 파일 없음.
- 프로덕션 빌드: `npm run build` 성공.
- 운영 의존성: `npm audit --omit=dev` 결과 취약점 0건.
- 리다이렉트: `src/app/auth/redirects.ts:3-21`에서 내부 경로, `//`, `/\`, CRLF를 차단한다.
- OAuth: `src/app/auth/supabase.ts:31-35`에서 PKCE flow를 사용한다.
- 초대 코드 생성: `src/app/api/invite-codes.ts:77-90`에서 `crypto.getRandomValues()`를 우선 사용한다.
- 외부 링크: 검색 결과 `target="_blank"` 위치는 `rel="noopener noreferrer"`가 적용되어 있다.
- 오류 노출: `src/app/utils/sanitize-error.ts:13-56`에 Supabase/Postgres 내부 오류 노출 방지 로직이 있다.
- 노출 파일: `dist` 내 `.env`, `.git`, `.map`, `.well-known` 노출은 확인되지 않았다.

## OWASP Top 10 매핑

| OWASP 항목 | 결과 |
| --- | --- |
| A01 Broken Access Control | Fail: `space_bookings` RLS 과허용 |
| A02 Cryptographic Failures | 확인 범위 내 직접 증거 없음. TLS는 외부 URL 미제공으로 미확인 |
| A03 Injection | 직접 SQLi 증거 없음. CSP 약화로 XSS 방어층은 Partial |
| A04 Insecure Design | Fail: 초대 코드 race condition, 상태 모델 drift |
| A05 Security Misconfiguration | Partial: CSP `unsafe-inline`, dev server 취약 버전 |
| A06 Vulnerable Components | Fail in dev: Vite audit finding. Pass in prod dependencies |
| A07 Identification/Auth Failures | Fail: `resolve_login_email` 익명 계정 열거 가능성 |
| A08 Software/Data Integrity | Partial: 수동 통합 SQL과 migrations 불일치 |
| A09 Logging/Monitoring Failures | 미확인: 운영 로그/알림/WAF/Supabase audit 설정 접근 필요 |
| A10 SSRF | 해당 없음: 서버 측 fetch/프록시 엔드포인트 없음 |

## 우선순위 기반 조치 로드맵

즉시:
- `space_bookings` RLS를 active/course_member 등 실제 허용 상태로 좁힌다.
- `redeem_course_invite`에 행 잠금 또는 원자적 update를 적용한다.
- `course_member` 상태 constraint를 정식 migration으로 추가한다.

단기:
- `resolve_login_email`에 rate limit/감사 로그를 추가하고 이메일 반환 구조를 제거할 수 있는지 설계한다.
- Vite를 `6.4.2` 이상으로 올리고 `npm audit`를 다시 실행한다.
- CSP에서 `script-src 'unsafe-inline'` 제거 가능성을 테스트한다.

중장기:
- Supabase REST 직접 테이블 변경을 줄이고 상태 변경은 RPC/Edge Function command로 모은다.
- WAF/Cloudflare/Vercel/Supabase 레벨 rate limit 정책을 명시한다.
- 운영 도메인 기준 TLS/DNS/CORS/헤더 실측 점검을 정기화한다.
- 브라우저 저장 refresh token의 위험을 줄이기 위해 BFF 또는 서버 세션 패턴을 검토한다.

## 재사용 체크리스트

| 항목 | 결과 | 근거/메모 |
| --- | --- | --- |
| 모든 민감 테이블 RLS enabled | Pass | 주요 Supabase migrations에서 확인 |
| RLS가 클라이언트 라우트와 같은 권한 모델 사용 | Fail | `space_bookings` |
| 상태 변경이 원자적으로 처리됨 | Fail | invite code `uses` race |
| 로그인/계정 식별 API가 열거 저항성을 가짐 | Fail | `resolve_login_email` |
| 프로덕션 소스맵 비공개 | Pass | `vite.config.ts`, `dist` |
| 운영 의존성 audit clean | Pass | `npm audit --omit=dev` |
| 개발 의존성 audit clean | Fail | Vite |
| CSP에 `unsafe-eval` 없음 | Pass | `vercel.json` |
| CSP에 `unsafe-inline` 없음 | Fail | script/style 모두 포함 |
| 외부 링크 `noopener` 적용 | Pass | 검색 결과 |
| Open Redirect 방어 | Pass | `getSafeInternalPath` |
| `.env`가 dist에 포함되지 않음 | Pass | `dist` 검색 |
| TLS/DNS/CAA/SPF/DKIM/DMARC | 미확인 | 외부 도메인 필요 |
| CORS 런타임 정책 | 미확인 | Supabase/Vercel 실측 필요 |
| 운영 로그/알림 | 미확인 | Supabase/Vercel/WAF 접근 필요 |

## 재점검 시 주의 사항

- 운영 도메인 URL을 확정한 뒤 실제 응답 헤더, TLS Labs, DNS 레코드, CORS preflight를 실측해야 한다.
- Supabase 프로젝트에서 현재 적용된 DB schema가 저장소 migrations와 동일한지 확인해야 한다.
- pending/rejected/suspended/course_member 등 상태별 테스트 계정으로 RLS를 직접 검증해야 한다.
- 초대 코드 race condition은 스테이징에서 `max_uses=1` 코드와 병렬 요청으로 재현해야 하며, 운영 데이터로 테스트하면 안 된다.
- `.env.local`의 Supabase anon key는 공개 클라이언트 키 성격이지만, RLS가 무너지면 즉시 악용 경로가 되므로 RLS 검증이 핵심이다.
