# KOOBOT 종합 리뷰 — 2026-05-06

7개 전문 에이전트가 병렬로 수행한 다각도 코드베이스 리뷰의 통합 보고서.

| 영역 | 점수 | 한 줄 평 |
|---|---|---|
| 보안 (Security) | — | **신규 취약점 없음.** 기존 audit 문서들이 노출 표면을 잘 커버 중. |
| 아키텍처 | 6/10 | 표면은 깔끔, 내부에 누수 (`AuthProvider` 거대화, supabase 직접 import 산재). |
| 성능 | — | 번들/이미지/페이지네이션에 큰 빈틈. 대부분 1회성 수정으로 해결. |
| 코드 품질 | 6/10 | 타입 규율은 우수 (no `any`, no console), 파일 크기 비대. |
| UX/UI | 6/10 | 디자인 시스템은 풍부하나 채택 불균일. dark/form/date 스택 미사용. |
| 접근성 | 6.5/10 | `lang="ko"`, `<img alt>` 양호. 그러나 `<main>` 랜드마크 없음, 스킵 링크 없음. |
| 테스트 | 3/10 | 6개 파일 81 어설션, auth/RLS/admin 0% 커버. CI 없음. |

---

## 1. 보안 (Security)

**기존 audit 이후 새 취약점 발견 없음.** 코드베이스가 2026-05-04 이후 성숙도가 크게 올라옴.

이미 알려진 OPEN 항목 (재확인됨):
- F-01 `space_bookings` RLS가 모든 인증 사용자에게 열려있음
- F-02 `redeem_course_invite` `max_uses` 레이스 조건 (FOR UPDATE 락 없음)
- F-03 `resolve_login_email` RPC가 anon에게 노출

좋은 패턴 (유지):
- 모든 민감한 mutation이 `SECURITY DEFINER` RPC 경유
- 직접 테이블 쓰기는 RLS + `current_user_has_permission()` 게이트
- Tag 권한 escalation에 트리거 가드 (`prevent_sensitive_permissions_on_club_tags`)
- Kookmin 이메일 도메인 서버 사이드 강제 (`before_user_created_kobot` Auth Hook)
- PKCE OAuth + 내부 경로 redirect 검증
- React 자동 escape + `dangerouslySetInnerHTML`은 `chart.tsx`의 CSS-vars 1곳만

---

## 2. 아키텍처 (6/10)

### 핵심 문제
1. **`AuthProvider.tsx` 1141 LOC** — 세션 + 두 RPC + fallback 정책 + 에러 정규화 + 프로필 저장 + public-credit 정책 + React context를 한 파일이 다 소유.
2. **6개 `.js` 정책 파일이 TS 프로젝트에 잔존** — `announcement-policy.js`, `contact-request-policy.js`, `notification-policy.js`, `project-policy.js`, `clipboard.js`, `member-feature-flags.js`. 14개 TS 파일이 `.js` 확장자로 import. 마이그레이션 계획이 docs에 없음.
3. **API 레이어 누수** — 다음 파일들이 `getSupabaseBrowserClient`를 직접 import해서 layered 설계를 깸:
   - [MemberLayout.tsx:49](src/app/layouts/MemberLayout.tsx:49)
   - [AccountInfo.tsx:327](src/app/pages/member/AccountInfo.tsx:327)
   - [Welcome.tsx:39](src/app/pages/public/Welcome.tsx:39)
   - [Security.tsx:11](src/app/pages/public/Security.tsx:11)
   - [AuthCallback.tsx:273](src/app/pages/public/AuthCallback.tsx:273)
   - [useLandingData.ts:2](src/app/hooks/useLandingData.ts:2)
4. **문서 drift** — `docs/analysis/01` §6는 "no API client"라고 하지만 실제로는 5,400 LOC의 `src/app/api/*.ts`가 존재.
5. **권한 모델 이중화** — `MemberLayout.NAVIGATION_ROLE_RANK` (member/teamLead/vicePresident/president)이 tag 시스템과 평행하게 존재. `docs/product/README.md`는 tag가 single source of truth라고 명시.

---

## 3. 성능

### Top 5 핫스팟

1. **[member-directory.ts:416](src/app/api/member-directory.ts:416), [member-admin.ts:117](src/app/api/member-admin.ts:117)** — `listMembers`/`listMemberAdminEntries`가 `.limit()`/`.range()` 없이 모든 행을 fetch. 1000명 = 1000 profile + 1000 account + tag join. **수정**: 서버 사이드 페이지네이션.

2. **[notices.ts:120](src/app/api/notices.ts:120)** — `notice_comments`를 클라이언트에서 카운트. 1000 notices × 100 comments = 100k row pull. **수정**: `count: "exact", head: true` 또는 view/RPC.

3. **[AuthProvider.tsx:1141](src/app/auth/AuthProvider.tsx:1141)** — `<AuthContext.Provider value={value}>`의 `value`가 매 렌더 재생성. **모든 consumer가 매 auth tick마다 재렌더링**. **수정**: `useMemo` + 안정적인 `auth` / 휘발성 `notifications` 컨텍스트 분리.

4. **[routes.tsx:64-65](src/app/routes.tsx:64)** — `~30 페이지 중 단 2개`만 `lazy()` 사용 (`StudyPostWrite`, `StudyPostDetail`). BlockNote(~MB) 포함 모든 페이지가 초기 번들에 포함. **수정**: 모든 member/admin 페이지를 `React.lazy`로. 예상: 초기 JS 50-70% 감소.

5. **`public/og-image.png`, `public/favicon.png` 각 644KB (총 1.3MB)** — favicon은 <10KB, OG 이미지는 <200KB여야 정상. **수정**: 압축 → ~1.2MB 절감.

### 번들 — 미사용/과중 의심
| 패키지 | 검증 |
|---|---|
| `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` | **import 0개** — 제거 가능 |
| `react-slick` | **import 0개** — 제거 가능 |
| `react-dnd`, `react-dnd-html5-backend` | **import 0개** — 제거 가능 |
| `react-responsive-masonry`, `@popperjs/core`, `react-popper` | **import 0개** — 제거 가능 |
| `embla-carousel-react`, `react-resizable-panels`, `recharts` | shadcn UI 1곳에서만 — UI 미사용 시 함께 제거 |

### 기타
- `MemberLayout.tsx:534` realtime channel은 정상 unsubscribe (line 550).
- `Members.tsx`는 가상화 없음 — 페이지네이션 후 `react-window` 권장.

---

## 4. UX/UI (디자인 채택 6/10, 모바일 부분적)

### 발견 (대부분 "설치만 됨, 안 씀")
1. **`next-themes`는 dead code** — `<ThemeProvider>` 마운트 안 됨, 토글 UI 없음. `dark:` 클래스만 빌드에 포함.
2. **`react-hook-form`은 `components/ui/form.tsx` 외 미사용** — 실제 폼(Recruit, Contact, ProfileSettings, Admin) 모두 raw `useState`, 필드 단위 검증 없음.
3. **`date-fns`는 `package.json`에만 있고 import 0개** — 한국어 로케일 포매팅 누락.
4. **`vaul` Drawer는 설치되어 있으나 모바일 사이드바는 [MemberLayout.tsx:843+](src/app/layouts/MemberLayout.tsx:843)에 손수 구현**.
5. **사이드바 nav 항목 ~28개**, role-gated 섹션 다수. 어드민 페이지는 같은 `MemberLayout` 사용해서 시각적 구분 없음.
6. **`Skeleton` primitive는 `sidebar.tsx` 1곳만 사용** — 어떤 리스트 페이지도 fetch 중 skeleton 안 그림.
7. **빈 상태(`검색 결과가 없습니다`) 6+ 곳에 중복** — 공통 `EmptyState` 컴포넌트 없음.
8. **토큰 시스템 두 개 공존** — semantic (`--background`, `--sidebar-*`) + legacy (`--kb-*`, `--brand-*`).
9. **`PublicHeader`는 tagline 없음, login CTA 없음**, 디자인 시스템 우회 inline `style={{}}`.

---

## 5. 접근성 (6.5/10)

### HIGH (반드시 수정)
1. **`<main>` 랜드마크가 어떤 페이지에도 없음** — `MemberLayout`/`PublicLayout`이 `<div>` 래퍼. 스크린리더 사용자에게 본문 진입점 없음.
2. **커스텀 모달이 dialog semantics 부족** — [ProjectFormModal.tsx:139](src/app/components/member/ProjectFormModal.tsx:139)는 `role="dialog"` 있지만 `aria-modal`, `aria-labelledby`, focus trap, focus restore 없음. [Announcements.tsx:396](src/app/pages/member/Announcements.tsx:396)도 동일. **수정**: Radix `Dialog`로 교체.
3. **Skip-to-content 링크 없음** — 키보드 사용자가 매 페이지마다 사이드바 ~30개 링크를 탭으로 통과해야 함.

### MEDIUM
4. **Heading 계층 깨짐** — [AccountInfo.tsx](src/app/pages/member/AccountInfo.tsx)에 L114 `<h3>`가 L373 `<h1>`보다 먼저.
5. **MemberLayout 사이드바가 `<nav>` 래퍼 없이 raw `<div>`** — `<nav aria-label="주 메뉴">` 추가 필요.
6. **Announcements 모달의 overlay 클릭 close에 keyboard 짝(Escape) 없음**.

### PASS
- `<html lang="ko">` ([index.html](index.html)) ✓
- `ImageWithFallback` `alt` forwarding ✓
- `NotificationToast`의 `role="status"` + `aria-live="polite"` ✓
- 폼 라벨은 대체로 `<Label htmlFor>` 정상 ✓

---

## 6. 테스트 (3/10)

### 인벤토리
- 6개 파일 (`scripts/*.test.mjs`), ~364 LOC, ~81 어설션
- 모두 unit test (순수 JS policy/helper 모듈 대상)
- Component test, E2E test, integration test **0**

### 미커버 핵심 영역
1. Auth/OAuth flow (`src/app/auth/*`)
2. Invite codes (`src/app/api/invite-codes.ts`)
3. Admin 권한 검사 (`pages/member/Admin.tsx` + `member-admin.ts`)
4. Tag permission system (`src/app/api/tags.ts`)
5. RLS 민감 API들 (`projects.ts`, `notifications.ts`, `contact-requests.ts`, `space-bookings.ts`)

### 인프라
- **`package.json`에 `test` 스크립트 없음** — `node --test scripts/*.test.mjs` 수동 실행만 가능.
- **`.github/` 없음 → CI 없음** — 매 commit/PR마다 자동 실행 안 됨.
- 결과: 이 브랜치에서 테스트가 한 번이라도 돌았는지 의심스러운 상태.

### 빠른 추가
1. `scripts/redirects.test.mjs` — `redirects.ts` URL 안전성
2. `scripts/invite-codes.test.mjs` — 코드 형식/만료/단일 사용
3. `scripts/member-admin.test.mjs` — role-gate 매트릭스
4. `package.json`에 `"test": "node --test scripts/*.test.mjs"` 추가
5. `.github/workflows/test.yml` 추가

---

## 7. 코드 품질 / 기술 부채 (6/10)

### 강점
- `any` **0개**, `@ts-ignore` **0개**, `@ts-expect-error` **0개**, `as any` **0개**
- `console.log`/`console.error` 0개 (esbuild.drop으로 강제 — `HANDOFF.md` §0.5)
- `catch (e) {}` 0개 — `sanitizeUserError` 일관 사용
- `TagChip` 단일 진실 공급원

### 기술 부채 Top 5

| # | 항목 | 위치 | 비용 | 노력 |
|---|---|---|---|---|
| 1 | **14개의 1000+ LOC god 파일** | `DesignLab.tsx` 1965, `Landing.tsx` 1803, `SpaceBooking.tsx` 1761, `Members.tsx` 1221, `MemberAdmin.tsx` 1196, `Dashboard.tsx` 1174, `AuthProvider.tsx` 1142, `Quests.tsx` 1061, `ProjectDetail.tsx` 1045, `TagDetail.tsx` 1042, `ProfileSettings.tsx` 1038, `MemberLayout.tsx` 1020, `InviteCodes.tsx` 987, `Tags.tsx` 950 | 변경 시 느림, PR 리뷰 어려움, 머지 충돌 | **L** |
| 2 | **10개 미사용 무거운 deps** in `package.json` | `react-slick`, `react-dnd`, `react-dnd-html5-backend`, `react-responsive-masonry`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@popperjs/core`, `react-popper` | 번들/공급망 리스크 | **S** |
| 3 | **`DesignLab.tsx` (1965 LOC) `/design-lab` 공개 라우트** | 디자이너 스크래치패드 ("4 dashboard mockups") — 제품 가치 0 | 가장 큰 dead route, public 노출 | **S** (삭제) |
| 4 | **6개 `.js` 정책 파일** | `api/*-policy.js`, `clipboard.js`, `member-feature-flags.js` (14개 TS가 import) | API↔UI 경계의 타입 안전성 침식 | **S** |
| 5 | **`tsc --noEmit`/lint/test 스크립트 없음** | `package.json`에 `build`/`dev`만 | 품질 회귀가 조용히 머지됨 | **M** |

### TODO/`any` 카운트
- 실제 TODO **1개**: [NoticeDetail.tsx:46](src/app/pages/public/NoticeDetail.tsx:46) `// TODO: connect to DB`
- `any` 실제 카운트 **0** (grep 결과 모두 영어 단어 "any" false positive)
- `console` **0**, empty catch **0**

### 문서 부패 위험: HIGH
- `docs/analysis/` 11개, `docs/ddd-workflow/` 21개
- analysis 08–11과 ddd-workflow 13–18이 **모두 2026-05-05 작성** — 같은 날 5+ 개 "full audit / re-audit / system-spec / re-analysis"
- 신규 컨트리뷰터가 어느 게 canonical인지 모름
- 권장: `docs/README.md`가 진실 공급원 명시 + `docs/archive/`로 이전

---

## 우선순위 액션 플랜

### 🔥 이번 주 (Quick Wins, 누적 1-2시간)
1. **미사용 deps 10개 제거** (`pnpm remove ...`) — 번들/감사/공급망 리스크 즉시 감소.
2. **`DesignLab.tsx` 삭제 + `/design-lab` 라우트 제거** — 1965 LOC + 공개 노출 제거.
3. **`<main>` 랜드마크 + skip-to-content 링크 추가** — 접근성 HIGH 2건 해결.
4. **favicon (32x32 ICO ~5KB), OG 이미지 압축 (~150KB JPG/WebP)** — 1.2MB 대역폭 절감.
5. **`package.json`에 스크립트 추가**:
   ```json
   "test": "node --test scripts/*.test.mjs",
   "typecheck": "tsc --noEmit",
   "lint": "eslint src --ext ts,tsx"
   ```

### ⚡ 다음 1-2주 (High Impact, 4-8시간)
6. **모든 member/admin 라우트 `React.lazy`** — 초기 번들 50-70% 감소.
7. **`AuthContext` value `useMemo` + 컨텍스트 분리** — auth tick마다 전역 재렌더 차단.
8. **`listMembers` 페이지네이션** — `.range(from, to)` + 검색은 SQL로.
9. **Radix `Dialog`로 커스텀 모달 교체** — `ProjectFormModal`, `Announcements` 모달.
10. **3개 빠른 테스트 추가** (redirects, invite-codes, member-admin) + GitHub Actions CI.

### 🔨 이번 달 (Strategic, 일 단위)
11. **`AuthProvider.tsx` 분해** — 세션/RPC/정책/저장/컨텍스트로 분리.
12. **6개 `.js` 정책 파일 → `.ts` 마이그레이션**.
13. **공통 `EmptyState`, `LoadingSkeleton` 컴포넌트** + 리스트 페이지 일괄 적용.
14. **디자인 토큰 통합** — semantic vs `--kb-*` 둘 중 하나로.
15. **문서 정리** — `docs/archive/`로 구버전 이동, `docs/README.md`에 진실 공급원 명시.

### 🌱 백로그 (Tag-Sized)
- 모바일 사이드바를 `vaul` Drawer로 교체
- `next-themes` 살리거나 dark 토큰 제거
- `react-hook-form`을 실제 폼들에 적용
- `date-fns` Korean locale로 날짜 포매팅 통일
- `MemberLayout` god 파일 분해
- 권한 모델 이중화 정리 (tag만)
- 미해결 보안 OPEN 3건 (F-01/02/03) 처리
