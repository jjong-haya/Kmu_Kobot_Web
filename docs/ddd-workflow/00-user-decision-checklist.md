# 00. 사용자 결정 체크리스트

## 1. 목적

이 문서는 KOBOT Web에서 사용자가 직접 정했거나, 사용자가 "추천대로 진행"이라고 승인한 제품/권한/개인정보/운영 기본값을 기록합니다.

작업 문서는 영어로 작성될 수 있지만, 이 문서는 사람이 빠르게 확인하는 한국어 결정 원장입니다.

## 2. 처리 원칙

| 우선순위 | 의미 | 처리 원칙 |
| --- | --- | --- |
| P0 | 권한, 개인정보, 승인 흐름, 감사 로그처럼 잘못 열리면 위험한 결정 | 확정 결정 또는 사용자 승인 가정이 있어야 구현 |
| P1 | 나중에 바꿀 수 있지만 DB/UX 비용이 있는 결정 | 추천 기본값으로 진행하고 문서에 assumption 기록 |
| P2 | 문구, 표시명, UX 세부 설정 | 합리적 기본값으로 진행 가능 |

사용자는 2026-05-01에 남은 선택지를 "그냥 다 추천대로 일단 해"라고 승인했습니다. 따라서 아래의 `Assumption-approved` 항목은 추가 질문 없이 구현 기준으로 사용합니다.

## 3. 확정 결정

### 3.1 서비스와 인증

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-AUTH-001 | 공개 메인 페이지는 발표/포트폴리오/시연용으로 사용 | Confirmed |
| DEC-AUTH-002 | 로그인 후 실제 동아리원이 쓰는 공간 이름은 `Member Workspace` | Confirmed |
| DEC-AUTH-003 | 기본 언어는 한국어, `lang="ko"` 기준 | Confirmed |
| DEC-AUTH-004 | 공식 문의처는 `kobot@kookmin.ac.kr` | Confirmed |
| DEC-LOGIN-001 | 최초 로그인은 Google OAuth 우선 | Confirmed |
| DEC-LOGIN-002 | 학교 계정 기본 조건은 `kookmin.ac.kr` | Confirmed |
| DEC-LOGIN-003 | 첫 로그인 후 ID/password 로그인 설정 가능 | Confirmed |
| DEC-LOGIN-004 | 링크로 들어와 로그인하면 원래 목적지로 복귀 | Confirmed |
| DEC-LOGIN-005 | 비국민대 계정은 가입 생성 자체를 제한하고 안내 화면으로 처리 | Assumption-approved |
| DEC-LOGIN-006 | 가입 정보 미완성 사용자는 `/member/join`으로 이동 | Confirmed |
| DEC-LOGIN-007 | 가입 요청 제출 후 승인 대기 사용자는 `/member/pending`으로 이동 | Confirmed |

### 3.2 가입과 프로필

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-PROFILE-001 | 필수 가입 정보는 이름, 닉네임, 학번, 전화번호, 단과대, 학과, 동아리 | Confirmed |
| DEC-PROFILE-002 | 동아리 입력은 phase 1에서 필수 | Assumption-approved |
| DEC-PROFILE-003 | 공개 페이지 작성자 표시 기본값은 익명 | Confirmed |
| DEC-PROFILE-004 | 내부 페이지에서는 익명 표시 불가 | Confirmed |
| DEC-PROFILE-005 | 내부 프로젝트 참여자 목록은 이름(닉네임), 연락처, 학번, 학과 등을 표시 | Confirmed |
| DEC-PROFILE-006 | 닉네임은 활성 사용자 기준 대소문자 구분 없이 중복 불가 | Confirmed |
| DEC-PROFILE-007 | 닉네임은 공백 입력 가능, 저장 slug에서는 공백을 `_`로 변환 | Confirmed |
| DEC-PROFILE-008 | 사용자가 `_`를 직접 입력하는 것은 불가 | Confirmed |
| DEC-PROFILE-009 | 닉네임 변경은 7일에 1회 | Confirmed |
| DEC-PROFILE-010 | 작성 당시 닉네임은 유지하고, 프로필 클릭 시 현재 닉네임 이력을 볼 수 있음 | Confirmed |
| DEC-PROFILE-011 | 이전 닉네임 비공개 요청 가능, 회장/부회장은 확인 가능 | Confirmed |
| DEC-PROFILE-012 | 숨긴 닉네임 이력은 회장/부회장만 override 가능 | Assumption-approved |

### 3.3 공식 팀과 프로젝트 팀

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-TEAM-001 | 공식 팀은 로봇 A/B/C/D팀, IoT팀, 연구팀 | Confirmed |
| DEC-TEAM-002 | 운영진은 회장, 부회장, 공식 팀장 | Confirmed |
| DEC-TEAM-003 | 프로젝트 팀장은 자기 프로젝트만 관리 | Confirmed |
| DEC-TEAM-004 | 팀 생성은 자유지만 승인 필요 | Confirmed |
| DEC-TEAM-005 | 프로젝트 생성 시 공식 팀 기반 또는 개인/자율 이름 기반 선택 가능 | Confirmed |
| DEC-TEAM-006 | 프로젝트는 승인된 것만 공개 목록에 노출 | Confirmed |
| DEC-TEAM-007 | 비공개 프로젝트는 운영진과 프로젝트 관련자만 접근 | Confirmed |
| DEC-TEAM-008 | 신청자에게는 내부 자료가 아니라 README/소개서 수준만 표시 | Confirmed |
| DEC-TEAM-009 | 공식 팀장은 공식 팀 기반 프로젝트의 검토 메타데이터만 볼 수 있고, 내부 자료는 별도 scope가 있어야 함 | Assumption-approved |
| DEC-TEAM-010 | 개인/자율 프로젝트 최종 승인은 모든 공식 팀장과 회장/부회장이 가능 | Assumption-approved |
| DEC-TEAM-011 | 승인 기록에는 누가 신청했고 누가 승인했는지 남김 | Confirmed |
| DEC-TEAM-012 | 사전 팀원은 정식 멤버가 아니라 승인 전 참여 예정자/신청자로 취급 | Assumption-approved |
| DEC-TEAM-013 | 프로젝트 가입 신청자 본인은 직접 승인 상태로 바꿀 수 없음 | Assumption-approved |
| DEC-TEAM-014 | 프로젝트 가입 요청 검토 위임자는 직접 membership table을 수정하지 않고 command RPC를 통해 승인/거절 | Assumption-approved |
| DEC-TEAM-015 | DB role `maintainer`는 당장 유지하되 제품 언어로는 `project_operator`로 매핑 | Assumption-approved |

### 3.4 권한 양도와 임시 위임

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-AUTHZ-001 | 프로젝트 팀장 양도는 요청자가 양도 요청, 피요청자가 수락하면 반영 | Confirmed |
| DEC-AUTHZ-002 | 현재 팀장이 말없이 탈퇴한 경우 공식 팀장이 강제 변경 요청 가능, 회장/부회장 승인 필요 | Confirmed |
| DEC-AUTHZ-003 | 팀장은 권한 변경 전까지 탈퇴 불가 | Confirmed |
| DEC-AUTHZ-004 | 임시 위임은 기한제, 최대 7일, 수락 필요 | Confirmed |
| DEC-AUTHZ-005 | 임시 위임은 팀장 권한 변경/양도 같은 핵심 권한은 제외 | Confirmed |
| DEC-AUTHZ-006 | 상태 전이는 직접 table update가 아니라 command RPC로 처리 | Assumption-approved |

### 3.5 초대와 모집

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-INVITE-001 | 초대 코드는 기본 5일 유효 | Confirmed |
| DEC-INVITE-002 | 초대 링크와 코드 모두 가능 | Confirmed |
| DEC-INVITE-003 | 초대 코드 사용 시 바로 승인되고 팀장에게 알림 | Confirmed |
| DEC-INVITE-004 | 초대 코드는 `max_uses`에 도달할 때까지 active 유지 | Assumption-approved |
| DEC-INVITE-005 | 실패한 초대 코드 사용 시도도 raw code 없이 기록 | Assumption-approved |
| DEC-INVITE-006 | 프로젝트 모집 카드는 로그인 사용자만 상세 신청 가능 | Confirmed |
| DEC-INVITE-007 | 모집 공개 여부는 프로젝트 생성 시 선택 | Confirmed |

### 3.6 연락 요청

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-CONTACT-001 | 연락 방식은 내부 채팅형 연락 요청 | Confirmed |
| DEC-CONTACT-002 | 요청자는 연락 이유와 자신의 공개 가능한 연락처를 첨부 | Confirmed |
| DEC-CONTACT-003 | 수락/거절/대기 상태를 사용 | Confirmed |
| DEC-CONTACT-004 | 수락 시 수락자가 넘길 연락처를 선택 | Confirmed |
| DEC-CONTACT-005 | 3일 미응답 시 자동 거절, 이유는 `미응답` | Confirmed |
| DEC-CONTACT-006 | 반복/유사 요청은 서버 RPC rate limit과 확인 UI로 막음 | Assumption-approved |
| DEC-CONTACT-007 | 스팸 신고는 회장/부회장이 확인하고 조치 | Confirmed |
| DEC-CONTACT-008 | phase 1 연락 수단은 email, phone, custom note로 시작 | Assumption-approved |
| DEC-CONTACT-009 | 프로젝트 roster 일반 조회에는 별도 감사 로그를 남기지 않고, 예외적 export/admin access만 audit | Assumption-approved |
| DEC-CONTACT-010 | 공개 `/contact` 문의는 내부 연락 요청과 별도 도메인 | Assumption-approved |

### 3.7 투표

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-VOTE-001 | 회장 선출 투표는 후보 모집 후 투표, 익명, 종료 후 결과 공개 | Confirmed |
| DEC-VOTE-002 | 단일 후보는 찬성/반대 | Confirmed |
| DEC-VOTE-003 | 당선자 미수락 시 차순위 요청 없이 재투표 | Confirmed |
| DEC-VOTE-004 | 결론이 안 나거나 출마자가 없으면 부회장이 권한 대행 | Confirmed |
| DEC-VOTE-005 | 일반 안건 투표도 가능 | Confirmed |
| DEC-VOTE-006 | 투표 항목은 오픈 전 수정 가능, 오픈 후 수정 불가 | Confirmed |
| DEC-VOTE-007 | 익명 투표는 일반 사용자/팀장/부회장/운영 화면에는 집계만 표시 | Confirmed |
| DEC-VOTE-008 | 회장만 감사 목적으로 개별 투표 기록 열람 가능, 투표 전 고지 필수 | Confirmed |
| DEC-VOTE-009 | 투표 자격은 투표 오픈 시점 snapshot으로 고정 | Assumption-approved |

### 3.8 GitHub README 연동

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-GITHUB-001 | GitHub 조직 이름은 `Kmu-Kobot` | Confirmed |
| DEC-GITHUB-002 | 프로젝트 팀장이 GitHub repo를 연결 가능 | Confirmed |
| DEC-GITHUB-003 | 공개/비공개 repo 모두 가능 | Confirmed |
| DEC-GITHUB-004 | README와 내부 소개서 중 표시 source는 프로젝트 팀장이 선택 | Confirmed |
| DEC-GITHUB-005 | 팀원은 source 변경 요청 가능, 프로젝트 팀장이 승인 | Confirmed |
| DEC-GITHUB-006 | private README snapshot은 최신본 1개만 보관, history는 project lead opt-in 때만 | Assumption-approved |
| DEC-GITHUB-007 | GitHub README 실패 시 마지막 성공 snapshot, 없으면 내부 소개서 fallback | Assumption-approved |

### 3.9 감사 로그와 개인정보

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-AUDIT-001 | 모든 요청/승인/중요 행동은 기록 | Confirmed |
| DEC-AUDIT-002 | 회장은 모든 기록 열람 가능 | Confirmed |
| DEC-AUDIT-003 | 감사 로그 기본 보관은 1년 | Confirmed |
| DEC-AUDIT-004 | 1년 후 개인정보 payload는 삭제하고 비식별 통계만 유지 | Confirmed |
| DEC-AUDIT-005 | 전화번호, 학번, 연락처, private README 원문, 투표 선택 원문은 일반 audit payload에 저장하지 않음 | Assumption-approved |
| DEC-AUDIT-006 | 회장/부회장은 전체 값, 공식 팀장은 마스킹, 일반 감사 화면은 마스킹 | Confirmed |
| DEC-AUDIT-007 | 감사 로그 생성은 command RPC/trigger/service role 경로로만 처리 | Assumption-approved |

### 3.10 대시보드, 공지, 공개 페이지

| ID | 결정 | 상태 |
| --- | --- | --- |
| DEC-DASH-001 | 대시보드는 일반 active member 우선, operator queue는 capability별 표시 | Assumption-approved |
| DEC-DASH-002 | 대시보드 첫 범위는 알림, 내 프로젝트, 연락 요청, 진행 중 투표 | Assumption-approved |
| DEC-NOTICE-001 | 공개 공지와 내부 공지는 별도 read model로 분리 | Assumption-approved |
| DEC-PUBLIC-001 | `/recruit`은 당장 실제 지원 form이 아니라 홍보/안내 페이지 | Assumption-approved |
| DEC-PUBLIC-002 | 지난 모집 일정은 archive/status copy로 전환 | Assumption-approved |
| DEC-UX-001 | `mock`, `DB 연결 전` 같은 개발 상태 문구는 production UI에서 제거 | Assumption-approved |
| DEC-UX-002 | `Admin/Leadership/Member/Guest` 용어는 회장/부회장/공식 팀장/프로젝트 팀장/capability 모델로 교체 | Assumption-approved |

## 4. 남은 비제품 결정

| ID | 항목 | 기본 처리 |
| --- | --- | --- |
| OPS-SUPABASE-001 | 원격 Supabase migration 적용 | Git/Vercel 배포와 별개로, DB 비밀번호와 migration history를 확인한 뒤 안전하게 적용 |
| OPS-AUTH-HOOK-001 | Supabase Auth Hook Dashboard 연결 검증 | SQL 함수만으로는 부족하므로 배포 체크리스트에서 수동 검증 |

## 5. 이후 질문 처리 규칙

사용자가 명시적으로 다른 결정을 내리기 전까지는 위 결정이 구현 기준입니다.

새 질문은 다음 경우에만 다시 사용자에게 묻습니다.

- 개인정보 공개 범위가 넓어지는 경우
- 권한이 기존 결정보다 넓어지는 경우
- 기존 데이터를 삭제하거나 되돌릴 수 없는 migration이 필요한 경우
- 법적/운영 책임자가 달라지는 경우
- 비용 또는 외부 서비스 계약이 필요한 경우
