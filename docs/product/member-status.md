# 부원 상태 (lifecycle)

`member_accounts.status` 는 **계정의 생애주기와 active eligibility** 만 표현한다. 동아리·소속·졸업·공지 범위·권한·사이드바 같은 의미는 전부 [태그](tag-system.md) 가 결정한다. status 는 "active 인가?" 같은 작동 가능 여부를 막는 gate 로만 쓰고, 분류/권한 의미를 만들지 않는다.

## 가능한 값

| status | 의미 |
| --- | --- |
| `pending` | 가입 폼 진행 중 (Welcome → ProfileSettings → membership_applications 제출) |
| `active` | 활동중인 모든 부원. KOBOT 정규 부원 / KOSS 초대코드 가입자 모두 동일 status. 동아리 구분은 [태그](tag-system.md) 가 한다. |
| `rejected` | 운영진이 거절·보류 |
| `withdrawn` | 본인 탈퇴 처리 |
| `course_member` | **폐기됨**. 20260506020000 마이그레이션이 모든 행을 `active` 로 합쳤고, 이후 RPC 도 새 값을 만들지 않는다. 타입 union 에는 잔존하지만 런타임에 등장하지 않는다 (`AuthProvider` 가 fetch 단계에서 `active` 로 정규화). |

## Invariants

1. **status 로 의미 분기 X.** "이 사람은 active 니까 KOBOT 메뉴 보여 주자" 같은 코드 작성 금지. active 여부는 보호된 작업의 eligibility gate 로만 쓰고, 권한·사이드바는 `member_tag_assignments` + `member_tag_permissions/nav` 만 본다.
2. **status 는 application 제출/승인 시에만 변한다.** 초대코드 사용은 status 를 바꾸지 않는다 (옛날엔 자동 `course_member` 로 승격했지만 `20260505190000_invite_does_not_auto_approve.sql` 에서 끊었다).
3. **UI 라벨에 "정식 부원" 같은 status 파생 라벨을 넣지 마라.** 동아리 명칭은 태그가 보여 준다.

## Touchpoints

### DB
- `supabase/migrations/20260428173000_member_workspace_core.sql` — `member_accounts` 정의
- `supabase/migrations/20260505190000_invite_does_not_auto_approve.sql` — redeem 이 더 이상 status 안 건드림

### API / 페이지
- `src/app/auth/useAuth.tsx` — `memberStatus` 노출. 라우팅 가드(`RequireActiveMember`)와 권한 RPC 에서 active eligibility 만 본다.
- `src/app/pages/member/ApprovalPending.tsx` — pending/rejected/withdrawn/course_member 별로 안내 화면
- `src/app/pages/member/MemberAdmin.tsx` — 회장이 status 강제 변경. 필터 옵션에 "신청 미제출 / 신청 제출 / 보류 / 탈퇴" 노출 (이건 lifecycle 표시이므로 OK)
