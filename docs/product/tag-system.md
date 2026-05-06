# 태그 시스템 — 단일 진리원천

부원의 동아리·역할·그룹은 모두 **태그(`member_tags`)** 로 표현된다. 권한·사이드바·디렉토리 필터·공지 공개 범위·미션 청중·미션 보상은 전부 태그 하나만 본다. `member_accounts.status` 는 lifecycle/active eligibility 컬럼이며 소속·졸업·표시 분류를 대신하지 않는다 (→ [member-status.md](member-status.md)).

> 새 페이지·기능을 만들거나, 태그 규칙을 바꿀 때는 **반드시 이 문서의 "Touchpoints"·"Invariants" 를 업데이트**하고 코드도 함께 고쳐라. 한쪽만 바뀌면 또 같은 버그가 난다.

## 데이터 모델

| 테이블 | 역할 |
| --- | --- |
| `member_tags` | 태그 카탈로그. `slug`(영문 식별자), `label`(표시명), `color`, `description`, `is_club`(동아리 태그 여부), `is_system`(잠금용 — 현재는 무시), `auto_status`(폐기, 항상 NULL) |
| `member_tag_permissions` | 태그 → 권한 N:N. `member_tag_permissions.permission`은 반드시 `public.permissions.code`와 조인되어 검증된 값만 권한으로 인정한다. |
| `member_tag_nav` | 태그 → 사이드바 href N:N |
| `member_tag_assignments` | 태그 → 사용자 N:N. 회장이 부여/회수, 또는 초대코드/미션 트리거가 자동 INSERT |
| `profiles.display_club_tag_id` | 멤버 디렉토리에서 대표 동아리로 보여 줄 태그. 실제 표시 전 해당 사용자의 `member_tag_assignments` 와 `member_tags.is_club=true` 를 다시 확인한다. |

## 핵심 RPC

| 함수 | 호출 위치 | 의미 |
| --- | --- | --- |
| `current_user_tag_permissions()` | `auth/useAuth` 토큰 갱신 | 현재 유저가 가진 모든 태그의 권한 합집합 |
| `current_user_tag_nav_paths()` | `MemberLayout` 사이드바 | 현재 유저가 볼 수 있는 메뉴 hrefs |
| `current_user_can_see_quest(quest_id)` | RLS / API | active 회원 eligibility + 미션 청중 매칭 |

## Invariants (절대 깨지면 안 됨)

1. **태그 부여/회수는 오직 `member_tag_assignments` 에만 쓴다.** profiles.tech_tags 같은 문자열 컬럼에 동일 정보를 또 쓰지 마라.
2. **status 로 태그를 자동 동기화하는 트리거를 다시 만들지 마라.** `sync_member_status_tags` 는 `20260505240000_clarify_tags_vs_status.sql` 와 `20260506000000_unlock_system_tags.sql` 에서 drop 됐다. 부활시키면 회장이 수동 부여한 KOBOT/KOSS 가 status 불일치로 자동 회수되는 버그가 다시 생긴다.
3. **권한·사이드바·UI 필터의 의미는 태그만 본다.** status 는 `active` 같은 작동 가능 여부만 막는 gate로 쓰고, 소속·졸업·메뉴·공지 범위·투표 대상 분류에는 쓰지 마라.
4. **KOBOT/KOSS 도 일반 태그**다. `is_system` 분기로 삭제·편집을 막지 마라. `20260506000000_unlock_system_tags.sql` 이 `is_system=false` 로 풀어 놨다.
5. **동아리 기본값은 slug ASC 로 고른다.** 초대코드나 멤버 카드 fallback 에서 동아리 태그가 여러 개면 `label` 이 아니라 안정적인 코드 식별자인 `slug` 오름차순 첫 태그를 사용한다.
6. **동아리 여부는 모든 태그에 똑같이 `member_tags.is_club=true` 로만 판단한다.** KOBOT/KOSS 라는 이름을 런타임에서 특별 취급하지 마라. 기존 초대코드/프로필 문자열과 매칭되는 레거시 태그는 마이그레이션에서 일반 규칙으로 `is_club=true` 백필한다.
7. **태그는 IAM 그룹처럼 동작한다.** `member_tags` 는 그룹, `member_tag_permissions` 는 그룹에 attach 된 permission policy, `member_tag_nav` 는 sidebar policy, `member_tag_assignments` 는 사용자를 그룹에 넣는 membership 이다.
8. **동아리 태그와 초대코드 기본 태그에는 위험 권한을 붙일 수 없다.** `admin.access` 또는 `*.manage` 권한은 동아리 태그(`is_club=true`)에 attach 할 수 없고, 그런 권한이 붙은 태그는 초대코드 기본 부여 목록에도 넣을 수 없다. UI 와 DB trigger 둘 다 막는다.
9. **역할 태그는 여러 개 부여될 수 있다.** 한 사람이 `president` 와 `official_team_lead_d` 를 동시에 가질 수 있다. 권한은 태그들의 합집합이고, 멤버 카드의 대표 직위는 `회장 > 부회장 > 팀장 > 부원` 우선순위로만 요약한다. 실제 칩 목록에서는 절대 하나만 남기지 않는다.
10. **권한 체크가 태그를 자동 생성하지 않는다.** 권한은 이미 존재하는 태그에 attach 되는 속성이고, 사용자는 `member_tag_assignments` 로 태그를 받아야 한다. 권한관리에서 체크만 한다고 새 태그나 사용자 할당이 생기지 않는다.

## Touchpoints (이 도메인을 건드리는 모든 파일)

태그 데이터/UX 를 바꾸면 아래 모두를 같이 봐야 한다.

### DB / SQL
- `supabase/migrations/20260505220000_member_tags.sql` — 카탈로그 + RLS + 시드
- `supabase/migrations/20260505240000_clarify_tags_vs_status.sql` — status→tag 트리거 drop, redeem RPC 재작성
- `supabase/migrations/20260505260000_member_quests.sql` — 미션 보상 태그 트리거
- `supabase/migrations/20260506000000_unlock_system_tags.sql` — 시스템 태그 잠금 해제 + 트리거 방어 drop
- `supabase/migrations/20260506060000_notice_tag_visibility.sql` — 공지 public/tag_in visibility
- `supabase/migrations/20260506070000_ouroboros_authority_closure.sql` — 공지 audience 원자적 RPC, quest active gate, SECURITY DEFINER grant closure
- `supabase/migrations/20260506080000_invite_club_tags_and_display_choice.sql` — 초대코드 동아리 태그 파생, `profiles.display_club_tag_id`
- `supabase/migrations/20260506100000_tag_policy_safety_guards.sql` — 동아리 태그/초대코드의 위험 권한 차단 trigger
- `supabase/migrations/20260506103000_block_sensitive_permissions_for_invite_tags.sql` — 초대코드에 이미 들어간 태그에 나중에 위험 권한을 붙이는 우회 차단
- `supabase/migrations/20260506110000_project_create_permission_and_role_tags.sql` — `projects.create` 권한, 프로젝트 생성 RPC, 회장/부회장/공식 팀장 A-D 역할 태그 seed/backfill

### API 레이어
- `src/app/api/tags.ts` — listTags / createTag / updateTag / deleteTag / **assignTagToUser** / **removeTagFromUser** / setTagPermissions / setTagNav
- `src/app/api/quests.ts` — 미션 CRUD + 보상 태그 부여 (트리거가 자동)
- `src/app/api/notices.ts` — 공지 public/tag_in audience RPC 호출
- `src/app/api/invite-codes.ts` — `default_tags` 슬러그 배열 저장. redeem 시 슬러그→태그 매칭 INSERT
- `src/app/config/tag-policy.ts` — 위험 권한 판정(`admin.access`, `*.manage`)의 프론트 단일 출처
- `src/app/api/member-directory.ts` — 디렉토리는 실제 assignments 를 우선한다. 레거시 회장 직위는 실제 `president` 태그가 없을 때만 가상 태그로 보정한다
- `src/app/api/member-admin.ts` — admin 화면이 보여 줄 태그/멤버 조인 결과

### 페이지
- `src/app/pages/member/Tags.tsx` — 태그 목록 (회장). 생성/수정은 팝업이며 기본 정보·권한·사이드바를 한 번에 다룬다.
- `src/app/pages/member/TagDetail.tsx` — 태그 상세: 기본정보·권한·메뉴 탭 + 부원 부여
- `src/app/pages/member/MemberAdmin.tsx` — 행마다 "+태그" 모달, 필터 드롭다운에 모든 태그 노출
- `src/app/pages/member/Members.tsx` — 디렉토리 카드. 필터 드롭다운에 태그 라벨 사용 (status 안 봄)
- `src/app/pages/member/Quests.tsx` — 청중·보상 태그 다중 선택
- `src/app/pages/member/Announcements.tsx` — 공지 공개 범위 public/tag_in + 태그 다중 선택
- `src/app/pages/member/InviteCodes.tsx` — 부여 태그 다중 선택 칩
- `src/app/layouts/MemberLayout.tsx` (`current_user_tag_nav_paths` 결과로 사이드바 그림)

### 칩 렌더링 / 아이콘 매핑
- `src/app/components/TagChip.tsx` 의 `SLUG_DECORATIONS` 가 태그 칩 아이콘/금속 질감/색상 매핑의 단일 출처다. `president=금`, `vice_president=은`, `official_team_lead_a/b/c/d=동` 질감은 여기서만 바꾼다.
- 단, 모든 화면이 아직 `TagChip` 을 쓰는 것은 아니다. 초대코드/공지/퀘스트 폼처럼 수동 렌더가 남아 있으므로 디자인 변경 전 [태그 렌더링 Touchpoints](tag-rendering-touchpoints.md)를 반드시 확인한다.
- 같은 선택 UI를 여러 페이지에서 반복하게 되면 `TagChip` 기반 공통 picker 컴포넌트로 추출한다. 추출 여부는 UX 의미가 바뀔 수 있으므로 사용자 확인 후 진행한다.
## 2026-05-05 note: profiles.tech_tags compatibility only

`profiles.tech_tags`는 태그/권한/표시의 진리원천이 아니다. 진리원천은 계속 `member_tags`와 `member_tag_assignments`다.

다만 이미 로드된 오래된 브라우저 번들이 프로필 저장 중 `profiles.tech_tags`를 조회하거나 PATCH할 수 있어서, `20260506150000_profiles_tech_tags_compat.sql`에서 호환 컬럼을 다시 추가했다. 이 컬럼은 400 오류 방지용 inert storage이며, 새 코드에서는 읽거나 쓰지 않는다.

2026-05-05 후속 수정으로 `src` 아래 새 번들 코드의 `techTags`/`tech_tags` 참조는 모두 제거했다. 호환 컬럼은 이미 열린 브라우저 탭과 캐시된 오래된 번들을 위한 임시 방어층이다. 권한, 표시, 메뉴, 초대, 멤버 필터는 계속 `member_tags`/`member_tag_assignments`만 사용한다.
