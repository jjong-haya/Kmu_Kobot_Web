# 04. 기능 명세서

## 1. 제품 범위

### 1.1 Public Site

목적:

- KOBOT 활동 소개
- 발표/포트폴리오/시연용 화면
- 프로젝트/모집/활동을 외부에 보여주는 공개 표면

주요 페이지:

| Route | 목적 |
| --- | --- |
| `/` | 메인 랜딩 |
| `/projects` | 공개 프로젝트 소개 |
| `/activities` | 활동 기록 |
| `/recruit` | 모집 안내 |
| `/notice` | 공개 공지 |
| `/contact` | 문의 |
| `/privacy` | 개인정보 처리방침 |
| `/terms` | 이용약관 |
| `/login` | 멤버 워크스페이스 로그인 |

### 1.2 Member Workspace

목적:

- 실제 동아리 운영
- 가입 승인, 공지, 자료, 장비, 프로젝트, 투표, 연락, 감사 로그

주요 페이지:

| Route | 목적 | 접근 |
| --- | --- | --- |
| `/auth/callback` | Google OAuth 결과 처리 | 세션 교환 중 |
| `/member/join` | 최초 가입 요청 정보 입력 | 로그인 사용자 중 가입 정보 미완성 pending |
| `/member/pending` | 가입 요청 접수 후 승인 대기/정지/반려 안내 | 로그인 사용자 중 active 아님 |
| `/member/profile` | active 사용자 프로필/ID 설정 | active only |
| `/member` | 대시보드 | active only |
| `/member/notifications` | 알림 | active only |
| `/member/contact-requests` | 연락 요청 | active 또는 project_only 정책 검토 |
| `/member/projects` | 내 프로젝트/프로젝트 목록 | active only |
| `/member/projects/:id` | 프로젝트 상세 | 권한별 |
| `/member/projects/:id/operations` | 프로젝트 내부 운영 | project lead/operator/delegation |
| `/member/votes` | 투표 | eligible voter |
| `/member/admin/members` | 가입 승인 | 운영진 |
| `/member/admin/official-teams` | 공식 팀 운영 | 회장/부회장/공식 팀장 |
| `/member/admin/audit` | 감사 로그 | 회장/부회장/범위 권한자 |
| `/member/admin/integrations` | GitHub/이메일 등 연동 | 회장 또는 명시 권한자 |

현재 코드의 route와 다를 수 있습니다. 이 문서는 목표 설계 기준입니다.

## 2. 인증 기능

### F-IA-001 Google 최초 로그인

사용자 스토리:

- 국민대학교 Google 계정으로 처음 로그인하고 싶다.
- 카카오톡/공지 링크로 들어온 경우 로그인 후 원래 보려던 페이지로 돌아가고 싶다.

Command:

- `StartGoogleLogin(nextPath)`
- `HandleGoogleOAuthCallback(code, state, nextPath)`

Domain Events:

- `GoogleOAuthStarted`
- `GoogleOAuthCallbackReceived`
- `SupabaseSessionEstablished`
- `GoogleOAuthCanceled`
- `GoogleOAuthSessionExchangeFailed`

정책:

| 정책 | 내용 |
| --- | --- |
| ReturnPathPolicy | 로그인 시작 전 nextPath를 저장하고 성공 후 복귀 |
| SameOriginPkcePolicy | OAuth 시작 origin과 callback origin이 같아야 함 |
| FriendlyCallbackErrorPolicy | PKCE raw error를 사용자용 문구로 변환 |

Acceptance Criteria:

- 사용자가 `/member/projects/abc` 링크로 들어와 로그인하면 성공 후 같은 페이지로 돌아간다.
- 로그인 취소 시 개발자용 에러 대신 `로그인이 취소되었습니다`를 보여준다.
- PKCE verifier 오류 시 `다시 로그인이 필요합니다`를 보여준다.
- 로컬 테스트 시 `http://localhost:5173/auth/callback`이 Supabase Redirect URLs에 없으면 원인 안내가 가능해야 한다.

### F-IA-002 국민대 이메일 제한

Command:

- `ValidateSignInEmail(email, googleHostedDomain)`
- `RejectNonAllowedEmail(email)`

Domain Events:

- `SignInEmailValidated`
- `NonKookminAccountRejected`
- `AllowedLoginExceptionAccepted`

Acceptance Criteria:

- `@kookmin.ac.kr` 계정은 계정 생성 가능하다.
- 허용 예외 목록에 있는 외부 계정은 계정 생성 가능하다.
- 허용되지 않은 외부 계정은 워크스페이스가 아니라 안내 페이지로 이동한다.
- 안내 페이지에는 학교 계정만 가능하다는 설명, 탈퇴/재가입 요청, 문의처만 표시한다.

### F-IA-003 ID 보조 로그인

Command:

- `CreateLoginId(loginId)`
- `SetLoginPassword(password)`
- `SignInWithLoginId(loginId, password)`

Domain Events:

- `LoginIdCreated`
- `LoginPasswordEnabled`
- `UserSignedInWithLoginId`

권한:

- `login_id.create.self` 가입 요청 작성 중 또는 active only

Acceptance Criteria:

- 최초 Google 로그인 후 가입 요청 정보가 미완성인 pending 사용자는 `/member/join`에서 ID를 설정해야 한다.
- 가입 요청을 제출한 pending 사용자는 `/member/pending`에서 ID 생성 화면에 접근할 수 없다.
- rejected, suspended, alumni는 ID 생성 화면에 접근할 수 없다.
- ID 로그인은 Google로 만든 같은 계정에 연결된다.
- ID 로그인 실패 시 존재 여부를 과도하게 노출하지 않는다.

## 3. 가입 요청/승인 대기/계정 상태 화면

### F-MEM-000 가입 요청 정보 입력

Route:

- `/member/join`

목적:

- 학교 Google 계정으로 확인된 이름과 이메일을 바탕으로 회원가입 요청서를 작성한다.
- 운영진 승인 전에 필요한 필수 정보와 ID 로그인을 먼저 설정한다.

입력 항목:

| 항목 | 필수 | 비고 |
| --- | --- | --- |
| 이메일 | 예 | Google 계정에서 자동 입력, 수정 불가 |
| 실명 | 예 | Google 이름을 자동 입력, 사용자가 확인/수정 |
| 닉네임 | 예 | 내부 기본 표시 이름 |
| 학번 | 예 | 운영진 확인용 |
| 전화번호 | 예 | 프로젝트 내부 소통용 |
| 단과대 | 예 | 소속 확인 |
| 학과 | 예 | 소속 확인 |
| 동아리 소속 | 선택 | 외부 프로젝트 참여자까지 고려 |
| 공개 페이지 표시 방식 | 예 | 기본값 익명 |
| 기술태그 | 선택 | 모집/협업 매칭 |
| 로그인 아이디/비밀번호 | 예 | 이후 ID 로그인 가능 |

Command:

- `SaveJoinRequestProfile`
- `CreateLoginId`
- `SetLoginPassword`
- `SubmitMemberJoinRequest`

Domain Events:

- `JoinRequestProfileSaved`
- `LoginIdCreated`
- `LoginPasswordEnabled`
- `MemberJoinRequestSubmitted`

Acceptance Criteria:

- Google 로그인 직후 필수 가입 정보가 미완성인 사용자는 `/member/join`으로 이동한다.
- 실명칸은 Google 이름 또는 `profiles.full_name`으로 자동 입력된다.
- 닉네임은 자동으로 실명을 넣지 않고 사용자가 직접 정한다.
- 로그인 아이디와 비밀번호는 가입 요청 시 필수다.
- 저장이 끝나면 `/member/pending`으로 이동한다.

### F-MEM-001 승인 대기 화면

Route:

- `/member/pending`

목적:

- 현재 계정이 왜 워크스페이스에 못 들어가는지 알려준다.
- 사용자가 할 수 있는 행동만 보여준다.

허용 CTA:

| CTA | 동작 |
| --- | --- |
| 승인 상태 새로고침 | `RefreshApprovalStatus` |
| 운영진 문의 | `mailto:kobot@kookmin.ac.kr` 또는 문의 modal |
| 로그아웃 | `SignOut` |
| 참여 코드 입력 | 별도 정책 확정 시, ID 생성과 분리 |

금지 CTA:

- ID 만들기
- 프로필 설정
- 프로젝트 생성
- 팀 초대 발급
- 관리자 화면 이동

Command:

- `RefreshApprovalStatus`
- `SignOut`

Domain Events:

- `ApprovalStatusRefreshed`
- `UserSignedOut`

Acceptance Criteria:

- 가입 정보 미완성 pending 사용자는 `/member/join`으로 이동한다.
- 가입 요청 제출 완료 pending 사용자는 `/member/pending`으로 이동한다.
- pending 사용자가 `/member/profile`로 직접 접근해도 가입 정보 미완성이면 `/member/join`, 제출 완료 상태면 `/member/pending`으로 이동한다.
- pending 화면에는 KOBOT 서비스 설명이 아니라 승인 안내 문구만 있다.
- 화면 문구에는 `/member` 같은 개발자 경로가 직접 노출되지 않는다.
- active로 바뀐 뒤 새로고침하면 대시보드로 이동한다.

### F-MEM-002 계정 정지/반려/졸업 안내

Command:

- `ViewAccountStatus`
- `ContactOperators`

Domain Events:

- `AccountStatusViewed`

Acceptance Criteria:

- suspended는 정지 사유와 문의 CTA만 표시한다.
- rejected는 반려 안내와 재가입 문의 CTA만 표시한다.
- alumni는 추후 정책에 따라 제한된 열람만 가능하게 한다.

## 4. 프로필과 닉네임

### F-PRO-001 프로필 필수 정보 입력

필수 입력:

| 항목 | 목적 | 공개 범위 |
| --- | --- | --- |
| 실명 | 내부 프로젝트 참여자 식별 | 같은 프로젝트 참여자/운영진 |
| 닉네임 | 내부 기본 표시, 공개 표시 선택 | 내부 필수 표시 |
| 학번 | 내부 식별 | 같은 프로젝트 참여자/운영진 |
| 전화번호 | 프로젝트 내부 소통 | 같은 프로젝트 참여자/운영진 |
| 단과대 | 소속 정보 | 내부 참여자 목록 |
| 학과 | 소속 정보 | 내부 참여자 목록 |
| 소속 동아리 | 외부 프로젝트 참여자 구분 | 내부 참여자 목록 |
| 기술 태그 | 모집/협업 매칭 | 공개 여부 정책 필요 |

Command:

- `SaveProfileSettings`

Domain Events:

- `ProfileCompleted`
- `ProfileUpdated`

Acceptance Criteria:

- active 사용자만 저장 가능하다.
- 내부 프로젝트 참여자 목록에서는 `실명 (닉네임)` 형태가 기본이다.
- 공개 페이지에서는 익명/닉네임/실명 중 사용자가 선택한 방식으로 표시한다.
- 기본 공개값은 anonymous다.

### F-PRO-002 닉네임 변경

Command:

- `ChangeNickname(newNickname, hidePrevious)`

Domain Events:

- `NicknameChanged`
- `PreviousNicknameHiddenFromMembers`

Acceptance Criteria:

- 닉네임은 대소문자 구분 없이 active 사용자 간 중복 불가다.
- `_` 직접 입력은 불가하다.
- 공백 입력은 허용하되 저장 slug에서는 `_`로 변환한다.
- 변경은 7일에 1회 가능하다.
- 작성 당시 닉네임 snapshot은 유지한다.
- 작성자 프로필에서는 `alpha - Beta - gamma(현)` 같은 이력을 권한 범위에 맞게 표시한다.
- 이전 닉네임 비공개 선택 시 일반 멤버에게는 숨기고 회장/부회장은 확인 가능하다.

## 5. 공식 팀 기능

### F-OT-001 공식 팀 카탈로그

기본 공식 팀:

- 로봇 A팀
- 로봇 B팀
- 로봇 C팀
- 로봇 D팀
- IoT팀
- 연구팀

Command:

- `CreateOfficialTeam`
- `RenameOfficialTeam`
- `DeactivateOfficialTeam`

Domain Events:

- `OfficialTeamCreated`
- `OfficialTeamRenamed`
- `OfficialTeamDeactivated`

Acceptance Criteria:

- 공식 팀은 운영 단위이며 프로젝트 팀과 별도로 관리한다.
- 공식 팀 명칭은 UI에서 한국어로 표시한다.

### F-OT-002 공식 팀장 임명

Command:

- `AssignOfficialTeamLead`
- `RemoveOfficialTeamLead`

Domain Events:

- `OfficialTeamLeadAssigned`
- `OfficialTeamLeadRemoved`

권한:

- 회장 직접 지명
- 부회장은 정책에 따라 요청 또는 보조 승인 가능

Acceptance Criteria:

- 공식 팀장은 운영진으로 표시한다.
- 공식 팀장은 자기 공식 팀의 초대/검토/범위 로그만 가진다.
- 공식 팀장이 모든 프로젝트 내부 자료를 볼 수 없어야 한다.

## 6. 프로젝트 생성/승인

### F-PRJ-001 프로젝트 생성 신청

사용자 스토리:

- 모든 active 사용자는 프로젝트 팀을 자유롭게 만들 수 있다.
- 생성 시 공식 팀 이름을 걸지 개인/자율 이름으로 할지 선택한다.
- 승인 전에도 필요하면 팀원을 미리 모을 수 있다.

Command:

- `SubmitProjectCreationRequest`
- `SetProjectType`
- `SetRecruitmentAudience`
- `SetVisibility`
- `AddPreTeamMembers`
- `AttachIntroSource`

Domain Events:

- `ProjectCreationRequested`
- `ProjectTypeSelected`
- `RecruitmentAudienceSelected`
- `ProjectVisibilitySelected`
- `ProjectPreTeamMembersAdded`
- `ProjectIntroSourceAttached`

입력 항목:

| 항목 | 필수 | 설명 |
| --- | --- | --- |
| 프로젝트 이름 | 예 | 공식 팀 기반 또는 개인 이름 |
| 프로젝트 유형 | 예 | official_based, personal/autonomous |
| 공식 팀 | 조건부 | official_based일 때 필요 |
| 한 줄 소개 | 예 | 모집/승인 목록에 표시 |
| 상세 소개 | 예 | 내부 소개서 또는 README |
| 공개 범위 | 예 | public/private |
| 모집 대상 | 예 | 동아리 내부/국민대 외부 포함 |
| 승인 전 공유 가능 여부 | 예 | 모집 공유 링크 노출 여부 |
| 필요 역할 | 선택 | 역할/기술 태그 |
| 참여 예정자 | 선택 | 사전 팀 구성 |
| GitHub 저장소 | 선택 | README 연동 |

Acceptance Criteria:

- 생성 신청은 active 사용자만 가능하다.
- 승인 전 프로젝트는 전체 공개 목록에 나오지 않는다.
- 승인 전 공유가 켜진 경우 모집 공유 페이지는 접근 가능하다.
- 승인자는 신청자, 참여 예정자, 필요 역할, 소개서를 볼 수 있다.
- 비공개 프로젝트는 승인 후에도 운영진과 프로젝트 관련자만 볼 수 있다.

### F-PRJ-002 프로젝트 승인/반려

Command:

- `ReviewProjectCreation`
- `ApproveProjectCreation`
- `RejectProjectCreation`

Domain Events:

- `ProjectCreationReviewed`
- `ProjectCreationApproved`
- `ProjectCreationRejected`
- `ProjectTeamActivated`

권한:

| 유형 | 검토 | 최종 승인 |
| --- | --- | --- |
| 공식 팀 기반 | 해당 공식 팀장 | 회장/부회장 권장 |
| 개인/자율 | 회장/부회장/공식 팀장 검토 가능 | 회장/부회장 권장 |

Acceptance Criteria:

- 승인/반려는 사유를 남긴다.
- 승인자는 audit log에 기록된다.
- 승인되면 프로젝트 팀장, 초기 팀원, 모집 설정이 반영된다.
- 반려되면 신청자에게 알림이 간다.

## 7. 프로젝트 모집/참여

### F-REC-001 모집 공유 페이지

목적:

- 공지방이나 카카오톡에 보기 좋은 카드/페이지로 공유한다.
- 지원자가 “내가 갈 수 있는 프로젝트인지” 판단하게 한다.

Command:

- `PublishRecruitmentCard`
- `UpdateRecruitmentNeeds`
- `ShareRecruitmentLink`

Domain Events:

- `RecruitmentCardPublished`
- `RecruitmentNeedsUpdated`
- `RecruitmentLinkShared`

Acceptance Criteria:

- 프로젝트 이름, 소개, 필요 역할, 기술 태그가 보인다.
- 로그인 필요 여부는 프로젝트 생성 시 선택한다.
- 승인 전 검토자는 볼 수 있어야 한다.
- 비공개 프로젝트는 내부 자료가 아니라 소개서만 보인다.

### F-REC-002 참여 신청

Command:

- `RequestToJoinProject`
- `CancelJoinRequest`
- `ApproveJoinRequest`
- `RejectJoinRequest`
- `ExpireJoinRequest`

Domain Events:

- `ProjectJoinRequested`
- `ProjectJoinCanceled`
- `ProjectJoinApproved`
- `ProjectJoinRejected`
- `ProjectJoinRequestExpired`
- `ProjectMemberJoined`

Acceptance Criteria:

- 신청자는 프로젝트 소개서/README만 볼 수 있다.
- 프로젝트 팀장이 참여 신청을 승인/거절한다.
- 프로젝트 팀장은 자기 프로젝트 신청만 볼 수 있다.
- 승인되면 프로젝트 참여자 목록에 들어간다.
- 반려/만료 시 알림이 간다.

### F-REC-003 프로젝트 참여자 목록

표시 항목:

| 항목 | 내부 프로젝트 목록 | 공개 페이지 |
| --- | --- | --- |
| 역할 | 표시 | 선택적 |
| 실명 | 표시 | 기본 숨김 |
| 닉네임 | 실명 옆 보조 표시 | 사용자 선택 시 표시 |
| 연락처 | 같은 프로젝트 참여자에게 표시 | 숨김 |
| 학번 | 같은 프로젝트 참여자에게 표시 | 숨김 |
| 학과/단과대 | 표시 | 숨김 또는 선택 |
| 기술 태그 | 표시 | 선택적 |

Acceptance Criteria:

- 프로젝트 참여자 목록에서는 실명을 우선 표시한다.
- 공개 페이지에서는 기본 anonymous다.
- 탈퇴자의 산출물 기여는 삭제하지 않되 표시 이름 정책을 반영한다.

## 8. 초대 코드/링크

### F-INV-001 코드 발급

Command:

- `IssueMemberActivationCode`
- `IssueOfficialTeamInvite`
- `IssueProjectInvite`

Domain Events:

- `MemberActivationCodeIssued`
- `OfficialTeamInviteIssued`
- `ProjectInviteIssued`

Acceptance Criteria:

- 기본 기한은 5일이다.
- 발급자는 만료일을 변경할 수 있다.
- 프로젝트 팀장은 자기 프로젝트 코드만 발급 가능하다.
- 프로젝트 코드는 프로젝트 참여만 부여한다.
- 활동 부원 코드는 운영진만 발급 가능하다.

### F-INV-002 코드 사용

Command:

- `RedeemInvitation(rawCode)`

Domain Events:

- `InvitationRedeemed`
- `MemberActivatedByCode`
- `OfficialTeamJoinedByInvite`
- `ProjectMemberJoinedByInvite`

Acceptance Criteria:

- 코드 사용은 서버에서 원자적으로 처리된다.
- 만료/폐기/사용 제한 초과 코드는 실패한다.
- 프로젝트 코드 사용 시 바로 참여 처리된다.
- 프로젝트 팀장에게 누가 들어왔는지 알림이 간다.
- 모든 사용 기록은 audit log에 남는다.

## 9. GitHub README 연동

### F-GH-001 GitHub 저장소 연결

Command:

- `LinkGitHubRepository`
- `VerifyGitHubRepositoryAccess`
- `DisconnectGitHubRepository`

Domain Events:

- `GitHubRepositoryLinked`
- `GitHubRepositoryAccessVerified`
- `GitHubRepositoryDisconnected`

Acceptance Criteria:

- GitHub App 기반 접근을 사용한다.
- 비공개 저장소도 README만 KOBOT 웹에서 보여줄 수 있다.
- 브라우저에 private token을 노출하지 않는다.
- 프로젝트 팀장이 저장소 연결 상태를 볼 수 있다.
- 설치가 안 된 경우 단계별 안내를 보여준다.

### F-GH-002 README/내부 소개서 표시 정책

Command:

- `ChooseIntroDisplayPolicy`
- `RequestReadmeSync`
- `ApproveIntroChange`

Domain Events:

- `IntroDisplayPolicyChanged`
- `ReadmeSyncRequested`
- `ReadmeSyncSucceeded`
- `ReadmeSyncFailed`
- `IntroChangeApproved`

정책 옵션:

| 옵션 | 설명 |
| --- | --- |
| internal_first | 내부 소개서 우선 |
| github_first | GitHub README 우선 |
| latest_updated | 내부 소개서 updated_at과 GitHub README commit date 비교 |
| manual | 프로젝트 팀장이 수동 선택 |

Acceptance Criteria:

- 팀원은 소개서 변경 요청을 할 수 있다.
- 프로젝트 팀장이 승인해야 반영된다.
- GitHub 조회 실패 시 fallback을 표시한다.
- 마지막 성공 snapshot을 보존한다.

## 10. 프로젝트 팀장 변경/탈퇴/임시 위임

### F-LEAD-001 프로젝트 팀장 양도

Command:

- `RequestProjectLeadTransfer`
- `AcceptProjectLeadTransfer`
- `RejectProjectLeadTransfer`

Domain Events:

- `ProjectLeadTransferRequested`
- `ProjectLeadTransferAccepted`
- `ProjectLeadTransferRejected`
- `ProjectLeadChanged`

Acceptance Criteria:

- 현재 팀장이 새 팀장에게 양도를 요청한다.
- 요청 시 현재 팀장은 이후 상태를 선택한다: 팀원 유지 또는 탈퇴 요청.
- 피요청자가 수락하면 자동 반영된다.
- 모든 전이는 audit log에 남는다.

### F-LEAD-002 공식 팀장의 강제 변경 요청

Command:

- `RequestForcedProjectLeadChange`
- `ApproveForcedProjectLeadChange`
- `RejectForcedProjectLeadChange`

Domain Events:

- `ForcedProjectLeadChangeRequested`
- `ForcedProjectLeadChangeApproved`
- `ForcedProjectLeadChangeRejected`
- `ProjectLeadChangedByApprovedForceRequest`

Acceptance Criteria:

- 현재 팀장이 말 없이 탈퇴/부재한 경우 공식 팀장이 요청할 수 있다.
- 회장/부회장이 승인해야 한다.
- 강제 변경 사유는 필수다.
- 새 팀장 후보 수락 여부는 정책으로 결정해야 하지만, 안전상 수락을 권장한다.

### F-LEAD-003 임시 위임

Command:

- `RequestTemporaryDelegation`
- `AcceptTemporaryDelegation`
- `RejectTemporaryDelegation`
- `RevokeTemporaryDelegation`
- `ExpireTemporaryDelegation`

Domain Events:

- `TemporaryDelegationRequested`
- `TemporaryDelegationAccepted`
- `TemporaryDelegationRejected`
- `TemporaryDelegationRevoked`
- `TemporaryDelegationExpired`

Acceptance Criteria:

- 최대 7일이다.
- 연장은 새 요청으로 처리한다.
- 피요청자 수락 후 시작한다.
- 위임자는 정식 프로젝트 팀장이 아니다.
- 위임 범위와 만료일이 화면에 표시된다.
- 위임자는 팀장 변경/공개 범위/GitHub 저장소/삭제/투표 확정 권한이 없다.

### F-EXIT-001 프로젝트 탈퇴 요청

Command:

- `RequestProjectExit`
- `ApproveProjectExit`
- `RejectProjectExit`

Domain Events:

- `ProjectExitRequested`
- `ProjectExitApproved`
- `ProjectExitRejected`
- `ProjectMemberLeft`
- `ProjectLeadExitBlocked`

Acceptance Criteria:

- 일반 팀원은 프로젝트 팀장에게 탈퇴 요청한다.
- 프로젝트 팀장은 승인/거절한다.
- 프로젝트 팀장은 권한 이전 또는 임시 복구 절차 전까지 탈퇴할 수 없다.

## 11. 연락 요청

### F-CON-001 연락 요청 보내기

Command:

- `SendContactRequest`

Domain Events:

- `ContactRequestSent`
- `RepeatedContactRequestDetected`

입력:

| 항목 | 필수 |
| --- | --- |
| 연락 사유 | 예 |
| 요청자가 넘길 연락처 | 선택 |
| 원하는 연락 방식 | 선택 |

Acceptance Criteria:

- 연락 사유는 필수다.
- 짧은 시간 반복 요청 시 확인창을 띄운다.
- 유사 문구 반복은 서버에서 제한한다.
- 자동화 의심 시 요청 제한 또는 CAPTCHA/쿨다운을 적용한다.

### F-CON-002 연락 요청 응답

Command:

- `AcceptContactRequest`
- `RejectContactRequest`
- `AutoRejectExpiredContactRequest`

Domain Events:

- `ContactRequestAccepted`
- `ContactRequestRejected`
- `ContactRequestAutoRejected`

Acceptance Criteria:

- 수락 시 수락자가 넘길 연락처를 선택한다.
- 3일 뒤 미응답이면 자동 거절한다.
- 자동 거절 사유는 `미응답`이다.
- 요청/응답은 1년 보관 후 삭제한다.
- 피요청자는 받은 요청을 자기 화면에서 삭제 처리할 수 있다.

### F-CON-003 신고와 제재

Command:

- `ReportContactSpam`
- `ReviewAbuseReport`
- `ApplyWarning`
- `ApplyContactRestriction`
- `SuspendMember`

Domain Events:

- `ContactRequestReportedAsSpam`
- `AbuseReportReviewed`
- `MemberWarned`
- `ContactRequestRestricted`
- `MemberSuspended`

Acceptance Criteria:

- 회장/부회장이 신고 내용을 확인한다.
- 단순 이유 없는 연락은 경고 가능하다.
- 이상한 글/부적절 내용은 정지 가능하다.
- 내용 없는 반복 요청은 제한 가능하다.
- 조치 이력은 audit log에 남는다.

## 12. 투표

### F-VOTE-001 회장 선거

Command:

- `AppointTemporaryPresident`
- `OpenPresidentCandidacy`
- `RecommendCandidate`
- `AcceptCandidacy`
- `WithdrawCandidacy`
- `OpenPresidentElectionVote`
- `SubmitBallot`
- `CloseVote`
- `PublishVoteResult`
- `AcceptPresidentRole`
- `RestartElection`

Domain Events:

- `TemporaryPresidentAppointed`
- `PresidentCandidacyOpened`
- `CandidateRecommended`
- `CandidacyAccepted`
- `CandidacyWithdrawn`
- `PresidentElectionVoteOpened`
- `AnonymousBallotSubmitted`
- `VoteClosed`
- `VoteResultPublished`
- `PresidentRoleAccepted`
- `PresidentElectionRestarted`

Acceptance Criteria:

- 임시회장은 2주 권한을 가진다.
- 15일째 회장 투표가 열린다.
- 후보 참여 기간은 14일이다.
- 투표 기간은 3일이다.
- 임시회장은 기본 후보가 되지만 사퇴 가능하다.
- 후보 추천 시 피추천자에게 알림이 간다.
- 단일 후보는 찬성/반대 투표다.
- 반대가 많으면 처음부터 재투표한다.
- 최초 당선자가 수락하지 않으면 차순위 요청 없이 재투표한다.
- 결론이 안 나면 부회장이 권한을 대신한다.
- 익명 투표는 종료 후 결과 공개다.

### F-VOTE-002 일반 안건 투표

Command:

- `CreateGeneralVote`
- `EditVoteBeforeOpen`
- `OpenVote`
- `SubmitBallot`
- `CloseVote`
- `PublishVoteResult`

Domain Events:

- `GeneralVoteCreated`
- `VoteEditedBeforeOpen`
- `VoteOpened`
- `BallotSubmitted`
- `VoteClosed`
- `VoteResultPublished`

Acceptance Criteria:

- 투표 범위는 생성자가 선택한다.
- 오픈 전에는 수정 가능하다.
- 오픈 후에는 수정 불가다.
- 익명/기명 여부를 선택할 수 있다.
- 결과 공개 시점도 선택 가능하되 기본은 종료 후 공개다.
- 투표 scope에 맞는 생성 권한이 있어야 한다.

## 13. 감사 로그와 개인정보 보존

### F-AUD-001 감사 로그 생성

Command:

- `RecordAuditLog`

Domain Events:

- `AuditLogRecorded`

Acceptance Criteria:

- 모든 중요 command는 audit log를 남긴다.
- audit log에는 actor, target, old/new data, reason, 권한 출처, scope, source id가 들어간다.
- 회장은 모든 기록을 볼 수 있다.
- 부회장은 운영 기록을 볼 수 있다.
- 공식 팀장/프로젝트 팀장은 자기 scope의 기록만 볼 수 있다.
- 민감 로그는 회장/부회장만 본다.

### F-AUD-002 보관과 삭제

Command:

- `DeleteExpiredAuditLogs`
- `DeleteExpiredNotifications`
- `DeleteExpiredContactRequests`

Domain Events:

- `AuditLogsDeletedAfterRetention`
- `NotificationsDeletedAfterRetention`
- `ContactRequestsDeletedAfterRetention`

Acceptance Criteria:

- 개인정보성 로그는 기본 1년 보관 후 삭제한다.
- 산출물은 삭제하지 않는다.
- 공개 페이지 기여자 표시 방식은 사용자 선택을 따른다.
- 개인정보 처리방침과 이용약관에 수집 항목, 목적, 보관 기간, 삭제 방법을 명시한다.

## 14. 알림

### F-NOTI-001 알림 생성/읽음

Command:

- `QueueNotification`
- `MarkNotificationRead`
- `DeleteNotification`

Domain Events:

- `NotificationQueued`
- `NotificationRead`
- `NotificationDeletedByUser`

Acceptance Criteria:

- 승인/반려/초대/참여/신고/투표 등 주요 event는 알림을 만든다.
- 사이드바에 읽지 않은 알림 배지가 뜬다.
- 이메일 알림은 사용자가 선택할 수 있다.
- 발신자 표시 이름은 `KOBOT`이다.
- 공식 문의처는 `kobot@kookmin.ac.kr`이다.

## 15. UI/UX 문구 원칙

| 원칙 | 예시 |
| --- | --- |
| 개발자 경로 노출 금지 | `/member로 이동` 대신 `워크스페이스로 이동` |
| 권한 범위 표시 | `승인하기` 대신 `이 프로젝트 참여 승인` |
| pending은 안내 중심 | 서비스 설명/마케팅 문구 제거 |
| 관리자 단어 제한 | `전체 운영`, `공식 팀 운영`, `프로젝트 운영`으로 구분 |
| 에러는 행동으로 연결 | `다시 로그인`, `운영진 문의`, `계정 전환` |
| 모바일 우선 정보량 조절 | 로그인/승인 페이지는 CTA 2~3개만 |

## 16. 1차 구현 우선순위

| 순위 | 기능 | 이유 |
| --- | --- | --- |
| 1 | 인증/callback/pending/profile 가드 정리 | 접근 제어의 입구 |
| 2 | capability 모델 재설계 | 이후 모든 기능의 기반 |
| 3 | 멤버 승인 관리 | 실제 동아리 운영 시작 조건 |
| 4 | 공식 팀/프로젝트 팀 분리 | 권한 사고 방지 |
| 5 | 프로젝트 생성/승인/모집 | 핵심 협업 기능 |
| 6 | 초대 코드 RPC | 참여 흐름 자동화 |
| 7 | 감사 로그 확장 | 나중에 붙이면 누락됨 |
| 8 | 연락 요청/신고 | 개인정보/소통 기능 |
| 9 | 투표 | 거버넌스 기능 |
| 10 | GitHub README 연동 | 프로젝트 소개 품질 향상 |
