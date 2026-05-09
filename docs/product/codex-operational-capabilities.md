# Codex 운영 권한과 원격 검증 기준

마지막 갱신: 2026-05-10

이 문서는 Codex가 현재 작업공간에서 무엇을 실제로 실행할 수 있는지, DB/배포/검증 작업을 할 때 무엇을 먼저 확인해야 하는지 정한다.

## 핵심 원칙

- 코드에 migration 파일이 있다고 해서 원격 Supabase에 적용된 것이 아니다.
- 원격 DB 오류가 보이면 먼저 실제 원격 상태를 확인한다.
- Codex가 실행 가능한 권한과 도구를 확인하지 않은 상태로 "못 한다" 또는 "사용자가 해야 한다"고 단정하지 않는다.
- 원격 DB 변경이 필요한 작업은 마이그레이션 적용 여부까지 검증해야 완료다.

## 현재 세션에서 확인해야 하는 권한

아래 항목은 값을 출력하지 않고 존재 여부만 확인한다.

| 항목 | 확인 명령 | 의미 |
| --- | --- | --- |
| Supabase CLI | `npx supabase --version` | 원격 migration 명령 실행 가능 여부 |
| 연결 프로젝트 | `supabase/.temp/project-ref`, `supabase/.temp/linked-project.json` | 어떤 Supabase 프로젝트에 연결되어 있는지 |
| Supabase access token | `SUPABASE_ACCESS_TOKEN` 존재 여부 | Supabase CLI가 원격 프로젝트를 조회/조작할 수 있는지 |
| DB password | `SUPABASE_DB_PASSWORD` 존재 여부 | `db push`, migration list 등 원격 DB 작업 가능 여부 |
| 프론트 anon key | `.env.local`의 `VITE_SUPABASE_ANON_KEY` 존재 여부 | PostgREST read 검증 가능 여부 |

시크릿 값은 절대 문서나 응답에 쓰지 않는다. 존재 여부와 검증 결과만 기록한다.

## DB 변경 작업 완료 기준

DB migration이 추가되거나, 코드가 새 테이블/RPC/컬럼을 호출하면 아래를 모두 수행한다.

1. `npx supabase migration list --linked`로 Local/Remote 차이를 확인한다.
2. 원격에 빠진 migration이 있으면 `npx supabase db push --yes`를 실행한다.
3. 다시 `npx supabase migration list --linked`로 Local/Remote가 맞는지 확인한다.
4. 코드가 호출하는 실제 REST/RPC endpoint를 한 번 호출해 상태 코드를 확인한다.
5. UI 변경이면 브라우저에서 실제 화면 또는 모킹된 정상 응답으로 주요 흐름을 확인한다.
6. 검증 결과를 해당 도메인 문서와 DDD workflow note에 남긴다.

## 행사 도메인 사례

2026-05-10에 `/rest/v1/events`가 404를 냈다. 원인은 `public.events` 테이블이 원격 Supabase schema cache에 없었기 때문이다.

확인 결과:

- `npx supabase --version`: 사용 가능
- `SUPABASE_ACCESS_TOKEN`: 존재
- `SUPABASE_DB_PASSWORD`: 존재
- `npx supabase migration list --linked`: 원격은 `20260508006000`까지만 적용, 로컬은 `20260509001000` 이후 3개 migration 존재

조치:

- `npx supabase db push --yes`로 아래 migration을 적용했다.
  - `20260509001000_events_persistence.sql`
  - `20260509002000_forms_management_nav_for_vice_president.sql`
  - `20260509003000_invite_link_status_and_role_tag_boundary.sql`

검증:

- `/rest/v1/events?select=id&limit=1`이 `200 OK`와 `[]`를 반환했다.
- `[]`는 테이블이 없다는 뜻이 아니라 현재 저장된 행사 row가 없다는 뜻이다.

## 반복 방지

- 새 Supabase table/RPC/column을 참조하는 PR은 원격 migration 확인 없이 완료로 말하지 않는다.
- `scripts/ops-documentation-policy.test.mjs`는 이 문서가 원격 migration 검증 절차를 계속 포함하는지 확인한다.
