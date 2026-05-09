# Forms Applicant Response Visibility DDD Note

## 1. Domain Understanding

폼 상세 URL은 같은 주소를 쓰지만 실제 업무는 두 개다.

- 신청자 응답 작성: 활성 부원이 질문을 보고 자기 응답을 제출한다.
- 폼 운영 관리: 운영진이 응답 목록, 응답 시트 연결, 댓글, 팀/경기 운영 데이터를 확인하고 수정한다.

비용이 큰 실수는 신청자가 다른 사람의 응답, 개인정보, 응답 시트 연결 정보, 운영 댓글, 팀/경기 운영 데이터를 보는 것이다. 따라서 이 문제는 UI 탭 표시 문제가 아니라 read model과 command 권한 경계 문제다.

## 2. Ubiquitous Language

- 신청자용 폼 상세 / `ApplicantFormView`: 응답 작성에 필요한 질문, 상태, 응답 가능 기간만 포함한다.
- 운영자용 폼 상세 / `ManagerFormView`: `forms.manage` 권한이 있는 사용자에게만 응답, 응답 시트, 댓글, 팀/경기 운영 데이터를 포함한다.
- 응답 시트 / `ResponseSheet`: 운영진 전용 응답 집계 read model이다. 신청자 응답 작성 read model에 포함하면 안 된다.
- 연결 질문 / `ConditionalQuestion`: 특정 선택지 응답에 따라 신청자에게 보이는 질문이다. 응답 시트 권한과는 별도 도메인 규칙이다.

## 3. Bounded Contexts

- Form Response Context
  - Actor: 신청자
  - Owned data: 질문, 응답 가능 상태, 제출 payload
  - Read model: `ApplicantFormView`
  - Security risk: 운영 데이터 노출

- Form Operations Context
  - Actor: `forms.manage` 운영진
  - Owned data: responses, responseSheet, comments, tournament teams/matches
  - Commands: 응답 시트 연결/해제, 경기 점수 저장
  - Security risk: 권한 없는 운영 명령 실행

## 4. Invariants

- `forms.manage`가 없는 사용자의 폼 상세 read model에는 `responses`, `comments`, `responseSheet`, `tournament.teams`, `tournament.matches`가 들어가면 안 된다.
- 신청자 화면은 `응답 작성`만 보여야 한다. `응답 시트`, `댓글`, `팀 관리` 탭은 운영자용 read model에서만 렌더링한다.
- 응답 시트 연결/해제, 운영 댓글 등록, 팀 추가, 경기 점수 저장은 `forms.manage` 권한이 없는 actor가 호출하면 실패해야 한다.
- UI 숨김은 보조 방어다. 먼저 신청자용 read model을 redaction해야 한다.

## 5. Event Storming

- Actor: Applicant
- Command: Open form for response
- Policy: Build `ApplicantFormView`
- Read Model: form questions without operator-only data
- Failure Event: Applicant response data exposed

- Actor: Form manager
- Command: Open form operations view
- Policy: Require `forms.manage`
- Read Model: full form operations state

- Actor: Form manager
- Command: Link response sheet / add operations comment / add tournament team / record match score
- Policy: Require `forms.manage`
- Domain Event: Form operations state updated
- Failure Event: Forbidden form operation attempted

## 6. Permission, State, Visibility

- 신청자는 활성 부원이어야 하고, 폼 상태와 응답 기간이 열려 있을 때만 제출할 수 있다.
- 운영자는 `forms.manage`가 있어야 폼 목록, 생성, 수정, 삭제, 상태 변경, 응답 시트, 댓글, 팀/경기 운영을 볼 수 있다.
- 현재 구현은 브라우저 localStorage 기반이므로 진짜 서버 보안 경계는 아니다. Supabase 영구 저장으로 옮길 때는 같은 규칙을 RLS/RPC에서 강제해야 한다.

## 7. Implementation Plan

- `src/app/api/forms.ts`
  - `redactFormForApplicant`로 신청자 read model에서 운영 데이터를 제거한다.
  - `getApplicantForm`을 추가해 신청자 상세 진입 경로가 전체 aggregate를 직접 받지 않게 한다.
  - `updateFormResponseSheet`, `addFormComment`, `addTournamentTeam`, `recordTournamentMatchScore`가 `actorCanManageForms` 없이는 실패하게 한다.

- `src/app/pages/member/FormDetail.tsx`
  - `canManageForms ? getForm : getApplicantForm`으로 읽기 경로를 분리한다.
  - 신청자에게는 `응답 작성` 패널만 만들고, 응답 시트 로드와 운영 명령은 `canManageForms`로 막는다.
  - 권한이 없는 상태로 바뀌면 응답 시트/점수 UI 상태를 비운다.

- `scripts/forms-policy.test.mjs`
  - 신청자 read model에서 운영 데이터가 제거되는 회귀 테스트를 추가한다.
  - 운영 명령이 command boundary에서 권한 인자를 요구하는 회귀 테스트를 추가한다.

- `docs/product/forms.md`
  - 신청자용 상세 read model의 운영 데이터 금지 규칙을 제품 문서에 남긴다.

## 8. Review Log

- Domain reviewer: 승인. 신청자 응답 작성과 폼 운영 관리는 별도 bounded context다.
- Implementation reviewer: 승인. `FormDetail` 상태에 들어가기 전에 read model이 분리된다.
- Risk reviewer: 조건부 승인. localStorage 구현은 서버 보안 경계가 아니므로, Supabase 이전 시 forms RLS/RPC가 같은 정책을 강제해야 한다.

## 9. Verification

- `npm run typecheck` 통과.
- `npm test -- scripts/forms-policy.test.mjs` 통과. 전체 142개 테스트 통과.
- 브라우저 검증: 운영 데이터가 포함된 테스트 폼을 localStorage에 심고, `forms.manage`를 제거한 일반 회원 컨텍스트로 `/member/forms/security-test-form`에 진입했다. 화면 버튼/링크/제목 목록에서 `응답 시트`, `Google Sheets`, `댓글`, `팀 관리` 운영 라벨이 0개였고, 보이는 응답 관련 버튼은 `응답 작성 1`, `개인정보 응답 카드`, `응답 제출`뿐이었다.
