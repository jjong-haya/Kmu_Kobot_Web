# 행사 생성 화면 재설계 DDD 기록

작성일: 2026-05-10

## Root Cause

행사 목록은 카드/목록 보기로 정리했지만, 행사 생성은 운영자가 한 번에 작성해야 하는 명령 화면인데도 기본 정보, 신청 폼, 조사, 출석, 팀 편성을 카드처럼 쪼개어 배치했다. 또한 `React Hook Form` 상태와 별도 `useState` 상태가 섞이고, 제출 함수 안에 `return` 뒤 죽은 검증 코드가 남아 있어 화면 구조와 쓰기 경계가 함께 흐려졌다.

## Bounded Context

- Context: Event Management
- Actor: `events.create` 또는 `events.manage` 권한을 가진 운영자
- Command: `CreateEvent`
- Aggregate: `ClubEvent`
- Owned data: `public.events` row와 `features` JSON
- UI read model: 생성 중 preview는 임시 화면 상태이며 DB에는 저장하지 않는다.

## Invariants

| Rule | Enforced by |
| --- | --- |
| 제목, 설명, 시작, 종료, 장소는 비어 있을 수 없다. | Zod validation in `EventCreate.tsx` |
| 종료 시간은 시작 시간 이후여야 한다. | Zod refine |
| 신청 폼 기능을 켜면 신청 URL이 필요하다. | Submit boundary |
| 생성 화면은 카드 나열이 아니라 단일 workbench 안에서 확장한다. | `scripts/events-policy.test.mjs` |

## Event Storming

| Actor | Command | Domain Event | Read Model |
| --- | --- | --- | --- |
| Operator | FillEventDraft | EventDraftEdited | Preview panel |
| Operator | ToggleEventFeature | EventFeatureEnabled | Feature disclosure row |
| Operator | CreateEvent | EventCreated | Event detail route |

## Implementation

- `src/app/pages/member/EventCreate.tsx`: 단일 studio/workbench 레이아웃으로 교체, 이중 상태/죽은 코드 제거.
- `scripts/events-policy.test.mjs`: 행사 생성 화면이 stacked option cards로 회귀하지 않도록 정적 테스트 추가.
- `docs/product/events.md`: 생성 화면 디자인 원칙 기록.

## Review Log

| Reviewer | Scope | Result |
| --- | --- | --- |
| Domain Reviewer | 운영자가 수행하는 CreateEvent 명령과 임시 preview 상태 분리 | Approved |
| Implementation Reviewer | 상태 단순화, 죽은 코드 제거, 테스트 가능성 | Approved |
| Risk Reviewer | 카드 나열 회귀, 신청 URL 검증, 원격 저장 경계 | Approved |

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `node --import tsx --test scripts/events-policy.test.mjs` | Passed. 13 tests. |
| `npm test` | Passed. 147 tests. |
| Browser `/member/events/new` | 좌측 미리보기와 우측 단일 workbench가 렌더링됨. |
