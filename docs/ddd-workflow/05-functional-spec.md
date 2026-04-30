# 05. 기능 명세서

## 1. 범위

### 1.1 1차 목표

KOBOT Web 1차 목표는 국민대 Google 계정으로 로그인한 사용자가 가입 요청서를 제출하고, 운영진 승인 후 Member Workspace에서 프로젝트/공지/자료/연락/투표의 기반 기능을 사용할 수 있는 상태를 만드는 것입니다.

### 1.2 제외 또는 후순위

| 항목 | 이유 |
| --- | --- |
| GitHub App 실제 설치 자동화 | 별도 GitHub App 생성/권한/서버 함수 필요 |
| 완전 암호학적 익명 투표 | DB 관리자에게도 익명인 구조는 2차 설계 필요 |
| 이메일 발송 자동화 | 발신 주소/SMTP/학교 정책 확인 필요 |
| 모든 mock 페이지 실데이터 연결 | 권한/스키마 안정화 후 순차 진행 |

## 2. Auth & Onboarding 요구사항

### 2.1 사용자 스토리

| ID | 스토리 | Acceptance Criteria |
| --- | --- | --- |
| AUTH-001 | 사용자는 국민대 Google 계정으로 최초 로그인한다 | Google OAuth 시작, `kookmin.ac.kr` 아닌 경우 제한 안내 |
| AUTH-002 | 링크로 들어온 사용자는 로그인 후 원래 의도로 돌아간다 | `next` path 보존, callback 후 안전 경로로 이동 |
| AUTH-003 | 신규 사용자는 가입 요청서를 작성한다 | `/member/join`에서 실명 자동 입력, 닉네임/ID/필수정보 입력 |
| AUTH-004 | 가입 요청 제출 후 승인 대기 화면을 본다 | `/member/pending`에는 ID 생성/프로필 설정 CTA 없음 |
| AUTH-005 | active 사용자는 워크스페이스로 간다 | `/member` 접근 허용 |

### 2.2 Negative Cases

| 케이스 | 기대 동작 |
| --- | --- |
| OAuth 취소 | raw error 대신 다시 로그인/문의 CTA |
| localhost 시작 후 production callback | PKCE 설명을 사용자에게 노출하지 않고 재로그인 안내 |
| pending 사용자가 `/member/profile` 직접 접근 | `/member/join` 또는 `/member/pending`으로 이동 |
| suspended/rejected 사용자 | 상태 안내와 문의만 표시 |

## 3. Member Approval 요구사항

### 3.1 기능

| 기능 | 요구사항 |
| --- | --- |
| 가입자 목록 | 회장/부회장/공식 팀장이 범위에 따라 볼 수 있음 |
| 승인/반려 | 누가, 언제, 어떤 자격으로 처리했는지 감사 로그 |
| 참여 코드 | 미승인자가 코드 입력 시 코봇 멤버 또는 프로젝트 참여로 전환 |
| 상태 변경 | pending/active/suspended/rejected/alumni/withdrawn/project_only 검토 |

## 4. Project 요구사항

### 4.1 프로젝트 생성

| 요구사항 | 설명 |
| --- | --- |
| 팀 생성 자유 | 모든 active member 가능 |
| 공식 팀 기반/개인 자율 선택 | 태그 색/표시로 구분 |
| 승인 필요 | 공식 팀장/회장/부회장 정책 범위 |
| 사전 팀원 모집 | 승인 전에도 참여 예정자 표시 가능 |
| 승인 전 공개 | 전체 목록 미노출, 공유 페이지 접근 가능 |

### 4.2 프로젝트 접근

| 사용자 | 볼 수 있는 정보 |
| --- | --- |
| Guest | 공개 허용된 모집 페이지만 |
| Login User | 로그인 필요 프로젝트 모집 페이지 |
| Applicant | README/소개서/신청 상태 |
| Project Member | 내부 자료/팀원 목록/일정 |
| Project Lead | 참여 승인/초대/프로젝트 운영 |
| Official Team Lead | 승인/검토 범위 정보 |
| President/Vice | 전체 운영 정보 |

## 5. Invitation 요구사항

### 5.1 코드/링크 종류

| 종류 | 효과 | 기본 기한 |
| --- | --- | --- |
| KOBOT 멤버 인증 코드 | 코봇 활동 부원 전환 | 5일 |
| 공식 팀 초대 | 공식 팀 소속 부여 | 5일 |
| 프로젝트 참여 코드 | 특정 프로젝트 참여 | 5일 |

### 5.2 Acceptance Criteria

- 동일 코드 동시 사용 시 `max_uses`를 넘지 않는다.
- 코드 사용은 감사 로그와 알림을 남긴다.
- 프로젝트 코드는 코봇 정식 부원 권한을 주지 않는다.

## 6. GitHub README 요구사항

### 6.1 1차 정책

| 항목 | 정책 |
| --- | --- |
| Organization | `Kmu-Kobot` 우선 |
| 저장소 필수 여부 | 필수 아님 |
| private repo | GitHub App/서버 조회 필요 |
| 표시 방식 | 내부 소개서, GitHub README, 최신 날짜 자동 중 선택 |
| 변경 요청 | 팀원이 요청, 프로젝트 팀장이 승인 |
| 실패 fallback | 마지막 성공 snapshot, 없으면 내부 소개서 |

## 7. Contact Request 요구사항

### 7.1 흐름

1. 요청자가 연락 사유와 자신이 공개 가능한 연락처를 첨부한다.
2. 수신자는 수락/거절/대기 중 선택한다.
3. 수락 시 수신자가 어떤 연락처를 넘길지 선택한다.
4. 3일 미응답이면 자동 거절되고 사유는 `미응답`이다.
5. 스팸 신고는 회장/부회장이 검토하고 경고/정지/제한 조치를 한다.

### 7.2 자동화 방지

- 짧은 시간 반복 요청 시 확인창 표시.
- 서버 rate limit으로 API 직접 호출도 제한.
- 동일/유사 내용 반복 탐지.
- 제한 이벤트는 감사 로그에 기록.

## 8. Voting 요구사항

### 8.1 회장 선거

| 항목 | 정책 |
| --- | --- |
| 임시회장 | 기존 정책에 따라 지정 |
| 후보 모집 | 14일 동안 가능 |
| 투표 오픈 | 15일째 |
| 투표 기간 | 3일 |
| 단일 후보 | 찬성/반대 |
| 결과 공개 | 종료 후 공개 |
| 당선자 수락 | 필요 |
| 미수락/거절 | 재투표 |

### 8.2 일반 안건 투표

- 참여자 범위 선택 가능.
- 익명 여부 선택 가능.
- 결과 공개 시점 선택 가능.
- 투표 오픈 전에는 수정 가능, 오픈 후 수정 불가.

## 9. Acceptance Test 초안

### 9.1 Join/Pending

```text
Given pending 사용자가 가입 정보 미완성이다
When /member/profile에 접근한다
Then /member/join으로 이동한다
```

### 9.2 Delegation Scope

```text
Given 사용자가 review_join_requests scope만 위임받았다
When GitHub 저장소 변경을 시도한다
Then 거부된다
```

### 9.3 Invitation Race

```text
Given max_uses=1 초대 코드가 있다
When 두 사용자가 동시에 사용한다
Then 한 명만 성공한다
```

### 9.4 Anonymous Vote

```text
Given 익명 투표가 종료되었다
When 운영진이 결과를 본다
Then 집계 결과만 보이고 개별 선택은 보이지 않는다
```
