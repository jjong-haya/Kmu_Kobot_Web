# 13. 전 프로젝트 DDD 재검증 기록 - 2026-05-01

## 1. 작성 목적

### 1.1 왜 이 문서를 추가했는가

직전 가입 정보 입력 작업에서 `login_id`를 단순 입력값처럼 처리했고, 가입/계정 도메인의 핵심 불변조건인 "ID는 중복될 수 없다"를 UI 흐름에 반영하지 못했다.

이 문서는 그 누락을 DDD 관점에서 재검증하고, 현재 프로젝트 전체의 주요 도메인별 위험과 다음 구현 기준을 다시 고정하기 위해 작성한다.

### 1.2 이번 재검증의 결론

`login_id`, `nickname`, `invite_code`, `project_slug`, `vote_id`, `permission`, `visibility`, `github_repository`처럼 식별자나 권한에 관여하는 값은 폼 필드가 아니라 도메인 값 객체다.

따라서 모든 구현은 다음 순서로 진행해야 한다.

1. 값 객체의 의미와 소유권을 정한다.
2. 중복, 권한, 상태 전이, 동시성, 개인정보 노출을 먼저 질문한다.
3. DB 제약, RLS, RPC 중 하나 이상으로 우회 불가능하게 막는다.
4. UI는 해당 제약을 사용자에게 이해 가능한 방식으로 보여준다.
5. 실패와 승인/거절은 감사 로그에 남긴다.

## 2. 이번 누락에 대한 DDD 원인 분석

### 2.1 잘못 본 것

`login_id`를 "영어 소문자와 숫자만 입력 가능한 문자열"로만 봤다.

### 2.2 실제 도메인 의미

`login_id`는 국민대 Google OAuth 이후 사용자가 추가로 설정할 수 있는 계정 대체 식별자다.

### 2.3 그래서 반드시 있어야 하는 불변조건

| 구분 | 불변조건 |
| --- | --- |
| 형식 | `^[a-z0-9]{4,20}$` |
| 정규화 | 저장 전 소문자, trim |
| 유일성 | 전체 `profiles.login_id` 기준 중복 불가 |
| 변경 정책 | 최초 설정 후 일반 사용자는 직접 변경 불가 |
| 인증 연계 | ID 로그인은 `login_id -> email -> Supabase password auth`로 이어짐 |
| 노출 통제 | 로그인 실패 시 존재 여부를 익명 사용자에게 직접 알려주지 않음 |
| 경쟁 조건 | 두 사용자가 동시에 같은 ID를 요청해도 DB unique constraint가 최종 방어 |

### 2.4 이번에 보완한 구현

| 계층 | 보완 |
| --- | --- |
| DB | `is_login_id_available(login_id_input text)` RPC 추가. 인증된 사용자만 호출 가능 |
| DB | 기존 `profiles_login_id_unique_idx`와 `profiles_login_id_format`을 최종 방어선으로 유지 |
| AuthProvider | `checkLoginIdAvailability` 추가 |
| AuthProvider | 저장 직전 다시 중복 확인 |
| AuthProvider | unique violation을 "이미 사용 중인 ID입니다."로 안전하게 변환 |
| UI | ID 입력 blur 시 중복 확인 |
| UI | 회원가입 요청 시 중복이면 ID 칸으로 이동, 빨간 테두리, 진동, 필드 하단 오류 표시 |

## 3. 전 프로젝트 Bounded Context 재정리

### 3.1 Public Portfolio Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 발표/포트폴리오 시연용 공개 페이지 |
| 주요 화면 | Landing, 공개 Projects, Activities, FAQ, Notice, Recruit, Contact, Privacy, Terms |
| 주요 위험 | 내부 프로젝트 정보나 실명/연락처가 공개 페이지로 새는 문제 |
| DDD 질문 | 공개 산출물은 누구 이름으로 표시되는가? 탈퇴 후 공개 방식은 어떻게 유지되는가? |
| 현재 원칙 | 공개 페이지 기본 표시는 익명, 사용자가 프로필에서 공개 이름 방식을 선택 |

### 3.2 Account/Auth/Onboarding Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 국민대 계정 로그인, 가입 요청, 미승인/승인 상태 전이 |
| Aggregate | Account, Profile, MemberAccount |
| 값 객체 | Email, LoginId, Nickname, StudentId, PhoneNumber, College, Department |
| 주요 명령 | GoogleLoginRequested, ProfileJoinSubmitted, LoginIdPasswordRegistered |
| 주요 이벤트 | UserSignedIn, JoinRequested, JoinApproved, JoinRejected, LoginIdClaimed |
| P0 불변조건 | 학교 계정 또는 운영진이 승인한 예외만 활동 가능 |
| P0 불변조건 | `login_id`는 전역 중복 불가 |
| P0 불변조건 | 닉네임은 활성 회원 기준 중복 불가 |
| 현재 보완 | `login_id` 중복 확인 RPC와 UI 연결 |

### 3.3 Member Registry Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 회원의 실명, 닉네임, 학번, 전화번호, 소속, 승인 상태 관리 |
| Aggregate | MemberAccount |
| 값 객체 | MemberStatus, PublicCreditNameMode, NicknameHistory |
| 주요 위험 | 실명/전화번호/학번이 공개 화면으로 노출되는 문제 |
| DDD 질문 | 내부 프로젝트 참여자 목록에서는 왜 실명이 보이는가? 공개 페이지에서는 왜 기본 익명인가? |
| 현재 원칙 | 내부 협업 목록은 실명 우선, 공개 기여 표시는 기본 익명 |

### 3.4 Role/Capability Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 회장, 부회장, 공식 팀장, 프로젝트 팀장, 임시 권한, 일반 부원 권한 판단 |
| Aggregate | CapabilityAssignment, OrgPositionAssignment, TeamMembership |
| 주요 위험 | broad permission 하나로 공식 팀장과 프로젝트 팀장을 섞는 문제 |
| DDD 질문 | 이 권한은 어느 범위에서, 누가, 언제까지 행사할 수 있는가? |
| 필요 보완 | `projects.manage` 같은 넓은 권한을 scope/source/expiresAt 기반 capability로 분해 |

### 3.5 Project Team Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 공식 팀 기반 프로젝트와 개인 자율 프로젝트 생성/승인/운영 |
| Aggregate | ProjectTeam, ProjectCreationRequest, ProjectMembership |
| 값 객체 | ProjectVisibility, RecruitmentMode, ProjectReadmePolicy |
| 주요 위험 | 프로젝트 팀장이 자기 프로젝트 밖의 비공개 자료를 볼 수 있는 문제 |
| DDD 질문 | 프로젝트 팀장은 운영진인가, 아니면 자기 프로젝트 범위의 관리자일 뿐인가? |
| 현재 원칙 | 프로젝트 팀장은 자기 프로젝트만 관리, 운영진은 회장/부회장/공식 팀장 |

### 3.6 Invitation/Recruitment Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 동아리 가입 코드, 프로젝트 참여 코드, 초대 링크, 모집 카드 관리 |
| Aggregate | InvitationCode, InvitationRedemption, RecruitmentCard |
| 주요 위험 | 코드 재사용, 만료 우회, 초대 링크 공유로 의도치 않은 자동 승인 |
| DDD 질문 | 코드는 누구에게 어떤 권한을 즉시 부여하는가? 만료 후 재사용은 어떻게 막는가? |
| 필요 보완 | `redeem_invitation` RPC에서 row lock, 만료, max uses, audit log를 한 번에 처리 |

### 3.7 GitHub Integration Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 공개/비공개 GitHub README와 내부 소개서 동기화 |
| Aggregate | GitHubRepositoryConnection, ReadmeSnapshot, ReadmeSyncAttempt |
| 주요 위험 | 비공개 저장소 README가 접근 권한 없는 사용자에게 노출되는 문제 |
| DDD 질문 | 코봇 웹에서 비공개 README를 볼 수 있는 권한은 GitHub 권한인가, 코봇 프로젝트 권한인가? |
| 현재 원칙 | 비공개 README는 코봇 프로젝트 권한으로 읽기 가능해야 하며, 내부 자료 전체가 아니라 README snapshot만 제공 |

### 3.8 Contact Request Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 이메일 공개 대신 연락 요청을 보내고 수락 시 연락처를 교환 |
| Aggregate | ContactRequest, ContactRequestEvent, ContactAbuseCase |
| 주요 위험 | 스팸, 반복 요청, 연락처 과다 수집 |
| DDD 질문 | 요청자는 왜 연락해야 하는가? 피요청자는 어떤 연락처를 공개할지 선택했는가? |
| 필요 보완 | 요청 생성/수락/거절/신고를 RPC로 고정하고 rate limit 이벤트 기록 |

### 3.9 Vote Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 회장 선출, 일반 안건, 프로젝트 참여자 투표 |
| Aggregate | Vote, Ballot, VoteEligibilitySnapshot, VoteResultSnapshot |
| 주요 위험 | 익명 투표라고 말했지만 DB에서 개인 선택을 추적할 수 있는 문제 |
| DDD 질문 | 익명은 UI 익명인가, 운영진도 개인 선택을 알 수 없는 DB 익명인가? |
| 현재 원칙 | 현재 1차 구현은 결과 공개형 투표 기준이며, 완전한 암호학적 익명은 별도 설계 필요 |

### 3.10 Audit/Notification Context

| 항목 | 내용 |
| --- | --- |
| 목적 | 모든 요청/승인/거절/권한 변경/초대 사용/연락 신고를 기록하고 알림 제공 |
| Aggregate | AuditLog, Notification |
| 주요 위험 | 사용자가 직접 audit log를 조작하거나 민감정보를 payload에 저장하는 문제 |
| DDD 질문 | 이 로그는 누가 썼고, 어떤 command의 결과인가? payload에 전화번호/학번/토큰이 들어가는가? |
| 필요 보완 | 일반 사용자의 직접 audit insert 금지, command RPC/trigger만 기록 |

## 4. 프로젝트 전체 P0/P1 재검증 결과

### 4.1 P0 - 즉시 보완한 항목

| ID | 항목 | 조치 |
| --- | --- | --- |
| P0-AUTH-001 | `login_id` 중복 검사 누락 | RPC, AuthProvider, UI 필드 검증 추가 |
| P0-AUTH-002 | DB unique violation 사용자 메시지 불명확 | "이미 사용 중인 ID입니다."로 변환 |
| P0-AUTH-003 | 가입 버튼 클릭 시 오류 위치 안내 부족 | 해당 필드 스크롤/포커스/진동으로 처리 |

### 4.2 P0 - 다음 단계에서 반드시 처리해야 하는 항목

| ID | 항목 | 왜 위험한가 | 권장 조치 |
| --- | --- | --- | --- |
| P0-RBAC-001 | 프로젝트 팀장과 운영진 권한 혼합 | 프로젝트 팀장이 운영진 수준으로 비공개 자료를 볼 수 있음 | capability scope/source 분리 |
| P0-AUDIT-001 | 감사 로그 직접 insert 가능성 | 악의적/실수성 로그 위조 가능 | trigger/RPC 중심으로 제한 |
| P0-INVITE-001 | 초대 코드 사용 command 부재 | 만료/중복/동시 사용을 UI만으로 막을 수 없음 | `redeem_invitation` RPC |
| P0-VOTE-001 | 익명 투표 보장 수준 불명확 | 사용자가 기대한 익명성과 실제 DB 구조가 다를 수 있음 | 익명 수준 명시 및 snapshot 설계 |

### 4.3 P1 - 설계 보완 항목

| ID | 항목 | 권장 조치 |
| --- | --- | --- |
| P1-GH-001 | GitHub README snapshot 권한 | private README는 snapshot 단위로 권한 검사 |
| P1-CONTACT-001 | 연락 요청 스팸/자동화 | rate limit, 유사 문구 반복 탐지, 신고 처리 |
| P1-DOC-001 | 기존 DDD 문서 인코딩 깨짐 | 새 문서는 UTF-8로 작성, 깨진 문서는 별도 복구 task |
| P1-BUILD-001 | Vite chunk size 경고 | route-level lazy loading 검토 |

## 5. 이번 구현의 수용 기준

### 5.1 가입자가 중복 ID를 입력한 경우

1. ID 입력칸에서 blur하면 중복 확인을 시도한다.
2. 이미 사용 중이면 ID 입력칸 아래에 "이미 사용 중인 ID입니다."를 보여준다.
3. 회원가입 요청 버튼을 눌렀을 때 중복이면 ID 위치로 스크롤하고 입력칸을 강조한다.
4. 그래도 동시에 같은 ID를 저장하려는 경쟁 상황은 DB unique index가 막는다.

### 5.2 보안 기준

1. 익명 사용자는 ID 중복 확인 RPC를 호출할 수 없다.
2. 로그인 실패 메시지는 기존처럼 "아이디 또는 비밀번호가 올바르지 않습니다."로 유지한다.
3. 중복 확인은 로그인 후 가입/프로필 설정 맥락에서만 제공한다.
4. DB 오류 원문은 사용자에게 노출하지 않는다.

## 6. 앞으로 모든 작업에 적용할 DDD 체크 질문

### 6.1 폼 필드 체크

| 질문 | 적용 예 |
| --- | --- |
| 이 값은 식별자인가? | ID, 닉네임, 초대 코드, 프로젝트 slug |
| 중복 범위는 어디인가? | 전역, 동아리, 공식 팀, 프로젝트 |
| 누가 바꿀 수 있는가? | 본인, 프로젝트 팀장, 공식 팀장, 회장 |
| 언제부터 잠기는가? | 가입 승인 후, 최초 ID 설정 후, 투표 오픈 후 |
| 실패하면 어디로 안내하는가? | 해당 필드, pending 페이지, 관리자 문의 |
| UI를 우회해도 막히는가? | DB constraint, RLS, RPC |

### 6.2 권한 체크

| 질문 | 적용 예 |
| --- | --- |
| role과 capability를 섞고 있지 않은가? | 공식 팀장 vs 프로젝트 팀장 |
| capability scope가 있는가? | organization, official_team, project, self |
| source가 남는가? | president, vice_president, delegation |
| 만료가 필요한가? | 임시 권한, 초대 코드, 모집 링크 |
| 감사 로그가 남는가? | 누가 요청, 누가 승인, 왜 거절 |

## 7. 구현 상태

### 7.1 완료

| Task | 상태 | 파일 |
| --- | --- | --- |
| DDD skill invariant matrix 추가 | 완료 | `C:/Users/jongh/.codex/skills/ddd-spec-workflow/SKILL.md` |
| LoginId availability RPC migration 추가 | 완료 | `supabase/migrations/20260501043000_login_id_availability.sql` |
| AuthProvider 중복 확인 API 추가 | 완료 | `src/app/auth/AuthProvider.tsx` |
| ProfileSettings 중복 검증 UX 추가 | 완료 | `src/app/pages/member/ProfileSettings.tsx` |

### 7.2 다음 작업 후보

| 우선순위 | 작업 |
| --- | --- |
| P0 | `redeem_invitation` RPC |
| P0 | 감사 로그 직접 insert 제한 |
| P0 | project capability scope 분리 |
| P1 | contact request command RPC |
| P1 | vote anonymity level 명시와 snapshot schema |
| P1 | 깨진 기존 DDD 문서 인코딩 복구 |
