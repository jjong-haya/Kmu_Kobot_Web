# 미션 / 퀘스트 시스템

회장이 미션을 만들고, 청중([태그](tag-system.md)) 을 지정하고, 보상 태그를 건다. 부원이 완료 신청 → 회장 승인 → 보상 태그가 자동 부여된다. 사이드바·권한이 그 즉시 따라온다.

## 흐름

1. 회장 `/member/quests` 에서 미션 생성: 라벨·색·설명·청중 모드(`all` 또는 `tag_in`)·청중 태그 N개·보상 태그 N개
2. 부원이 본인이 청중인 미션만 보임 (`current_user_can_see_quest` RLS)
3. 부원이 "완료 신청" → 증빙 텍스트 입력 → `submit_quest_completion(quest_id, evidence)` RPC
4. 회장이 승인/거절 → `review_quest_completion(completion_id, decision, reason)` RPC
5. 승인되면 `apply_quest_completion_rewards` 트리거가 보상 태그를 `member_tag_assignments` 에 자동 INSERT

## Invariants

1. **보상 태그 부여는 트리거가 한다.** 클라이언트에서 별도로 INSERT 하지 마라. (이중 부여 / RLS 우회 위험)
2. **청중 의미는 `member_tag_assignments` 만 본다.** 단, 실제 신청/조회 가능 여부는 `member_accounts.status = 'active'` eligibility gate 를 통과해야 한다. status 를 동아리/졸업/역할 분류로 쓰는 것은 금지.
3. **삭제 캐스케이드 주의.** `member_quests` 삭제 시 audience/reward/completions 가 같이 사라진다. 이미 부여된 보상 태그는 유지된다 (별도 테이블이라 분리됨).

## Touchpoints

### DB
- `supabase/migrations/20260505260000_member_quests.sql` — 4개 테이블 + RLS + RPC + 보상 트리거
- `supabase/migrations/20260506070000_ouroboros_authority_closure.sql` — `current_user_can_see_quest` active eligibility 보강

### API / 페이지
- `src/app/api/quests.ts` — listQuests / createQuest / updateQuest / deleteQuest / setQuestAudienceTags / setQuestRewardTags / submitQuestCompletion / reviewQuestCompletion / listQuestCompletions
- `src/app/pages/member/Quests.tsx` — 회장 view (생성·수정·심사) / 부원 view (목록·신청)
- `src/app/api/tags.ts` — 미션이 보상으로 거는 태그는 여기서 만들어진 태그
