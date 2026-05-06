# 11. 전체 교차검증 부록 - 라우트, DB/RPC/RLS, 문서, 성능

작성일: 2026-05-05  
상위 문서: `docs/analysis/10-project-wide-system-spec-2026-05-05.md`  
목적: 2차 서브에이전트 교차검증 결과를 작업자가 바로 대조할 수 있는 표로 남긴다. 이 문서는 코드 수정 지시서가 아니라, 앞으로 수정할 때 무엇을 같이 봐야 하는지 알려주는 상세 참조다.

## 1. 라우트 / guard / sidebar / API / DB 상세표

공통 전제:

- 모든 `/member/*` 라우트는 상위에서 `RequireSession`을 통과한다.
- 실제 접근 차단은 `src/app/routes.tsx`의 guard가 결정한다.
- 사이드바 노출은 `src/app/layouts/MemberLayout.tsx`의 `NAVIGATION`, `AuthProvider`의 `permissions`, `tagNavPaths`가 결정한다.
- `src/app/config/nav-catalog.ts`는 태그가 선택할 수 있는 nav 후보 목록이다. 주석상 `MemberLayout.NAVIGATION`과 mirror여야 하지만 현재는 완전히 일치하지 않는다.
- `AuthProvider`는 공통으로 `get_my_authorization_context`, `current_user_tag_permissions`, `current_user_tag_nav_paths` RPC에 의존한다. fallback 경로에서는 `profiles`, `member_accounts`를 직접 조회한다.

### 1.1 Public routes

| path | component | guard | page/API | DB/RPC |
|---|---|---|---|---|
| `/` | `Landing` | 없음 | `useLandingData`, 선택적 `signOut` | `notices`, `space_bookings`, `member_accounts`, `project_teams`, auth signOut |
| `/projects` | `PublicProjects` | 없음 | 정적 공개 페이지 | 없음 |
| `/notice` | `PublicNotice` | 없음 | 정적 `NOTICES` | 없음 |
| `/notice/:slug` | `NoticeDetail` | 없음 | `useAuth` 일부, 로컬 댓글 상태 | 없음 |
| `/recruit` | `Recruit` | 없음 | 로컬 form/toast | 없음 |
| `/contact` | `Contact` | 없음 | 로컬 form/toast | 없음 |
| `/activities` | `Activities` | 없음 | 정적 | 없음 |
| `/faq` | `FAQ` | 없음 | 정적 | 없음 |
| `/privacy` | `Privacy` | 없음 | 정적 | 없음 |
| `/terms` | `Terms` | 없음 | 정적 | 없음 |
| `/login` | `Login` | 없음 | `signInWithGoogle`, `signInWithLoginId` | Supabase auth, `resolve_login_email`, 이후 auth context RPC |
| `/invite/course` | `InviteCourse` | 세션 있으면 redirect | invite code localStorage, Google login | auth OAuth |
| `/invite/course/:code` | `InviteCourse` | 세션 있으면 redirect | invite code localStorage, Google login | auth OAuth |
| `/auth/callback` | `AuthCallback` | 없음 | PKCE callback, invite redeem, `refreshAuthData` | auth `exchangeCodeForSession/getUser/signOut`, `redeem_course_invite`, `get_my_authorization_context` |
| `/design-lab` | `DesignLab` | 없음 | 정적/목업 디자인 실험 | 없음 |
| `*` | `NotFound` | 없음 | 정적 | 없음 |

### 1.2 Member routes

| path | component | guard | sidebar/catalog | page/API | DB/RPC |
|---|---|---|---|---|---|
| `/member` | `Dashboard` | active 또는 course + `dashboard.read`, course bypass | sidebar 있음, catalog 있음 | `loadDashboardData` | `notifications`, `notices`, `project_teams`, `project_team_memberships`, `space_bookings`, `contact_requests` |
| `/member/join` | `ProfileSettings` | session only | sidebar 없음 | `checkLoginIdAvailability`, `saveProfileSettings` | `profiles`, auth `updateUser`, `is_login_id_available`, `mark_current_user_has_login_password`, `submit_current_membership_application`, `apply_course_invite_after_application` |
| `/member/welcome` | `Welcome` | session only | sidebar 없음 | `redeem_course_invite`, `refreshAuthData` | `redeem_course_invite`, `get_my_authorization_context` |
| `/member/pending` | `ApprovalPending` | session only | sidebar 없음 | `refreshAuthData`, `signOut` | auth signOut, auth context RPC |
| `/member/profile` | `Profile` | active 또는 course | 계정 드롭다운/탭, catalog 없음 | `saveProfileSettings` | `profiles`, profile RPC 가능 |
| `/member/security` | `Security` | active 또는 course | 계정 드롭다운/탭, catalog 없음 | Supabase auth 직접 호출 | auth `signInWithPassword`, `updateUser` |
| `/member/account-info` | `AccountInfo` | active 또는 course | 계정 드롭다운/탭, catalog 없음 | 직접 insert | `profile_change_requests` |
| `/member/notifications` | `Notifications` | active 또는 course + `notifications.read`, course bypass | sidebar/catalog 있음, tag nav로 숨김 가능 | 알림 목록/읽음/삭제 | `notifications`, `profiles` |
| `/member/contact-requests` | `ContactRequests` | active 또는 course, 별도 permission 없음 | sidebar/catalog 있음, tag nav로 숨김 가능 | 연락 요청 CRUD/RPC | `contact_requests`, `profiles`, `member_accounts`, `create_contact_request`, `decide_contact_request`, `report_contact_request_spam` |
| `/member/announcements` | `Announcements` | active 또는 course + `announcements.read` 또는 `announcements.manage`, course bypass | sidebar는 `announcements.read` 중심 | 공지 CRUD | `notices`, `notice_comments`, `profiles` |
| `/member/announcements/:noticeId` | `AnnouncementDetail` | 위와 동일 | 상위 route 기준 | 공지 상세/댓글 | `notices`, `notice_comments`, `profiles` |
| `/member/study-log` | `StudyLog` | active only | sidebar/catalog 있음 | `ComingSoonPage` | 없음 |
| `/member/study-playlist` | `StudyPlaylist` | active only | sidebar/catalog 있음 | `ComingSoonPage` | 없음 |
| `/member/peer-review` | `PeerReview` | active only | sidebar/catalog 있음, team lead 성격 | 정적/목업 | 없음 |
| `/member/projects` | `MemberProjects` | active + `projects.read` 또는 `projects.manage` | sidebar는 `projects.read` 중심 | `listProjects` | `project_teams`, `project_team_memberships`, `profiles` |
| `/member/projects/:slug` | `ProjectDetail` | active + `projects.read` 또는 `projects.manage` | 상위 route 기준 | `getProjectBySlug` | `project_teams`, `project_team_memberships`, `profiles` |
| `/member/showcase` | `Showcase` | active + `projects.read` 또는 `projects.manage` | sidebar는 team lead/manage 성격 | 정적/목업 | 없음 |
| `/member/events` | `Events` | active + `events.read` 또는 `events.manage` | sidebar는 `events.read` 중심 | `ComingSoonPage` | 없음 |
| `/member/space-booking` | `SpaceBooking` | active 또는 course, 별도 permission 없음 | sidebar/catalog 있음, tag nav로 숨김 가능 | 예약 조회/생성 | `space_bookings` |
| `/member/members` | `Members` | active 또는 course + `members.read` 또는 `members.manage`, course bypass | sidebar는 `members.read` 중심 | member directory/favorite/profile | `profiles`, `member_accounts`, `member_favorite_profiles`, `org_position_assignments`, `team_memberships`, `project_team_memberships`, `member_tag_assignments`, auth getUser |
| `/member/resources` | `Resources` | active + `resources.read` 또는 `resources.manage` | sidebar는 `resources.read` 중심 | `ComingSoonPage` | 없음 |
| `/member/templates` | `Templates` | active + `resources.read` 또는 `resources.manage` | sidebar는 manage/team lead 성격 | 정적/목업 | 없음 |
| `/member/equipment` | `Equipment` | active + `resources.read` 또는 `resources.manage` | sidebar는 `resources.read` 중심 | `ComingSoonPage` | 없음 |
| `/member/roadmap` | `Roadmap` | active only | sidebar/catalog 있음, vice president 성격 | 정적/목업 | 없음 |
| `/member/retro` | `Retro` | active only | sidebar/catalog 있음, vice president 성격 | 정적/목업 | 없음 |
| `/member/changelog` | `Changelog` | active only | sidebar/catalog 있음, vice president 성격 | 정적/목업 | 없음 |
| `/member/votes` | `Votes` | active only | sidebar/catalog 있음 | `ComingSoonPage` | 현재 UI 없음. vote schema/RLS는 별도 확인 필요 |
| `/member/forms` | `Forms` | active + `forms.manage` | sidebar/catalog 있음 | 정적/목업 | 없음 |
| `/member/integrations` | `Integrations` | active + `integrations.manage` | sidebar/catalog 있음 | 정적/목업 | 없음 |
| `/member/permissions` | `Permissions` | active + `permissions.manage` | sidebar/catalog 있음 | 정적/목업 관리 UI | 없음 |
| `/member/nav-config` | `NavConfig` | active + `permissions.manage` | sidebar/catalog 없음 | `/member/tags/koss` redirect | 없음 |
| `/member/tags` | `Tags` | active + `permissions.manage` | sidebar/catalog 있음 | 태그 목록/생성/삭제 | `member_tags`, `member_tag_permissions`, `member_tag_nav`, `member_tag_assignments` |
| `/member/tags/:slug` | `TagDetail` | active + `permissions.manage` | 상위 route 기준 | 태그 권한/nav/멤버 배정 | `member_tags`, `member_tag_permissions`, `member_tag_nav`, `member_tag_assignments`, `profiles`, `member_accounts`, directory 관련 테이블, tag RPC |
| `/member/member-admin` | `MemberAdmin` | active + `members.manage` 또는 `permissions.manage` | sidebar 있음, catalog 누락 | 멤버 상태/프로필/삭제/태그 배정 | `profiles`, `member_accounts`, `member_tag_assignments`, `org_position_assignments`, `membership_applications`, `member_tags`, `admin_set_member_status`, `admin_update_member_profile`, `admin_delete_member` |
| `/member/quests` | `Quests` | active 또는 course, 별도 permission 없음 | sidebar/catalog 있음, tag nav로 숨김 가능 | 퀘스트 CRUD/제출/검토 | `member_quests`, `member_quest_audience_tags`, `member_quest_reward_tags`, `member_quest_completions`, `profiles`, `member_tags`, `submit_quest_completion`, `review_quest_completion` |
| `/member/invite-codes` | `InviteCodes` | active + `members.manage` | sidebar/catalog 있음 | 초대코드 CRUD, 태그 목록 | `course_invite_codes`, `member_tags` |

### 1.3 라우트와 nav의 실제 drift

| drift | 현재 상태 | 위험 |
|---|---|---|
| `MemberLayout.NAVIGATION`과 `NAV_CATALOG` 불일치 | sidebar path 26개, catalog path 25개. `/member/member-admin`이 catalog에 없다. | 태그에서 member-admin 노출 제어를 못 하거나, 주석과 실제 제어면이 어긋난다. |
| `/member/nav-config` legacy route | route는 있고 `permissions.manage`로 접근 가능하지만 sidebar/catalog에는 없다. 실제로는 `/member/tags/koss` redirect다. | 오래된 URL이 남아 권한/문서/QA를 헷갈리게 한다. |
| `read OR manage` guard와 sidebar 단일 permission | announcements/projects/events/members/resources 계열은 route가 read 또는 manage를 허용하지만 sidebar는 read 또는 manage 한쪽만 본다. | 권한은 있는데 메뉴가 없거나, 메뉴는 있는데 route에서 막히는 현상이 생긴다. |
| `allowCourseMember` bypass | 일부 route에서 course 회원은 permission 검사를 우회한다. sidebar는 tag nav로 숨길 수 있다. | 메뉴에는 없어도 URL 직접 접근이 가능하다. collapse 이후에도 legacy branch가 남아 정책 판단을 흐린다. |
| profile/security/account-info | catalog에는 없고 계정 메뉴/탭으로만 접근한다. | 의도된 예외로 보인다. 다만 catalog mirror 규칙에는 예외 목록을 문서화해야 한다. |

## 2. DB / RPC / RLS 교차검증 결과

기준은 repo의 `supabase/migrations` 체인이다. 실제 Supabase 프로젝트에 외부 baseline schema나 default grant가 있으면 런타임은 다를 수 있지만, repo만으로 재현 가능한 상태는 아래와 같다.

| 분류 | 판정 | 근거 | 영향 |
|---|---|---|---|
| 누락 테이블 | `public.notices` 생성 migration이 repo 체인에 없다. | API는 `src/app/api/notices.ts`, `src/app/api/dashboard.ts`에서 `notices`를 사용하지만 migration은 생성 없이 `public.notices`를 `regclass`로 참조한다. | 외부 선행 테이블이 없으면 migration apply 자체가 실패하고 공지 API가 깨진다. |
| 삭제 컬럼 참조 | `profiles.tech_tags` drop 이후에도 `get_my_authorization_context()` 본문에 남아 있다. | `20260506040000_purge_club_strings_from_tech_tags.sql`은 컬럼을 drop하고, `20260504144000_active_member_base_permissions.sql`의 RPC는 여전히 참조한다. | 로그인/권한 컨텍스트 RPC에서 `undefined_column` 위험이 크다. |
| RPC signature | 호출명/인자명 drift는 큰 문제 없음. | contact/admin/quest/tag RPC는 migration에 정의와 grant execute가 있다. | 이름 불일치보다 내부 정책/값 도메인 문제가 더 크다. |
| 값 도메인 drift | `adminSetMemberStatus` 타입은 `course_member`, `project_only`를 아직 허용하지만 최신 RPC는 `pending/active/rejected/withdrawn`만 허용한다. | `src/app/api/member-admin.ts` 타입과 `20260506020000_collapse_course_member.sql` RPC 조건이 다르다. | UI가 옛 값을 보내면 `invalid_status`로 실패한다. |
| table grant 명시성 | direct table API 대상 중 여러 테이블의 explicit grant가 repo 체인에서 안 보인다. | `profiles`, `member_accounts`, `notifications`, `contact_requests`, `project_teams`, `course_invite_codes`, `space_bookings`, `member_favorite_profiles`, `membership_applications`, `notices` 등. | Supabase default privileges에 기대고 있다면 새 환경에서 RLS 이전에 permission denied가 날 수 있다. |
| RLS 범위 | `space_bookings` select가 active member보다 넓다. | `auth.uid() is not null` 성격의 select 정책. | 승인 멤버가 아닌 로그인 사용자도 예약을 볼 수 있다. |
| 비원자 direct DML | 태그/퀘스트 설정이 delete 후 insert, 여러 insert로 나뉜다. | `tags.ts`, `quests.ts`에서 트랜잭션 RPC 없이 여러 DML 호출. | 중간 실패 시 권한/nav/보상/대상 태그가 부분 반영된다. |
| raw error | `space-bookings.ts`가 DB `error.message`를 그대로 throw한다. | list/create/delete 경로. | constraint/policy/table 힌트가 사용자에게 노출될 수 있다. |
| fallback masking | dashboard/member-directory가 DB/RLS/schema 실패를 빈 데이터처럼 숨긴다. | `dashboard.withFallback`, `member-directory.safeRows`, favorite local fallback. | 운영에서 권한/스키마 문제를 "데이터 없음"으로 오판한다. |

DB 우선 수정 순서:

1. `public.notices`의 기준 schema를 repo migration에 명시한다.
2. `get_my_authorization_context()`에서 `profiles.tech_tags`를 완전히 제거한다.
3. `current_user_has_permission()`에 tag permission을 통합하거나, DB RLS에서는 tag permission을 안 쓰겠다고 명시한다.
4. direct DML로 권한/보상/상태가 바뀌는 흐름은 RPC 한 번으로 원자화한다.
5. direct table access 대상에 grant를 명시할지, Supabase 기본 권한에 의존할지 결정하고 문서화한다.

## 3. 성능 / 자산 / CSP 교차검증 결과

| 분류 | 현재 상태 | 영향 | 권장 |
|---|---|---|---|
| 라우트 eager import | `src/app/routes.tsx`가 `Landing`, `DesignLab`, `SpaceBooking`, `Dashboard`, `Members`, `Quests`, `ProfileSettings` 등 모든 큰 페이지를 정적 import한다. | production JS가 단일 청크 약 1.32MB로 커진다. | React Router route `lazy` 또는 `React.lazy`로 public/member/admin/실험 페이지 분리. |
| 로고 중복 | `src/assets/mainLogo.png`, `public/favicon.png`, `public/og-image.png`가 같은 3600x1200 PNG, 각 658KB다. | favicon/OG/앱 로고 모두 과대 용량이고 규격도 다르다. | favicon 32/180/192/512, OG 1200x630, 앱 로고 표시 크기별 파생본 생성. |
| font import | `fonts.css`는 0바이트이고 `design-tokens.css`가 외부 font `@import`를 가진다. | CSS import 순서 문제로 dist 반영이 불안정하다. | HTML link/preload 또는 `index.css` 최상단 self-host/link 방식으로 정리. |
| CSP inline style | `vercel.json`의 CSP는 `style-src 'unsafe-inline'`에 의존한다. | inline style이 많은 현재 구조에서는 CSP 강화가 어렵다. | `DesignLab`, `SpaceBooking`, `Members`, `chart.tsx`부터 CSS class/CSS variable로 이동. |
| Tailwind source 범위 | `tailwind.css`가 `@source '../**/*.{js,ts,jsx,tsx}'`로 넓게 스캔한다. | import되지 않는 TSX의 class도 CSS 후보가 될 수 있다. | 미사용 파일 정리 후 source 범위를 실제 앱 진입 경로 중심으로 좁힌다. |
| 미사용 후보 | `Admin.tsx`, `Attendance.tsx`, `Notice.tsx`, `OfficeHours.tsx`, `QnA.tsx`, `Study.tsx`, `MobileLanding.tsx`, `MemberShell.tsx`, 해시명 이미지 2개 등. | 번들/유지보수/문서 혼란. | route/import 참조를 한 번 더 확인한 뒤 archive 또는 삭제. |

## 4. 문서 신뢰도 정리

최종 사실 판단 순서:

1. 실제 코드와 `supabase/migrations`
2. `docs/analysis/10-project-wide-system-spec-2026-05-05.md`
3. `docs/analysis/09-full-code-reaudit-v2-2026-05-05.md`
4. `docs/product/*`는 정책 방향으로 신뢰하되 현재 구현 설명은 코드와 대조
5. 오래된 `HANDOFF.md`, `docs/analysis/01~07`, 일부 `docs/ddd-workflow/*`, 구 보안 감사 문서는 배경 자료로만 사용

| 문서 | 판정 | 이유 |
|---|---|---|
| `docs/analysis/10-project-wide-system-spec-2026-05-05.md` | 최우선 신뢰 | 최신 전체 지도. 이 부록과 함께 사용한다. |
| `docs/analysis/09-full-code-reaudit-v2-2026-05-05.md` | 신뢰 | fallback, tag/RLS, quest/invite 보안 감사가 현재와 맞다. |
| `docs/product/tag-system.md` | 정책 문서로 신뢰 | 태그가 권한/소속/nav의 중심이라는 방향은 맞지만 구현은 아직 status fallback과 분리되어 있다. |
| `docs/product/member-status.md` | 정책 문서로 신뢰 | status를 lifecycle로 줄이는 방향은 맞다. 실제 타입/guard에는 legacy 흔적이 남아 있다. |
| `docs/product/invite-codes.md` | 조건부 신뢰 | tag 부여 중심은 맞지만 plaintext code, max_uses race, approval 흐름은 정정 필요. |
| `docs/product/quests.md` | 조건부 신뢰 | 보상 태그 구조는 맞지만 direct approved insert 위험이 빠져 있다. |
| `HANDOFF.md` | 주의/사실판단 금지 | mock/미구현/course_member 설명이 현재 코드와 많이 다르다. |
| `docs/ddd-workflow/15-member-directory-tagging-2026-05-05.md` | 폐기 권장 | `profiles.tech_tags`, systemTags/profileTags, active->KOBOT, course_member->KOSS 모델이 최신 구현과 충돌한다. |
| `SECURITY_AUDIT*` | 참고만 | 일부 지적은 유효하지만 CSP/source map/course_member 등 현재와 다른 내용이 섞여 있다. |

## 5. fallback이 왜 많아졌는지에 대한 코드 기반 추정

현재 fallback은 전부 같은 성격이 아니다. 좋은 fallback도 있고, 문제가 된 fallback도 있다.

좋은 fallback:

- `redirects.ts`의 내부 경로 제한
- notification target href 검증
- clipboard API 실패 시 textarea 복사
- 사용자에게 DB 내부 오류를 그대로 보여주지 않기 위한 `sanitizeUserError`
- dashboard처럼 일부 섹션 실패를 `failedSections`로 표시하려는 partial failure 처리

위험한 fallback:

- auth/tag RPC 실패를 명확한 실패로 다루지 않고 status 기반 권한을 붙이는 흐름
- DB/RLS/schema 실패를 빈 배열로 바꿔 "데이터 없음"처럼 보이게 하는 흐름
- `member_favorite_profiles` 실패 시 localStorage로 조용히 대체하는 흐름
- delete-then-insert 실패 후 부분 반영을 복구하지 않는 흐름
- raw `error.message`를 그대로 보여주는 흐름과, 반대로 너무 많이 숨겨서 운영자가 원인을 못 보는 흐름이 섞인 상태

왜 이렇게 되었을 가능성이 큰가:

1. 기존 status 중심 모델에서 tag 중심 모델로 옮기는 중간에 UI를 계속 살리려 했다.
2. Supabase migration/RLS/grant가 자주 바뀌면서 개발 중 화면이 깨지지 않도록 빈 데이터 fallback을 넣었다.
3. `course_member` collapse, `tech_tags` 제거, tag nav 도입이 서로 다른 PR/작업 단위로 진행되어 runtime branch가 남았다.
4. 프론트에서 빠르게 기능을 붙이기 위해 atomic RPC보다 direct table DML을 먼저 사용했다.
5. 문서가 최신 코드보다 느리게 갱신되어, 작업자가 옛 모델을 보고 보완 fallback을 추가했을 가능성이 있다.

따라서 다음 수정 원칙은 단순하다. UI 표시용 fallback은 허용하되, 권한/RLS/RPC/schema/보상/상태 변경 fallback은 fail closed로 바꿔야 한다.
