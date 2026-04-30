# 05. 엣지 케이스와 열린 질문

## 1. 서브 에이전트 합의 결론

계정/권한, 프로젝트/초대, 거버넌스/투표/감사, IA/UX 관점에서 독립적으로 검토한 결과, 네 관점 모두 같은 위험을 지적했습니다.

핵심 위험:

```text
공식 팀장, 프로젝트 팀장, maintainer, 임시 위임자가 하나의 team lead 또는 projects.manage로 섞일 수 있다.
```

이 문제는 단순 이름 문제가 아닙니다. 다음 사고로 이어집니다.

| 사고 | 원인 |
| --- | --- |
| 비공개 프로젝트 노출 | 공식 팀 일반 팀원 또는 maintainer가 private project를 볼 수 있음 |
| 투표 조작 위험 | 임시 위임자가 프로젝트 팀장처럼 투표 생성/마감 가능 |
| 감사 로그 과노출 | maintainer/delegate가 민감 audit log 접근 가능 |
| 권한 재위임 | 임시 위임자가 다시 위임 관련 row를 수정 가능 |
| 승인 책임 불명확 | 누가 어떤 자격으로 승인했는지 audit log에 남지 않음 |
| UX 혼동 | 사용자가 프로젝트 내부 관리자인데 Admin처럼 보임 |

## 2. 반드시 답해야 할 Why 질문

### 2.1 계정/인증

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 Google 최초 로그인인가? | 학교 계정 여부를 안정적으로 확인하기 위해 | Google OAuth first 유지 |
| 왜 ID 로그인은 가입 요청서에서 먼저 설정하나? | 최초 Google 로그인 후에는 학교 계정 확인이 끝났으므로, 승인 대기 전에 이후 로그인 수단을 만들어야 함 | `/member/join`에서 필수 설정 |
| 왜 로그인 후 원래 링크로 돌아가야 하나? | 카카오톡/공지 링크 UX가 끊기지 않게 하기 위해 | nextPath 보존 |
| 왜 localhost에서 PKCE 오류가 나나? | OAuth 시작 origin과 callback origin이 다르면 storage가 다름 | Supabase Redirect URL 정확히 등록 |
| 왜 비국민대 계정 안내 페이지가 필요한가? | raw error가 아니라 계정 전환/탈퇴/재가입 행동을 주기 위해 | restricted page 필요 |

### 2.2 회원 승인

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 pending을 join과 pending 안내로 나누나? | 가입 요청서 작성과 승인 대기 안내를 같은 화면에 두면 ID 생성 CTA가 승인 대기 화면에 섞임 | 미완성 pending은 `/member/join`, 제출 완료 pending은 `/member/pending` |
| 왜 공식 팀장이 가입 승인을 할 수 있나? | 운영진 분산을 위해 | 범위를 명확히. 회장/부회장 최종 승인 권장 |
| 왜 모든 상태 변경을 audit에 남겨야 하나? | 누가 승인/정지/반려했는지 추적하기 위해 | 필수 |
| 왜 project_only 상태가 필요한가? | 코봇 정식 부원은 아니지만 프로젝트 참여자는 있을 수 있음 | DB 상태 추가 검토 |
| 왜 탈퇴 후 산출물을 삭제하지 않나? | 프로젝트 기록 보존 필요 | 표시 이름 정책만 반영 |

### 2.3 공식 팀과 프로젝트 팀

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 공식 팀과 프로젝트 팀을 분리해야 하나? | 운영 조직과 실제 협업 단위가 다름 | 다른 Aggregate |
| 왜 공식 팀장은 프로젝트 팀장이 아닌가? | 공식 팀장은 운영/검토자이고 프로젝트 책임자가 아님 | UI/DB 모두 분리 |
| 왜 공식 팀 일반 팀원이 비공개 프로젝트를 보면 안 되나? | 공식 팀 소속만으로 프로젝트 내부 접근권이 생기면 정보 노출 | lead/운영진/참여자만 |
| 왜 프로젝트 팀장은 운영진이 아닌가? | 자기 프로젝트만 관리하기 때문 | Admin 메뉴에 노출 금지 |
| 왜 `팀장 이상` 표현을 금지하나? | 공식 팀장과 프로젝트 팀장을 섞음 | `운영진`, `공식 팀장 이상`, `이 프로젝트 관리자` 사용 |

### 2.4 프로젝트 생성/모집

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 승인 전에도 모집 공유 페이지가 필요한가? | 팀원을 미리 모으고 승인자가 참여 예정자를 볼 수 있게 | 소개서만 공개 |
| 왜 승인된 프로젝트만 목록에 보여야 하나? | 미승인 아이디어가 공식 활동처럼 보이면 안 됨 | active + public만 catalog |
| 왜 비공개 프로젝트의 README만 보여야 하나? | 신청 판단은 필요하지만 내부 자료는 보호해야 함 | applicant intro view 필요 |
| 왜 프로젝트 생성 시 공개/비공개를 선택하나? | 공개 범위가 승인/모집/README 노출에 영향 | 생성 command에 포함 |
| 왜 필요 역할/기술 태그가 중요한가? | 지원자가 자기 적합성을 판단 | recruitment card 필수 요소 |

### 2.5 초대 코드

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 코드 사용은 서버 RPC여야 하나? | 만료, 사용 횟수, 권한 부여, 로그가 원자적이어야 함 | 필수 |
| 왜 프로젝트 코드로 코봇 부원 권한을 주면 안 되나? | 프로젝트 참여자와 정식 부원을 구분해야 함 | target_type 분리 |
| 왜 기본 기한이 5일인가? | 공유 링크 유출 위험과 편의 균형 | 기본 5일, 변경 가능 |
| 왜 초대 사용 시 팀장 알림이 필요한가? | 누가 들어왔는지 프로젝트 책임자가 알아야 함 | NotificationQueued |

### 2.6 GitHub README

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 GitHub App이 필요한가? | private repo README를 서버에서 안전하게 읽기 위해 | GitHub App 기반 |
| 왜 브라우저에 token을 주면 안 되나? | private repo 접근권이 노출됨 | 서버만 접근 |
| 왜 README와 내부 소개서 날짜 비교가 가능한가? | 최신 설명을 자동 선택하기 위해 | latest_updated option |
| 왜 fallback 정책이 필요한가? | GitHub 장애 시 빈 화면 방지 | 마지막 snapshot 또는 내부 소개서 |
| 왜 프로젝트 팀원이 소개서 변경 요청을 하고 팀장이 승인하나? | 프로젝트 대표 책임자가 공개 내용을 통제 | request/approve flow |

### 2.7 투표/거버넌스

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 프로젝트 권한과 투표 권한을 분리하나? | 프로젝트 관리자가 전체 투표를 만들면 안 됨 | vote capability 별도 |
| 왜 익명 투표 개별 ballot을 운영진도 보면 안 되나? | 익명성 신뢰 보장 | 집계만 열람 |
| 왜 당선자 수락이 필요한가? | 책임 수락 없는 권한 부여 방지 | 수락 후 반영 |
| 왜 차순위 자동 요청을 하지 않나? | 사용자가 원한 정책: 다시 투표 | 재투표 |
| 왜 단일 후보 찬반인가? | 선택지가 하나일 때 동의 여부를 묻기 위해 | 찬성/반대 |

### 2.8 연락 요청

| 왜? | 질문 | 현재 권장 답 |
| --- | --- | --- |
| 왜 연락 요청 사유가 필수인가? | 스팸/불필요 연락 방지 | reason required |
| 왜 수락자가 넘길 연락처를 선택하나? | 개인정보 자기결정권 | accept modal에서 선택 |
| 왜 3일 후 자동 거절인가? | 무기한 대기 방지 | auto_rejected, reason=미응답 |
| 왜 반복 요청에 확인창만으로 충분하지 않나? | 자동화는 API를 직접 칠 수 있음 | 서버 rate limit 필요 |
| 왜 신고를 회장/부회장이 보나? | 제재 권한은 운영진 영역 | abuse review queue |

## 3. 도메인별 엣지 케이스

### 3.1 Auth/Callback

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| localhost에서 로그인 시작, production callback으로 복귀 | PKCE verifier 없음 | exact redirect URL 등록, 오류 친화 문구 |
| 카카오톡 인앱 브라우저에서 로그인 | storage/cookie 제한 가능 | nextPath를 state/cookie 기반으로 보강 검토 |
| 사용자가 OAuth 중 취소 | raw error 노출 | cancelled 상태 표시 |
| Google 계정 여러 개 | 잘못된 계정 선택 | `prompt=select_account` 유지 |
| 학교 계정이지만 `hd` 누락 | 로그인 거부 가능 | email suffix fallback 유지 |

### 3.2 Join/Pending/Profile

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 가입 정보 미완성 pending 사용자가 `/member/profile` 직접 입력 | active 전용 프로필 화면 접근 | `/member/join`으로 이동 |
| 가입 요청 제출 완료 pending 사용자가 `/member/profile` 직접 입력 | 승인 대기 중 프로필 수정 CTA 노출 | `/member/pending`으로 이동 |
| pending 사용자에게 참여 코드 입력 허용 | 프로젝트/활동 권한 혼동 | 코드 target_type별 결과 화면 분리 |
| rejected 사용자가 다시 Google 로그인 | 반려 상태 유지 | 재가입 요청 flow 필요 |
| suspended 사용자가 ID 로그인 | 우회 접근 | status active 아닌 경우 workspace 차단 |

### 3.3 Nickname/Profile

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| `Alpha`와 `alpha` | 중복 회피 실패 | case-insensitive unique |
| `a b`와 `a_b` | slug 충돌 | `_` 직접 입력 금지, slug 중복 검사 |
| 탈퇴자가 쓰던 닉네임 재사용 | 작성자 혼동 | 작성 당시 snapshot 유지 |
| 부적절 닉네임 | 공개 품질 저하 | 금칙어/검사 |
| 닉네임 변경 후 과거 글 | 이력 불일치 | 글은 snapshot, 프로필은 현재 이력 표시 |

### 3.4 Official Team

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 공식 팀장이 자기 팀 아닌 프로젝트 승인 | 권한 범위 초과 | official_team scope 검증 |
| 공식 팀장이 모든 project read | 비공개 노출 | official team membership만으로 private read 금지 |
| 팀장 교체 중 공백 | 승인 지연 | 회장/부회장 fallback |
| 공식 팀 일반 팀원이 팀장 권한 획득 | RLS 오해 | role slug와 capability 분리 |

### 3.5 Project

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 프로젝트 팀장이 탈퇴 | ownerless project | lead transfer 전 탈퇴 금지 |
| 사전 모집 멤버가 승인 전 나감 | 승인 정보 부정확 | pre team member status 관리 |
| 프로젝트 비공개인데 공유 링크 공개 | 정보 노출 | share page는 intro only |
| 프로젝트 공개 전환 | 비공개 README 노출 | approval 또는 확인 절차 필요 |
| 프로젝트 이름 변경 | 공개 링크/slug 깨짐 | slug 변경 정책/redirect 필요 |

### 3.6 Invitation

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 동시에 같은 코드 사용 | used_count race | transaction + row lock |
| 코드 링크 유출 | 무단 참여 | expiry, max_uses, revoke |
| 프로젝트 코드로 활동 승인 | 권한 상승 | target_type 분리 |
| 만료 후 사용 | 혼란 | 명확한 실패 화면 |
| 발급자 탈퇴 후 코드 | 책임 불명확 | 발급자 상태와 코드 유지/폐기 정책 |

### 3.7 GitHub

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| GitHub App 권한 제거 | README 조회 실패 | status 표시, last snapshot fallback |
| README에 비밀 정보 포함 | KOBOT 웹에서 노출 | 프로젝트 팀장에게 공개 범위 경고 |
| private repo branch 변경 | README 경로 실패 | branch/path 설정 저장 |
| 내부 소개서와 README 충돌 | 무엇을 보여줄지 불명확 | intro display policy |
| GitHub API rate limit | 조회 실패 | caching/snapshot |

### 3.8 Delegation

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 위임자가 다시 위임 | 권한 확산 | 금지 |
| 위임자가 공개 범위 변경 | 정보 노출 | 금지 capability |
| 위임 만료 직전 action | race | command 시점 expires_at 검증 |
| 팀장이 위임 후 탈퇴 | 책임 공백 | lead exit policy 우선 |
| 여러 delegation 동시 존재 | 충돌 | scope별 유효 delegation 계산 |

### 3.9 Voting

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 투표 오픈 후 수정 | 신뢰 훼손 | 오픈 후 수정 불가 |
| 익명 투표인데 DB에서 user_id 연결 | 익명성 훼손 | 분리/해시/집계 설계 필요 |
| 후보 0명 | 투표 불가 | 부회장 대행 지속, 후보 재모집 |
| 당선자 미수락 | 권한 공백 | 재투표 |
| 동률 | 결정 불가 | 재투표 또는 부회장+공식 팀장 2명 선택 정책 |

### 3.10 Contact/Abuse

| 케이스 | 위험 | 대응 |
| --- | --- | --- |
| 같은 내용 반복 | 스팸 | 유사도 탐지 + rate limit |
| 짧은 시간 다수 발송 | 자동화 | 확인창 + 서버 제한 |
| 수락 후 연락처 악용 | 개인정보 위험 | 신고/제재 flow |
| 피요청자가 삭제 | 증거 사라짐 | 사용자 화면 숨김과 audit 보존 분리 |
| 3일 만료 job 실패 | pending 누적 | scheduled cleanup/retry |

## 4. 현재 코드 위험 상세

### RISK-001 `current_user_is_project_team_lead` 의미 오염

위치:

- `supabase/migrations/20260428173000_member_workspace_core.sql`

문제:

```sql
role in ('lead', 'maintainer')
```

그리고 accepted delegation도 true가 됩니다.

위험:

- maintainer가 팀장처럼 동작
- 임시 위임자가 팀장처럼 동작
- 투표, 감사 로그, 초대, 프로젝트 update 권한 확장

권장 수정:

- `current_user_is_project_lead(project_id)`는 role = lead만 true
- maintainer는 `current_user_is_project_operator(project_id)`로 분리
- delegation은 `current_user_has_project_delegated_scope(project_id, scope)`로 분리

### RISK-002 `projects.manage` 과범위

문제:

- 공식 팀장 seed 권한에 `projects.manage`가 들어갈 경우, 공식 팀장이 프로젝트 직접 관리자처럼 작동할 수 있습니다.

권장 수정:

- `projects.manage` 제거 또는 내부용 deprecated
- capability를 다음처럼 분리

```text
project.creation.review
official_team.project.review
project.join_request.review
project.material.manage
project.visibility.change
project.audit.read
```

### RISK-003 private project read 과범위

문제:

- 공식 팀 membership만으로 private project read가 가능할 수 있습니다.

권장 수정:

- private project read는 회장/부회장, 해당 프로젝트 참여자, 해당 프로젝트 팀장, 명시 검토자만 허용
- 공식 팀 일반 팀원은 제외
- 공식 팀장은 검토/감사 범위만 별도 허용

### RISK-004 pending과 join 화면 혼동

문제:

- 가입 요청 제출 완료 pending 사용자에게 `/member/profile` 접근 또는 ID 생성 CTA가 있으면 승인 대기 화면과 가입 요청서가 섞입니다.

권장 수정:

- route guard: `/member/profile` active only
- `/member/join`과 `/member/pending` CTA whitelist를 분리
- MemberLayout 비활성 상태 header에서 profile 버튼 제거

### RISK-005 invitation code direct update

문제:

- 프론트에서 직접 code row를 update하면 race condition과 audit 누락이 발생합니다.

권장 수정:

- `redeem_invitation(raw_code)` RPC 필수
- row lock, used_count, status, audit, notification 한 트랜잭션

### RISK-006 vote anonymity

문제:

- 익명 투표라도 `vote_ballots.voter_user_id`와 선택지가 직접 연결되면 관리자/DB 접근자가 볼 수 있습니다.

권장 수정:

- 1차에서는 “서비스 운영진에게 익명”과 “DB 관리자에게도 익명” 수준을 구분해 명시
- 진짜 익명성이 필요하면 ballot identity 분리 또는 암호화/집계 구조 필요

## 5. 구현 전 결정해야 할 항목

| 결정 | 추천안 | 이유 |
| --- | --- | --- |
| `maintainer` 유지 여부 | 1차에서는 제거 또는 project_operator로 낮춤 | 부팀장 대신 임시 위임으로 결정했기 때문 |
| project_only 상태 추가 | 추가 | 외부 프로젝트 참여자와 정식 부원 구분 |
| withdrawn 상태 추가 | 추가 또는 별도 tombstone | 탈퇴 완료 처리 명확화 |
| 공식 팀장 프로젝트 최종 승인 | 회장/부회장 최종 승인 권장 | 책임 추적 안정성 |
| 강제 팀장 변경 후보 수락 | 수락 권장 | 책임 부여에 대한 동의 필요 |
| 익명 투표 수준 | 운영진 화면 익명부터 시작 | 완전 익명은 별도 암호 설계 필요 |
| GitHub fallback | 마지막 성공 snapshot + 내부 소개서 fallback | 장애 대응 |
| 연락 요청 rate limit | 서버 제한 + 유사도 + 확인창 | 자동화는 confirm만으로 부족 |

## 6. 기능별 Acceptance Test 초안

### Join/Pending guard

```text
Given 사용자가 pending 상태이고 가입 요청 정보가 미완성이다
When /member/profile에 직접 접근한다
Then /member/join으로 이동한다

Given 사용자가 pending 상태이고 가입 요청 정보를 제출했다
When /member/profile에 직접 접근한다
Then /member/pending으로 이동한다
And 승인 대기 화면에는 ID 생성 입력창이 보이지 않는다
```

### Project lead separation

```text
Given 사용자가 project_operator다
When 프로젝트 공개 범위 변경을 시도한다
Then command가 거부된다
And audit log에 거부 이벤트가 남는다
```

### Temporary delegation scope

```text
Given 사용자가 review_join_requests scope를 위임받았다
When 참여 신청을 승인한다
Then 성공한다
When GitHub 저장소 변경을 시도한다
Then 거부된다
```

### Official team lead scope

```text
Given 사용자가 로봇 A팀 공식 팀장이다
When 로봇 B팀 기반 프로젝트를 승인하려 한다
Then 권한 없음으로 거부된다
```

### Invitation redemption

```text
Given max_uses=1인 프로젝트 초대 코드가 있다
When 두 사용자가 동시에 코드를 사용한다
Then 한 명만 성공한다
And used_count는 1이다
And 실패자는 사용 제한 초과 안내를 본다
```

### Vote anonymity

```text
Given 익명 투표가 종료되었다
When 회장/부회장이 결과를 본다
Then 집계 결과만 보인다
And 개별 투표자의 선택지는 보이지 않는다
```

### Contact auto reject

```text
Given 연락 요청이 pending 상태로 3일이 지났다
When 만료 job이 실행된다
Then status는 auto_rejected가 된다
And decision_reason은 미응답이다
```

## 7. 문구/IA 체크리스트

| 화면 | 반드시 확인 |
| --- | --- |
| 로그인 | 개발자 경로 노출 없음, Google 버튼은 표준 느낌 유지 |
| Auth Callback | raw PKCE error 노출 없음 |
| Join | 실명 자동 입력, 닉네임/아이디/필수 정보 입력, 회원가입 요청 CTA |
| Pending | 승인 상태 새로고침/문의/로그아웃만 표시, ID 생성/프로필 설정 CTA 없음 |
| Sidebar | Admin과 Project Operation 분리 |
| Project Detail | 사용자 자격과 scope 표시 |
| Vote | scope와 익명 여부 명확 표시 |
| Contact Request | 사유/연락처/신고 flow 명확 |
| Admin/Audit | 전체 운영과 범위 감사 로그 구분 |

## 8. 다음 구현 단계 권장

1. 현재 미수정 코드 중 pending/profile/auth callback P0 버그를 먼저 정리합니다.
2. DB migration에 capability/source/scope 모델을 추가하는 새 migration을 설계합니다.
3. `current_user_is_project_team_lead`를 분리하는 migration을 작성합니다.
4. `/member/pending`과 `MemberLayout`의 비활성 상태 CTA를 정리합니다.
5. 초대 코드 RPC와 audit log snapshot을 구현합니다.
6. 프로젝트 생성 승인 request 모델을 현재 `project_teams.status=pending`과 분리합니다.
7. GitHub README 연동은 private repo 권한 설계가 끝난 뒤 붙입니다.
