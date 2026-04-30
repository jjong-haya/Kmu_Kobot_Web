# 08. 작업 체크리스트

## 1. 운영 원칙

### 1.1 모든 구현 전 확인

- [ ] 관련 bounded context가 문서에 정의되어 있다.
- [ ] 값 객체, 식별자, 권한, 상태 전이에 대한 불변조건이 적혀 있다.
- [ ] UI validation만으로 막는 규칙이 없다.
- [ ] DB constraint, RLS, RPC, trigger 중 하나 이상으로 최종 방어한다.
- [ ] 실패 시 사용자에게 보여줄 안전한 문구가 정해져 있다.
- [ ] 개인정보, 토큰, 비공개 README, 투표 선택값이 로그 payload에 그대로 들어가지 않는다.

### 1.2 모든 구현 후 확인

- [ ] `git diff --check`를 실행했다.
- [ ] `npm run build`를 실행했다.
- [ ] DB 변경이 있으면 Supabase migration 적용 여부를 확인했다.
- [ ] `10-verification-and-release.md`에 결과를 기록했다.
- [ ] 새로 발견한 질문은 `00-user-decision-checklist.md` 또는 재검증 문서에 남겼다.

## 2. Phase 0: DDD 기반 정비

- [x] TASK-0001: `ddd-spec-workflow` skill 생성
  - 목적: 모든 큰 작업을 DDD, event storming, spec/design/tasks 흐름으로 진행하기 위함

- [x] TASK-0002: `docs/ddd-workflow` 문서 세트 생성
  - 목적: Kiro-style spec/design/tasks 기반 작업 원장 유지

- [x] TASK-0003: 프로젝트 주요 도메인 1차 리뷰
  - 범위: 계정, 회원, 권한, 프로젝트, 초대, GitHub, 연락, 투표, 감사 로그

- [x] TASK-0004: DDD skill에 invariant matrix와 폼 필드 게이트 추가
  - 수정 파일: `C:/Users/jongh/.codex/skills/ddd-spec-workflow/SKILL.md`
  - 이유: ID, slug, code, nickname, role, status 같은 필드를 UI validation만으로 처리하는 누락 방지

## 3. Phase 1: Auth / Join / Pending

- [x] TASK-0101: `/member/join`과 `/member/pending` UX 문구 정리
  - 결과: pending 화면에서 ID 생성 CTA 제거, 가입 정보 입력과 승인 대기 역할 분리

- [x] TASK-0102: OAuth callback raw error 사용자 노출 차단
  - 결과: PKCE, schema cache, Supabase 함수 오류를 사용자 친화 문구로 변환

- [x] TASK-0103: 로그인 상태에 따른 Landing CTA 정리
  - 결과: 로그인 사용자는 로그인 버튼 대신 상태 기반 CTA를 표시

- [x] TASK-0104: `login_id` 중복 검사와 DDD 불변조건 보완
  - Spec reference: `13-full-project-ddd-revalidation-2026-05-01.md`
  - 수정 파일: `src/app/auth/AuthProvider.tsx`
  - 수정 파일: `src/app/auth/types.ts`
  - 수정 파일: `src/app/pages/member/ProfileSettings.tsx`
  - DB 파일: `supabase/migrations/20260501043000_login_id_availability.sql`
  - 불변조건: 전역 유일성, 소문자 정규화, 최초 설정 후 잠금, 인증된 사용자만 중복 확인 가능
  - UX: blur 및 submit 시 중복 확인, 중복이면 ID 입력칸으로 이동/강조

## 4. Phase 2: Capability / Permission

- [x] TASK-0201: broad permission 위험 목록화
  - 위험: `projects.manage`, `members.manage`, `permissions.manage`가 scope 없이 쓰이면 운영진과 프로젝트 팀장 권한이 섞인다.

- [x] TASK-0202: `current_user_is_project_team_lead` 분리 설계
  - 필요 helper: lead, operator, delegated scope, private read, audit read

- [x] TASK-0203: capability read model 설계
  - 핵심 필드: code, scopeType, scopeId, source, expiresAt

- [ ] TASK-0204: capability 기반 DB/RLS migration 구현
  - 우선순위: P0
  - 이유: 프로젝트 팀장이 자기 프로젝트 밖의 비공개 자료를 볼 수 없게 하기 위함

## 5. Phase 3: Command RPC

- [ ] TASK-0301: `redeem_invitation` RPC 구현
  - 우선순위: P0
  - 검증: 같은 코드 동시 사용 시 1명만 성공
  - 필수: 만료, max uses, audit log, notification

- [ ] TASK-0302: Contact Request RPC 구현
  - 우선순위: P1
  - 검증: 3일 미응답 자동 거절, 신고, 반복 요청 제한

- [ ] TASK-0303: Audit log insert 제한
  - 우선순위: P0
  - 원칙: 일반 사용자는 직접 insert 불가, command RPC/trigger만 기록

## 6. Phase 4: Project / GitHub / Vote

- [ ] TASK-0401: `project_creation_requests` schema와 승인 command 구현
- [ ] TASK-0402: 프로젝트 모집 카드 공개/비공개 정책 구현
- [ ] TASK-0403: GitHub repository connection과 README snapshot schema 구현
- [ ] TASK-0404: vote eligibility/result snapshot schema 구현
- [ ] TASK-0405: 익명 투표 보장 수준을 UI와 약관에 명시

## 7. 현재 남은 P0

| ID | 작업 | 이유 |
| --- | --- | --- |
| P0-RBAC-001 | capability scope/source 분리 | 운영진과 프로젝트 팀장 권한 혼합 방지 |
| P0-AUDIT-001 | audit log 직접 insert 제한 | 감사 로그 위조 방지 |
| P0-INVITE-001 | invitation redeem RPC | 초대 코드 동시 사용/만료 우회 방지 |
| P0-VOTE-001 | 익명 투표 수준 명시 | 사용자 기대와 실제 DB 구조 불일치 방지 |
