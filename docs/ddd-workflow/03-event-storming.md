# 03. Event Storming Ledger

## 1. Purpose

This file is the cumulative DDD Step 7 ledger.

Add commands, events, policies, read models, and external systems under the owning domain. Do not mix multiple domains into one vague command such as `Approve` or `Manage`.

## 2. Actors

| Actor | Meaning | Scope |
| --- | --- | --- |
| Guest | Not logged in. | Public showcase only. |
| SchoolGoogleUser | Google-authenticated `kookmin.ac.kr` user. | Can begin join profile. |
| RestrictedGoogleUser | Google-authenticated but not school/allowed account. | Restricted guidance only. |
| JoinProfileIncompleteUser | Logged in but join profile missing required fields. | `/member/join`. |
| PendingApplicant | Join request submitted, not active yet. | `/member/pending`. |
| ActiveMember | Approved KOBOT member. | Member workspace by capability. |
| ProjectOnlyParticipant | Non-full member with project-specific participation. | Future project-only routes. |
| President | Highest operator. | Organization-wide. |
| VicePresident | Organization-wide support operator. | Organization-wide except president-only actions. |
| OfficialTeamLead | Operator for one official team. | Own official team and assigned approval/review scopes. |
| ProjectLead | Lead for one project. | Own project only. |
| ProjectOperator | Scoped project helper. | Explicit project capability only. |
| TemporaryDelegate | Time-limited scoped helper. | Accepted delegation scope only. |
| System | Scheduled jobs, OAuth hooks, server-side commands. | Automation only. |

## 3. Command/Event Map

### 3.1 Identity And Access

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| StartGoogleLogin | Guest | GoogleLoginStarted | SchoolEmailOnlyPolicy, NextPathPreservationPolicy | AuthSessionView |
| CompleteOAuthCallback | SchoolGoogleUser | OAuthCallbackCompleted | CallbackErrorRedactionPolicy | AuthCallbackProgressView |
| RejectNonSchoolGoogleAccount | System | NonSchoolAccountRejected | SchoolEmailOnlyPolicy | RestrictedAccountView |
| CreateLoginIdCredential | JoinProfileIncompleteUser / ActiveMember | LoginCredentialCreated | LoginIdUniquenessPolicy | ProfileCredentialView |
| ResolveLoginIdForPasswordSignIn | Guest | LoginEmailResolved | AccountEnumerationPreventionPolicy | LoginFormView |
| RefreshAuthorizationContext | Authenticated User | AuthorizationContextRead | ActiveStatusCapabilityPolicy | AuthorizationContextView |

### 3.2 Member Registry

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| SaveJoinProfileDraft | JoinProfileIncompleteUser | JoinProfileDraftSaved | RequiredProfileFieldPolicy | JoinRequestFormView |
| SubmitJoinRequest | JoinProfileIncompleteUser | JoinRequestSubmitted | MembershipApplicationPolicy | ApprovalStatusView |
| ApproveMemberJoin | President / VicePresident / OfficialTeamLead by scope | MemberJoinApproved | MemberApprovalAuthorityPolicy | MemberApprovalQueueView |
| RejectMemberJoin | OperatorGroup | MemberJoinRejected | RejectionReasonPolicy | MemberApprovalQueueView |
| SuspendMember | President / VicePresident | MemberSuspended | SuspensionAuditPolicy | MemberDirectoryView |
| RestoreMember | President / VicePresident | MemberRestored | RestoreAuditPolicy | MemberDirectoryView |
| RequestMemberExit | ActiveMember | MemberExitRequested | ProjectLeadExitGuardPolicy | MemberExitRequestView |
| ApproveMemberExit | ProjectLead / OperatorGroup by scope | MemberExitApproved | ContributionRetentionPolicy | MemberExitRequestView |
| CompleteMemberExit | System / OperatorGroup | MemberWithdrawn | PublicAttributionPolicy | PublicContributionView |

### 3.3 Profile Identity

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| ChangeNickname | ActiveMember | NicknameChanged | NicknameFormatPolicy, NicknameCooldownPolicy, ActiveNicknameUniquenessPolicy | ProfileView |
| HidePreviousNicknameFromMembers | ActiveMember | NicknameHistoryVisibilityChanged | PresidentViceOverridePolicy | NicknameHistoryView |
| ChangePublicCreditMode | ActiveMember | PublicCreditModeChanged | PublicAttributionPolicy | PublicContributionView |
| UpdateContactProfile | ActiveMember | ContactProfileUpdated | PiiVisibilityPolicy | ProjectRosterView |

### 3.4 Authority And Capability

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| AssignOrgPosition | President | OrgPositionAssigned | PresidentDirectAppointmentPolicy | AuthorizationContextView |
| AssignOfficialTeamLead | President | OfficialTeamLeadAssigned | DirectAppointmentAuditPolicy | OfficialTeamOperationView |
| RequestRoleTransfer | CurrentHolder / OfficialTeamLead by escalation | RoleTransferRequested | RoleTransferAuthorityPolicy | RoleTransferInboxView |
| AcceptRoleTransfer | TargetUser | RoleTransferAccepted | TargetAcceptancePolicy | RoleTransferInboxView |
| ApplyRoleTransfer | System / President by policy | RoleTransferApplied | AssignmentTransactionPolicy | AuthorizationContextView |
| RequestTemporaryDelegation | ProjectLead | TemporaryDelegationRequested | DelegationScopePolicy | DelegationInboxView |
| AcceptTemporaryDelegation | TargetUser | TemporaryDelegationAccepted | MaxSevenDayDelegationPolicy | AuthorizationContextView |
| ExpireTemporaryDelegation | System | TemporaryDelegationExpired | ExpiryPolicy | AuthorizationContextView |

### 3.5 Project Workspace

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| SubmitProjectCreationRequest | ActiveMember | ProjectCreationRequested | ProjectCreationSubmissionPolicy | ProjectCreationQueueView |
| AddPreTeamMembers | Requester | PreTeamMembersAdded | PreTeamMemberPolicy | ProjectCreationReviewView |
| ApproveProjectCreation | President / VicePresident / OfficialTeamLead by scope | ProjectCreationApproved | ProjectCreationApprovalPolicy | ProjectCatalogView |
| RejectProjectCreation | Approver | ProjectCreationRejected | RejectionReasonPolicy | ProjectCreationQueueView |
| ChangeProjectVisibility | ProjectLead | ProjectVisibilityChanged | ProjectVisibilityPolicy | ProjectDetailView |
| ArchiveProject | ProjectLead / OperatorGroup | ProjectArchived | ArchiveAuditPolicy | ProjectCatalogView |
| RequestProjectJoin | ActiveMember / ProjectApplicant | ProjectJoinRequested | ApplicantIntroOnlyPolicy | ProjectJoinRequestView |
| ApproveProjectJoin | ProjectLead / ScopedDelegate | ProjectJoinApproved | ProjectJoinApprovalPolicy | ProjectRosterView |
| RejectProjectJoin | ProjectLead / ScopedDelegate | ProjectJoinRejected | RejectionReasonPolicy | ProjectJoinRequestView |
| RequestProjectLeadTransfer | ProjectLead / OfficialTeamLead escalation | ProjectLeadTransferRequested | LeadTransferPolicy | RoleTransferInboxView |

### 3.6 Invitation And Recruitment

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| PublishRecruitmentCard | ProjectLead | RecruitmentCardPublished | RecruitmentAudiencePolicy | RecruitmentSharePage |
| IssueMemberActivationCode | President / VicePresident / OfficialTeamLead by scope | MemberActivationCodeIssued | InviteIssuerScopePolicy | InvitationManagementView |
| IssueOfficialTeamInvite | OfficialTeamLead / President / VicePresident | OfficialTeamInviteIssued | InviteIssuerScopePolicy | InvitationManagementView |
| IssueProjectInvite | ProjectLead / ScopedDelegate | ProjectInviteIssued | ProjectInviteScopePolicy | InvitationManagementView |
| RedeemInvitation | Authenticated User | InvitationRedeemed | AtomicInvitationRedemptionPolicy | InvitationResultView |
| RejectInvitationRedemption | System | InvitationRedemptionRejected | ExpiryMaxUseTargetPolicy | InvitationResultView |
| RevokeInvitation | Issuer / HigherOperator | InvitationRevoked | RevocationAuthorityPolicy | InvitationManagementView |

### 3.7 GitHub README Integration

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| LinkGitHubRepository | ProjectLead | GitHubRepositoryLinked | GitHubRepositoryOwnershipPolicy | GitHubConnectionView |
| VerifyGitHubAppAccess | System | GitHubRepositoryAccessVerified | ServerSideGitHubTokenPolicy | GitHubConnectionView |
| RequestReadmeSync | ProjectLead / System | ReadmeSyncRequested | ReadmeVisibilityPolicy | ProjectIntroView |
| StoreReadmeSnapshot | System | ReadmeSnapshotStored | PrivateReadmeRetentionPolicy | ProjectIntroView |
| ChangeIntroDisplayPolicy | ProjectLead | IntroDisplayPolicyChanged | ProjectLeadOnlyPolicy | ProjectIntroView |
| RequestIntroDisplayPolicyChange | ProjectMember | IntroDisplayPolicyChangeRequested | ProjectLeadApprovalPolicy | ProjectIntroPolicyRequestView |

### 3.8 Communication And Contact

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| SendContactRequest | ActiveMember | ContactRequestSent | ContactAntiSpamPolicy | ContactInboxView |
| AcceptContactRequest | Recipient | ContactRequestAccepted | RecipientContactDisclosurePolicy | ContactInboxView |
| RejectContactRequest | Recipient | ContactRequestRejected | DecisionReasonPolicy | ContactInboxView |
| AutoRejectExpiredContactRequest | System | ContactRequestAutoRejected | ThreeDayExpiryPolicy | ContactInboxView |
| ReportContactSpam | Recipient | ContactSpamReported | AbuseReportPolicy | AbuseReviewQueueView |
| RestrictContactRequester | President / VicePresident | ContactRequesterRestricted | AbuseActionPolicy | AbuseReviewQueueView |
| PublishAnnouncement | AuthorizedMember | AnnouncementPublished | AnnouncementVisibilityPolicy | AnnouncementListView |
| AskQuestion | ActiveMember | QuestionAsked | QnaVisibilityPolicy | QnaListView |
| AnswerQuestion | AuthorizedMember | QuestionAnswered | QnaAnswerPolicy | QnaDetailView |

### 3.9 Voting And Governance

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| CreateVote | AuthorizedVoteManager | VoteCreated | VoteCreationScopePolicy | VoteListView |
| OpenVote | VoteManager | VoteOpened | VoteEligibilitySnapshotPolicy | VoteDetailView |
| SubmitBallot | EligibleVoter | BallotSubmitted | BallotAnonymityPolicy, MaxChoicePolicy | VoteParticipationView |
| CloseVote | System / VoteManager | VoteClosed | VoteClosePolicy | VoteResultView |
| PublishVoteResult | VoteManager | VoteResultPublished | ResultVisibilityPolicy | VoteResultView |
| NominateCandidate | ActiveMember | CandidateNominated | CandidateNominationPolicy | ElectionCandidateView |
| AcceptNomination | Nominee | CandidateAcceptedNomination | CandidateAcceptancePolicy | ElectionCandidateView |
| WithdrawCandidacy | Candidate | CandidateWithdrew | CandidateWithdrawalPolicy | ElectionCandidateView |
| AcceptElectionWin | Winner | ElectionWinAccepted | ElectionTransitionPolicy | AuthorizationContextView |
| RejectElectionWin | Winner | ElectionWinRejected | ElectionRerunPolicy | ElectionStatusView |

### 3.10 Supporting Operations

| Command | Actor | Domain Event | Policy / Guard | Read Model |
| --- | --- | --- | --- | --- |
| CreateStudyLog | ActiveMember | StudyLogCreated | StudyVisibilityPolicy | StudyLogFeedView |
| UploadResource | AuthorizedMember | ResourceUploaded | ResourceVisibilityPolicy | ResourceLibraryView |
| RequestEquipmentRental | ActiveMember | EquipmentRentalRequested | EquipmentAvailabilityPolicy | EquipmentRentalView |
| ApproveEquipmentRental | EquipmentManager | EquipmentRentalApproved | EquipmentRentalAuthorityPolicy | EquipmentRentalView |
| ReturnEquipment | Borrower / EquipmentManager | EquipmentReturned | EquipmentReturnAuditPolicy | EquipmentInventoryView |
| CreateEvent | EventManager | EventCreated | EventAuthorityPolicy | EventListView |
| RecordAttendance | EventManager | AttendanceRecorded | AttendanceCorrectionAuditPolicy | AttendanceView |

## 4. Policies

| Policy | Rule |
| --- | --- |
| SchoolEmailOnlyPolicy | First account creation starts with Google and must be `kookmin.ac.kr` or active exception. |
| NextPathPreservationPolicy | OAuth login must return the user to the intended route when safe. |
| CallbackErrorRedactionPolicy | Raw Supabase/PostgREST/PKCE errors are not shown to users. |
| ActiveStatusCapabilityPolicy | Full workspace commands require active member status unless a project-only scope is explicitly designed. |
| ScopedCapabilityPolicy | Role alone is not enough; capability, scope, source, status, and expiry are checked together. |
| ProjectLeadNotOperatorPolicy | Project lead manages own project only and is not a global operator. |
| ApplicantIntroOnlyPolicy | Applicants can see project intro/README but not internal materials. |
| AtomicInvitationRedemptionPolicy | Invitation redemption checks hash, status, expiry, max uses, target, membership effect, audit, and notification in one transaction. |
| RecipientContactDisclosurePolicy | Contact recipient chooses which contact payload is disclosed after acceptance. |
| BallotAnonymityPolicy | Voters must see before submission that normal screens show aggregate results only, while the president can inspect individual vote records for audit purposes. |
| AuditRedactionPolicy | Audit payloads do not copy raw phone, student ID, contact payloads, tokens, private README text, or vote choices. |

## 5. Read Models

| Read Model | Used By | Source Domains |
| --- | --- | --- |
| AuthSessionView | Login, callback | Identity And Access |
| AuthorizationContextView | Route guards, sidebar | Identity, Member Registry, Authority |
| JoinRequestFormView | `/member/join` | Member Registry, Profile Identity |
| ApprovalStatusView | `/member/pending` | Member Registry |
| MemberDashboardView | `/member` | Notifications, Projects, Votes, Contact, Events |
| ProjectCatalogView | Public/member projects | Project Workspace, Recruitment, GitHub Intro |
| ProjectIntroView | Recruitment/share/applicant screens | Project Workspace, GitHub README Integration |
| ProjectOperatorView | Project management screens | Project Workspace, Invitation, Audit |
| ContactInboxView | Contact request page | Communication, Notification |
| VoteDetailView | Vote page | Voting And Governance |
| AuditTimelineView | Operator audit screens | Audit Notification And Retention |

## 6. External Systems

| System | Purpose | Failure Mode |
| --- | --- | --- |
| Supabase Auth | Google OAuth, password login, session. | OAuth cancellation, PKCE mismatch, hook misconfiguration. |
| Supabase Postgres/RLS/RPC | Data, policy, command enforcement. | Schema cache, missing migration, broad RLS. |
| Google OAuth | School identity. | Non-school account, consent cancellation, hosted-domain mismatch. |
| Vercel | Hosting and SPA rewrite. | Missing env vars, bad redirect URL, direct route 404. |
| GitHub App | Private README fetch. | App not installed, permission denied, private repo unavailable. |
| Email Provider | Future notifications. | Sender/domain configuration missing. |

## 7. Open Event-Storming Questions

Open questions are tracked in `14-verification-question-ledger.md`. Do not duplicate the queue here. Add new questions there and reference the affected command/event in this file.
