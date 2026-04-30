# 03. Capability와 권한 모델

## 1. 가장 중요한 결론

KOBOT Web에서 권한은 `permissions` 문자열 배열 하나로 끝나면 안 됩니다.

잘못된 접근:

```text
사용자에게 projects.manage가 있다.
따라서 모든 프로젝트 관리 화면과 업데이트를 허용한다.
```

올바른 접근:

```text
사용자가 어떤 계정 상태인지 확인한다.
어떤 권한 출처로 capability를 받았는지 확인한다.
그 capability가 어느 scope에 적용되는지 확인한다.
권한이 만료/취소되지 않았는지 확인한다.
해당 command가 그 capability에 포함되는지 확인한다.
command 실행 후 audit log에 권한 근거를 기록한다.
```

즉 권한 판정은 아래 함수처럼 생각해야 합니다.

```text
isAllowed(actor, capability, target)
= actor.accountStatus == active
AND authoritySource is valid
AND authorityScope covers target
AND capability is granted
AND authority is not expired/revoked
AND command transition is valid
AND action will be audited
```

## 2. 계정 상태 모델

| 상태 | 의미 | 허용 화면 | 운영 권한 |
| --- | --- | --- | --- |
| pending | 로그인은 했지만 활동 승인 전 | 가입 정보 미완성: `/member/join`, 제출 후: `/member/pending` | 가입 요청 작성 capability만 |
| active | 정식 활동 부원 | member workspace | 부여된 capability만 |
| suspended | 정지 | 정지 안내, 문의, 로그아웃 | 없음 |
| rejected | 가입 반려 | 반려 안내, 재가입 문의 | 없음 |
| alumni | 활동 종료/졸업 | 추후 정책에 따른 제한 열람 | 없음 |
| project_only | 특정 프로젝트 참여자 | 해당 프로젝트 소개/참여 화면 | 프로젝트에서 부여된 최소 권한 |
| withdrawn | 탈퇴 완료 | 공개 산출물 표시 정책만 유지 | 없음 |

현재 DB에는 `project_only`, `withdrawn`이 없습니다. 외부 프로젝트 참여자와 탈퇴 완료 처리를 정확히 하려면 추가가 필요합니다.

## 3. Role, Capability, Delegation 분리

| 개념 | 질문 | 예시 | 저장 방식 |
| --- | --- | --- | --- |
| Role | 이 사람은 어떤 책임자인가? | 회장, 공식 팀장, 프로젝트 팀장 | assignment table |
| Capability | 이 사람이 어떤 행위를 할 수 있는가? | project.join_request.review | derived/read model or policy |
| Scope | 어디에 대해 가능한가? | organization, official_team:robot-a, project:abc | capability scope |
| Delegation | 누가 언제까지 무엇을 맡겼는가? | 7일간 참여 신청 검토 | delegation table |

### 3.1 절대 섞으면 안 되는 역할

| 역할 | 운영진인가 | 프로젝트 내부 권한인가 | 팀장인가 |
| --- | --- | --- | --- |
| 회장 | 예 | 전체 | 조직 최고 책임자 |
| 부회장 | 예 | 전체 운영 보조 | 조직 운영 책임자 |
| 공식 팀장 | 예 | 자기 공식 팀 검토/초대 | 공식 팀장 |
| 프로젝트 팀장 | 아니오 | 자기 프로젝트 | 프로젝트 팀장 |
| 프로젝트 운영 보조자 | 아니오 | 일부 프로젝트 업무 | 팀장 아님 |
| 임시 위임자 | 아니오 | 기간/범위 제한 업무 | 팀장 아님 |

## 4. 권한 출처 모델

권장 `Capability` read model:

```ts
type Capability = {
  code: string;
  scopeType: "organization" | "official_team" | "project" | "self";
  scopeId: string | null;
  source:
    | "president"
    | "vice_president"
    | "official_team_lead"
    | "project_lead"
    | "project_operator"
    | "temporary_delegation"
    | "system";
  sourceId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
};
```

이 구조가 필요한 이유:

| 상황 | 단순 permission의 문제 | Capability 모델의 해결 |
| --- | --- | --- |
| 공식 팀장이 프로젝트를 검토 | `projects.manage`면 모든 프로젝트 수정 가능해짐 | `project.creation.review` + official_team scope |
| 프로젝트 팀장이 투표 생성 | 전역 투표까지 만들 수 있음 | `vote.create.project` + project scope |
| 임시 위임자가 초대 발급 | 무제한 초대 가능해짐 | `project.invite.issue_limited` + expiresAt |
| 회장이 전체 로그 열람 | 프로젝트 팀장도 audit를 볼 수 있음 | `audit.read.organization`만 회장에게 |

## 5. Capability 카탈로그 초안

### 5.1 계정과 가입

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| account.sign_in.google | self | user | Google 로그인 시작 |
| account.sign_in.login_id | self | active user | ID 로그인 |
| member.application.review | organization 또는 official_team | president, vice_president, official_team_lead | 가입 신청 검토 |
| member.activate | organization | president, vice_president | 활동 부원 승인 |
| member.reject | organization | president, vice_president | 가입 반려 |
| member.suspend | organization | president, vice_president | 정지 |
| member.exit.review | organization | president, vice_president | 동아리 탈퇴 검토 |
| profile.update.self | self | active user | 자기 프로필 수정 |
| login_id.create.self | self | active user | ID 로그인 생성 |

pending 사용자는 가입 요청이 미완성일 때만 `/member/join`에서 `profile.update.self`, `login_id.create.self`를 갖습니다. 가입 요청 제출 후 `/member/pending`에서는 해당 CTA를 다시 열지 않습니다.

### 5.2 공식 팀

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| official_team.read | official_team | active member | 공식 팀 정보 조회 |
| official_team.member.invite | official_team | official_team_lead | 자기 팀 초대 |
| official_team.member.assign | official_team | president, vice_president | 팀원 배정 |
| official_team.lead.assign | official_team | president | 공식 팀장 임명 |
| official_team.project.review | official_team | official_team_lead | 공식 팀 기반 프로젝트 검토 |
| official_team.audit.read | official_team | president, vice_president, official_team_lead | 공식 팀 범위 로그 조회 |

### 5.3 프로젝트

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| project.creation.submit | organization | active member | 프로젝트 생성 신청 |
| project.creation.review | official_team 또는 organization | official_team_lead, president, vice_president | 생성 신청 검토 |
| project.creation.approve | organization | president, vice_president | 생성 최종 승인 |
| project.read.public | project | active member 또는 공개 방문자 | 공개 프로젝트 소개 조회 |
| project.read.private_intro | project | applicant, participant, operator | 비공개 프로젝트 소개서 조회 |
| project.read.internal | project | project_member | 내부 자료 조회 |
| project.update.basic | project | project_lead | 기본 정보 수정 |
| project.visibility.change | project | project_lead + approval 필요 | 공개 범위 변경 |
| project.archive | project | project_lead + president/vice approval | 아카이브 |
| project.member.invite | project | project_lead, temporary_delegation(scope) | 프로젝트 초대 |
| project.join_request.review | project | project_lead, temporary_delegation(scope) | 참여 신청 검토 |
| project.member.role.change | project | project_lead | 프로젝트 역할 변경 |
| project.member.exit.review | project | project_lead | 팀원 탈퇴 승인 |
| project.material.manage | project | project_lead, project_operator, temporary_delegation(scope) | 내부 자료 관리 |
| project.activity_log.write | project | project_member | 활동 기록 작성 |
| project.audit.read | project | project_lead, president, vice_president | 프로젝트 감사 기록 조회 |

중요:

- `project_operator`가 있다면 팀장 권한과 분리합니다.
- 임시 위임자는 scope에 포함된 capability만 수행합니다.
- 프로젝트 팀장은 운영진이 아닙니다.

### 5.4 GitHub README

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| github.repository.link | project | project_lead | 저장소 연결 |
| github.repository.change | project | project_lead | 저장소 변경 |
| github.repository.disconnect | project | project_lead | 저장소 연결 해제 |
| github.readme.sync_request | project | project_lead, temporary_delegation(scope) | README 동기화 요청 |
| github.readme.snapshot.read | project | authorized viewer | 권한에 맞는 README snapshot 조회 |
| project.intro_policy.change | project | project_lead | 내부/GitHub/최신 우선 정책 변경 |

### 5.5 연락 요청

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| contact.request.send | self | active member 또는 project_only | 연락 요청 전송 |
| contact.request.respond | self | recipient | 수락/거절 |
| contact.request.report | self | recipient | 신고 |
| contact.abuse.review | organization | president, vice_president | 신고 검토 |
| contact.abuse.action | organization | president, vice_president | 경고/제한/정지 |

### 5.6 투표

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| vote.create.organization | organization | president, vice_president | 전체 부원 투표 생성 |
| vote.create.official_team | official_team | official_team_lead | 공식 팀 투표 생성 |
| vote.create.project | project | project_lead | 프로젝트 투표 생성 |
| vote.publish | matching scope | vote creator 권한자 | 투표 오픈 |
| vote.edit_before_open | matching scope | creator/manager | 오픈 전 수정 |
| vote.cancel | matching scope | 권한자 | 투표 취소 |
| vote.close | matching scope | system 또는 권한자 | 종료 |
| vote.result.publish | matching scope | 권한자 | 결과 공개 |
| vote.ballot.submit | self | eligible voter | 투표 제출 |
| vote.ballot.revoke_before_close | self | eligible voter if policy allows | 투표 수정/철회 정책이 있다면 |

단일 `votes.manage`는 금지합니다. 최소한 scope별로 나눠야 합니다.

### 5.7 감사 로그

| Capability | Scope | 기본 출처 | 설명 |
| --- | --- | --- | --- |
| audit.read.organization | organization | president | 전체 감사 로그 |
| audit.read.operations | organization | president, vice_president | 운영 감사 로그 |
| audit.read.official_team | official_team | official_team_lead | 공식 팀 범위 로그 |
| audit.read.project | project | project_lead | 프로젝트 범위 감사 로그 |
| audit.read.self | self | user | 자기 관련 기록 일부 |
| audit.read.privacy | organization | president, vice_president | 개인정보/신고/제재 민감 로그 |

익명 투표 개별 ballot은 감사 로그와 별도 보호 모델이 필요합니다. 운영진도 개별 선택지를 볼 수 없게 해야 합니다.

## 6. Role별 기본 capability 매트릭스

| 역할 | 기본 capability |
| --- | --- |
| 회장 | 모든 organization scope capability, 권한 카탈로그 관리, 전체 감사 로그 |
| 부회장 | 대부분의 운영 capability, 단 권한 카탈로그/회장 직접 임명 등 일부 제한 가능 |
| 공식 팀장 | 자기 official_team scope의 초대, 검토, 팀원 확인, 공식 팀 로그 |
| 프로젝트 팀장 | 자기 project scope의 참여 신청, 초대, 자료, 소개서, 프로젝트 투표, 탈퇴 승인 |
| 프로젝트 운영 보조자 | 명시적으로 부여된 project scope의 자료/활동 관리 정도 |
| 임시 위임자 | delegation scope에 포함된 capability만, 최대 7일 |
| 일반 부원 | 자기 프로필, 연락 요청, 프로젝트 신청, 공개/참여 프로젝트 조회 |
| 프로젝트 전용 참여자 | 허용된 프로젝트 소개/신청/참여 범위만 |
| 가입 요청 작성 중 사용자 | 필수 프로필 입력, ID 로그인 설정, 회원가입 요청 제출 |
| 승인 대기 사용자 | 승인 상태 조회, 운영진 문의, 로그아웃 |

## 7. 임시 위임 설계

### 7.1 모델

```text
authority_delegation
- id
- project_team_id
- delegator_user_id
- delegate_user_id
- status: pending | accepted | rejected | revoked | expired
- scopes: text[]
- reason
- starts_at
- expires_at
- accepted_at
- created_at
- source_audit_log_id
```

### 7.2 허용 scope 예시

| Scope | 허용 command |
| --- | --- |
| invite_members | IssueLimitedProjectInvite |
| review_join_requests | ApproveJoinRequest, RejectJoinRequest |
| manage_project_materials | AddProjectMaterial, UpdateProjectMaterial |
| manage_activity_logs | CreateProjectActivityLog, EditOwnProjectActivityLog |
| request_readme_sync | RequestReadmeSync |

### 7.3 명시적 금지

임시 위임자는 다음을 할 수 없습니다.

| 금지 | 이유 |
| --- | --- |
| 프로젝트 팀장 변경 | 소유권 변경 |
| 프로젝트 공개 범위 변경 | 비공개 정보 노출 가능 |
| 프로젝트 삭제/아카이브 | 회복 어려움 |
| GitHub 저장소 연결/변경/해제 | 외부 private 권한과 연결 |
| 임시 위임 재위임 | 권한 확산 |
| 팀원 강제 제외 | 분쟁 위험 |
| 프로젝트 이름/유형 변경 | 공식 기록 변경 |
| 투표 시작/종료/결과 확정 | 의사결정 조작 위험 |
| 민감 감사 로그 열람 | 개인정보/감사 정보 접근 |
| 연락 신고 처리/제재 | 운영진 조치 영역 |

## 8. 프로젝트 운영 보조자 유지 여부

사용자와의 이전 결정은 “부팀장 대신 임시 위임”입니다. 따라서 `maintainer`는 1차 구현에서 제거하거나 아래처럼 낮은 권한으로 재정의해야 합니다.

| 선택 | 권장도 | 설명 |
| --- | --- | --- |
| maintainer 제거 | 높음 | 정책과 가장 일치. 프로젝트 팀장과 일반 팀원 사이를 두지 않음. |
| project_operator로 재정의 | 중간 | 상시 운영 보조자이지만 팀장 권한 금지. |
| maintainer를 팀장급으로 유지 | 금지 | 현재 발견된 권한 사고의 원인. |

권장 결정:

```text
1차 구현에서는 maintainer를 프로젝트 팀장급으로 쓰지 않는다.
필요하다면 project_operator라는 별도 역할로 두고 capability를 명시적으로 제한한다.
임시 부재 처리는 TemporaryProjectDelegation으로 해결한다.
```

## 9. RLS와 RPC 설계 원칙

| 레이어 | 책임 | 예시 |
| --- | --- | --- |
| RLS | 사용자가 row를 읽거나 쓸 최소 권한이 있는지 방어 | 자기 알림 select, 자기 프로젝트 select |
| RPC/Command Handler | 상태 전이, 권한 scope, 감사 로그, 알림 생성 | `approve_project_join_request()` |
| Frontend | capability read model에 따라 CTA 표시 | `이 프로젝트 참여 승인` 버튼 표시 |

절대 하면 안 되는 것:

```text
프론트가 invitation_codes.used_count를 직접 update
프론트가 project_team_join_requests.status를 직접 approved로 update
RLS 함수 하나가 lead/maintainer/delegate를 전부 team lead로 반환
```

권장 RPC 예시:

```text
redeem_invitation(raw_code text)
approve_project_join_request(request_id uuid, reason text)
reject_project_join_request(request_id uuid, reason text)
request_temporary_project_delegation(project_id uuid, delegate_id uuid, scopes text[], expires_at timestamptz)
accept_temporary_project_delegation(delegation_id uuid)
create_project_vote(project_id uuid, payload jsonb)
submit_vote_ballot(vote_id uuid, option_ids uuid[])
```

## 10. 함수 이름 규칙

현재 위험한 이름:

```text
current_user_is_project_team_lead(project_team_id)
```

문제:

- lead 외에 maintainer/delegate까지 포함할 수 있습니다.
- 이름과 실제 의미가 다릅니다.
- 감사/투표/위임 같은 민감 권한에도 재사용될 수 있습니다.

권장 함수:

```text
current_user_is_official_team_lead(official_team_id)
current_user_is_project_lead(project_team_id)
current_user_is_project_operator(project_team_id)
current_user_has_project_delegated_scope(project_team_id, scope)
current_user_can_review_project_join_request(project_team_id)
current_user_can_issue_project_invite(project_team_id)
current_user_can_manage_project_material(project_team_id)
current_user_can_create_project_vote(project_team_id)
current_user_can_read_project_audit(project_team_id)
current_user_can_review_official_team_project(official_team_id)
```

## 11. UI 권한 표시 규칙

프론트는 사용자가 “내가 어떤 자격으로 이 버튼을 누르는지” 알 수 있어야 합니다.

| 상황 | 표시 문구 |
| --- | --- |
| 공식 팀장으로 검토 | `공식 팀장 권한으로 검토` |
| 프로젝트 팀장으로 승인 | `이 프로젝트 팀장 권한으로 승인` |
| 임시 위임으로 처리 | `임시 운영 대행 권한으로 처리, YYYY-MM-DD까지` |
| 회장으로 처리 | `전체 운영 권한으로 처리` |
| 프로젝트 운영 보조자로 처리 | `프로젝트 운영 보조 권한으로 처리` |

금지 표현:

| 금지 표현 | 대체 표현 |
| --- | --- |
| 팀장 이상 | 운영진, 공식 팀장 이상, 이 프로젝트 관리자 |
| 관리자 | 전체 운영 관리자, 프로젝트 관리자 |
| 승인자 | 가입 승인자, 프로젝트 승인자, 참여 승인자 |
| 권한 변경 | 공식 팀 직책 변경, 프로젝트 역할 변경 |
| 팀장 권한 | 공식 팀장 권한, 프로젝트 팀장 권한 |

## 12. Join/Pending/Restricted 화면 권한 규칙

승인 전 화면은 두 단계로 분리합니다. `/member/join`은 가입 요청서를 작성하는 화면이고, `/member/pending`은 요청 제출 후 승인만 기다리는 안내 화면입니다.

### 12.1 Join 화면 허용 CTA

| CTA | 이유 |
| --- | --- |
| 회원가입 요청하기 | 필수 정보와 ID 로그인을 제출 |
| 로그아웃 | 계정 전환 |

### 12.2 Pending 화면 허용 CTA

허용 CTA:

| CTA | 이유 |
| --- | --- |
| 승인 상태 새로고침 | 승인 직후 진입 가능 |
| 운영진 문의 | 문제 해결 |
| 로그아웃 | 계정 전환 |
| 참여 코드 입력 | 정책 확정 시, 단 ID/프로필 생성과 분리 |

금지 CTA:

| CTA | 이유 |
| --- | --- |
| ID 생성 | 가입 요청서는 이미 제출됐고, 승인 대기 화면에서 다시 열면 흐름이 섞임 |
| 프로필 설정 | 가입 요청서는 이미 제출됐고, 수정은 운영진 문의 또는 별도 수정 요청으로 처리 |
| 프로젝트 생성 | active member 전용 |
| 팀 초대 발급 | 권한 없음 |
| 관리자 화면 이동 | 권한 없음 |

## 13. 감사 로그 권한 근거 스냅샷

모든 중요한 command는 아래 정보를 audit log에 남겨야 합니다.

```json
{
  "actorUserId": "uuid",
  "actorAccountStatus": "active",
  "authoritySource": "temporary_delegation",
  "authoritySourceId": "delegation_uuid",
  "authorityScopeType": "project",
  "authorityScopeId": "project_uuid",
  "capability": "project.join_request.review",
  "targetType": "project_join_request",
  "targetId": "request_uuid",
  "reason": "지원 역할이 프로젝트 모집 조건과 일치함",
  "createdAt": "2026-04-29T00:00:00+09:00"
}
```

이 정보가 없으면 나중에 “누가 어떤 자격으로 승인했는지” 알 수 없습니다.

## 14. 구현 우선순위

| 우선순위 | 작업 |
| --- | --- |
| P0 | pending/profile/ID 접근 가드 정리 |
| P0 | `current_user_is_project_team_lead` 의미 분리 |
| P0 | capability read model에 scope/source/expiresAt 추가 |
| P0 | invitation redemption RPC 설계 |
| P1 | 프로젝트 생성 승인 request 모델 분리 |
| P1 | GitHub repository connection/readme snapshot 모델 추가 |
| P1 | vote capability scope 분리 |
| P1 | audit log authority snapshot 확장 |
| P2 | 연락 요청 anti-abuse 정책 강화 |
| P2 | alumni/project_only/withdrawn 상태 세분화 |
