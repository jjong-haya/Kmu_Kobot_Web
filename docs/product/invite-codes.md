# 초대 코드 (course invite codes)

초대 코드의 본질은 **링크 한 줄로 태그를 자동 부여**하는 것. 회장이 발급한 코드를 부원이 사용하면 코드에 묶인 [태그들](tag-system.md) 이 자동으로 `member_tag_assignments` 에 INSERT 된다. 권한·사이드바·동아리 식별이 모두 태그로 따라온다.

## 흐름

1. 회장이 `/member/invite-codes` 에서 코드 발급 → `default_tags` 에 슬러그 배열 저장 (e.g. `['koss']`)
2. 부원이 `https://kobot.kookmin.ac.kr/invite/course?code=ABCD` 로 접속
3. Google 로그인 후 `AuthCallback` 이 `redeem_course_invite(code)` RPC 호출
4. RPC 가 코드의 `default_tags` 슬러그 → `member_tags.slug` 매칭하여 `member_tag_assignments` 에 INSERT (lower() 매칭, 없는 슬러그는 무시)
5. 부원 카드 사이드바·권한 즉시 갱신
6. `default_tags` 안에 `is_club=true` 동아리 태그가 여러 개 있으면 **slug ASC 첫 태그**의 `label` 을 `profiles.club_affiliation` 호환 텍스트로 저장한다. label 은 표시용이므로 기본 선택 기준으로 쓰지 않는다. KOBOT/KOSS/새 동아리 모두 같은 규칙을 탄다.

> ⚠️ 코드 사용 자체로 status 는 절대 안 바뀐다. (`20260505190000_invite_does_not_auto_approve.sql`)
> 부원이 `submit_current_membership_application()` 으로 가입 신청까지 마치고, 회장이 승인해야 status=`active` 가 된다. 태그만 먼저 붙는 구조.

## Invariants

1. **`default_tags` 는 태그 슬러그 배열.** label/한글명을 저장하지 마라. RPC 가 `lower(slug)` 로 매칭한다.
2. **회장이 코드 발급할 때 입력 UI 는 자유 텍스트 X.** `member_tags` 카탈로그를 그대로 칩으로 펼쳐서 다중 선택받는다. 슬러그 오타·존재하지 않는 태그가 들어가지 않게.
3. **초대코드의 동아리 열은 `club_affiliation` 직접 입력이 아니다.** `default_tags` 중 동아리 태그에서 파생한 일반 텍스트다. 태그처럼 pill 로 꾸미지 않는다.
4. **초대코드 태그 열은 공통 `TagChip` 으로 렌더한다.** 멤버 카드와 디자인이 달라지면 [tag-rendering-touchpoints.md](tag-rendering-touchpoints.md)를 보고 수동 렌더가 남았는지 찾는다.
5. **redeem RPC 에서 어떤 트리거도 status→tag 자동화를 건드리면 안 됨.** ([tag-system.md#invariants](tag-system.md#invariants-절대-깨지면-안-됨))
6. **동아리 판정은 태그 이름이 아니라 `member_tags.is_club` 이다.** 새 동아리 태그는 태그 생성/수정 모달에서 "동아리 태그"를 켜야 초대코드 동아리 열과 멤버 대표 동아리 후보에 들어간다.

## Touchpoints

### DB
- `supabase/migrations/20260504040000_course_invite_codes.sql` — 테이블 / 만료 / 사용 횟수
- `supabase/migrations/20260505123000_course_invite_default_tags.sql` — `default_tags text[]` 컬럼
- `supabase/migrations/20260505180000_redeem_course_invite_idempotent.sql` — 중복 호출 안전
- `supabase/migrations/20260505190000_invite_does_not_auto_approve.sql` — status 자동 승격 끊음
- `supabase/migrations/20260505240000_clarify_tags_vs_status.sql` — redeem 이 슬러그 매칭으로 `member_tag_assignments` INSERT
- `supabase/migrations/20260506000000_unlock_system_tags.sql` — 옛 트리거 방어 drop
- `supabase/migrations/20260506080000_invite_club_tags_and_display_choice.sql` — 초대코드 동아리 파생 + 멤버 대표 동아리 선택 컬럼

### API / 페이지
- `src/app/api/invite-codes.ts` — `createInviteCode({ defaultTags: string[] })` / `listInviteCodes()`
- `src/app/pages/member/InviteCodes.tsx` — 발급 모달의 "부여 태그" UI는 `listTags()` 로 받은 카탈로그를 `TagChip` 다중 선택으로 노출. 목록 태그 열도 `TagChip` 을 사용한다.
- `src/app/pages/public/AuthCallback.tsx` — `redeem_course_invite(code)` 호출 후 라우팅
- `src/app/pages/public/InviteCourse.tsx` — 코드 입력 페이지
