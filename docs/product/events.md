# 행사 도메인

마지막 갱신: 2026-05-10

## 현재 구현

| 항목 | 위치 | 설명 |
| --- | --- | --- |
| 행사 목록 | `src/app/pages/member/Events.tsx` | React Query로 `listEvents()`를 호출하고 상태별 필터, 검색, 카드 보기/목록 보기를 제공한다. 카드/목록 행 본문 클릭은 상세로 이동하고, 우측 상단 세로점 메뉴는 수정 같은 관리 작업을 제공한다. |
| 행사 상세 | `src/app/pages/member/EventDetail.tsx` | URL의 행사 id를 `getEvent()`로 조회한다. 수정 권한이 있으면 상세 상단에서 행사 수정으로 이동한다. |
| 행사 생성/수정 | `src/app/pages/member/EventCreate.tsx` | 카드 나열이 아니라 단일 studio/workbench 화면에서 대표 이미지, 기본 정보, 일정, 참여 폼을 선형 작업면으로 편집한다. `events/new`는 생성, `events/:eventId/edit`는 기존 행사를 불러와 같은 작업면에서 수정한다. Zod로 기본 필드와 종료 시간이 시작 시간 이후인지 검증한다. |
| API 클라이언트 | `src/app/api/events.ts` | `events` Supabase 테이블을 읽고 생성/수정한다. 브라우저 `localStorage` 쓰기 경로는 사용하지 않는다. |
| DB 스키마/RLS | `supabase/migrations/20260509001000_events_persistence.sql` | `public.events` 테이블, `events.read/create/manage` 기반 정책, `created_by` 소유자 기준을 둔다. |

## 권한

| 동작 | 권한 |
| --- | --- |
| 목록/상세 읽기 | active member 또는 `events.read` 또는 `events.manage` |
| 생성 | `events.create` 또는 `events.manage` |
| 수정 | 생성자 또는 `events.manage` |
| 삭제 | `events.manage` |

## 데이터 원천

행사는 `public.events`가 단일 원천이다. 이전 코드의 하드코딩된 샘플 행사와 브라우저 로컬 저장은 사용자별로 데이터가 갈라지는 문제가 있으므로 새 read/write path에서 제외했다.

대표 이미지는 행사 도메인이 소유하는 `events.image_url`에 저장한다. 현재 UI는 운영자가 올린 이미지를 data URL로 저장할 수 있고, 이미지가 없으면 KOBOT 기본 로고를 사용한다. 폼은 폼 도메인의 내용을 복제하지 않고 `events.form_id`, `events.form_title` 참조만 저장한다.

## 생성 화면 디자인 원칙

- 행사 만들기는 여러 카드를 아래로 쌓는 페이지가 아니라 하나의 제작 화면이다.
- 좌측은 실제 대표 이미지 업로드/미리보기와 핵심 요약, 우측은 하나의 workbench 안에서 기본 정보, 진행 일정, 참여 폼을 선과 행으로 구분한다.
- `대표 이미지 톤` 같은 가짜 디자인 옵션은 쓰지 않는다. 이미지가 없을 때만 KOBOT 기본 로고가 대표 이미지 영역에 표시된다.
- 참여 폼은 검색 가능한 선택 팝업에서 고른다. 선택된 폼은 행사 카드와 상세 화면의 `참여하기` 버튼으로 연결된다.
- 참여자 조사, 출석 체크, 팀 편성 같은 운영 기능 토글은 이 화면의 현재 범위가 아니다.

## 운영 검증

2026-05-10 원격 Supabase에서 `/rest/v1/events`가 404를 반환한 원인은 `public.events` 테이블을 만드는 `20260509001000_events_persistence.sql`이 remote migration history에 없었기 때문이다.

확인 및 조치:

- `npx supabase migration list --linked`로 remote가 `20260508006000`까지만 적용된 상태임을 확인했다.
- `npx supabase db push --yes`로 `20260509001000_events_persistence.sql`, `20260509002000_forms_management_nav_for_vice_president.sql`, `20260509003000_invite_link_status_and_role_tag_boundary.sql`을 원격에 적용했다.
- `/rest/v1/events?select=id&limit=1`이 `200 OK`와 `[]`를 반환하는 것을 확인했다. `[]`는 테이블이 없다는 뜻이 아니라 현재 행사 row가 없다는 뜻이다.

2026-05-10 행사 생성 UI가 대표 이미지와 참여 폼 연결을 추가하면서 `/rest/v1/events`가 400을 반환한 원인은 새 read/write path가 `image_url`, `form_id`, `form_title`을 요청했지만 원격 DB에 `20260510020000_events_media_and_form_link.sql`이 아직 적용되지 않았기 때문이다.

확인 및 조치:

- `npx supabase migration list --linked`에서 `20260510020000`의 Remote가 비어 있음을 확인했다.
- `npx supabase db push --yes`로 `20260510020000_events_media_and_form_link.sql`을 원격에 적용했다.
- `/rest/v1/events?select=id,title,image_url,form_id,form_title&limit=1`이 `200 OK`와 `[]`를 반환하는 것을 확인했다.

## 검증

- `scripts/events-policy.test.mjs`에서 행사 생성/목록이 Supabase `events` 테이블을 쓰는지 확인한다.
- 같은 테스트에서 대표 이미지 톤 UI가 재도입되지 않는지, 이미지 업로드/폼 선택/참여 CTA가 유지되는지 확인한다.
- `npm run typecheck`
- `npm test`
