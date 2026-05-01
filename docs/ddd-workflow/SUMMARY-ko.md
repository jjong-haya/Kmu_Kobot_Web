# KOBOT Web 작업 정리본

## 1. 이번 작업의 핵심

이번 작업은 화면 기능을 더 추가하기보다, 회원/권한/감사 로그의 안전 경계를 먼저 바로잡은 작업입니다.

DDD 관점에서 이번에 닫은 질문은 다음입니다.

| 질문 | 결론 | 반영 위치 |
| --- | --- | --- |
| 회원 상태 값은 무엇인가 | `pending`, `active`, `suspended`, `rejected`, `alumni`, `project_only`, `withdrawn`으로 통일 | Supabase migration, auth type |
| ID 로그인은 누가 가능한가 | `active` 회원만 ID/password 로그인이 가능 | `resolve_login_email` |
| 공개 프로젝트 기여자 표시 기본값은 무엇인가 | 기본값은 `anonymous` | DB default, AuthProvider, ProfileSettings |
| 프로젝트 팀장은 누구인가 | 실제 프로젝트 멤버십 role이 `lead`인 활성 회원만 팀장 | project lead helper |
| 임시 위임자는 팀장인가 | 아니며, scope와 만료 시간을 가진 제한 권한자 | delegation helper |
| 일반 회원이 감사 로그를 쓸 수 있는가 | 불가. command RPC, trigger, service role 경로로만 남겨야 함 | audit RLS / grant revoke |

## 2. 코드에 반영한 내용

### 2.1 Supabase 마이그레이션

새 마이그레이션을 추가했습니다.

- `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql`

이 마이그레이션의 역할은 다음입니다.

- `member_accounts.status` 제약을 프론트 타입과 맞춤
- 닉네임 DB 정규식이 한글을 안전하게 받도록 재정의
- `resolve_login_email`을 `active` 회원만 반환하도록 변경
- `current_user_is_project_team_lead`를 실제 `lead`만 의미하도록 축소
- `current_user_is_project_operator`를 별도 helper로 추가
- `current_user_has_project_delegated_scope`를 추가해 임시 위임은 scope/기간으로만 판단
- 비공개 프로젝트 row read를 더 좁힘
- 일반 authenticated 사용자의 `audit_logs` 직접 insert 정책 제거
- 일반 authenticated 사용자의 `create_audit_log` 실행 권한 제거

### 2.2 프론트 인증 기본값

공개 페이지 기여자 표시 기본값을 `nickname`에서 `anonymous`로 맞췄습니다.

수정 파일:

- `src/app/auth/AuthProvider.tsx`
- `src/app/auth/types.ts`
- `src/app/pages/member/ProfileSettings.tsx`

## 3. 아직 남은 중요한 질문

이번 작업으로 모든 도메인이 끝난 것은 아닙니다. 아래 질문들은 계속 P0/P1로 남습니다.

| ID | 남은 질문 | 이유 |
| --- | --- | --- |
| Q-AUTH-003 | Supabase Auth Hook이 Dashboard에서 실제 연결됐는가 | SQL 함수만 있어도 Dashboard hook이 연결되지 않으면 학교 계정 제한이 강제되지 않음 |
| Q-AUTHZ-002 | 남은 direct table transition을 command RPC로 바꿀 것인가 | RLS만으로는 승인/거절/수락/양도 같은 상태 전이를 충분히 통제하기 어려움 |
| Q-PROJECT-001 | 프로젝트 공개 소개, 운영진 검토 정보, 내부 자료 read model을 어떻게 분리할 것인가 | 비공개 프로젝트 자료가 공식 팀장이나 broad permission 사용자에게 과노출될 수 있음 |
| Q-AUDIT-002 | 감사 로그 payload에서 어떤 개인정보를 반드시 마스킹할 것인가 | 전화번호, 학번, 연락처, 투표 선택, private README 원문은 과보관 위험이 있음 |
| Q-INVITE-001 | 초대 코드 사용을 어떤 RPC로 원자 처리할 것인가 | 만료, 다회 사용, 중복 사용, 실패 기록이 필요함 |
| Q-VOTE-001 | 익명 투표의 익명성 수준을 어디까지 보장할 것인가 | UI 익명과 DB 수준 익명은 다름 |

## 4. DDD 방식으로 본 이번 결론

이번 변경은 “기능을 더 만든 것”보다 “잘못 열려 있던 권한 의미를 좁힌 것”에 가깝습니다.

특히 프로젝트 권한에서 중요한 분리가 있었습니다.

- 프로젝트 팀장: 실제 프로젝트 `lead`
- 프로젝트 운영자: `lead` 또는 `maintainer`, 하지만 팀장 양도/핵심 상태 변경 권한은 아님
- 임시 위임자: 특정 scope와 기간 안에서만 가능한 제한 권한자
- 공식 팀장: 공식 팀 기반 프로젝트를 검토할 수 있지만, 내부 자료 전체 열람자로 바로 취급하지 않음
- 회장/부회장급 운영 권한: `admin.access`, `members.manage` 같은 상위 권한으로 분리

## 5. 검증 계획

이번 커밋 전 확인할 항목입니다.

- `git diff --check`
- `npm run build`
- 3개 리뷰 관점 통합
- DDD 문서의 resolved archive / active queue 반영
- Git commit/push

원격 Supabase DB에는 이번 마이그레이션을 아직 직접 적용하지 않습니다. 로컬 마이그레이션 파일을 푸시한 뒤, 원격 적용은 DB 비밀번호와 migration history 문제를 다시 확인해서 별도 단계로 진행하는 것이 안전합니다.
