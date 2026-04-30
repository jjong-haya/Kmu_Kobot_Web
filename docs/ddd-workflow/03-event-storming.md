# 03. 이벤트 스토밍

## 1. Actor

### 1.1 사용자/운영자

| Actor | 설명 | 범위 |
| --- | --- | --- |
| Guest | 로그인하지 않은 방문자 | 공개 페이지, 공개 프로젝트/모집 카드 |
| School Google User | 국민대 Google 계정 사용자 | 최초 로그인, 가입 요청 |
| Pending Applicant | 가입 요청 중/승인 대기 사용자 | `/member/join`, `/member/pending` |
| Active Member | 승인된 코봇 부원 | Member Workspace |
| President | 최고 관리자 | 전체 |
| Vice President | 부회장 | 회장 전용 제외 거의 전체 |
| Official Team Lead | 공식 팀장 | 자기 공식 팀/승인 범위 |
| Project Lead | 프로젝트 팀장 | 자기 프로젝트 |
| Project Operator | 프로젝트 내부 운영 보조 | 허용된 프로젝트 기능 |
| Temporary Delegate | 기간제 위임자 | 특정 프로젝트 + 특정 scope + 만료일 |
| Project Applicant | 프로젝트 참여 신청자 | README/소개서/신청 상태 |
| External Project Participant | 학교 인원이지만 코봇 정식 부원은 아닌 참여자 | 특정 프로젝트 |

## 2. Commands

### 2.1 Auth & Onboarding

| Command | Actor | 결과 Event |
| --- | --- | --- |
| StartGoogleLogin | Guest | GoogleLoginStarted |
| CompleteOAuthCallback | School Google User | OAuthCallbackCompleted |
| SubmitJoinRequestProfile | Pending Applicant | JoinRequestProfileSubmitted |
| CreateLoginIdCredential | Pending Applicant 또는 Active Member | LoginCredentialCreated |
| RefreshAuthorizationContext | Authenticated User | AuthorizationContextRead |
| RequestAccountDeletionAndRejoin | Restricted User | AccountRejoinRequested |

### 2.2 Member Approval

| Command | Actor | 결과 Event |
| --- | --- | --- |
| ApproveMemberJoin | President/Vice/OfficialTeamLead 정책 범위 | MemberJoinApproved |
| RejectMemberJoin | 운영진 | MemberJoinRejected |
| SuspendMember | President/Vice | MemberSuspended |
| RestoreMember | President/Vice | MemberRestored |
| RequestMemberExit | Active Member | MemberExitRequested |
| ApproveMemberExit | Project Lead 또는 운영진 정책 | MemberExitApproved |

### 2.3 Project & Recruitment

| Command | Actor | 결과 Event |
| --- | --- | --- |
| SubmitProjectCreationRequest | Active Member | ProjectCreationRequested |
| SelectProjectType | Requester | ProjectTypeSelected |
| AddPreTeamMembers | Requester | PreTeamMembersAdded |
| ApproveProjectCreation | 운영진/공식 팀장 정책 범위 | ProjectCreationApproved |
| RejectProjectCreation | 운영진/공식 팀장 정책 범위 | ProjectCreationRejected |
| PublishRecruitmentCard | Project Lead | RecruitmentCardPublished |
| RequestToJoinProject | Active Member 또는 Project Applicant | ProjectJoinRequested |
| ApproveJoinRequest | Project Lead/허용 Delegation | ProjectJoinApproved |
| RejectJoinRequest | Project Lead/허용 Delegation | ProjectJoinRejected |

### 2.4 Invitation

| Command | Actor | 결과 Event |
| --- | --- | --- |
| IssueMemberActivationCode | President/Vice/OfficialTeamLead 정책 | MemberActivationCodeIssued |
| IssueOfficialTeamInvite | OfficialTeamLead/President/Vice | OfficialTeamInviteIssued |
| IssueProjectInvite | Project Lead/허용 Delegation | ProjectInviteIssued |
| RedeemInvitation | Authenticated User | InvitationRedeemed |
| RevokeInvitation | Issuer 또는 상위 운영자 | InvitationRevoked |
| ExpireInvitation | System | InvitationExpired |

### 2.5 GitHub README

| Command | Actor | 결과 Event |
| --- | --- | --- |
| LinkGitHubRepository | Project Lead | GitHubRepositoryLinked |
| VerifyGitHubAppAccess | System | GitHubRepositoryAccessVerified |
| RequestReadmeSync | Project Lead/허용 Delegation/System | ReadmeSyncRequested |
| StoreReadmeSnapshot | System | ReadmeSnapshotStored |
| ChangeIntroDisplayPolicy | Project Lead | IntroDisplayPolicyChanged |
| RequestIntroDisplayPolicyChange | Project Member | IntroDisplayPolicyChangeRequested |
| ApproveIntroDisplayPolicyChange | Project Lead | IntroDisplayPolicyChangeApproved |

### 2.6 Contact Request

| Command | Actor | 결과 Event |
| --- | --- | --- |
| SendContactRequest | Active Member | ContactRequestSent |
| AcceptContactRequest | Recipient | ContactRequestAccepted |
| RejectContactRequest | Recipient | ContactRequestRejected |
| AutoRejectExpiredContactRequest | System | ContactRequestAutoRejected |
| ReportContactSpam | Recipient | ContactSpamReported |
| RestrictContactRequester | President/Vice | ContactRequesterRestricted |

### 2.7 Voting & Governance

| Command | Actor | 결과 Event |
| --- | --- | --- |
| CreateVote | 권한 있는 운영자/프로젝트 팀장 범위 | VoteCreated |
| OpenVote | Vote Manager | VoteOpened |
| SubmitBallot | Eligible Voter | BallotSubmitted |
| CloseVote | System/Vote Manager | VoteClosed |
| PublishVoteResult | Vote Manager | VoteResultPublished |
| NominateCandidate | Active Member | CandidateNominated |
| AcceptNomination | Nominee | CandidateAcceptedNomination |
| AcceptElectionWin | Winner | ElectionWinAccepted |
| RejectElectionWin | Winner | ElectionWinRejected |

## 3. Policies / Sagas

### 3.1 핵심 Policy

| Policy | 규칙 |
| --- | --- |
| SchoolEmailOnlyPolicy | 일반 신규 사용자는 `kookmin.ac.kr` Google 계정으로만 가입 시작 |
| JoinBeforePendingPolicy | 가입 정보 미완성 pending은 `/member/join`, 완료 pending은 `/member/pending` |
| CapabilitySourceScopePolicy | capability는 source, scope, expiresAt 없이는 판정하지 않음 |
| ProjectLeadNotOperatorPolicy | project_operator/temporary_delegate는 팀장 변경/공개범위/GitHub 연결 변경 불가 |
| ApplicantIntroOnlyPolicy | 참여 신청자는 내부 자료가 아니라 README/소개서만 열람 |
| InvitationRedemptionAtomicPolicy | 초대 코드 사용은 row lock + 권한 부여 + 감사 로그 + 알림을 한 트랜잭션으로 처리 |
| AnonymousVotePolicy | 익명 투표는 화면상 집계만 제공, 개별 선택값 노출 금지 |
| ContactAntiSpamPolicy | 짧은 시간 반복/유사 내용 반복은 서버 제한과 확인창 병행 |
| AuditRedactionPolicy | 감사 로그에 전화번호/학번/투표 선택/연락처 원문 복사 금지 |

### 3.2 Saga 후보

| Saga | 단계 |
| --- | --- |
| ProjectCreationApprovalSaga | 신청서 작성 → 사전 팀원/모집 카드 → 검토 → 승인/반려 → 프로젝트 활성화 → 알림/감사 |
| InvitationRedemptionSaga | 코드 입력 → hash 조회 → 만료/횟수/target 검증 → 권한 부여 → used_count 증가 → 알림/감사 |
| TemporaryDelegationSaga | 요청 → 피요청자 수락 → scope 활성화 → 만료 job → 감사 |
| ContactRequestLifecycleSaga | 요청 → 수락/거절/3일 자동거절 → 연락처 공개/숨김 → 신고 가능 → 감사 |
| ElectionSaga | 임시회장 지정 → 14일 후보 모집 → 15일 투표 오픈 → 3일 투표 → 결과 공개 → 당선자 수락 → 권한 반영 |
| GitHubReadmeSyncSaga | 저장소 연결 → App 권한 확인 → README fetch → snapshot 저장 → 표시 정책 적용 → 실패 fallback |

## 4. Read Models

### 4.1 화면용 Read Model

| Read Model | 사용 화면 | 포함 정보 |
| --- | --- | --- |
| AuthSessionView | Login/AuthCallback | session, status, nextPath |
| JoinRequestFormView | `/member/join` | Google 실명, 필수 프로필, ID 생성 상태 |
| ApprovalStatusView | `/member/pending` | 승인 상태, 문의, 로그아웃 |
| AuthorizationContextView | 전체 protected route | permissions, orgPositions, teamMemberships, capability source/scope |
| ProjectCatalogView | 공개/내부 프로젝트 목록 | approved + public 프로젝트 |
| ProjectApplicantIntroView | 공유 링크/신청자 화면 | README/소개서/필요 역할/기술 태그 |
| ProjectOperatorView | 프로젝트 상세 운영 | 신청자, 초대 코드, 팀원, 자료 관리 CTA |
| OfficialTeamOperationView | 공식 팀장 화면 | 자기 공식 팀 검토/초대/승인 큐 |
| ContactInboxView | 연락 페이지 | 받은 요청, 보낸 요청, 상태, 신고 CTA |
| VoteDetailView | 투표 화면 | eligibility, 익명 여부, 선택지, 결과 공개 시점 |
| AuditTimelineView | 운영진/범위 감사 | actor source/scope, redacted payload |

## 5. External Systems

### 5.1 연동 목록

| 시스템 | 용도 | 실패 시 처리 |
| --- | --- | --- |
| Supabase Auth | Google OAuth, ID/password 로그인 | 친화적 오류, 재로그인 안내 |
| Supabase Postgres/RLS/RPC | 데이터/권한/상태 전이 | RPC 기반 실패 메시지 |
| Google OAuth | 학교 계정 확인 | 비국민대 안내/재가입 |
| Vercel | 배포/SPA rewrite | 환경변수/redirect URL 확인 |
| GitHub App | private README 조회 | 마지막 snapshot 또는 내부 소개서 fallback |
| Email | 알림/문의 | 1차는 웹 알림 중심, 이메일은 후속 |
