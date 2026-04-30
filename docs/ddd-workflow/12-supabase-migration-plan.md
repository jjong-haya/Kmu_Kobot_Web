# 12. Supabase Migration Plan

## 1. 목적

### 1.1 이 문서의 역할

이 문서는 KOBOT Web의 권한/상태/RLS를 실제 Supabase migration으로 옮기기 전 점검해야 할 실행 계획입니다.

핵심 원칙은 다음입니다.

```text
넓은 permission 문자열을 바로 삭제하지 않는다.
먼저 capability read model을 추가하고, 기존 permission은 호환 레이어로 유지한 뒤 단계적으로 줄인다.
```

## 2. Preflight

### 2.1 기존 데이터 확인

Migration 전에 다음 데이터를 먼저 확인합니다.

| 확인 | 이유 |
| --- | --- |
| `project_team_memberships.role = 'maintainer'` 존재 여부 | 제거 또는 `member` 이전 정책 필요 |
| 임시 위임 row와 프로젝트 팀장 row가 겹치는지 | delegated scope와 role이 섞였는지 확인 |
| `project_teams.status` 값 분포 | `project_only`, `withdrawn` 추가 시 route 분기 영향 확인 |
| audit log payload에 개인정보가 들어있는지 | 1년 후 redaction/delete 정책 설계 필요 |
| `projects.manage`, `members.manage`, `permissions.manage` 사용처 | capability 전환 범위 산정 |

### 2.2 실패 시 중단 조건

- 기존 DB에 `maintainer`가 많고 이전 정책이 정해지지 않은 경우
- `project_team_memberships`에 프로젝트별 lead가 2명 이상 존재하는 경우
- 감사 로그 payload가 암호화/마스킹 없이 과도한 개인정보를 포함하는 경우
- 프론트가 신규 `project_only`, `withdrawn` 상태를 처리하지 못하는 경우

## 3. 상태와 역할 변경

### 3.1 Member Status

추가해야 하는 상태입니다.

| 상태 | 의미 | 기본 라우팅 |
| --- | --- | --- |
| `project_only` | KOBOT 정회원은 아니지만 특정 프로젝트 참여 권한이 있는 계정 | `/member/pending` 안내 후 프로젝트 범위 기능만 단계 개방 |
| `withdrawn` | 탈퇴 처리된 계정 | `/member/pending` 안내 및 재가입/문의 유도 |

### 3.2 Project Role

`project_team_memberships.role`은 장기적으로 다음만 허용합니다.

| role | 의미 |
| --- | --- |
| `lead` | 프로젝트 최종 책임자 |
| `member` | 프로젝트 참여자 |

`maintainer`, `delegate`, `operator`는 role로 저장하지 않고 capability/delegation에서 표현합니다.

## 4. Helper Function 분리

### 4.1 제거 대상

`current_user_is_project_team_lead(project_id)`처럼 여러 권한 의미를 섞는 함수는 제거하거나 내부 사용을 중단합니다.

### 4.2 추가 대상

| 함수 | 판단 |
| --- | --- |
| `current_user_is_project_lead(project_id)` | 현재 사용자가 해당 프로젝트의 실제 lead인지 |
| `current_user_is_project_member(project_id)` | 현재 사용자가 해당 프로젝트 참여자인지 |
| `current_user_has_project_delegated_scope(project_id, scope)` | 기간제 위임 권한이 현재 유효한지 |
| `current_user_can_issue_project_invite(project_id)` | 초대 코드/링크 발급 가능 여부 |
| `current_user_can_review_project_join_request(project_id)` | 프로젝트 참여 신청 승인 가능 여부 |
| `current_user_can_manage_project_materials(project_id)` | 내부 자료 수정 가능 여부 |
| `current_user_can_read_private_project(project_id)` | 비공개 프로젝트 소개/내부 정보 열람 가능 여부 |
| `current_user_can_read_project_audit(project_id)` | 해당 프로젝트 감사 로그 열람 가능 여부 |
| `current_user_can_review_project_creation(project_type, official_team_id)` | 프로젝트 생성 승인 가능 여부 |

## 5. Capability Read Model

### 5.1 Shape

프론트와 RLS가 공유할 read model은 다음 구조를 목표로 합니다.

```ts
type Capability = {
  code: string
  scopeType: "organization" | "official_team" | "project" | "self"
  scopeId: string | null
  sourceType: "org_position" | "official_team_role" | "project_role" | "delegation" | "system"
  sourceId: string | null
  expiresAt: string | null
}
```

### 5.2 RPC 응답

`get_my_authorization_context` 또는 후속 RPC는 다음을 반환해야 합니다.

| 필드 | 목적 |
| --- | --- |
| `permissions` | 기존 프론트 호환용 문자열 배열 |
| `capabilities` | 신규 권한 판단 read model |
| `memberStatus` | `active`, `pending`, `project_only`, `withdrawn` 등 |
| `officialTeamRoles` | 공식 팀 기반 권한 출처 |
| `projectRoles` | 프로젝트별 lead/member |
| `delegations` | 유효 기간이 있는 임시 권한 |
| `projectOnlyProjectIds` | 프로젝트 전용 계정이 접근 가능한 프로젝트 |

## 6. RLS와 Command RPC

### 6.1 RLS 역할

RLS는 “이 row를 읽거나 쓸 수 있는가”만 판단합니다.

### 6.2 RPC 역할

다음 상태 전이는 직접 `UPDATE`하지 않고 RPC command에서 처리합니다.

| Command | 이유 |
| --- | --- |
| `request_project_creation` | 신청자, 공개 여부, 모집 방식, 공식 팀 기반 여부 검증 |
| `approve_project_creation` | 승인자 권한 source/scope 기록 |
| `request_project_join` | 중복 신청/마감/비공개 정책 검증 |
| `approve_project_join` | 프로젝트 팀장 권한 또는 위임 권한 검증 |
| `issue_project_invitation` | 초대 코드 scope, 만료일, 사용 횟수 검증 |
| `redeem_invitation` | 동시 사용과 만료를 transaction으로 처리 |
| `request_project_lead_transfer` | 요청자/피요청자/이후 본인 권한 검증 |
| `accept_project_lead_transfer` | 수락 즉시 lead 변경과 감사 로그 생성 |
| `request_temporary_delegation` | 최대 2주, 수락 필요, scope 제한 |
| `approve_member_withdrawal` | 탈퇴 요청 승인과 산출물 표시명 정책 기록 |

## 7. Audit

### 7.1 기록 원칙

감사 로그에는 최소 다음을 남깁니다.

| 필드 | 설명 |
| --- | --- |
| actor | 실제 실행자 |
| command | 실행한 command |
| capability_code | 사용한 capability |
| capability_scope | organization/official_team/project/self |
| capability_source | president, vice_president, official_team_role, project_role, delegation |
| target | 대상 멤버/프로젝트/팀 |
| before_summary | 마스킹 가능한 이전 상태 |
| after_summary | 마스킹 가능한 이후 상태 |
| private_payload | 회장/부회장만 볼 수 있는 민감 상세 |
| retention_until | 개인정보 payload 삭제 예정일 |

### 7.2 1년 보관 정책

1년 이후에는 개인정보 payload를 삭제하고, 통계/비식별 이벤트만 유지합니다.

## 8. 단계별 Migration 순서

### 8.1 Additive 단계

1. 신규 status 값을 허용한다.
2. capability read model view/function을 추가한다.
3. helper function을 추가하되 기존 helper는 유지한다.
4. audit private payload 분리 컬럼 또는 테이블을 추가한다.
5. invitation redemption 기록 테이블을 추가한다.

### 8.2 Compatibility 단계

1. 기존 `permissions` 반환은 유지한다.
2. 프론트는 신규 `capabilities`를 읽을 수 있게 타입만 먼저 확장한다.
3. 메뉴/라우트는 기존 permission과 capability를 병행해서 판단한다.

### 8.3 Enforcement 단계

1. 상태 전이 direct update RLS를 닫는다.
2. RPC command를 통해서만 승인/거절/양도/위임/탈퇴가 가능하게 한다.
3. audit log 직접 insert 권한을 제거한다.

### 8.4 Cleanup 단계

1. `maintainer` role을 제거한다.
2. 기존 broad permission 의존도를 제거한다.
3. 사용되지 않는 helper function을 제거한다.

## 9. Edge Cases

| Edge Case | 처리 |
| --- | --- |
| 프로젝트 팀장이 말 없이 탈퇴 | 공식 팀장이 강제 변경 요청, 회장/부회장 승인 |
| 임시 위임 기간 만료 직전 승인 | command 실행 시점에 `expiresAt` 재검증 |
| 초대 코드 동시 사용 | redemption transaction + unique constraint |
| 비공개 GitHub README 동기화 실패 | 마지막 성공 snapshot 우선, 없으면 내부 소개서 |
| `project_only` 계정이 전체 멤버 메뉴 접근 | route guard에서 project scope 확인 전까지 pending 안내 |
| 익명 투표 감사 요청 | 회장만 개별 투표 기록 열람 가능, UI에 사전 고지 |

## 10. 완료 기준

- [ ] 기존 데이터 preflight query 결과 저장
- [ ] 신규 status가 프론트에서 깨지지 않음
- [ ] broad permission 사용처 표 작성
- [ ] helper function 분리 migration 작성
- [ ] command RPC별 감사 로그 기록 확인
- [ ] `npm run build` 통과
- [ ] Supabase migration rollback 전략 작성
