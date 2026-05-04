# KOBOT 보안 패치 점검 보고서 (2026-05-04, 코드 대량 수정 후)

기존 `SECURITY_AUDIT_2026-05-04_CURRENT.md` 이후 변경된 부분만 점검.
신규/수정 파일: 22 modified + 15 untracked (api 7건, migrations 5건, pages 2건 포함).

## ✅ Pass — 안전 확인
| 항목 | 증거 |
|---|---|
| 의존성 CVE | `npm audit --omit=dev` → **0건 (총 365 패키지)** |
| 하드코드 시크릿 | `sbp_/sk_/AIza/service_role` 정규식 grep → src·supabase 전 영역 **0 hit** |
| `eval` / `new Function` | **0 hit** |
| `dangerouslySetInnerHTML` | 1 hit (`chart.tsx`, shadcn 라이브러리, CSS 변수만 주입) |
| Source map | `vite.config.ts: sourcemap:false` 유지 |
| 프로덕션 콘솔 제거 | `esbuild.drop: ['console','debugger']` 유지 |
| HTTP 보안 헤더 | HSTS preload + X-Frame-Options DENY + COOP/CORP + Permissions-Policy + CSP `frame-ancestors 'none'` |
| 신규 테이블 RLS | `member_favorite_profiles`, `org_position_assignments`, `notices`, `contact_requests` 모두 `enable row level security` + self/admin 정책 분리 |
| `SECURITY DEFINER` 사용 | `current_user_has_permission`, `current_user_can_read_member_directory`, `current_user_can_manage_announcements` — 권한 helper 용도, RLS 우회 아님 |
| `isPresidentView` ReferenceError | 해소됨. `showSectionHeaders` prop은 기본값 true로 NavigationLinks 내부에만 잔존 |

## ⚠️ 발견 사항

### F1. DB 에러 메시지 사용자 노출 (Medium · CWE-209 · CVSS 5.3)
- **카테고리**: A05 Misconfiguration / A09 Logging Failures
- **영향 파일**: `contact-requests.ts`, `dashboard.ts`, `member-directory.ts`, `notifications.ts`, `projects.ts`, `notices.ts`, `invite-codes.ts` 일부 약 **40개 호출지점**
- **영향**: 실패 응답이 `column profiles.x does not exist`, RLS 정책명, 함수 signature 등 스키마 정보를 그대로 토해냄. 공격자가 데이터 모델을 매핑.
- **수정**: 모든 `throw new Error(error.message)` → `throw new Error(sanitizeUserError(error))`. helper(`src/app/utils/sanitize-error.ts`)는 이미 존재하며 `invite-codes.ts`에서만 사용 중.

### F2. CSP `script-src 'unsafe-inline'` (Medium · CWE-1021)
- **파일**: `vercel.json`
- **영향**: 공지 본문에 마크다운 렌더러를 추가하면 stored XSS 시 CSP가 막지 못함.
- **수정**: Vite의 inline boot script를 hash 또는 nonce 기반으로 전환.
  ```
  script-src 'self' 'sha256-<vite-bootstrap-hash>';
  ```

### F3. 미커밋 마이그레이션 5건 (Process · Drift Risk)
- 신규 SQL: `20260504144000_active_member_base_permissions`, `20260505093000_member_directory_profile`, `20260505120000_member_directory_read_rls`, `20260505123000_course_invite_default_tags`, `20260505133000_assign_current_president_position`, `20260505143000_announcements_permissions_and_comments`, `20260505152000_contact_requests_rpc_and_rls`
- 로컬에는 있으나 Supabase 프로덕션 적용 여부 확인 필요. 미적용 시 RLS 정책 부재로 권한 외 조회 가능.

### F4. 본문 렌더링 (Low · 현 상태 안전)
- `Announcements.tsx`, `NoticeDetail.tsx`: 본문은 React `{body}` 텍스트 렌더 → 자동 escape. 마크다운/HTML 렌더러 도입 시 DOMPurify 필수.

## 우선순위 로드맵
| 우선 | 조치 |
|---|---|
| 즉시 | `sanitizeUserError` 7개 api/ 파일 일괄 적용 |
| 즉시 | 변경분 commit + 5개 마이그레이션 Supabase 적용 |
| 단기 | CSP `'unsafe-inline'` 제거 (hash/nonce) |
| 단기 | Supabase PAT `sbp_f6df…6e746f` 회수 |
| 중기 | `contact_requests`/`notices`/`invite-codes` admin 액션 audit log |
| 중기 | Cloudflare 프록시 + `/auth/*`, `redeem_course_invite` 엔드포인트 WAF/rate-limit |

## 재점검 시 미확인 영역
- DAST(ZAP/Burp) 미수행 — static/config audit만.
- `redeem_course_invite` race condition 동시성 부하 테스트 미수행 (RPC 5/min rate limit만 검증).
- Supabase Auth 대시보드 OAuth `redirect_uri` 화이트리스트 일치 여부 미검증.

## 직전 발생 버그 처리 결과
- `MemberLayout.tsx` `isPresidentView` ReferenceError → 이전 `replace_all` Edit가 정상 적용되어 모든 참조 제거됨. 현재 503행은 avatar div, NavigationLinks 호출은 `showSectionHeaders` 인자 없이 (기본값 true) 호출.
