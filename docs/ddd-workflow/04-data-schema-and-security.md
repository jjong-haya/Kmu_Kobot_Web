# 04. 데이터 스키마와 보안

## 1. 현재 데이터 모델 현황

### 1.1 마이그레이션 파일

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20260325150000_auth_rbac.sql` | 조직, 프로필, 멤버 계정, 공식 팀, RBAC, OAuth hook, 로그인 ID RPC |
| `supabase/migrations/20260428173000_member_workspace_core.sql` | 닉네임 이력, 감사 로그, 알림, 연락 요청, 프로젝트, 초대, 투표, 권한 양도/위임, 탈퇴 요청 |

### 1.2 현재 테이블 분류

| 분류 | 테이블 |
| --- | --- |
| 조직/회원 | `organizations`, `profiles`, `member_accounts`, `allowed_login_exceptions`, `bootstrap_admin_emails` |
| 직책/팀/RBAC | `org_positions`, `org_position_assignments`, `teams`, `team_roles`, `team_memberships`, `permissions`, `org_position_permissions`, `team_role_permissions` |
| 프로필/감사/알림 | `nickname_histories`, `audit_logs`, `notifications` |
| 연락 | `contact_requests`, `contact_request_events` |
| 프로젝트 | `project_teams`, `project_team_memberships`, `project_team_join_requests` |
| 초대 | `invitation_codes` |
| 투표 | `votes`, `vote_options`, `vote_ballots`, `vote_ballot_options`, `vote_nominations` |
| 권한 이동 | `role_transfer_requests`, `authority_delegations` |
| 탈퇴 | `member_exit_requests` |

## 2. 스키마 명세 원칙

### 2.1 모든 테이블에 필요한 명세 항목

| 항목 | 설명 |
| --- | --- |
| Aggregate | 어느 도메인 Aggregate에 속하는가 |
| Primary Key | PK와 생성 방식 |
| Ownership | row의 소유자와 관리자 |
| Status Machine | 허용 상태와 상태 전이 |
| Invariants | DB 제약과 RPC 제약 |
| RLS Intent | select/insert/update/delete 권한 의도 |
| Audit Event | 어떤 command에서 어떤 감사 이벤트를 남기는가 |
| Sensitive Fields | 개인정보/민감정보 여부 |
| Retention | 보존 기간과 삭제/익명화 방식 |
| Concurrency Strategy | unique, row lock, idempotency, transaction |

## 3. 현재 P0 위험

### 3.1 `current_user_is_project_team_lead` 의미 오염

현재 함수는 project `lead`, `maintainer`, accepted delegation을 모두 팀장처럼 판단할 수 있습니다.

#### 3.1.1 위험

| 사용처 | 사고 가능성 |
| --- | --- |
| 프로젝트 update | maintainer/임시 위임자가 공개 범위, 핵심 필드 수정 |
| 초대 코드 관리 | 제한 없는 초대 발급/폐기 |
| 투표 관리 | 투표 생성/마감/수정 가능 |
| 감사 로그 열람 | 민감 프로젝트 로그 열람 |
| 위임 관리 | 임시 위임자의 재위임/권한 확산 |

#### 3.1.2 권장 분리

```text
current_user_is_project_lead(project_id)
current_user_is_project_operator(project_id)
current_user_has_project_delegated_scope(project_id, scope)
current_user_can_read_project_audit(project_id)
current_user_can_create_project_vote(project_id)
```

### 3.2 넓은 permission 코드 위험

`projects.manage`, `members.manage`, `votes.manage` 같은 넓은 permission은 scope/source 없이 사용하면 위험합니다.

#### 3.2.1 권장 Capability 구조

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
    | "temporary_delegation";
  expiresAt?: string;
};
```

### 3.3 감사 로그 신뢰성 위험

현재 active member가 audit log insert 가능한 구조는 감사 로그의 신뢰성을 낮춥니다.

#### 3.3.1 권장 원칙

| 작업 | 정책 |
| --- | --- |
| INSERT | service role, trigger, security definer RPC만 |
| UPDATE | 금지. 정정은 correction event |
| DELETE | 금지. 보존 기간 후 purge job만 |
| payload | redacted diff 중심 |
| 민감정보 | 전화번호, 학번, 연락처 payload, 투표 선택, private README 원문 저장 금지 |

### 3.4 익명 투표 구조 위험

현재 `vote_ballots.voter_user_id`와 `vote_ballot_options.option_id`가 연결되면 운영진/DB 접근자는 개별 선택을 추적할 수 있습니다.

#### 3.4.1 1차 권장

| 수준 | 정책 |
| --- | --- |
| UI 익명 | 운영진 화면에는 집계만 표시 |
| DB 완전 익명 | 2차 암호/토큰 설계 필요 |
| 명세 | 익명 수준을 문서에 명확히 고지 |

### 3.5 직접 update 위험

다음 도메인은 프론트 직접 update가 아니라 RPC command로만 처리해야 합니다.

| 도메인 | 필요한 RPC |
| --- | --- |
| 초대 코드 | `redeem_invitation(raw_code)` |
| 참여 신청 | `approve_project_join_request`, `reject_project_join_request` |
| 연락 요청 | `send_contact_request`, `accept_contact_request`, `reject_contact_request`, `report_contact_spam` |
| 투표 | `create_vote`, `open_vote`, `submit_ballot`, `close_vote`, `publish_vote_result` |
| 권한 양도 | `request_role_transfer`, `accept_role_transfer`, `apply_role_transfer` |
| 임시 위임 | `request_authority_delegation`, `accept_authority_delegation`, `expire_authority_delegation` |
| 탈퇴 | `request_member_exit`, `approve_member_exit`, `complete_member_exit` |

## 4. 추가 또는 분리 필요 테이블

### 4.1 프로젝트/초대/GitHub

| 테이블 | 이유 |
| --- | --- |
| `project_creation_requests` | 승인 전 신청서와 승인된 프로젝트 본체 분리 |
| `project_pre_members` | 승인 전 팀원 모집/참여 예정자 관리 |
| `project_recruitment_cards` | 카카오톡/공지방 공유 카드와 공개 정책 분리 |
| `invitation_redemptions` | 코드 사용 이력, 중복/실패 추적 |
| `github_repository_connections` | GitHub App 설치/저장소/branch/path/visibility 관리 |
| `readme_snapshots` | GitHub 장애/권한 제거 fallback |
| `readme_sync_attempts` | sync 실패 원인과 최신성 판단 |

### 4.2 권한/투표/연락

| 테이블 | 이유 |
| --- | --- |
| `capability_assignments` 또는 read model | source/scope/expiresAt 기반 권한 표시 |
| `vote_eligibility_snapshots` | 투표 시작 시점 투표권자 고정 |
| `vote_result_snapshots` | 결과 공개 시점 집계 snapshot |
| `contact_abuse_cases` | 단일 spam_report 필드보다 운영진 검토/조치에 적합 |
| `rate_limit_events` | 반복 요청/자동화 방지 근거 |

## 5. 보존/개인정보 정책

### 5.1 기본 정책

| 데이터 | 기본 보존 | 1년 후 |
| --- | --- | --- |
| 감사 로그 | 1년 | 삭제 또는 payload redaction 후 비식별 통계만 |
| 연락 요청 | 1년, 피요청자 숨김 가능 | 삭제 |
| 탈퇴 처리 기록 | 1년 | 삭제 |
| 산출물 | 삭제하지 않음 | 작성 당시 표시명 snapshot 또는 익명 정책 유지 |
| 투표 결과 | 결과 보존 | 개별 ballot은 정책에 따라 삭제/분리 |

### 5.2 감사 로그 payload 금지 후보

- 전화번호 원문
- 학번 원문
- 연락 요청자가 첨부한 연락처 원문
- 수락자가 공개한 연락처 원문
- 익명 투표 선택값
- private GitHub README 원문
- OAuth token, GitHub token, Supabase secret

## 6. 구현 전 DB 질문

### 6.1 P0 질문

1. RLS는 row 접근만 담당하고, 상태 전이는 전부 RPC로 처리할 것인가?
2. `current_user_is_project_team_lead`를 폐기하고 역할별 helper로 분리할 것인가?
3. `projects.manage` 같은 넓은 permission을 deprecated하고 scope capability로 바꿀 것인가?
4. 감사 로그에 개인정보 원문 저장을 금지할 것인가?
5. 익명 투표의 익명 수준은 어디까지 보장할 것인가?
