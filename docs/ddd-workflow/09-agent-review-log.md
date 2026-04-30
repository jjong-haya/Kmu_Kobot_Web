# 09. 에이전트 리뷰 로그

## 1. 리뷰 요약

### 1.1 핵심 합의

네 관점의 리뷰가 공통으로 지적한 P0 위험은 다음입니다.

```text
공식 팀장, 프로젝트 팀장, maintainer, 임시 위임자를 같은 team lead 또는 projects.manage로 섞으면 안 된다.
```

### 1.2 합의 원칙

| 원칙 | 설명 |
| --- | --- |
| Role과 Capability 분리 | 신분/직책과 행위 가능성은 다르다 |
| Scope 필수 | 권한은 organization, official_team, project, self 범위가 있어야 한다 |
| Source 필수 | 권한 출처가 president인지 delegation인지 기록해야 한다 |
| Delegation은 role이 아님 | 기간과 scope가 제한된 임시 capability다 |
| Audit은 command 내부에서 | 사용자가 직접 insert하면 안 된다 |

## 2. 리뷰 기록

### 2.1 계정/권한 리뷰

| 항목 | 내용 |
| --- | --- |
| 역할 | 계정/권한/회원 도메인 |
| 핵심 발견 | 같은 permission code라도 권한 출처, 범위, 계정 상태, 승인 절차, 감사 로그가 함께 필요 |
| 위험 | 공식 팀장, 프로젝트 팀장, maintainer, 임시 위임자가 `projects.manage`로 합쳐짐. 비국민대 계정 생성 전 차단은 안내/탈퇴 기록 요구와 충돌 가능 |
| 반영 위치 | `02-domain-discovery.md`, `04-data-schema-and-security.md` |

### 2.2 프로젝트/공식팀/GitHub 리뷰

| 항목 | 내용 |
| --- | --- |
| 역할 | 프로젝트/공식팀/GitHub 연동 도메인 |
| 핵심 발견 | OfficialTeam, ProjectCreationRequest, Invitation, GitHubRepositoryConnection을 분리해야 함 |
| 위험 | DB `project_teams.status=pending`만으로 승인 전 신청서/사전모집/검토 이력을 담기 어려움 |
| 반영 위치 | `02-domain-discovery.md`, `03-event-storming.md`, `05-functional-spec.md` |

### 2.3 DB/RLS/감사 로그 리뷰

| 항목 | 내용 |
| --- | --- |
| 역할 | DB/RLS/데이터 스키마/감사 로그 |
| 핵심 발견 | RLS는 row 접근만 담당하고 상태 전이는 RPC command로 처리해야 함 |
| 위험 | contact_requests, join_requests, role_transfer_requests, authority_delegations 등이 관련자 update로 상태 조작 가능 |
| 반영 위치 | `04-data-schema-and-security.md`, `08-task-checklist.md` |

### 2.4 IA/UX/운영 프로세스 리뷰

| 항목 | 내용 |
| --- | --- |
| 역할 | IA/UX/운영 프로세스 |
| 핵심 발견 | `/member/join`은 가입 요청서, `/member/pending`은 승인 대기 안내로 분리해야 함 |
| 위험 | 프로젝트 팀장이 Admin처럼 보이거나 pending 화면에 ID 생성 CTA가 남는 문제 |
| 반영 위치 | `06-design-spec.md`, `00-user-decision-checklist.md` |

## 3. 후속 리뷰 필요 항목

### 3.1 추가 리뷰 반영: Auth/Join/Pending

| 항목 | 내용 |
| --- | --- |
| 원문 오류 노출 | `PKCE`, `schema cache`, `Could not find function`, `.env` 같은 개발자 메시지는 사용자 화면에 노출하지 않는다 |
| PKCE 처리 | Supabase client 자동 URL 감지와 `AuthCallback.exchangeCodeForSession`이 중복되지 않게 수동 처리 한 곳으로 통일한다 |
| 원래 링크 복귀 | `/login`, `/auth/callback`, `/member/join`, `/member/pending` 전 구간에서 safe internal `next`를 보존한다 |
| 가입 화면 | Google 이름은 실명으로 단정하지 않고 “참고해 입력됨, 다르면 수정”으로 안내한다 |
| ID 변경 | 최초 생성 후 직접 변경은 막고 별도 요청 플로우로 분리한다 |
| 신규 status | `project_only`, `withdrawn`을 프론트 타입과 안내 화면에서 깨지지 않게 처리한다 |

### 3.2 추가 리뷰 반영: Capability/Permission

| 항목 | 내용 |
| --- | --- |
| broad permission | `projects.manage`, `members.manage`, `permissions.manage`를 즉시 제거하지 않고 capability 병행 레이어로 이전한다 |
| helper 분리 | `current_user_is_project_team_lead` 의미를 lead/member/delegation/private-read/audit helper로 분리한다 |
| delegation | 임시 위임은 role이 아니라 `scope`, `source`, `expiresAt`을 가진 capability로 표현한다 |
| audit | 실행 command가 어떤 capability source/scope로 승인되었는지 감사 로그에 남긴다 |
| migration 순서 | additive -> compatibility -> enforcement -> cleanup 순서로 진행한다 |

### 3.3 열린 리뷰

| ID | 질문 | 필요한 리뷰 |
| --- | --- | --- |
| REVIEW-001 | `maintainer` 제거 migration의 기존 데이터 변환 방식 | 권한 + DB |
| REVIEW-002 | 실제 Supabase DB에 `project_only`, `withdrawn` 적용 전 preflight 결과 | DB |
| REVIEW-003 | capability read model을 프론트 메뉴에 적용할 호환 기간 | UX + 권한 |
| REVIEW-004 | 감사 로그 private payload 저장 위치와 1년 후 삭제 job | DB + 개인정보 |
| REVIEW-005 | GitHub README private fallback 구현 방식 | Integration + UX |

## 4. 리뷰 사용 규칙

### 4.1 구현 전

관련 task의 리뷰 항목이 있으면 먼저 확인한다.

### 4.2 구현 중

새로운 위험이 나오면 이 로그에 추가하고 `00-user-decision-checklist.md`에 질문을 등록한다.
