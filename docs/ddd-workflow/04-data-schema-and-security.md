# 04. Data Schema And Security Ledger

## 1. Purpose

This file is the cumulative DDD Step 8-9 ledger.

It records the current database model, intended security boundary, known gaps, and required command/RPC enforcement.

## 2. Current Persistence Inventory

### 2.1 Migrations

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260325150000_auth_rbac.sql` | Base organization, profile, member account, official team, RBAC, auth hook, login ID resolver. |
| `supabase/migrations/20260428173000_member_workspace_core.sql` | Workspace extension tables: nickname history, audit, notifications, contact, project, invitation, vote, delegation, exit request. |
| `supabase/migrations/20260501033000_tighten_login_id_format.sql` | Login ID cleanup and stricter format. |
| `supabase/migrations/20260501043000_login_id_availability.sql` | Authenticated login ID availability RPC. |
| `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` | Active-only ID login, canonical status constraint, default nickname regex repair, audit insert lock-down, project lead/operator/delegation helper split, and tighter project RLS. |

### 2.2 Table Groups

| Context | Tables |
| --- | --- |
| Identity And Access | `organizations`, `profiles`, `member_accounts`, `allowed_login_exceptions`, `bootstrap_admin_emails` |
| RBAC / Official Team | `org_positions`, `org_position_assignments`, `teams`, `team_roles`, `team_memberships`, `permissions`, `org_position_permissions`, `team_role_permissions` |
| Profile Identity | `nickname_histories` |
| Audit / Notification | `audit_logs`, `notifications` |
| Contact | `contact_requests`, `contact_request_events` |
| Project | `project_teams`, `project_team_memberships`, `project_team_join_requests` |
| Invitation | `invitation_codes` |
| Voting | `votes`, `vote_options`, `vote_ballots`, `vote_ballot_options`, `vote_nominations` |
| Governance / Delegation | `role_transfer_requests`, `authority_delegations` |
| Withdrawal | `member_exit_requests` |

## 3. Current Functions And RPCs

| Function | Current Purpose | DDD Status |
| --- | --- | --- |
| `before_user_created_kobot(event jsonb)` | Reject non-Google/non-school account creation. | Must verify Supabase Dashboard hook is actually connected. |
| `handle_new_user()` | Creates profile/member account on auth user creation. | Good base, but join submission remains inferred from profile completion. |
| `current_user_is_active_member()` | Checks active account. | Good base for member-only access. |
| `current_user_has_permission(text)` | Checks broad permission strings. | Too coarse for scoped project/team commands. |
| `get_my_authorization_context()` | Returns profile, account, org positions, team memberships, permissions. | Needs scoped capability read model later. |
| `resolve_login_email(text)` | Resolves login ID to email. | Active-only as of `20260501060000`; pending/suspended/rejected/alumni/project-only/withdrawn cannot use ID login. |
| `is_login_id_available(text)` | Authenticated login ID availability check. | Good for current login ID slice. |
| `normalize_nickname_slug(text)` | Normalizes nickname display to slug. | Aligned to frontend rule: Korean/English letters, numbers, spaces; underscores are stored internally only. |
| `assert_active_nickname_available(uuid,citext)` | Active-member nickname uniqueness. | Good base; cooldown still missing. |
| `current_user_is_project_team_lead(uuid)` | Checks actual active project lead only. | Tightened in `20260501060000`; no longer includes maintainer or temporary delegation. |
| `current_user_is_project_operator(uuid)` | Checks project lead/maintainer without delegation. | Helper for future operator-scoped read models; not a lead-transfer authority. |
| `current_user_has_project_delegated_scope(uuid,text)` | Checks accepted, unexpired temporary delegation by explicit scope. | Good base; accept/reject delegation still needs command RPC. |
| `current_user_can_review_project(uuid)` | Allows president/vice/member manager or official team lead review metadata. | Should not be reused for internal project material. |
| `can_read_private_project(uuid)` | Checks project row visibility. | Tightened in `20260501060000`; still needs separate intro/review/internal read models. |
| `create_audit_log(...)` | Inserts audit log. | Execute revoked from normal users in `20260501060000`; replacement internal command path still needed. |

## 4. Security Boundary By Context

### 4.1 Identity And Access

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| First account creation must start with Google OAuth. | Supabase Auth hook function. | Dashboard hook connection must be verified. |
| School-domain users are allowed; exceptions require active allowlist. | `is_allowed_sign_in_email`. | Exception lifecycle/audit needs command flow. |
| Login ID is globally unique and lowercase. | DB unique index, check, trigger, availability RPC. | Resolved for phase 1: ID login resolves active accounts only. |
| Raw auth errors are not shown to users. | Frontend safe error mapping. | Needs regression test. |

### 4.2 Member Registry

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| Full workspace access requires active status. | `RequireActiveMember`, RLS active checks. | Project-only route model missing. |
| Join request submission should be explicit. | Currently profile completeness inference. | Need `MembershipApplication` or submitted flag/state. |
| Status transitions require audit. | Some fields exist. | State-transition RPCs missing. |
| Withdrawal keeps contribution attribution policy but removes/limits personal data. | `member_exit_requests`. | Completion command/purge policy missing. |

### 4.3 Profile Identity And PII

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| Nickname active-member uniqueness. | Trigger + advisory lock. | Cooldown and hidden-history visibility need enforcement. |
| Phone/student ID/department are internal data. | RLS row policies only. | Need safe profile views/column-level read models. |
| Public attribution defaults to anonymous. | DB default and frontend defaults. | Resolved for phase 1; withdrawal/public-credit UI still needs final copy. |

### 4.4 Authority And Capability

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| Role, capability, scope, source, and expiry are separate. | Not fully implemented. | Need scoped capability read model. |
| Project lead manages only own project. | Project helper/RLS. | Lead helper is now actual lead only; command RPCs still needed for transitions. |
| Temporary delegation is not role transfer. | `authority_delegations`, scoped delegation helper. | Delegate accept/reject/apply lifecycle still needs command RPC. |
| Role transfer request, acceptance, and application are separate. | `role_transfer_requests`. | Command RPC needed for assignment transaction. |

### 4.5 Project / Invitation / GitHub

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| Private project internal material is scoped. | `can_read_private_project` tightened for project rows. | Must split intro/review/internal material read models before private materials ship. |
| Project creation request is separate from active project. | Not implemented as separate table. | Need `project_creation_requests` and pre-team model. |
| Invitation redemption is atomic. | Not implemented. | Need `redeem_invitation` RPC and redemption history. |
| Private GitHub README is fetched server-side and shown by KOBOT authorization. | Not implemented. | Need GitHub connection/snapshot tables. |

### 4.6 Contact / Vote / Audit

| Rule | Enforcing Layer | Gap |
| --- | --- | --- |
| Contact payload is disclosed only after recipient accepts. | Table has payload fields. | Direct update can bypass lifecycle; command RPC needed. |
| Contact spam is rate-limited and reportable. | Some spam fields exist. | Rate-limit event/abuse workflow missing. |
| Vote submissions enforce status/time/eligibility/max choices. | Tables exist. | Direct insert policies do not enforce full invariant. |
| Anonymous vote guarantee is explicit. | `votes.anonymity`. | Current schema links voter to selected option. |
| Audit logs cannot be forged. | Direct insert policy removed; `create_audit_log` execute revoked from normal users. | Internal audit command/redaction helper still needed. |
| Audit payload redacts sensitive data. | Policy only in docs. | Redaction helper/test missing. |

## 5. Required Command RPCs

State transitions and high-risk operations should not be direct table updates.

| Priority | RPC / Command | Context | Must Enforce |
| --- | --- | --- | --- |
| P0 | `submit_join_request` | Member Registry | Required profile fields, submitted timestamp, audit, notification. |
| P0 | `approve_member_join` / `reject_member_join` | Member Registry | Authority source/scope, status transition, audit. |
| P0 | `redeem_invitation` | Invitation | Hash lookup, expiry, max uses, row lock, target, membership effect, audit, notification. |
| P0 | `approve_project_creation` / `reject_project_creation` | Project | Approval authority, pre-team visibility, status transition, audit. |
| P0 | `approve_project_join_request` / `reject_project_join_request` | Project | Project lead/delegate scope, membership creation, notification. |
| P0 | `submit_ballot` | Voting | Open status, time window, eligibility snapshot, max choices, same-vote option IDs, anonymity policy. |
| P0 | `create_audit_log_internal` | Audit | Not callable by normal users; redaction and authority snapshot. |
| P1 | `send_contact_request` | Contact | Rate limit, required reason, allowed payload type, duplicate prevention. |
| P1 | `accept_contact_request` / `reject_contact_request` / `report_contact_spam` | Contact | Recipient-only decision, 3-day status, notification, abuse queue. |
| P1 | `request_authority_delegation` / `accept_authority_delegation` | Authority | Max 7 days, scope, no role-transfer, audit. |
| P1 | `request_role_transfer` / `accept_role_transfer` / `apply_role_transfer` | Authority | Acceptance, previous-holder after-status, assignment transaction, audit. |

## 6. Missing Or Future Tables

| Table | Context | Reason |
| --- | --- | --- |
| `membership_applications` or explicit submitted columns | Member Registry | Separate join profile draft from submitted join request. |
| `capability_assignments` or derived capability read model | Authority | Store/source capabilities with scope/source/expiry. |
| `project_creation_requests` | Project | Approval request lifecycle before active project exists. |
| `project_pre_members` | Project | Planned/pre-recruited participants before approval or join. |
| `project_recruitment_cards` | Recruitment | Shareable recruitment page policy separate from project internals. |
| `invitation_redemptions` | Invitation | Track successful/failed redemption attempts without raw code. |
| `github_repository_connections` | GitHub | App installation/repository/branch/path/visibility. |
| `readme_snapshots` | GitHub | Last successful README copy and fallback source. |
| `readme_sync_attempts` | GitHub | Failure reason and freshness. |
| `vote_eligibility_snapshots` | Voting | Fixed eligible voters when vote opens. |
| `vote_result_snapshots` | Voting | Published aggregate result. |
| `contact_abuse_cases` | Contact | Operator review of spam reports and sanctions. |
| `rate_limit_events` | Contact / Security | Detect repeated/similar automated requests. |

## 7. High-Risk Gaps

| ID | Gap | Affected Question |
| --- | --- | --- |
| GAP-AUTH-001 | Auth hook function exists, but dashboard hook connection is not documented as verified. | `Q-AUTH-003` |
| GAP-AUTHZ-002 | Some older broad permissions still exist and must not be used as scoped project command authority. | `Q-AUTHZ-002`, `Q-PROJECT-001` |
| GAP-AUDIT-002 | Audit payload redaction is not enforced. | `Q-AUDIT-002` |
| GAP-INVITE-001 | Invitation redemption lacks atomic command and history. | `Q-INVITE-001`, `Q-INVITE-002` |
| GAP-VOTE-001 | Vote ballot insert lacks command-level eligibility/status/max-choice checks. | `Q-VOTE-001`, `Q-VOTE-002` |
| GAP-CONTACT-001 | Contact request update can bypass lifecycle. | `Q-CONTACT-001` |

## 8. Security Design Rule

Direct table updates are allowed only for low-risk profile/content edits.

Use command RPCs for:

- Approval
- Rejection
- Invitation redemption
- Project membership changes
- Role transfer
- Temporary delegation
- Contact request lifecycle
- Vote lifecycle and ballot submission
- Audit creation
- Private visibility changes
- Any operation that has audit, notification, or retention side effects
