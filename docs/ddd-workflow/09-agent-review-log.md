# 09. 리뷰 로그

## 1. 리뷰 방식

### 1.1 이번 문서의 의미

현재 세션에서는 새 sub-agent를 추가로 띄우지 않고, `ddd-spec-workflow` 규칙에 따라 로컬 리뷰 역할을 나누어 점검했다.

역할은 다음과 같이 시뮬레이션했다.

| 역할 | 관점 |
| --- | --- |
| Product reviewer | 사용자가 기대하는 흐름과 문구 |
| Domain reviewer | aggregate, value object, invariant |
| Security reviewer | enumeration, privilege escalation, privacy leakage |
| Data reviewer | DB constraint, RPC, RLS, race condition |
| UX reviewer | 오류 위치, 복구 가능성, raw error 노출 여부 |

## 2. 공통 합의

### 2.1 모든 식별자는 값 객체다

`login_id`, `nickname`, `project_slug`, `invite_code`, `github_repository`, `vote_id`는 단순 문자열이 아니다.

각 값은 최소한 다음을 가져야 한다.

- 정규화 규칙
- 유일성 범위
- 소유자
- 변경 가능 시점
- 중복/충돌 시 사용자 문구
- DB/RPC 수준의 최종 방어

### 2.2 UI validation은 보조 수단이다

UI는 빠른 피드백을 줄 뿐이다. 권한, 상태 전이, 유일성, 초대 코드 사용, 투표 제출, 연락 요청 생성은 DB/RPC에서 최종 결정해야 한다.

## 3. 2026-05-01 Auth/LoginId 리뷰

### 3.1 발견한 누락

`login_id`를 단순 입력값으로 보고 형식 검사만 구현하면 안 된다. ID 로그인은 `login_id -> email -> Supabase password auth`로 이어지므로, 중복 ID는 인증 대상 자체를 모호하게 만든다.

### 3.2 Why review

| 질문 | 답 |
| --- | --- |
| 왜 중복을 막아야 하는가? | 같은 ID가 두 계정에 연결되면 ID 로그인 해석이 불가능해진다. |
| 왜 DB unique index만으로 부족한가? | 최종 방어는 되지만 사용자에게 저장 실패 후 generic 오류만 보이면 UX가 나쁘다. |
| 왜 RPC가 필요한가? | RLS를 우회하지 않고 인증된 사용자에게 availability boolean만 제공하기 위해서다. |
| 왜 anon에게 열지 않는가? | 로그인 ID 존재 여부를 익명 사용자가 대량 조회하면 계정 열거 표면이 커진다. |
| 왜 저장 직전 재확인하는가? | blur 이후 다른 사용자가 같은 ID를 선점할 수 있기 때문이다. |
| 그래도 동시 제출하면? | `profiles_login_id_unique_idx`가 최종적으로 막는다. |

### 3.3 반영 사항

- `is_login_id_available(text)` RPC 추가
- `AuthProvider.checkLoginIdAvailability` 추가
- 저장 직전 availability 재확인
- unique violation safe message 변환
- `/member/join`과 `/member/profile` ID blur/submit 검증 연결
- 중복이면 상단 카드가 아니라 ID 필드 하단 오류와 필드 강조로 표시

## 4. 남은 고위험 리뷰 항목

### 4.1 RBAC / Capability

| ID | 질문 | 위험 |
| --- | --- | --- |
| REVIEW-RBAC-001 | 공식 팀장과 프로젝트 팀장을 같은 permission으로 다루고 있는가? | 프로젝트 범위 밖 자료 노출 |
| REVIEW-RBAC-002 | 임시 권한은 role인가 capability인가? | 기간 만료 후 권한 잔류 |
| REVIEW-RBAC-003 | 회장 직접 지명과 요청/수락 흐름이 같은 이벤트로 기록되는가? | 감사 추적 불완전 |

### 4.2 Project / GitHub

| ID | 질문 | 위험 |
| --- | --- | --- |
| REVIEW-GH-001 | 비공개 GitHub README snapshot을 누가 볼 수 있는가? | private repo 정보 노출 |
| REVIEW-GH-002 | GitHub 연동 실패 시 내부 소개서와 날짜 비교 기준은 무엇인가? | 오래된 정보 표시 |
| REVIEW-GH-003 | 프로젝트 팀장이 GitHub App 설치를 잘못했을 때 복구 UX가 있는가? | 연동 중단 |

### 4.3 Contact / Vote / Audit

| ID | 질문 | 위험 |
| --- | --- | --- |
| REVIEW-CONTACT-001 | 연락 요청 반복/유사 문구 스팸을 어디서 막는가? | 사용자 괴롭힘 |
| REVIEW-VOTE-001 | 익명 투표는 운영진도 개인 선택을 모르는가? | 익명성 오해 |
| REVIEW-AUDIT-001 | audit log payload에 전화번호/학번/토큰이 들어가는가? | 개인정보 과다 보관 |

## 5. 다음 리뷰 게이트

### 5.1 구현 전 반드시 묻기

- 이 값은 식별자인가?
- 중복 범위는 어디인가?
- 누가 변경할 수 있는가?
- 언제부터 잠기는가?
- 실패하면 어떤 필드나 화면으로 안내하는가?
- UI를 우회해도 DB/RPC에서 막히는가?
- 어떤 감사 이벤트가 남는가?

### 5.2 멈춰야 하는 조건

다음 중 하나라도 답이 없으면 구현을 멈추고 질문 또는 문서화를 먼저 한다.

- 권한 범위가 모호함
- 상태 전이 경로가 모호함
- 공개/비공개 기준이 모호함
- 개인정보 보관 기준이 모호함
- DB 불변조건이 없음
