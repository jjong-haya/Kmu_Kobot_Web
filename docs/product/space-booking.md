# 공간 예약

마지막 갱신: 2026-05-09

## 현재 구현

| 항목 | 위치 | 설명 |
| --- | --- | --- |
| 월간/주간 캘린더 | `src/app/pages/member/SpaceBooking.tsx` | 날짜를 클릭하면 기존 월간 달력에서 해당 주만 남고 아래에 상세 영역이 펼쳐진다. |
| 선택 날짜 상세 | `src/app/pages/member/SpaceBooking.tsx` | 선택된 날짜의 예약 목록을 시간순으로 표시한다. |
| 예약 생성 | `src/app/pages/member/SpaceBooking.tsx`, `src/app/api/space-bookings.ts` | `create_space_booking` RPC를 호출한다. 같은 날/과거 예약과 시간 충돌은 UI와 DB write path 양쪽에서 막는다. |
| 공개 읽기 | `src/app/api/space-bookings.ts` | 공개 캘린더는 제한된 컬럼만 읽고 참가자/태그/팀 공개 범위는 노출하지 않는다. |

## 중요한 경계

- 공간 예약은 `space_bookings` 도메인이다.
- 참석자, 공개 대상 태그, 팀 공개 범위는 `space_booking_participants`, `space_booking_audience_tags`, `space_booking_audience_teams`가 소유한다.
- 예약 UI에 남아 있는 `personal` 타입은 과거 데이터 표시용이고, 새 예약 생성 옵션은 `meeting`, `study`만 허용한다.

## 검증

- `scripts/space-booking-conflicts.test.mjs`에서 충돌 방지, 당일 예약 금지, 제거된 `personal` 타입 부활 방지를 확인한다.
- `npm run typecheck`
- `npm test`
