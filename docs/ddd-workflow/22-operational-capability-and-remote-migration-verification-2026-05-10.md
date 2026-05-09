# 운영 권한과 원격 마이그레이션 검증 DDD 기록

작성일: 2026-05-10

## 1. 도메인 이해

이번 도메인은 기능 자체가 아니라 Codex가 원격 Supabase에 영향을 주는 작업을 수행할 때의 운영 절차다. 실제 동아리 서비스 운영에서 비용이 큰 실수는 로컬 코드와 migration 파일만 보고 기능이 완료됐다고 판단했지만, 원격 DB에는 테이블/RPC/컬럼이 없어 실제 사용자 화면이 404나 권한 오류를 내는 상황이다.

## 2. 용어

| 한국어 용어 | 코드/문서 용어 | 의미 | 금지할 모호어 |
| --- | --- | --- | --- |
| 운영 권한 | operational capability | 현재 Codex 세션에서 실제로 실행 가능한 CLI, 환경 변수, 원격 프로젝트 연결 상태 | 아마 가능함, 나중에 적용 |
| 원격 마이그레이션 검증 | remote migration verification | local/remote migration history를 비교하고 원격 endpoint로 확인하는 절차 | 로컬 migration 있음 |
| 완료 기준 | completion gate | DB 변경 작업을 끝났다고 말하기 전에 통과해야 하는 증거 | 구현 완료 |

## 3. 경계 컨텍스트

운영 검증 컨텍스트는 행사, 폼, 태그 같은 제품 도메인의 소유 데이터를 직접 소유하지 않는다. 대신 원격 Supabase project ref, Supabase CLI 실행 가능성, 환경 변수 존재 여부, migration 적용 여부, REST/RPC 검증 결과를 소유한다.

## 4. 엔티티와 값 객체

- `OperationalCapability`: 현재 세션에서 확인된 실행 가능성. Supabase CLI, access token 존재, DB password 존재, anon key 존재가 값 객체로 붙는다.
- `RemoteMigrationState`: local/remote migration version 집합. remote에 빠진 migration이 있으면 완료 상태가 아니다.
- `EndpointVerification`: 실제 REST/RPC 호출 결과. HTTP status, body 의미, 검증 시각을 포함한다.

## 5. 애그리게이트

`RemoteChangeVerification`이 루트다. 이 애그리게이트는 `CheckCapabilities`, `CompareMigrationHistory`, `ApplyMissingMigrations`, `VerifyEndpoint`, `RecordEvidence` 명령만 완료 상태로 전이시킬 수 있다.

## 6. 불변식

| 규칙 | 범위 | 강제 위치 |
| --- | --- | --- |
| 원격 DB 변경은 migration list 확인 전 완료라고 말하지 않는다. | Supabase DB 변경 | 문서 규칙, 회귀 테스트 |
| 비밀 값은 출력하거나 문서에 남기지 않는다. 존재 여부만 기록한다. | Supabase token/password/anon key | 운영 문서, 리뷰 |
| 원격 endpoint가 실패하면 UI fallback으로 완료 처리하지 않는다. | REST/RPC read/write path | 도메인 문서, 테스트 |

## 7. 이벤트 스토밍

| Actor | Command | Domain Event | Read Model |
| --- | --- | --- | --- |
| Codex | CheckCapabilities | CapabilitiesChecked | 운영 권한 표 |
| Codex | CompareMigrationHistory | RemoteMigrationGapFound | local/remote migration list |
| Codex | ApplyMissingMigrations | RemoteMigrationsApplied | applied migration 목록 |
| Codex | VerifyEndpoint | EndpointVerified | HTTP status/body |
| Codex | RecordEvidence | OperationalEvidenceRecorded | 제품 문서, DDD note, 테스트 |

## 8. 권한, 상태, 가시성

Supabase CLI 실행 권한은 값 자체가 아니라 가능 여부만 공개한다. `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VITE_SUPABASE_ANON_KEY`는 존재 여부만 기록하고 값은 절대 출력하지 않는다.

## 9. 데이터/RLS/RPC/감사

이번 작업은 새 DB schema를 만들지 않는다. 다만 `public.events` 404의 원인이 원격 schema cache에 테이블이 없던 것이므로, 향후 DB schema 작업은 `docs/product/codex-operational-capabilities.md`에 원격 migration 적용 증거와 endpoint 검증 증거를 남긴다.

## 10. UX와 제품 흐름

사용자에게는 “테이블이 없어서 404”인지 “row가 없어서 빈 목록”인지 명확히 구분해 말해야 한다. `/rest/v1/events?select=id&limit=1`의 `200 OK []`는 기능이 죽은 것이 아니라 현재 행사 데이터가 없다는 뜻이다.

## 11. 구현 계획

1. 운영 권한/원격 검증 기준 문서를 제품 문서 인덱스와 문서 거버넌스에 연결한다.
2. 행사 도메인 문서에 실제 404 원인, 적용한 migration, endpoint 검증 결과를 남긴다.
3. `scripts/ops-documentation-policy.test.mjs`로 문서 링크와 원격 검증 절차가 빠지지 않게 회귀 테스트를 둔다.
4. `npm run typecheck`, 문서 정책 테스트, 행사 정책 테스트, 원격 migration list, 실제 REST endpoint를 검증한다.

## 12. 검증과 루프 종료

### DDD Loop Review Log

| Reviewer | Scope | Summary | Status |
| --- | --- | --- | --- |
| Domain Reviewer | 운영 권한과 제품 도메인 분리 | 운영 검증은 행사/폼 데이터를 소유하지 않고 완료 기준을 소유한다. | Approved |
| Implementation Reviewer | 테스트 가능성 | 문서 링크, 필수 명령, endpoint 증거를 정적 테스트로 고정했다. | Approved |
| Risk Reviewer | 비밀/원격 DB 위험 | 비밀 값 미출력과 원격 endpoint 검증을 불변식으로 올렸다. | Approved |

### Disagreement Register

| Disagreement | Evidence | Decision | Classification |
| --- | --- | --- | --- |
| 문서 테스트가 실제 원격 상태를 보장하지 못한다. | 정적 테스트는 CLI 실행 결과를 직접 재현하지 않는다. | 문서 테스트는 누락 방지, 실제 원격 상태는 별도 CLI/REST 검증으로 보완한다. | accepted |

### Unresolved Questions Checklist

| Question | Status |
| --- | --- |
| 원격 행사용 seed 데이터가 필요한가? | 이번 요청 범위 밖. 테이블 존재 검증은 완료했고 row 없음은 정상으로 문서화했다. |

### Approved Assumptions List

| Assumption | Owner | Risk |
| --- | --- | --- |
| 운영 권한 문서는 비밀 값 대신 존재 여부만 기록한다. | Codex | 낮음. 보안 요구와 검증 요구를 동시에 만족한다. |

### Closure Decision

운영 권한/원격 migration 검증 누락 문제는 제품 문서와 회귀 테스트로 닫는다.

검증 증거:

| Check | Result |
| --- | --- |
| `node --import tsx --test scripts/ops-documentation-policy.test.mjs` | Passed. 3 tests. |
| `npm run typecheck` | Passed. |
| `npm test` | Passed. 146 tests. |
| `npx supabase migration list --linked` | Local/Remote 모두 `20260509001000`, `20260509002000`, `20260509003000` 포함. |
| `/rest/v1/events?select=id&limit=1` | `HTTP_STATUS:200`, body `[]`. |
| Browser `/member/events` | 카드/목록 전환과 빈 상태가 렌더링됨. |
