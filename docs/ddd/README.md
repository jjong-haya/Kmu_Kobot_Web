# KOBOT Member Workspace DDD 설계 패키지

이 폴더는 KOBOT Web의 멤버 워크스페이스를 DDD와 이벤트 스토밍 방식으로 다시 검증한 설계 산출물입니다.

## 왜 다시 설계했는가

현재 프로젝트는 단순 게시판형 웹이 아니라 다음 성격을 동시에 가집니다.

- 국민대학교 계정 기반 인증 시스템
- 동아리원 승인 및 권한 관리 시스템
- 공식 팀과 프로젝트 팀이 함께 존재하는 협업 시스템
- 초대 코드, 프로젝트 모집, GitHub README 연동 시스템
- 회장/부회장/공식 팀장/프로젝트 팀장의 의사결정 시스템
- 연락 요청, 신고, 투표, 감사 로그, 개인정보 보존 시스템

이 구조에서 `팀장`, `관리자`, `승인자` 같은 단어를 대충 쓰면 권한 사고가 납니다. 특히 `공식 팀장`, `프로젝트 팀장`, `maintainer`, `임시 위임자`는 서로 다른 도메인 개념입니다.

## 핵심 결론

KOBOT Web의 권한은 단순 Permission 코드만으로 판정하지 않습니다. 모든 권한은 아래 5가지를 함께 가집니다.

| 축 | 의미 |
| --- | --- |
| 계정 상태 | pending, active, suspended, rejected, alumni, project_only |
| 권한 출처 | president, vice_president, official_team_lead, project_lead, project_operator, temporary_delegation |
| 적용 범위 | organization, official_team:{id}, project:{id}, self |
| 수행 능력 | members.approve, project.join_request.review, vote.create.project 같은 command capability |
| 시간/승인 근거 | approved_by, approved_at, expires_at, source_event_id |

최종 원칙은 다음입니다.

```text
Role = 신분 또는 책임
Permission/Capability = 특정 행위 가능성
Delegation = 기간과 scope가 제한된 임시 행위 가능성
```

이 세 개를 섞으면 투표 조작, 비공개 프로젝트 노출, 권한 재위임, 감사 로그 오염이 발생합니다.

## 문서 목록

| 문서 | 내용 |
| --- | --- |
| [01-domain-map.md](./01-domain-map.md) | 바운디드 컨텍스트, 핵심 용어, Aggregate, 도메인 불변식 |
| [02-event-storming-board.md](./02-event-storming-board.md) | Actor, Command, Domain Event, Policy, Read Model 기준 이벤트 스토밍 |
| [03-capability-and-permission-model.md](./03-capability-and-permission-model.md) | 계정 상태, 역할, 권한 출처, scope, delegation 설계 |
| [04-feature-specification.md](./04-feature-specification.md) | 기능 명세서, 화면, command, acceptance criteria |
| [05-edge-cases-and-open-questions.md](./05-edge-cases-and-open-questions.md) | 왜 질문, 엣지 케이스, 현재 코드 위험, 구현 전 확인 항목 |

## 구현 전 반드시 지켜야 할 금지 사항

| 금지 | 이유 |
| --- | --- |
| `팀장 이상`이라는 표현 사용 | 공식 팀장과 프로젝트 팀장이 섞입니다. |
| `projects.manage` 하나로 모든 프로젝트 권한 처리 | 공식 팀장, 프로젝트 팀장, 임시 위임자의 범위가 다릅니다. |
| `current_user_is_project_team_lead()` 안에 maintainer/delegate 포함 | 팀장이 아닌 사용자가 팀장급 권한을 얻습니다. |
| pending 사용자에게 `/member/pending`에서 `/member/profile` 또는 ID 생성 CTA 노출 | 승인 대기 화면과 가입 요청서 화면이 섞입니다. 최초 정보 입력은 `/member/join`에서만 합니다. |
| 프로젝트 팀장을 운영진으로 표시 | 프로젝트 팀장은 자기 프로젝트 범위에서만 권한을 가집니다. |
| 임시 위임자를 role로 저장해서 팀장처럼 처리 | delegation은 기간제 capability입니다. |
| 프론트에서 초대 코드 사용을 직접 update | 사용 횟수, 만료, 권한 부여, 감사 로그가 원자적으로 처리되지 않습니다. |
| 익명 투표 ballot을 운영진이 직접 볼 수 있게 설계 | 익명성 신뢰가 깨집니다. |

## 현재 코드와 연결되는 주요 위험

현재 migration에는 이미 좋은 기반이 있지만, 다음 위험은 구현 전에 고쳐야 합니다.

| 파일 | 위험 |
| --- | --- |
| `supabase/migrations/20260428173000_member_workspace_core.sql` | `current_user_is_project_team_lead()`가 lead, maintainer, accepted delegation을 함께 true로 볼 수 있습니다. |
| `supabase/migrations/20260428173000_member_workspace_core.sql` | `project_teams_update_admins_or_leads`, `votes_manage_admins_or_leads`, `audit_logs_select_admins_or_project_leads`가 위 함수를 재사용하면 과권한이 생깁니다. |
| `src/app/layouts/MemberLayout.tsx` | 사이드바에서 전체 운영과 프로젝트 내부 운영이 섞이면 프로젝트 팀장이 Admin처럼 보일 수 있습니다. |
| `src/app/pages/member/ApprovalPending.tsx` | 가입 요청 접수 후 승인만 기다리는 화면입니다. ID 생성이나 프로필 설정 CTA가 있으면 안 됩니다. |

## 설계 기준일

- 작성일: 2026-04-29
- 서비스 도메인: `https://kobot.kookmin.ac.kr`
- 공식 문의처: `kobot@kookmin.ac.kr`
- 대상: 국민대학교 KOBOT 로봇 동아리 및 승인된 프로젝트 참여자
