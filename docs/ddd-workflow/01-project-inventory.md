# 01. KOBOT Web 프로젝트 인벤토리

## 1. 파일 구조 요약

### 1.1. assets

- `src/assets/ae67a8a7439bdd0bf639ea5f01344febcca3901b.png`
- `src/assets/auth-callback/toy-robot-run.webp`
- `src/assets/e07bff62a8ea40b031ed3fa6a6dc4e06f1c39b5c.png`
- `src/assets/mainLogo.png`
- `src/assets/wordLogo.png`

### 1.2. auth

- `src/app/auth/AuthProvider.tsx`
- `src/app/auth/guards.tsx`
- `src/app/auth/onboarding.ts`
- `src/app/auth/supabase.ts`
- `src/app/auth/types.ts`
- `src/app/auth/useAuth.ts`

### 1.3. components

- `src/app/components/figma/ImageWithFallback.tsx`
- `src/app/components/ScrollToTop.tsx`
- `src/app/components/ui/accordion.tsx`
- `src/app/components/ui/alert-dialog.tsx`
- `src/app/components/ui/alert.tsx`
- `src/app/components/ui/aspect-ratio.tsx`
- `src/app/components/ui/avatar.tsx`
- `src/app/components/ui/badge.tsx`
- `src/app/components/ui/breadcrumb.tsx`
- `src/app/components/ui/button.tsx`
- `src/app/components/ui/calendar.tsx`
- `src/app/components/ui/card.tsx`
- `src/app/components/ui/carousel.tsx`
- `src/app/components/ui/chart.tsx`
- `src/app/components/ui/checkbox.tsx`
- `src/app/components/ui/collapsible.tsx`
- `src/app/components/ui/command.tsx`
- `src/app/components/ui/context-menu.tsx`
- `src/app/components/ui/dialog.tsx`
- `src/app/components/ui/drawer.tsx`
- `src/app/components/ui/dropdown-menu.tsx`
- `src/app/components/ui/form.tsx`
- `src/app/components/ui/hover-card.tsx`
- `src/app/components/ui/input-otp.tsx`
- `src/app/components/ui/input.tsx`
- `src/app/components/ui/label.tsx`
- `src/app/components/ui/menubar.tsx`
- `src/app/components/ui/navigation-menu.tsx`
- `src/app/components/ui/pagination.tsx`
- `src/app/components/ui/popover.tsx`
- `src/app/components/ui/progress.tsx`
- `src/app/components/ui/radio-group.tsx`
- `src/app/components/ui/resizable.tsx`
- `src/app/components/ui/scroll-area.tsx`
- `src/app/components/ui/select.tsx`
- `src/app/components/ui/separator.tsx`
- `src/app/components/ui/sheet.tsx`
- `src/app/components/ui/sidebar.tsx`
- `src/app/components/ui/skeleton.tsx`
- `src/app/components/ui/slider.tsx`
- `src/app/components/ui/sonner.tsx`
- `src/app/components/ui/switch.tsx`
- `src/app/components/ui/table.tsx`
- `src/app/components/ui/tabs.tsx`
- `src/app/components/ui/textarea.tsx`
- `src/app/components/ui/toggle-group.tsx`
- `src/app/components/ui/toggle.tsx`
- `src/app/components/ui/tooltip.tsx`
- `src/app/components/ui/use-mobile.ts`
- `src/app/components/ui/utils.ts`

### 1.4. config

- `index.html`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `tsconfig.json`
- `vercel.json`
- `vite.config.ts`

### 1.5. database

- `supabase/migrations/20260325150000_auth_rbac.sql`
- `supabase/migrations/20260428173000_member_workspace_core.sql`

### 1.6. docs

- `docs/analysis/01-overview-and-architecture.md`
- `docs/analysis/02-public-experience.md`
- `docs/analysis/03-member-workspace.md`
- `docs/analysis/04-design-system-and-ui.md`
- `docs/analysis/05-tooling-and-operations.md`
- `docs/analysis/06-risks-and-priorities.md`
- `docs/analysis/07-dashboard-development-plan.md`
- `docs/analysis/README.md`
- `docs/ddd/01-domain-map.md`
- `docs/ddd/02-event-storming-board.md`
- `docs/ddd/03-capability-and-permission-model.md`
- `docs/ddd/04-feature-specification.md`
- `docs/ddd/05-edge-cases-and-open-questions.md`
- `docs/ddd/README.md`
- `docs/product/implementation-priority.md`
- `docs/product/legal-and-compliance-checklist.md`
- `docs/product/member-workspace-policy.md`
- `docs/product/README.md`

### 1.7. layout

- `src/app/layouts/MemberLayout.tsx`
- `src/app/layouts/PublicLayout.tsx`

### 1.8. member-ui

- `src/app/pages/member/Admin.tsx`
- `src/app/pages/member/Announcements.tsx`
- `src/app/pages/member/ApprovalPending.tsx`
- `src/app/pages/member/Attendance.tsx`
- `src/app/pages/member/Changelog.tsx`
- `src/app/pages/member/ContactRequests.tsx`
- `src/app/pages/member/Dashboard.tsx`
- `src/app/pages/member/Equipment.tsx`
- `src/app/pages/member/Events.tsx`
- `src/app/pages/member/Forms.tsx`
- `src/app/pages/member/Integrations.tsx`
- `src/app/pages/member/Members.tsx`
- `src/app/pages/member/Notice.tsx`
- `src/app/pages/member/Notifications.tsx`
- `src/app/pages/member/OfficeHours.tsx`
- `src/app/pages/member/PeerReview.tsx`
- `src/app/pages/member/Permissions.tsx`
- `src/app/pages/member/ProfileSettings.tsx`
- `src/app/pages/member/Projects.tsx`
- `src/app/pages/member/QnA.tsx`
- `src/app/pages/member/Resources.tsx`
- `src/app/pages/member/Retro.tsx`
- `src/app/pages/member/Roadmap.tsx`
- `src/app/pages/member/Showcase.tsx`
- `src/app/pages/member/Study.tsx`
- `src/app/pages/member/StudyLog.tsx`
- `src/app/pages/member/StudyPlaylist.tsx`
- `src/app/pages/member/Templates.tsx`
- `src/app/pages/member/Votes.tsx`

### 1.9. other

- `.env.example`
- `.env.local`
- `.gitignore`
- `ATTRIBUTIONS.md`
- `guidelines/Guidelines.md`
- `README.md`
- `src/app/App.tsx`
- `src/app/pages/NotFound.tsx`
- `src/app/routes.tsx`
- `src/main.tsx`
- `src/styles/fonts.css`
- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/theme.css`
- `src/vite-env.d.ts`
- `supabase/README.md`

### 1.10. public-ui

- `src/app/pages/public/Activities.tsx`
- `src/app/pages/public/AuthCallback.tsx`
- `src/app/pages/public/Contact.tsx`
- `src/app/pages/public/FAQ.tsx`
- `src/app/pages/public/Landing.tsx`
- `src/app/pages/public/Login.tsx`
- `src/app/pages/public/Notice.tsx`
- `src/app/pages/public/Privacy.tsx`
- `src/app/pages/public/Projects.tsx`
- `src/app/pages/public/Recruit.tsx`
- `src/app/pages/public/Terms.tsx`

## 2. 조사 필요 항목

- [ ] 2.1. 각 파일의 실제 책임과 도메인 연결을 검증한다.
- [ ] 2.2. 라우트, 권한, DB 접근, 배포 설정을 연결해서 확인한다.

## 3. 현재 프로젝트 구조 해석

### 3.1 런타임

| 항목 | 값 |
| --- | --- |
| Frontend | Vite + React + React Router |
| Styling/UI | Tailwind, Radix UI, lucide-react, motion |
| Backend/Auth/Data | Supabase Auth + Postgres/RLS/RPC |
| Deployment | Vercel SPA rewrite |
| Public domain | `https://kobot.kookmin.ac.kr` |
| Local dev | `http://localhost:5173` |

### 3.2 앱 레이어

| 경로 | 책임 |
| --- | --- |
| `src/app/auth` | Supabase client, AuthProvider, guards, onboarding 분기, auth types |
| `src/app/pages/public` | 공개 랜딩, 프로젝트, 공지, 모집, 로그인, OAuth callback, 약관/개인정보 |
| `src/app/pages/member` | Member Workspace 화면: 대시보드, 공지, 프로젝트, 연락, 투표, 권한 등 |
| `src/app/layouts` | Public/Member layout, 사이드바, 헤더, 로그인 상태 표시 |
| `src/app/components/ui` | Radix 기반 UI primitive |
| `src/assets` | 로고, 이미지, auth callback 로봇 이미지 |
| `src/styles` | theme/tailwind/global style |

### 3.3 데이터 레이어

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20260325150000_auth_rbac.sql` | 기본 조직/회원/RBAC/Auth hook |
| `supabase/migrations/20260428173000_member_workspace_core.sql` | 워크스페이스 확장 테이블/RLS/RPC |
| `supabase/README.md` | Supabase 설정 설명 |

### 3.4 문서 레이어

| 경로 | 책임 |
| --- | --- |
| `docs/analysis` | 기존 구조/디자인/운영 분석 |
| `docs/product` | 제품 정책, 법적 체크리스트, 구현 우선순위 |
| `docs/ddd` | 도메인 설계 원본 패키지 |
| `docs/ddd-workflow` | 이번에 추가한 Kiro식 작업 장부 |

## 4. 현재 작업 트리 주의

### 4.1 이미 수정된 코드

현재 auth/join/pending/login/nav 관련 파일에 수정 사항이 있습니다. 이 변경은 사용자의 최근 요구사항인 “로그인 후 바로 pending이 아니라 가입 요청서 작성 → 승인 대기” 흐름과 연결되어 있습니다.

### 4.2 구현 전 같이 봐야 할 파일

- `src/app/auth/AuthProvider.tsx`
- `src/app/auth/guards.tsx`
- `src/app/auth/onboarding.ts`
- `src/app/pages/public/AuthCallback.tsx`
- `src/app/pages/public/Login.tsx`
- `src/app/pages/member/ProfileSettings.tsx`
- `src/app/pages/member/ApprovalPending.tsx`
- `src/app/layouts/MemberLayout.tsx`
- `supabase/migrations/20260325150000_auth_rbac.sql`
- `supabase/migrations/20260428173000_member_workspace_core.sql`
