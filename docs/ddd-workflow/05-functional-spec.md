# 05. Functional Specification Ledger

## 1. Purpose

This file is the cumulative DDD Step 10-11 functional ledger.

Each feature slice should reference the domain path in `02-domain-discovery.md`, commands in `03-event-storming.md`, data/RLS/RPC rules in `04-data-schema-and-security.md`, and active questions in `14-verification-question-ledger.md`.

## 2. Product Scope

### 2.1 Public Showcase

Public pages support presentation, portfolio, recruiting, and public information.

Acceptance:

- Guests can understand what KOBOT is without logging in.
- Public project pages show only approved and public-safe project information.
- Public recruit/contact flows do not accidentally become member join/contact-request flows.
- Past recruitment dates are not shown as active deadlines.

Active questions:

- `Q-PUBLIC-001`
- `Q-PUBLIC-002`
- `Q-CONTACT-003`

### 2.2 Member Workspace

Member workspace is the logged-in operational surface for active KOBOT members.

Acceptance:

- Active members can access workspace pages by capability.
- Pending applicants see join/pending guidance, not full workspace.
- Project-only participants do not gain full workspace access until their route model exists.
- Sidebar/menu labels follow the canonical DDD terms.

Active questions:

- `Q-AUTH-002`
- `Q-AUTH-005`
- `Q-DASH-001`
- `Q-DASH-002`
- `Q-UX-002`

## 3. Identity And Access

### 3.1 Google First Login

User story:

As a new user, I sign in first through Google so KOBOT can verify my school identity.

Acceptance:

- Google OAuth is the primary first-login path.
- OAuth request preserves safe `next` path.
- Raw OAuth/Supabase errors are hidden from the user.
- Non-school accounts see restricted guidance, not internal pages.
- Supabase Auth Hook connection is verified before release.

Negative cases:

- OAuth cancellation shows retry/home actions.
- Localhost callback mismatch shows safe retry guidance.
- Non-school account does not create persistent member data unless explicitly allowed.

Active questions:

- `Q-AUTH-003`

### 3.2 Login ID Credential

User story:

As a member, I can create an ID/password login after school Google verification so later login is faster.

Acceptance:

- Login ID is optional until created.
- Login ID uses lowercase letters and numbers only.
- Duplicate login ID is checked at field level and again before saving.
- Anonymous users cannot enumerate login IDs.
- ID/password login policy for pending/suspended/alumni users is explicitly decided.

Active questions:

- `Q-AUTH-004`
- `R-ID-001`

## 4. Member Registry And Profile

### 4.1 Join Request

User story:

As a school Google user, I complete the join request information and wait for operator approval.

Acceptance:

- Required fields are clear and field-level validation scrolls to the failing input.
- Join profile draft and submitted join request are not confused.
- Pending users cannot create projects, browse private data, vote, or contact members.
- Approval/rejection is audited.

Required fields:

- Full name
- Nickname
- Student ID
- Phone number
- College
- Department
- Club affiliation policy pending final decision

Active questions:

- `Q-AUTH-001`
- `Q-PROFILE-003`

### 4.2 Profile Identity

Acceptance:

- Internal project rosters prioritize real name with nickname.
- Public contribution display defaults to anonymous unless user chooses otherwise.
- Nickname does not allow `_` input; spaces are displayed as spaces and stored in slug form.
- Nickname changes are rate-limited.
- Hidden previous nickname policy is enforced by read model/RLS.

Active questions:

- `Q-PROFILE-001`
- `Q-PROFILE-002`
- `Q-PROFILE-004`

## 5. Authority And Capability

Acceptance:

- President, vice president, official team lead, project lead, project operator, and temporary delegate are separate concepts.
- Capability checks include status, source, scope, expiry, and command.
- Project lead does not see global admin menus by default.
- Temporary delegation lasts at most 7 days and cannot transfer lead authority.
- Role transfer is request/accept/apply, not a direct table update.

Active questions:

- `Q-AUTHZ-001`
- `Q-AUTHZ-002`

## 6. Project Workspace

### 6.1 Project Creation

Acceptance:

- Active members can request project creation.
- Request can be official-team-based or autonomous/personal.
- Approved projects appear in project catalog based on visibility.
- Pending/rejected projects do not appear as approved projects.
- Approver identity and authority source are audited.

Active questions:

- `Q-PROJECT-002`
- `Q-PROJECT-003`

### 6.2 Project Visibility And Internal Materials

Acceptance:

- Public users can only see public-approved intro/recruitment information.
- Applicants can see intro/README, not internal materials.
- Project members see roster/internal materials according to project membership.
- Official team leads only see the private information their approval/review role requires.

Active questions:

- `Q-PROJECT-001`

## 7. Invitation And Recruitment

Acceptance:

- Invite codes and links can target member activation, official team, or project team.
- Default expiry is 5 days unless overridden by policy.
- Redeeming a valid code immediately applies the target membership/participation effect and notifies the relevant lead.
- Failed/expired/replayed redemptions are safely handled without exposing raw code.

Active questions:

- `Q-INVITE-001`
- `Q-INVITE-002`

## 8. GitHub README Integration

Acceptance:

- Project lead can connect a GitHub repository later.
- Private repositories must be accessed server-side through GitHub App authorization.
- KOBOT shows README/project intro without exposing repository internals.
- Project lead chooses display source policy; members can request changes.
- Sync failure falls back to last valid snapshot or internal intro.

Active questions:

- `Q-GITHUB-001`
- `Q-GITHUB-002`

## 9. Communication And Contact

### 9.1 Contact Request

Acceptance:

- Requester sends reason and available contact payload.
- Recipient chooses accept, reject, or report.
- If accepted, recipient chooses which contact payload to disclose.
- Pending requests auto-reject after 3 days with reason `No response`.
- Repeated/similar automated requests are blocked server-side, not just by confirmation modal.

Active questions:

- `Q-CONTACT-001`
- `Q-CONTACT-002`
- `Q-CONTACT-004`

### 9.2 Announcements / Q&A

Acceptance:

- Public notices and internal announcements have explicit visibility.
- Q&A write/read/answer permissions are scoped.
- Developer placeholder copy is not shown in production.

Active questions:

- `Q-NOTICE-001`
- `Q-UX-001`

## 10. Voting And Governance

Acceptance:

- Votes are draft before opening and immutable after opening except allowed cancellation/close commands.
- Eligibility is snapshotted when vote opens.
- Single-candidate president election uses yes/no.
- If winner rejects, rerun vote rather than automatically offering next candidate.
- Anonymous vote explains exactly who can or cannot see individual choices.

Active questions:

- `Q-VOTE-001`
- `Q-VOTE-002`

## 11. Audit, Notification, Retention

Acceptance:

- Important commands create audit logs with actor, target, authority source/scope, and redacted payload.
- Normal active members cannot forge audit logs.
- Notifications are generated by domain events.
- Personal operational data defaults to 1-year retention unless product/legal policy says otherwise.

Active questions:

- `Q-AUDIT-001`
- `Q-AUDIT-002`
- `Q-LEGAL-001`

## 12. Supporting Domains

Study, resources, equipment, events, office hours, attendance, roadmap, retrospective, changelog, forms, and integrations are supporting domains.

Acceptance:

- They remain UI placeholders until each domain gets its own DDD slice.
- No production UI should display developer-state wording such as `mock` or `DB 연결 전`.
- When implemented, each must define ownership, visibility, status machine, commands, audit, and retention.

Active questions:

- `Q-SUPPORT-001`
- `Q-UX-001`
