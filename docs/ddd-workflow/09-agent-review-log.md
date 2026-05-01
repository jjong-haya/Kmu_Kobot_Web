# 09. Review Log

## 1. Review Roles

The current review can use broad local reviewer perspectives during exploration:

| Role | Focus |
| --- | --- |
| Product Reviewer | User expectation, flow, and copy |
| Domain Reviewer | Aggregates, value objects, invariants |
| Security Reviewer | Enumeration, privilege escalation, privacy leakage |
| Data Reviewer | Constraints, RPC, RLS, race conditions |
| UX Reviewer | Error location, recovery path, raw error exposure |

Before closing a DDD loop, at least these 3 independent reviewer perspectives are mandatory:

| Required Role | Must Approve |
| --- | --- |
| Domain Reviewer | Terms, contexts, aggregates, commands, events, and invariants are coherent. |
| Implementation Reviewer | Code structure, migrations, tests, and release plan can actually enforce the model. |
| Risk Reviewer | Edge cases, privacy, security, concurrency, and operational failure modes are handled. |

## 2. Shared Review Rule

Every identifier-like field is treated as a value object until proven otherwise.

Examples:

- `login_id`
- `nickname`
- `project_slug`
- `invite_code`
- `github_repository`
- `vote_id`

For each value object, the implementation must define normalization, uniqueness scope, owner, mutability, failure copy, and persistence-level enforcement.

## 3. 2026-05-01 Review: Login ID Availability

### 3.1 Finding

`login_id` was previously handled mostly as a formatted input. That missed the domain invariant: a login ID is a globally unique alternate account identifier.

### 3.2 Why Review

| Question | Answer |
| --- | --- |
| Why must duplicates be blocked? | ID login resolves `login_id -> email -> Supabase password auth`; duplicates make resolution ambiguous. |
| Why is a DB unique index not enough? | It is the final guard, but users need field-level feedback before submit failure. |
| Why add an RPC? | It returns only a boolean without exposing full profile rows. |
| Why not grant it to `anon`? | Anonymous availability checks increase account-enumeration surface. |
| Why re-check before save? | Another user may claim the ID after blur validation. |
| What handles the final race? | `profiles_login_id_unique_idx` remains the final guard. |

### 3.3 Implemented Controls

- Added `is_login_id_available(text)` RPC.
- Added `AuthProvider.checkLoginIdAvailability`.
- Re-check availability immediately before profile save.
- Convert duplicate unique violations into safe user-facing copy.
- Show field-level error on the login ID input instead of a top-level alert card.

## 4. Remaining High-Risk Review Items

### 4.1 RBAC / Capability

| ID | Question | Risk |
| --- | --- | --- |
| REVIEW-RBAC-001 | Are official-team leads and project leads represented with the same permission? | Project-scoped users may gain global visibility. |
| REVIEW-RBAC-002 | Is temporary authority a role or a scoped capability? | Temporary authority may persist past expiration. |
| REVIEW-RBAC-003 | Are direct appointment and request/accept flows auditable as separate events? | Authority history becomes unclear. |

### 4.2 Project / GitHub

| ID | Question | Risk |
| --- | --- | --- |
| REVIEW-GH-001 | Who can read private GitHub README snapshots? | Private repository information may leak. |
| REVIEW-GH-002 | How is internal description freshness compared with GitHub README freshness? | Stale project descriptions may be shown. |
| REVIEW-GH-003 | What happens when a project lead misconfigures GitHub App installation? | Integration becomes unrecoverable for non-experts. |

### 4.3 Contact / Vote / Audit

| ID | Question | Risk |
| --- | --- | --- |
| REVIEW-CONTACT-001 | Where are repeated/similar contact requests blocked? | Spam or harassment. |
| REVIEW-VOTE-001 | Does "anonymous vote" mean UI-only anonymity or database-level anonymity? | User trust issue. |
| REVIEW-AUDIT-001 | Can audit payloads contain phone, student ID, tokens, or private README text? | Personal-data over-retention. |

## 5. Stop Conditions

Stop implementation and update the spec if any of these are unclear:

- Permission scope
- Lifecycle transition
- Public/private visibility
- Personal-data retention
- Database-level invariant

## 6. 2026-05-01 Review: DDD Loop Closure Rule

### 6.1 Sub-Agent Reviewer Summary

| Reviewer | Role | Approval Status | Key Judgment |
| --- | --- | --- | --- |
| Sartre | Domain Reviewer | approved-with-requirements | DDD must start from domain understanding, and any unresolved question must restart Step 1. |
| Dirac | Implementation Reviewer | approved-with-requirements | Explanation must precede edits, especially for DDD documents, permissions, database, commits, and shutdowns. |
| Parfit | Risk Reviewer | approved-with-requirements | Closure requires a review log, disagreement register, unresolved-question checklist, and explicit closure decision. |

### 6.2 Integrated Decision

The DDD loop is allowed to close only when all of these are true:

- Every question is answered or explicitly accepted by the user as an assumption.
- At least 3 independent reviewer perspectives are recorded.
- Reviewer disagreements are classified as `accepted`, `rejected`, `deferred`, or `needs-rework`.
- Deferred or rejected disagreements include reason, impact, and risk owner.
- The code or document changes created while answering questions are rechecked for new questions.

### 6.3 Disagreement Register

| ID | Disagreement | Evidence | Impact | Classification | Decision | Risk Owner |
| --- | --- | --- | --- | --- | --- | --- |
| DDD-DIS-001 | Can the loop close if a question is small? | User explicitly required even small questions to block closure. | Prevents silent assumptions. | accepted | Small questions remain blockers unless user approves them as assumptions. | Product owner |
| DDD-DIS-002 | Can local role simulation replace sub-agents? | User explicitly required at least 3 sub-agents for loop closure in this workflow. | Keeps final validation independent. | accepted | Use sub-agents when closing a DDD loop for this project. | Codex |

### 6.4 Unresolved Questions Checklist

| ID | Question | Status | Requires Step 1 Restart |
| --- | --- | --- | --- |
| DDD-Q-001 | Does every future domain slice have a user-approved assumption list before implementation? | Open per slice | Yes |
| DDD-Q-002 | Did the code added to resolve a domain question create new questions? | Must be checked per slice | Yes when any new question appears |

### 6.5 Closure Decision

The workflow-foundation loop can close for the skill update itself because the skill now encodes the restart rule, 3-reviewer rule, disagreement register, unresolved-question checklist, approved-assumption list, and closure decision artifact.

Feature-specific loops do not inherit closure automatically. Each feature slice must run the loop again from Step 1.

## 7. 2026-05-01 Review: Full Project DDD Restart

### 7.1 Sub-Agent Reviewer Summary

| Reviewer | Role | Scope | Approval Status | Key Findings |
| --- | --- | --- | --- | --- |
| Popper | Domain Reviewer | Domain tree, ubiquitous language, bounded contexts | needs-rework-before-feature-implementation | Domain split is correct, but active questions must track join submission, status mismatch, public attribution default, project approval authority, vote anonymity, invitation multi-use, and audit payload policy. |
| Carver | Implementation / Data Security Reviewer | Supabase migrations, RLS/RPC, auth code, audit/security docs | needs-rework-before-feature-implementation | Current data model has P0 gaps: auth hook verification, non-active ID login resolution, broad project helpers, overbroad private project read, direct audit inserts, invitation/vote/contact direct table lifecycle gaps. |
| Mill | UX / Product Reviewer | Routes, layouts, pages, copy, dashboard, member workspace UX | approved-with-ux-questions | Screen-domain map is clear, but dashboard MVP, project-only routes, public recruit vs join request, stale public dates, developer-state copy, and permission terminology must be resolved. |

### 7.2 Integrated Domain Decision

The project now uses cumulative ledgers:

- `02-domain-discovery.md`: stable domain tree, terms, aggregates, invariants.
- `03-event-storming.md`: cumulative command/event/policy/read-model map.
- `04-data-schema-and-security.md`: current DB model, security boundaries, required RPC/RLS gaps.
- `14-verification-question-ledger.md`: active verification queue.

The DDD loop does not close for feature implementation yet. It closes only for this documentation restructuring pass.

### 7.3 New Active Questions Added

| Source | Question IDs Added |
| --- | --- |
| Popper | `Q-AUTH-001`, `Q-AUTH-002`, `Q-PROFILE-001`, `Q-AUTHZ-001`, `Q-PROJECT-001`, `Q-INVITE-001`, `Q-VOTE-001`, `Q-AUDIT-002` |
| Carver | `Q-AUTH-003`, `Q-AUTH-004`, `Q-PROFILE-004`, `Q-AUDIT-001`, `Q-VOTE-002`, `Q-CONTACT-001` |
| Mill | `Q-DASH-001`, `Q-DASH-002`, `Q-AUTH-005`, `Q-PUBLIC-001`, `Q-PUBLIC-002`, `Q-UX-001`, `Q-UX-002`, `Q-CONTACT-004` |

### 7.4 Disagreement Register

| ID | Disagreement | Evidence | Impact | Classification | Decision | Risk Owner |
| --- | --- | --- | --- | --- | --- | --- |
| DDD-DIS-003 | Should feature implementation continue after this DDD pass? | Reviewers found active P0 questions. | Implementing state transitions now risks permission/privacy bugs. | needs-rework | Do documentation foundation only; feature code waits for relevant P0 question resolution. | Codex / Product owner |
| DDD-DIS-004 | Should all supporting pages get full DB design now? | UX review lists many placeholder domains. | Over-designing all pages slows P0 security fixes. | accepted | Treat support domains as known tree nodes but defer implementation until selected. | Codex |
| DDD-DIS-005 | Should working specs be Korean or English? | User said working docs can be English if Korean summary exists. | Prevents encoding/context issues while keeping user-readable summary. | accepted | Working specs in English; `SUMMARY-ko.md` in Korean. | Codex |

### 7.5 Closure Decision

This DDD documentation restart can close because:

- The full domain tree is now cumulative in `02-domain-discovery.md`.
- Ubiquitous language and banned ambiguous terms are recorded.
- Event-storming, data/security, functional, UX, and implementation ledgers were rebuilt around the domain tree.
- Active questions were moved into `14-verification-question-ledger.md` rather than hidden.
- Three independent sub-agent perspectives were integrated.

Feature implementation cannot close yet. Any feature slice must pull its active questions from `14-verification-question-ledger.md`, answer them, and restart the loop from Step 1 for the affected domain path.

## 8. 2026-05-01 Review: Identity / Audit / Project Scope Tightening

### 8.1 Reviewer Summary

| Reviewer | Role | Scope | Approval Status | Key Findings |
| --- | --- | --- | --- | --- |
| Sartre | Domain Reviewer | Member status, ID login, public attribution, project lead/operator/delegation, audit authority | needs-rework-integrated | Active-only ID login, canonical statuses, anonymous default, and audit direct-write removal are correct. Private project review and internal read must stay separate. `review_join_requests` delegation must not directly mutate memberships. |
| Dirac | Implementation Reviewer | Supabase migration, RLS policies, TypeScript defaults | needs-rework-integrated | SQL and TS are plausible, but requester self-update on join requests and delegated membership updates were too broad. Existing `projects.manage/projects.read` behavior may intentionally tighten and should be reviewed against UI. |
| Parfit | Risk Reviewer | Privilege escalation, audit forging, privacy leakage | needs-rework-integrated | Audit forge path and non-active ID login are closed. Direct membership mutation by delegates and self-approval risk must be removed. Official-team review access should not be mixed into private project material read. |

### 8.2 Rework Applied

| Finding | Decision | Evidence |
| --- | --- | --- |
| Delegate with `review_join_requests` could insert/update membership rows directly. | Accepted. Removed delegated membership insert/update from direct RLS. Future approval must use command RPC. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` |
| Delegate with `review_join_requests` could update join-request rows directly. | Accepted. Removed delegated direct update until a command RPC can enforce request identity, transition, audit, and notification. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql`, `Q-AUTHZ-003` |
| Requester could update own project join request and spoof approval/review fields. | Accepted. Removed requester self-update from direct join-request update policy. Future cancel/edit must use command RPC. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` |
| Official-team lead review access was mixed into `can_read_private_project`. | Accepted. Removed review helper from private project row-read helper. Review metadata needs a separate read model. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql`, `Q-PROJECT-001` |
| `maintainer` storage vocabulary differs from `ProjectOperator` domain language. | Deferred. Storage remains for compatibility; added active question before role-management UI. | `Q-AUTHZ-004` |
| Audit payload redaction and authority snapshot are still missing. | Deferred. Direct write path is blocked now; redaction/internal audit command remains active. | `Q-AUDIT-002` |

### 8.3 Closure Decision

This slice can proceed to build verification and commit because the reviewers' blocking RLS concerns were integrated into the migration.

The broader capability/project/audit DDD loop is not fully closed. Remaining active questions are tracked in `14-verification-question-ledger.md`, especially `Q-AUTHZ-002`, `Q-AUTHZ-003`, `Q-PROJECT-001`, `Q-PROJECT-004`, and `Q-AUDIT-002`.
