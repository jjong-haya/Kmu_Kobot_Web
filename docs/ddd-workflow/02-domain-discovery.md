# 02. Domain Discovery Ledger

## 1. Purpose

This file is the cumulative DDD Step 1-6 ledger for KOBOT Web.

Do not recreate the domain map from scratch on every task. Add new domains, terms, aggregates, invariants, and open questions here when they are discovered.

Per-run verification questions belong in `14-verification-question-ledger.md`. This file is the stable domain tree.

## 2. Root Domain

KOBOT Web is a club operations platform with two different product surfaces:

| Surface | Purpose | Primary Users | Important Boundary |
| --- | --- | --- | --- |
| Public Showcase | Presentation, portfolio, recruiting, public project introduction | Guests, applicants, presentation audience | Must not expose private member/project operations data |
| Member Workspace | Real club operations after login | KOBOT members, operators, project participants | Must enforce membership status, role/capability scope, project privacy, auditability |

## 3. Domain Tree

```text
KOBOT Web
├─ Public Showcase
│  ├─ Landing
│  ├─ Public Projects
│  ├─ Public Notice
│  ├─ Recruit
│  ├─ Activities
│  ├─ FAQ
│  └─ Contact / Terms / Privacy
├─ Identity And Access
│  ├─ Google OAuth First Login
│  ├─ School Email Gate
│  ├─ Login ID Credential
│  ├─ OAuth Callback And Next Path
│  └─ Restricted Account Guidance
├─ Member Registry
│  ├─ Join Request Profile
│  ├─ Approval Pending
│  ├─ Active Member
│  ├─ Suspended / Rejected / Alumni / Withdrawn
│  ├─ Project-Only Participant
│  └─ Profile Identity And Nickname History
├─ Authority And Capability
│  ├─ Organization Position
│  ├─ Official Team Role
│  ├─ Project Role
│  ├─ Scoped Capability
│  ├─ Temporary Delegation
│  └─ Role Transfer
├─ Official Team Operations
│  ├─ Robot A Team
│  ├─ Robot B Team
│  ├─ Robot C Team
│  ├─ Robot D Team
│  ├─ IoT Team
│  └─ Research Team
├─ Project Workspace
│  ├─ Project Creation Request
│  ├─ Project Team
│  ├─ Project Membership
│  ├─ Project Activity / Study Log
│  ├─ Project Visibility
│  └─ Project Lead Transfer / Exit
├─ Invitation And Recruitment
│  ├─ Member Activation Code
│  ├─ Official Team Invite
│  ├─ Project Invite
│  ├─ Recruitment Share Page
│  └─ Project Join Request
├─ GitHub README Integration
│  ├─ Repository Connection
│  ├─ GitHub App Access
│  ├─ README Snapshot
│  ├─ Internal Description
│  └─ Display Source Policy
├─ Communication
│  ├─ Contact Request
│  ├─ Contact Exchange
│  ├─ Contact Spam Report
│  ├─ Notification
│  └─ Announcement / Q&A
├─ Learning And Knowledge
│  ├─ Study Log
│  ├─ Study Playlist
│  ├─ Peer Review
│  └─ Templates
├─ Resources And Equipment
│  ├─ Resource Library
│  ├─ Equipment Inventory
│  ├─ Equipment Rental
│  └─ Return / Maintenance
├─ Events And Attendance
│  ├─ Event
│  ├─ Session
│  ├─ Office Hours
│  └─ Attendance
├─ Voting And Governance
│  ├─ President Election
│  ├─ Temporary President
│  ├─ General Vote
│  ├─ Candidate Nomination
│  ├─ Ballot
│  └─ Result Snapshot
├─ Audit Notification And Retention
│  ├─ Audit Log
│  ├─ Redacted Payload
│  ├─ Actor Authority Snapshot
│  ├─ Notification
│  └─ Retention / Purge
└─ Legal And Privacy
   ├─ Terms
   ├─ Privacy Policy
   ├─ Consent Notice
   ├─ Personal Data Display Scope
   └─ Withdrawal / Rejoin
```

## 4. Ubiquitous Language

### 4.1 People And Account Terms

| Korean Term | Code/Spec Term | Meaning | Banned Ambiguous Synonyms |
| --- | --- | --- | --- |
| 사용자 | `User` | Supabase Auth user. May not be a KOBOT member. | member, account owner |
| 학교 Google 사용자 | `SchoolGoogleUser` | User authenticated through Google with `kookmin.ac.kr` identity. | external user |
| 가입 요청 작성 중 사용자 | `JoinProfileIncompleteUser` | Logged in, but required join profile is incomplete. | pending user |
| 승인 대기 사용자 | `PendingApplicant` | Join profile submitted, waiting for approval. | pending user |
| 활동 부원 | `ActiveMember` | Approved KOBOT member with `member_accounts.status = active`. | user, approved user |
| 프로젝트 전용 참여자 | `ProjectOnlyParticipant` | Not a full KOBOT member but can join a specific project. | external member |
| 운영진 | `OperatorGroup` | President, vice president, and official team leads. Project leads are not global operators. | admin, team lead above |
| 회장 | `President` | Highest organization administrator. | admin |
| 부회장 | `VicePresident` | Organization-wide support administrator. | admin |
| 공식 팀장 | `OfficialTeamLead` | Lead of Robot A-D, IoT, or Research team. | team lead, project lead |
| 프로젝트 팀장 | `ProjectLead` | Lead of one project team only. | operator, official team lead |
| 프로젝트 운영 보조자 | `ProjectOperator` | Project-scoped helper. Cannot transfer lead role or change high-risk settings unless explicitly granted. | maintainer |
| 임시 위임자 | `TemporaryDelegate` | Person accepting time-limited delegated project capability. | temporary lead |

### 4.2 Team And Project Terms

| Korean Term | Code/Spec Term | Meaning | Banned Ambiguous Synonyms |
| --- | --- | --- | --- |
| 공식 팀 | `OfficialTeam` | Club operating unit: Robot A, B, C, D, IoT, Research. | project team |
| 프로젝트 팀 | `ProjectTeam` | Collaboration unit created around a project. | official team |
| 공식 팀 기반 프로젝트 | `OfficialBasedProject` | Project created under an official team name. | official team |
| 개인/자율 프로젝트 | `AutonomousProject` | Project created with a new/free project identity. | private project |
| 프로젝트 소개서 | `ProjectIntro` | Internal description or README-backed intro shown to applicants. | internal material |
| 프로젝트 내부 자료 | `ProjectInternalMaterial` | Member-only project resources, meeting notes, links, files. | README |
| 모집 공유 페이지 | `RecruitmentSharePage` | Shareable card/page for recruiting project members. | public project page |
| 참여 예정자 | `PreTeamMember` | Person listed before project approval or before final membership acceptance. | member |

### 4.3 Authority Terms

| Korean Term | Code/Spec Term | Meaning | Banned Ambiguous Synonyms |
| --- | --- | --- | --- |
| Role | `Role` | Responsibility or position held by a person. | permission |
| Capability | `Capability` | Ability to perform a specific command. | role, permission string |
| Scope | `Scope` | Boundary where a capability applies: organization, official team, project, self. | target |
| Source | `AuthoritySource` | Why the user has the capability: president, vice president, team lead, project lead, delegation. | role |
| Delegation | `Delegation` | Time-limited capability transfer, not a role transfer. | temporary role |
| Audit Log | `AuditLog` | Tamper-resistant record of who did what under which authority. | activity log |
| Activity Log | `ActivityLog` | Project/team work record. Not a security audit trail. | audit log |

### 4.4 Identity Value Objects

| Value Object | Rule |
| --- | --- |
| `SchoolEmail` | Must be `kookmin.ac.kr` unless manually allowed through exception policy. |
| `LoginId` | Lowercase `[a-z0-9]{4,20}`, globally unique, optional until created, locked after creation unless admin flow exists. |
| `NicknameDisplay` | 2-12 visible chars, Korean/English/numbers/spaces, no `_`, no special characters, no banned words. |
| `NicknameSlug` | Lowercase normalized nickname where spaces become `_`; uniqueness is active-member scoped unless historical attribution is explicitly modeled. |
| `StudentId` | Required join profile field; sensitive internal contact/verification data. |
| `PhoneNumber` | Required join profile field; formatted for display, sensitive internal contact data. |
| `PublicCreditNameMode` | `anonymous`, `nickname`, or `real_name`; default public display is anonymous. |
| `InvitationCode` | Raw code must not be stored; store hash, expiry, max use count, status, and target. |
| `RepositoryFullName` | GitHub `owner/repo`; may refer to a private repository. |
| `VoteAnonymity` | Normal users, team leads, vice president, and operators see aggregate results only; president-only individual ballot audit access is retained and must be disclosed. |

## 5. Bounded Contexts

### 5.1 Public Showcase

| Item | Description |
| --- | --- |
| Purpose | Present KOBOT publicly and support recruiting/demo/portfolio use. |
| Owned Data | Public project summaries, public notices, activities, recruiting copy. |
| Primary Routes | `/`, `/projects`, `/notice`, `/recruit`, `/activities`, `/faq`, `/contact`, `/privacy`, `/terms` |
| External Dependencies | Vercel SPA routing, public assets. |
| Risk | Accidentally exposing member-only data or private project metadata. |

### 5.2 Identity And Access

| Item | Description |
| --- | --- |
| Purpose | Authenticate users, preserve next path, build authorization context. |
| Owned Data | Supabase session, profile identity, login ID credential state, school-email eligibility. |
| Primary Routes | `/login`, `/auth/callback`, `/member/join`, `/member/pending` |
| Main Files | `src/app/auth/*`, `src/app/pages/public/Login.tsx`, `src/app/pages/public/AuthCallback.tsx`, `supabase/migrations/20260325150000_auth_rbac.sql` |
| Risk | Raw OAuth errors, PKCE origin mismatch, account enumeration, non-school access. |

### 5.3 Member Registry

| Item | Description |
| --- | --- |
| Purpose | Manage join profile, member status, approval, suspension, withdrawal, rejoin. |
| Owned Data | `profiles`, `member_accounts`, `nickname_histories`, `member_exit_requests`. |
| Aggregate Roots | `MemberAccount`, `ProfileIdentity`, `MemberExitRequest`. |
| Risk | Profile PII visibility, nickname collision, incorrect pending/join routing, missing audit trail. |

### 5.4 Authority And Capability

| Item | Description |
| --- | --- |
| Purpose | Decide who may execute commands, in which scope, and from which authority source. |
| Owned Data | `org_positions`, `org_position_assignments`, `teams`, `team_roles`, `team_memberships`, `permissions`, `authority_delegations`, `role_transfer_requests`. |
| Aggregate Roots | `AuthorityAssignment`, `TemporaryDelegation`, `RoleTransferRequest`. |
| Risk | Global permission strings like `projects.manage` being treated as scoped authority. |

### 5.5 Official Team Operations

| Item | Description |
| --- | --- |
| Purpose | Operate official club teams and team-lead authority. |
| Owned Data | `teams`, `team_roles`, `team_memberships`. |
| Official Teams | Robot A, Robot B, Robot C, Robot D, IoT, Research. |
| Risk | Confusing official team membership with project membership. |

### 5.6 Project Workspace

| Item | Description |
| --- | --- |
| Purpose | Create, approve, operate, and archive project teams. |
| Owned Data | `project_teams`, `project_team_memberships`, `project_team_join_requests`, future `project_creation_requests`. |
| Aggregate Roots | `ProjectCreationRequest`, `ProjectTeam`, `ProjectMembership`. |
| Risk | Pending projects appearing as approved, private projects leaking, project leads acting as global admins. |

### 5.7 Invitation And Recruitment

| Item | Description |
| --- | --- |
| Purpose | Issue codes/links and support project recruiting before/after approval. |
| Owned Data | `invitation_codes`, future `invitation_redemptions`, future `project_recruitment_cards`. |
| Aggregate Roots | `Invitation`, `RecruitmentCard`, `ProjectJoinRequest`. |
| Risk | Code replay, expired code reuse, unbounded auto-join, missing notification to project lead. |

### 5.8 GitHub README Integration

| Item | Description |
| --- | --- |
| Purpose | Show README/project intro inside KOBOT while respecting private repository boundaries. |
| Owned Data | Future `github_repository_connections`, `readme_snapshots`, `readme_sync_attempts`. |
| External Dependencies | GitHub App, GitHub API. |
| Risk | Private README leakage, token handling, stale README/source mismatch. |

### 5.9 Communication

| Item | Description |
| --- | --- |
| Purpose | Announcements, Q&A, notifications, and contact request workflow. |
| Owned Data | `notifications`, `contact_requests`, `contact_request_events`, future announcement/Q&A tables. |
| Aggregate Roots | `ContactRequest`, `Notification`, `Announcement`. |
| Risk | Contact spam, exposing phone/email too early, harassment reports without operator workflow. |

### 5.10 Learning And Knowledge

| Item | Description |
| --- | --- |
| Purpose | Study records, playlists, peer review, reusable templates. |
| Owned Data | Currently mostly UI mock data; future study/resource tables. |
| Primary Routes | `/member/study-log`, `/member/study-playlist`, `/member/peer-review`, `/member/templates` |
| Risk | Project/internal study material visibility not tied to project membership. |

### 5.11 Resources And Equipment

| Item | Description |
| --- | --- |
| Purpose | Club resource library, equipment inventory, rental/return/maintenance. |
| Owned Data | Currently mostly UI mock data; future resources/equipment/rental tables. |
| Primary Routes | `/member/resources`, `/member/equipment` |
| Risk | Rental state transition without command/audit; equipment availability mismatch. |

### 5.12 Events And Attendance

| Item | Description |
| --- | --- |
| Purpose | Events, sessions, office hours, attendance tracking. |
| Owned Data | Currently mostly UI mock data; future event/session/attendance tables. |
| Primary Routes | `/member/events`, `/member/office-hours`; inactive `Attendance.tsx`. |
| Risk | Attendance personal data, event eligibility, manual correction audit. |

### 5.13 Voting And Governance

| Item | Description |
| --- | --- |
| Purpose | President election, general votes, nominations, ballots, result publication. |
| Owned Data | `votes`, `vote_options`, `vote_ballots`, `vote_ballot_options`, `vote_nominations`. |
| Aggregate Roots | `Vote`, `Ballot`, `Nomination`, `Election`. |
| Risk | Misleading anonymity, changing options after open, missing eligibility snapshot. |

### 5.14 Audit Notification And Retention

| Item | Description |
| --- | --- |
| Purpose | Record important actions, notify affected users, retain/purge data by policy. |
| Owned Data | `audit_logs`, `notifications`, retention fields. |
| Aggregate Roots | `AuditLog`, `Notification`, `RetentionPolicy`. |
| Risk | Users inserting fake audit logs, storing raw PII/private README/vote selections. |

### 5.15 Legal And Privacy

| Item | Description |
| --- | --- |
| Purpose | Explain terms, privacy, consent, withdrawal, public attribution. |
| Owned Data | Terms/privacy pages, consent copy, public credit settings. |
| Primary Routes | `/privacy`, `/terms` |
| Risk | Collecting phone/student ID without clear display/retention policy; withdrawal attribution conflict. |

## 6. Aggregate Candidates

| Aggregate Root | Context | Child Entities | Value Objects | Invariants |
| --- | --- | --- | --- | --- |
| `MemberAccount` | Member Registry | ApprovalRecord, StatusHistory | MemberStatus, SchoolEmail | Only approved active members enter full workspace. |
| `ProfileIdentity` | Member Registry | NicknameHistory | NicknameDisplay, NicknameSlug, PublicCreditNameMode | Active nickname uniqueness and safe public attribution. |
| `AuthorityAssignment` | Authority And Capability | RoleAssignment, CapabilityGrant | Scope, Source, CapabilityCode | Capability must be scoped and source-aware. |
| `TemporaryDelegation` | Authority And Capability | DelegationAcceptance | Expiry, ScopeList | Max 7 days; no role-transfer capability. |
| `RoleTransferRequest` | Authority And Capability | ApprovalStep | TransferType, PreviousHolderAfterStatus | Requested/accepted/applied states must be separate. |
| `OfficialTeam` | Official Team Operations | TeamMembership | OfficialTeamSlug, OfficialTeamRole | Official team lead is an operator, project lead is not. |
| `ProjectCreationRequest` | Project Workspace | PreTeamMember, ReviewRecord | ProjectType, RecruitmentAudience | Approved request creates/activates project. |
| `ProjectTeam` | Project Workspace | ProjectMembership, ProjectActivity | ProjectSlug, Visibility, ProjectStatus | Private project readable only by authorized scope. |
| `RecruitmentCard` | Invitation And Recruitment | RequiredRole, ShareTarget | Audience, Visibility | Only approved/public-checkable intro is shown. |
| `Invitation` | Invitation And Recruitment | RedemptionAttempt | CodeHash, Expiry, MaxUses, TargetType | Redemption is atomic and audited. |
| `GitHubRepositoryConnection` | GitHub README Integration | ReadmeSnapshot, SyncAttempt | RepositoryFullName, Branch, Path, CommitSha | Private README shown only through KOBOT authorization. |
| `ContactRequest` | Communication | ContactRequestEvent | ContactPayload, AbuseSignal, Expiry | Contact payload exchange happens after acceptance. |
| `Vote` | Voting And Governance | Option, Ballot, Nomination | EligibilityScope, Anonymity, ResultVisibility | Open vote options are immutable; eligibility is snapshotted. |
| `AuditLog` | Audit Notification And Retention | RedactedPayload | RetentionPolicy, ActorAuthoritySnapshot | Users cannot forge audit logs; sensitive payload is redacted. |
| `EquipmentRental` | Resources And Equipment | RentalEvent | RentalStatus, DueDate | Borrow/return/overdue transitions are audited. |
| `EventSession` | Events And Attendance | AttendanceRecord | AttendanceStatus, CorrectionReason | Attendance correction requires authority and audit. |

## 7. Cross-Domain Invariants

| ID | Invariant | Enforcing Layer |
| --- | --- | --- |
| INV-ID-001 | `login_id` is globally unique and normalized lowercase. | DB unique index + RPC + UI validation |
| INV-ID-002 | Login ID existence must not be exposed to anonymous users. | RPC grant and safe login error copy |
| INV-NICK-001 | Active-member nickname slug cannot collide. | DB trigger/function + UI validation |
| INV-AUTH-001 | A role alone does not grant command authority without capability, scope, source, and valid status. | RPC/RLS helper redesign required |
| INV-PROJECT-001 | Project lead authority applies only to that project. | Scoped helper/RLS required |
| INV-PROJECT-002 | Pending or rejected projects must not appear as approved projects. | Query/RLS/read model |
| INV-INVITE-001 | Invitation redemption must be atomic with expiry/max-use checks. | Security definer RPC with row lock |
| INV-GH-001 | Private GitHub README content must not be stored or displayed outside authorized project scope. | Server-side fetch + snapshot RLS |
| INV-CONTACT-001 | Recipient contact details are disclosed only after recipient accepts and chooses payload. | Contact command RPC |
| INV-CONTACT-002 | Repeated/similar contact requests are rate-limited and reportable. | RPC + rate-limit events |
| INV-VOTE-001 | A vote marked anonymous must not show individual choices in normal operator UI. | Read model + RLS + copy |
| INV-VOTE-002 | Vote eligibility should be snapshotted at opening. | Snapshot table required |
| INV-AUDIT-001 | Audit logs cannot be directly inserted by normal active members. | RLS/RPC/trigger redesign required |
| INV-PII-001 | Phone, student ID, contact payloads, tokens, private README text, and vote selections must not be copied raw into audit payload. | Redaction policy + tests |
| INV-RET-001 | Personal operational records default to 1-year retention unless product/legal policy says otherwise. | Purge job or retention query required |

## 8. New Domain Discovery Rule

When a new feature appears, ask:

1. Does it introduce a new actor?
2. Does it introduce a new value object?
3. Does it introduce a new status machine?
4. Does it cross an existing bounded context?
5. Does it require a command rather than direct update?
6. Does it create a new visibility level?
7. Does it collect, show, retain, or delete personal data?
8. Does it require audit, notification, or external integration?

If yes, add the node to this file and add verification questions to `14-verification-question-ledger.md`.
