# Events View Mode DDD Note

## Domain Understanding

행사 목록은 같은 행사 read model을 두 가지 사용 목적에 맞게 보여줘야 한다.

- 카드 보기: 이미지와 상태가 먼저 보이는 탐색용 화면.
- 목록 보기: 일정, 장소, 정원, 기능 태그를 빠르게 비교하는 운영/스캔용 화면.

현재 구현은 `EventCard` 그리드만 렌더링해서 사용자가 목록형 비교를 할 수 없었다.

## Bounded Context

- Events Read Context
  - Actor: active member 또는 `events.read/manage` 사용자
  - Owned read model: `ClubEvent`
  - Projection: `EventCard`, `EventListItem`
  - Invariant: 보기 방식은 UI projection 상태일 뿐이며, 행사 데이터 원천이나 권한 정책을 바꾸면 안 된다.

## Implementation Plan

- `Events.tsx`에 `EventViewMode = "card" | "list"` 상태를 추가한다.
- 검색창 옆에 카드/목록 segmented control을 둔다.
- 기존 카드는 그대로 유지하고, 목록형 `EventListItem` projection을 추가한다.
- `events-policy.test.mjs`에 카드/목록 보기 회귀 테스트를 추가한다.
- `docs/product/events.md`에 행사 목록의 카드/목록 보기 요구를 기록한다.

## Verification

- `npm run typecheck`
- `npm test -- scripts/events-policy.test.mjs`
