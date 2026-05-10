# Design Renewal — Remaining Backlog

마지막 갱신: 2026-05-10

본 backlog 는 첫 리뉴얼 세션(Phase 0~1 + W1 부분 + W6) 이후 남은 작업의 단일 출처다. 다음 세션은 여기서 우선순위를 골라 PR 단위로 진행한다.

## 첫 세션에서 완료된 것

- Phase 0 — `git merge origin/main`, `npm install`, typecheck/test 통과
- Phase 1 — design token 확장 (motion, z-index, 다크 토큰, breakpoint, status, radius, shadow, semantic alias) + 8 primitive 신설 (`EmptyState`, `PageHeader`, `FilterBar`, `ListGrid`, `ViewToggle`, `ListSkeleton`, `StatusPill`, `ErrorBoundary`)
- Phase 2 W1 — `Events.tsx`, `EventDetail.tsx`, `Forms.tsx` 풀 리디자인 (events-policy 17/17 + forms-policy 20/20 통과)
- Phase 2 W6 — `ComingSoonPage.tsx` placeholder 재설계
- Phase 6 — `docs/design/system/tokens.md`, `docs/design/system/components.md`, `docs/design/CONVENTIONS.md`, `docs/design/audit/README.md` 작성

## 남은 작업 (우선순위 순)

### W1 잔여 (다음 세션 1순위)

- [ ] `EventCreate.tsx` (1113L) — 3-pass 진행
  1. token pass
  2. primitive adoption (PageHeader, EmptyState 인라인 제거)
  3. left preview / right workbench 레이아웃 정보 위계 정밀화. 단, `events-policy.test` 의 `event-create-studio` / `event-create-workbench` / `lg:grid-cols-[360px_minmax(0,1fr)]` 등 정규식은 보존
- [ ] `FormCreate.tsx` (1964L) — 3-pass 진행. forms-policy 정규식 ~50개 보존 필요
- [ ] `FormDetail.tsx` (844L) — 동일 3-pass

### W2 — 일상 트래픽 페이지

- [ ] `Dashboard.tsx`
- [ ] `Members.tsx` (1438L, 좋은 패턴 — token 정합 + EmptyState 도입 위주)
- [ ] `Tags.tsx` (1321L, 좋은 패턴 — token 정합 + StatusPill 적용)
- [ ] `Profile.tsx` / `ProfileSettings.tsx` / `AccountInfo.tsx`
- [ ] `Notice.tsx` (member)
- [ ] `Announcements.tsx`, `AnnouncementDetail.tsx`

### W3 — 관리/설정

- [ ] `Admin.tsx`
- [ ] `MemberAdmin.tsx`
- [ ] `Permissions.tsx`
- [ ] `InviteCodes.tsx`
- [ ] `Security.tsx`
- [ ] `Integrations.tsx`
- [ ] `ContactRequests.tsx`

### W4 — 저빈도/온보딩

- [ ] `SpaceBooking.tsx` (next-day 제약 UX 명시 필요)
- [ ] `Quests.tsx` (1075L, 좋은 패턴)
- [ ] `Templates.tsx`
- [ ] `Attendance.tsx`
- [ ] `ProjectStudyPanel.tsx`, `ProjectDetail.tsx`
- [ ] `StudyPostWrite.tsx`
- [ ] `Welcome.tsx`
- [ ] `ApprovalPending.tsx`
- [ ] `TagIconGallery.tsx`

### W5 — 퍼블릭

- [ ] `Landing.tsx`
- [ ] `Login.tsx`
- [ ] `Recruit.tsx`
- [ ] `Privacy.tsx`, `Terms.tsx`
- [ ] `Contact.tsx`
- [ ] public `Notice.tsx`, `NoticeDetail.tsx`
- [ ] `SpaceBookingPublic.tsx`

### Phase 3 — 모달/오버레이/토스트 통일

- [ ] 페이지에 흩어진 `<AlertDialog>` 인라인 → 모두 `ConfirmActionDialog` 로 마이그레이션 (현재 Forms.tsx 만 적용됨)
- [ ] sonner toast 글로벌 래퍼 신설 — `toast.success/error/info/warning` 4종으로 위치/duration/아이콘 통일
- [ ] 모달 3분류(컨펌·입력·드로어) 사용 기준 docs/design/system/overlays.md 작성
- [ ] 키보드 ESC, 외부 클릭, 포커스 트랩 회귀 시각 테스트

### Phase 4 — 도메인 흐름 점검

- [ ] 운영자 view ↔ 부원 view 사이드바 일관성 (`MemberShell.tsx`, `nav-catalog.ts`)
- [ ] `RequirePermission` / `RequireActiveMember` 권한 거부 fallback 화면 EmptyState 화
- [ ] 가입 온보딩: Login → Recruit → ApprovalPending → Welcome → Dashboard 동선 점검
- [ ] 행사 흐름: 목록 → 상세 → 신청 폼 → 완료 토스트 e2e 수동 검증
- [ ] 폼 흐름: 만들기 → 응답 보기 → 마감 → 보관
- [ ] 공간예약 흐름: next-day 제약 UX 명시

### Phase 5 — 다크모드 (사용자 confirm 필요)

- [ ] 토글 위치 결정 (Profile / Header / 시스템 prefers-color-scheme)
- [ ] 모든 페이지 라이트/다크 시각 확인
- [ ] WCAG AA 대비 검증
- [ ] dark variant 만 잘못 깨지는 케이스 (예: 그림자, 보더 색) 회귀 테스트

### 인프라 / 회귀 방지

- [ ] CI grep — `bg-\[#`, `text-\[#`, `border-\[#` 패턴이 page 파일에 남아 있으면 fail
- [ ] Storybook 또는 단순 `/design-system` 라우트로 primitive 카탈로그 시각 확인
- [ ] Lighthouse a11y > 90 회귀 테스트

## 결정 미확정 (실행 전 사용자에게 확인)

- (a) 다크모드 별도 PR vs Phase 1 통합
- (b) 모바일 분기점 Tailwind 기본 그대로 vs 커스텀
- (c) PR 단위 — Wave 한 묶음 PR 1개 vs 페이지마다 PR

기본값은 plan에 적힌 대로: 다크모드 = Phase 5 별도, breakpoint = Tailwind 기본 sm/md/lg, PR = Wave 단위.
