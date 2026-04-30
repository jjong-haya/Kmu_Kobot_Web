# 08. 태스크 체크리스트

## 1. Phase 0: 문서/스킬 기반 구축

- [x] TASK-0001: `ddd-spec-workflow` Codex skill 생성
  - Spec reference: `README.md`, skill `SKILL.md`
  - Verification: skill quick_validate 통과
  - Risk: Windows UTF-8 BOM 문제 해결 완료

- [x] TASK-0002: `docs/ddd-workflow` 문서 세트 생성
  - Spec reference: `README.md`
  - Verification: scaffold script 실행 완료
  - Risk: 기존 `docs/ddd`와 역할 중복 가능, README에서 역할 구분

- [x] TASK-0003: 서브 에이전트 DDD 리뷰 수집
  - Spec reference: `09-agent-review-log.md`
  - Verification: 계정/권한, 프로젝트/GitHub, DB/RLS, UX/IA 리뷰 반영
  - Risk: 한 에이전트 응답 지연 가능, 도착 시 추가 반영

## 2. Phase 1: Auth/Join/Pending

- [x] TASK-0101: `/member/join`과 `/member/pending` UX 문구 최종 점검
  - Spec reference: `06-design-spec.md#4-화면별-문구-원칙`
  - 수정 파일: `ProfileSettings.tsx`, `ApprovalPending.tsx`
  - Verification: pending 화면에 ID 생성/프로필 수정 CTA 없음, `npm run build` 통과
  - Risk: 승인 후 원래 링크 이동은 `next` 보존으로 완화

- [x] TASK-0102: AuthCallback raw error 사용자 문구 정리
  - Spec reference: `05-functional-spec.md#2-auth--onboarding-요구사항`
  - 수정 파일: `AuthCallback.tsx`, `AuthProvider.tsx`, `Login.tsx`
  - Verification: OAuth 취소/PKCE 실패 시 친화적 안내, technical message 필터 추가, `npm run build` 통과
  - Risk: 운영 디버깅은 console/logging 체계가 필요

- [x] TASK-0103: 로그인 후 Landing 버튼 상태 검증
  - Spec reference: `06-design-spec.md#2-라우트-정책`
  - 수정 파일: `Landing.tsx`
  - Verification: 비로그인 CTA는 `/login?next=%2Fmember`, 로그인 사용자는 상태별 CTA 표시, `npm run build` 통과
  - Risk: auth context loading 중 짧은 상태 전환 가능

## 3. Phase 2: Capability/Permission

- [x] TASK-0201: permission 사용처 목록화
  - Spec reference: `04-data-schema-and-security.md#3-현재-p0-위험`
  - 수정 파일: `12-supabase-migration-plan.md`, `09-agent-review-log.md`
  - Verification: `projects.manage`, `members.manage`, `permissions.manage` broad permission 위험과 전환 순서 기록
  - Risk: mock UI permission과 DB permission 혼재

- [x] TASK-0202: `current_user_is_project_team_lead` 분리 migration 설계
  - Spec reference: `04-data-schema-and-security.md#31-current_user_is_project_team_lead-의미-오염`
  - 수정 파일: `12-supabase-migration-plan.md`
  - Verification: lead/member/delegation/private-read/audit helper 후보 작성
  - Risk: 실제 migration은 기존 데이터 preflight 이후 별도 task로 진행

- [x] TASK-0203: capability read model 설계
  - Spec reference: `04-data-schema-and-security.md#32-넓은-permission-코드-위험`
  - 수정 파일: `12-supabase-migration-plan.md`, `types.ts`
  - Verification: capability shape/source/scope/expiresAt 문서화, `project_only`, `withdrawn` 프론트 상태 타입 추가
  - Risk: 프론트 메뉴 노출 조건 대량 변경은 후속 task에서 처리

## 4. Phase 3: Command RPC

- [ ] TASK-0301: `redeem_invitation` RPC 설계
  - Spec reference: `05-functional-spec.md#5-invitation-요구사항`
  - 예상 수정 파일: 새 migration
  - Verification: max_uses=1 동시 사용 한 명만 성공
  - Risk: row lock/transaction 설계 필요

- [ ] TASK-0302: Contact Request RPC 설계
  - Spec reference: `05-functional-spec.md#7-contact-request-요구사항`
  - 예상 수정 파일: 새 migration, `ContactRequests.tsx`
  - Verification: 3일 자동거절, 수락 연락처 선택
  - Risk: 연락처 payload 개인정보 처리

- [ ] TASK-0303: Audit log insert 제한 설계
  - Spec reference: `04-data-schema-and-security.md#33-감사-로그-신뢰성-위험`
  - 예상 수정 파일: 새 migration
  - Verification: 일반 active member 직접 insert 불가
  - Risk: 기존 create_audit_log 호출 방식 변경

## 5. Phase 4: Project/GitHub/Vote

- [ ] TASK-0401: `project_creation_requests` 설계
- [ ] TASK-0402: 프로젝트 모집 공유 페이지 spec 작성
- [ ] TASK-0403: GitHub repository connection/readme snapshot schema 작성
- [ ] TASK-0404: vote eligibility/result snapshot schema 작성
- [ ] TASK-0405: 익명 투표 수준 사용자 고지 문구 작성

## 6. 체크 방식

### 6.1 작업 시작 전

각 task는 시작 전에 다음을 확인한다.

- [ ] 관련 P0 결정이 열려 있지 않다.
- [ ] 수정 파일 범위가 작다.
- [ ] 검증 방법이 있다.
- [ ] 감사 로그/개인정보 영향이 검토되었다.

### 6.2 작업 완료 후

- [ ] 빌드 또는 관련 테스트 실행.
- [ ] `10-verification-and-release.md`에 결과 기록.
- [ ] 새 질문이 생기면 `00-user-decision-checklist.md`에 추가.
