# 변경 체크리스트 (반복 실수 방지)

이 문서를 **모든 변경 작업 시작 전과 끝나기 전 두 번** 펼쳐 본다. 같은 버그를 반복하는 패턴은 명세 부재가 원인이라 여기에 모든 데이터 흐름과 검증 절차를 박아 둔다.

## 0. 전체 단일 진리원천

| 영역 | 단일 출처 | 추가/유지 금지 |
| --- | --- | --- |
| 부원의 동아리·역할·권한·메뉴 | `member_tag_assignments` × `member_tags` | ❌ `profiles.tech_tags`, ❌ `member_accounts.status` 분기 |
| 부원의 lifecycle | `member_accounts.status` (`pending` → `active` → `rejected/withdrawn`) | ❌ `course_member` (폐기) |
| 미션 보상 자동 부여 | `apply_quest_completion_rewards` 트리거가 `member_tag_assignments` 에 INSERT | ❌ 클라이언트가 직접 INSERT |
| 초대코드 → 태그 부여 | `redeem_course_invite` 가 `default_tags` 슬러그 매칭으로 `member_tag_assignments` INSERT | ❌ status 자동 승격, ❌ tech_tags 갱신 |
| 동아리 태그 판정 | `member_tags.is_club=true` | ❌ KOBOT/KOSS 이름 하드코딩, ❌ label 문자열 추론 |

## 1. 데이터 흐름 (변경 시 반드시 이 경로 모두 점검)

### 부원 카드 / 디렉토리 (`/member/members`)
```
member_tag_assignments + member_tags  ─┐
org_position_assignments              ─┤→  src/app/api/member-directory.ts
member_accounts (status — UI 분기 X)  ─┘   (listMemberDirectory)
                                          → MemberDirectoryProfile.memberTags: TagChipData[]
                                          → src/app/pages/member/Members.tsx
                                          → <TagChip tag={...} />
```

### 멤버 관리 (`/member/member-admin` — 회장 전용)
```
profiles + member_accounts + applications + tag_assignments
  → src/app/api/member-admin.ts (listAdminMembers)
  → MemberAdmin.tsx 행: <TagChip tag={...} onRemove={...} />
  → 필터 드롭다운: tagsCatalog (member_tags 전체)
  → +태그 모달: TagAssignModal (assignTagToUser RPC)
```

### 사이드바 / 권한
```
member_tag_assignments → member_tag_nav / member_tag_permissions
  → current_user_tag_nav_paths() / current_user_tag_permissions()
  → AuthProvider effectivePermissions / MemberLayout NAV
```

### 알림 / 가입 신청 승인
```
submit_current_membership_application()
  → membership_applications (profile_snapshot, status=submitted)
  → notifications (type=membership_application_submitted, related_entity_id=application_id)
  → src/app/api/notifications.ts (actor + application snapshot enrichment)
  → src/app/pages/member/Notifications.tsx (상세 팝업)
  → CTA: /member/member-admin?filter=submitted
  → MemberAdmin.tsx (승인 대기 필터, 승인/보류 처리)
```

가입 신청 알림은 `/member/members` 로 보내면 안 된다. `/member/members` 는 디렉토리 read model 이고, 승인 업무 소유자는 `/member/member-admin` 이다.

## 2. 칩 디자인 단일 출처

태그 칩 본체는 `src/app/components/TagChip.tsx` 가 단일 출처다. 단, 아직 모든 페이지가 이 컴포넌트를 쓰는 것은 아니다. 태그 디자인을 바꾸기 전에는 반드시 [태그 렌더링 Touchpoints](./tag-rendering-touchpoints.md)를 먼저 본다.

현재 `TagChip` 영향권:
- MemberAdmin.tsx (행 태그 / +태그 모달)
- Members.tsx (디렉토리 카드 / 리스트 / 내 프로필)
- Quests.tsx (퀘스트 카드의 청중 / 보상 표시)
- Tags.tsx (태그 목록 미리보기)
- InviteCodes.tsx (목록 태그 열 / 발급 모달 태그 선택)

현재 수동 렌더라 `TagChip` 변경이 자동 반영되지 않는 곳:
- Announcements.tsx (공지 공개 태그 선택 버튼 / 공개 범위 요약)
- Quests.tsx (생성/수정 폼의 태그 선택 버튼)
- TagDetail.tsx (헤더 badge / 가상 회원 미리보기 pill)

태그 디자인이 모든 화면에서 같아야 하면 수동 렌더 지점을 `TagChip` 또는 별도 공통 선택 컴포넌트로 통합한다. 이 통합은 화면 의미가 바뀔 수 있으므로 먼저 확인받는다.

## 3. RLS 가드 (디렉토리·관리 페이지에서 데이터가 비어 보이면 우선 의심)

| 테이블 | 일반 부원 | 회장 (members.manage / permissions.manage) |
| --- | --- | --- |
| `member_tags` | SELECT 모두 가능 | INSERT/UPDATE/DELETE |
| `member_tag_assignments` | 본인 행만 + 디렉토리 read 권한 보유자 | 모두 |
| `profiles` | 디렉토리 read 권한 보유자 | 모두 |

→ 디렉토리에서 본인 외 부원 태그가 안 보이면 `current_user_can_read_member_directory()` 가 false 일 가능성 99%.

## 4. 마이그레이션 미적용 시 자주 깨지는 컬럼

| 컬럼 | 추가 마이그 | 운영에 없으면 깨지는 곳 |
| --- | --- | --- |
| `member_tags.is_club` | `20260506030000_member_tags_club_kind.sql` | tags.ts SELECT, member-directory.ts join SELECT |
| `member_tags.is_system=false` 풀림 | `20260506000000_unlock_system_tags.sql` | 회장이 KOBOT/KOSS 삭제 못함 |
| status 정규화 | `20260506020000_collapse_course_member.sql` | course_member 잔존 → AuthProvider 가 active 로 정규화함 |
| `profiles.tech_tags` DROP | `20260506040000_purge_club_strings_from_tech_tags.sql` | 옛 코드가 SELECT 시 컬럼 없음 에러 (현재 모든 SELECT 에서 제거됨) |

→ **선택형 컬럼에 의존하는 모든 SELECT 는 fallback 패턴 필수**:
```ts
const first = await supabase.from(...).select("...new_col...");
if (first.error) {
  const fallback = await supabase.from(...).select("...without new_col...");
  ...
}
```
`safeRows` 헬퍼는 에러를 삼켜서 [] 로 반환하므로 fallback 의도가 있으면 wrap 하지 마라.

## 5. 변경 전 사전 점검

1. 어느 페이지에서 보이는 변경인지 확인 → 위 "1. 데이터 흐름" 표에서 영향 경로 식별.
2. 만지는 컬럼 / 함수가 **마이그레이션이 필요한지** 확인. 필요하면 새 파일 작성.
3. 새 컬럼 추가 → 모든 SELECT 에 fallback 추가했는지 확인.
4. 칩 / 라벨 변경 → `components/TagChip.tsx` 와 `tag-rendering-touchpoints.md` 의 수동 렌더 지점까지 같이 확인.
5. status 분기 코드 추가하려는 충동이 들면 STOP. 권한·UI 는 항상 태그 기반.
6. 알림 링크 변경 → `notifications.md` 를 먼저 보고, row click 이 상세 팝업을 거친 뒤 CTA 로 이동하는지 확인.

## 6. 변경 후 검증

1. `npm run build` 통과 (= 타입 OK)
2. `mcp__Claude_Preview__preview_console_logs level=error` 깨끗
3. 대상 페이지 새로고침 → 실제로 의도한 화면이 나오는지 눈으로 확인 (시간 부족하면 `preview_snapshot` / `preview_screenshot` 으로 대체)
4. 운영 DB 에 새 마이그레이션 필요하면 README 마이그레이션 목록 갱신.

## 7. 실패 패턴 카탈로그 (반복 금지)

| 증상 | 진짜 원인 | 1차 의심 |
| --- | --- | --- |
| 멤버 관리는 태그 보이는데 디렉토리는 빈 칩 | `member-directory.ts` 의 join SELECT 가 `is_club` 같은 신규 컬럼 때문에 깨졌고, `safeRows` 가 에러 삼켜 [] 반환 | safeRows 우회 + 명시적 fallback |
| "상태 변경 못했다" | `admin_set_member_status` 가 INSERT...ON CONFLICT DO UPDATE 였는데 `organization_id` NOT NULL 위반 | UPDATE-only RPC 로 재작성 |
| 같은 라벨이 색상 다른 칩으로 두 번 | `profiles.tech_tags` 잔존 문자열 + 진짜 태그 동시 렌더 | tech_tags 폐기 + 카드는 `memberTags` 만 |
| KOBOT 부여해도 즉시 회수 | 옛 `sync_member_status_tags` 트리거가 status 와 auto_status 비교해 자동 삭제 | 트리거 drop + auto_status null |
| 칩 가로폭 라벨 따라 들쭉날쭉 | TagChip `minWidth` 미설정 | 70px 고정 |
| 회장 카드만 ShieldCheck 라인 보이고 나머지 부원 비어 보임 | `MemberMeta` 가 position 없으면 라인 자체 숨김 | 폴백: tag 라벨 → "부원" |
