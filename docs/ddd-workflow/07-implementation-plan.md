# 07. 구현 계획

## 1. 구현 원칙

### 1.1 작은 단위

한 작업은 가능하면 한 bounded context, 한 command, 또는 한 화면 상태만 다룬다.

### 1.2 문서-작업 연결

모든 작업은 `05-functional-spec.md` 또는 `04-data-schema-and-security.md`의 조항을 참조해야 한다.

### 1.3 검증 우선순위

권한, 개인정보, 상태 전이, 감사 로그는 UI보다 먼저 검증한다.

## 2. Phase 0: 기준선 고정

### 2.1 목표

현재 문서와 코드의 기준선을 확정하고, 구현 전 열린 질문을 문서화한다.

### 2.2 작업

- [x] DDD workflow skill 생성
- [x] `docs/ddd-workflow` 생성
- [x] 사용자 결정 체크리스트 작성
- [x] 서브 에이전트 도메인 리뷰 수집
- [ ] P0 결정 사용자 확인

## 3. Phase 1: Auth/Join/Pending 안정화

### 3.1 목표

최초 로그인, 가입 요청, 승인 대기, active 진입을 명확히 분리한다.

### 3.2 작업 순서

1. `/member/join` 필수 입력과 저장 흐름 검증.
2. `/member/pending` CTA whitelist 검증.
3. `/member/profile` active-only guard 검증.
4. AuthCallback raw error 문구 정리.
5. localhost/production redirect URL 문서화.

## 4. Phase 2: Capability/Permission 재설계

### 4.1 목표

Role, Capability, Scope, Source, Delegation을 분리한다.

### 4.2 작업 순서

1. 기존 permission 사용처 목록화.
2. `current_user_is_project_team_lead` 분리 설계.
3. project lead/operator/delegation helper 설계.
4. auth context read model에 capability source/scope 추가 설계.
5. 사이드바 노출 규칙과 연결.

## 5. Phase 3: DB Command RPC 전환

### 5.1 목표

상태 전이를 direct update가 아니라 RPC command로 처리한다.

### 5.2 우선 RPC

1. `redeem_invitation`
2. `send_contact_request`
3. `accept_contact_request`
4. `approve_project_join_request`
5. `request_authority_delegation`
6. `submit_ballot`
7. `create_audit_log` service-only 구조

## 6. Phase 4: Project/Invitation/GitHub

### 6.1 목표

프로젝트 생성 신청, 모집 공유, 초대 코드, GitHub README를 분리된 Aggregate로 구현한다.

### 6.2 작업 순서

1. `project_creation_requests` 설계.
2. 모집 카드/공유 페이지 설계.
3. 초대 코드 redemption 원자 처리.
4. GitHub connection/readme snapshot 테이블 설계.
5. README 표시 정책 구현.

## 7. Phase 5: Contact/Vote/Audit

### 7.1 Contact

- 요청/수락/거절/자동거절 RPC.
- 신고/제재 큐.
- rate limit 이벤트.

### 7.2 Vote

- 투표권자 snapshot.
- 익명 수준 명세.
- 결과 snapshot.

### 7.3 Audit

- redacted payload.
- actor authority source/scope snapshot.
- 1년 purge 정책.

## 8. 롤백 계획

### 8.1 DB

- 새 migration은 additive 우선.
- 기존 넓은 permission은 즉시 삭제하지 않고 deprecated 후 화면/함수 전환.
- RLS 변경은 staging/local 검증 후 적용.

### 8.2 UI

- `/member/join`, `/member/pending`, `/member/profile`은 feature flag 없이도 명확히 분기 가능.
- 신규 관리자 메뉴는 권한 read model 안정화 전 숨김 처리.

## 9. 구현 Gate

### 9.1 Gate 조건

| Gate | 조건 |
| --- | --- |
| Gate 1 | P0 결정이 Accepted 또는 안전한 ASSUMPTION 상태 |
| Gate 2 | 관련 functional spec 존재 |
| Gate 3 | data/RLS 영향이 문서화됨 |
| Gate 4 | task checklist에 작은 작업으로 분리됨 |
| Gate 5 | verification 방법이 정해짐 |
