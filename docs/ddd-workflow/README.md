# KOBOT Web DDD Workflow

## 1. 목적

### 1.1 이 폴더의 역할

이 폴더는 KOBOT Web에서 앞으로 어떤 작업을 하든 구현 전에 확인해야 하는 DDD 기반 작업 장부입니다.

기존 `docs/ddd`는 도메인 설계 원본입니다. 이 폴더는 실제 작업을 진행하기 위한 실행 흐름입니다.

```text
결정 체크리스트 -> 인벤토리 -> 도메인 발견 -> 이벤트 스토밍 -> 데이터/보안
-> 기능 명세 -> 디자인 명세 -> 구현 계획 -> 태스크 -> 리뷰 -> 검증
```

### 1.2 기준

| 항목 | 값 |
| --- | --- |
| 작성일 | 2026-04-30 |
| 프로젝트 루트 | `C:\Users\jongh\Desktop\kook\2026-1\코봇\Web_final` |
| 서비스 도메인 | `https://kobot.kookmin.ac.kr` |
| 공식 문의처 | `kobot@kookmin.ac.kr` |
| 기본 언어 | 한국어 |

## 2. 문서 목록

| 순서 | 문서 | 역할 |
| --- | --- | --- |
| 0 | [00-user-decision-checklist.md](./00-user-decision-checklist.md) | 사용자가 먼저 정해야 할 결정과 열린 질문 |
| 1 | [01-project-inventory.md](./01-project-inventory.md) | 현재 프로젝트 전체 파일 구조와 책임 |
| 2 | [02-domain-discovery.md](./02-domain-discovery.md) | 용어, 바운디드 컨텍스트, Aggregate |
| 3 | [03-event-storming.md](./03-event-storming.md) | Actor, Command, Event, Policy, Read Model |
| 4 | [04-data-schema-and-security.md](./04-data-schema-and-security.md) | DB/RLS/RPC/감사/개인정보 설계 |
| 5 | [05-functional-spec.md](./05-functional-spec.md) | 기능 명세와 Acceptance Criteria |
| 6 | [06-design-spec.md](./06-design-spec.md) | IA, 라우트, 화면 상태, UX 문구 |
| 7 | [07-implementation-plan.md](./07-implementation-plan.md) | 단계별 구현 계획과 Gate |
| 8 | [08-task-checklist.md](./08-task-checklist.md) | 작은 작업 단위 체크리스트 |
| 9 | [09-agent-review-log.md](./09-agent-review-log.md) | 서브 에이전트 리뷰 결과 |
| 10 | [10-verification-and-release.md](./10-verification-and-release.md) | 검증/릴리스 기준 |
| 11 | [11-harness-engineering.md](./11-harness-engineering.md) | Windows/UTF-8/명령 실행/배포/검증 하네스 설계 |
| 12 | [12-supabase-migration-plan.md](./12-supabase-migration-plan.md) | Supabase 권한/RLS/RPC migration 실행 계획 |

## 3. 작업 규칙

### 3.1 구현 전

1. `00-user-decision-checklist.md`에서 P0/P1 질문을 확인한다.
2. 관련 bounded context를 `02-domain-discovery.md`에서 확인한다.
3. command/event/policy를 `03-event-storming.md`에 추가한다.
4. DB/RLS/RPC 영향이 있으면 `04-data-schema-and-security.md`에 먼저 반영한다.
5. 기능/UX가 있으면 `05-functional-spec.md`, `06-design-spec.md`를 업데이트한다.
6. 구현할 작은 작업을 `08-task-checklist.md`에 체크박스로 만든다.

### 3.2 구현 중

- 한 번에 큰 기능을 만들지 않는다.
- 권한, 개인정보, 감사 로그, 상태 전이가 관련되면 반드시 “왜?” 질문을 추가한다.
- 새 질문이 나오면 `00-user-decision-checklist.md`로 돌아간다.

### 3.3 구현 후

- 검증 결과를 `10-verification-and-release.md`에 적는다.
- 에이전트 리뷰나 코드 리뷰 발견은 `09-agent-review-log.md`에 남긴다.

## 4. 최우선 경고

### 4.1 권한 경계

공식 팀장, 프로젝트 팀장, project_operator, 임시 위임자는 같은 권한이 아닙니다.

```text
Role = 신분 또는 책임
Capability = 특정 행위 가능성
Scope = 적용 범위
Source = 권한 출처
Delegation = 기간제 capability
```

### 4.2 화면 경계

`/member/join`은 가입 요청서이고, `/member/pending`은 승인 대기 안내입니다.

pending 화면에는 ID 생성, 프로필 수정, 프로젝트 생성 같은 CTA를 두지 않습니다.

### 4.3 데이터 경계

RLS는 row 접근 제어이고, 상태 전이는 RPC command에서 검증해야 합니다.

감사 로그는 사용자가 직접 insert하지 않습니다.
