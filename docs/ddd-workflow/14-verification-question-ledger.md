# 14. Verification Question Ledger

## 1. Purpose

This file is the active verification queue for DDD loops.

The domain tree and terminology live in `02-domain-discovery.md` and grow over time. This file is different: it tracks questions that must be answered, verified, converted into assumptions, or turned into tasks.

## 2. Queue Rules

### 2.1 Active Queue

Questions in the active queue are blockers or review items for future implementation.

Do not silently delete active questions. Move them to the resolved archive only when one of these is true:

- The user answered the question.
- The code/database/docs prove the answer.
- The user explicitly approved a safe assumption.
- The question was converted into a concrete task with an owner and verification method.

### 2.2 Loop Restart Rule

When any active question is answered, return to DDD Step 1 for the affected domain path and ask:

1. Did the answer create or rename a domain term?
2. Did the answer add a new bounded context?
3. Did the answer change an aggregate, value object, or invariant?
4. Did the answer change permissions, state, visibility, audit, retention, or UX?
5. Did the implementation used to resolve it create a new question?

If yes, add the new question to the active queue.

### 2.3 Status Values

| Status | Meaning |
| --- | --- |
| `active` | Needs an answer before the related slice can close. |
| `blocked-by-user` | Needs direct user decision. |
| `blocked-by-implementation` | Needs code/database inspection or implementation. |
| `assumption-approved` | User accepted the uncertainty as an assumption. |
| `converted-to-task` | No longer a question; tracked in `08-task-checklist.md`. |
| `resolved` | Answered and verified. |

## 3. Active Verification Queue

| ID | Priority | Domain Path | Question | Why It Matters | Current Safe Default | Status | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q-AUTH-001 | P0 | Identity And Access > Member Registry | Is join request submission the same as required profile fields being filled, or does it require a separate `MembershipApplication.submitted_at`? | Current code can infer submission from field completeness, but approval/audit needs an explicit application event. | Treat profile completion and join submission as separate domain events. | active | Design `MembershipApplication` or explicit submitted state. |
| Q-AUTH-003 | P0 | Identity And Access > Google OAuth | Is `before_user_created_kobot` actually connected in Supabase Dashboard Auth Hooks? | The SQL function exists, but the hook connection is the real enforcement point for Google/school-account creation. | Treat DB function as incomplete until dashboard hook is verified. | active | Add deployment checklist item and manual verification evidence. |
| Q-AUTH-005 | P1 | Identity And Access > Project-Only Participant | Which minimum routes can `project_only` users access? | Current `RequireActiveMember` blocks almost all member workspace routes. | Create project-only route/read model later; do not grant full workspace. | active | Define project-only UX slice. |
| Q-PROFILE-002 | P1 | Member Registry > Profile Identity | Is nickname 7-day change limit enforced in DB/RPC or only UX? | UI-only enforcement can be bypassed. | Enforce through RPC or trigger before shipping nickname change. | active | Inspect/implement command path. |
| Q-PROFILE-003 | P1 | Member Registry > Join Profile | Is `clubAffiliation` required for all users, or optional except external project participants? | Current `saveProfileSettings` treats it as required while earlier product discussion allowed flexibility. | Required input for now because user asked college/department/club fields during signup. | active | Confirm with join policy before final release. |
| Q-PROFILE-004 | P1 | Member Registry > Profile Identity | Should hidden nickname history be hidden from `members.read` only, or also from official team leads? | `hide_previous_from_members` exists, but current select policy may expose hidden history to broad readers. | Only president/vice can override hidden history. | active | Update nickname history RLS/read model. |
| Q-AUTHZ-002 | P0 | Authority And Capability | Can broad permissions like `projects.manage` remain, or must every project action be scoped capability? | Broad permissions can make official team leads look like global project admins. | State-changing project actions use scoped command RPCs. | active | Implement capability read model. |
| Q-AUTHZ-003 | P0 | Authority And Capability > Project Join Review | Should a `review_join_requests` delegate directly mutate `project_team_memberships`, or only execute an approve/reject command RPC? | Direct membership insert/update can add arbitrary members or alter existing member rows without a reviewed request. | Delegates cannot mutate membership rows directly; implement join-review command RPC. | active | Implement `approve_project_join_request` / `reject_project_join_request` RPCs. |
| Q-AUTHZ-004 | P1 | Authority And Capability > Project Role Vocabulary | Should the DB role value `maintainer` be migrated to `project_operator`, or kept as storage vocabulary mapped to product term `ProjectOperator`? | Mismatched role language can make future policies use the wrong authority meaning. | Keep storage value for now, but product/code language should treat it as project operator, not project lead. | active | Decide migration or mapping before role-management UI. |
| Q-PROJECT-001 | P0 | Project Workspace > Visibility | Can official team leads read private internal material for official-team-based projects, or only approval/review metadata? | User clarified project lead only sees own project, and operator group has broader review, but internal material scope needs precision. | Official team lead can see review metadata only until internal-material read models are split. | active | Implement separate read models: public intro, review metadata, internal material. |
| Q-PROJECT-002 | P0 | Project Workspace > Creation Approval | Who approves personal/autonomous project creation: president/vice only, all official team leads, or all official team leads plus president/vice? | Earlier decisions allowed official team leads; risk is unclear responsibility. | All official team leads plus president/vice can approve, with required audit authority source. | active | Encode as capability source/scope. |
| Q-PROJECT-003 | P1 | Project Workspace > Recruitment | Is a pre-team member a member, applicant, or only a displayed planned participant? | Affects visibility, notifications, approval, and whether contact info is visible. | Pre-team member is not a project member until accepted/approved. | active | Define `PreTeamMember` state. |
| Q-PROJECT-004 | P1 | Project Workspace > Join Request | Can a requester cancel or edit their own project join request, and which fields are allowed? | Direct self-update can accidentally permit self-approval or reviewer field spoofing. | No direct self-update; add cancel/edit command RPC later. | active | Design `cancel_project_join_request` and editable fields. |
| Q-INVITE-001 | P0 | Invitation And Recruitment | How should `status = used` interact with `max_uses > 1`? | Current schema can conflict with multi-use invitation codes. | Status remains `active` until `used_count >= max_uses` or expiry/revocation. | active | Implement redemption RPC and status policy. |
| Q-INVITE-002 | P0 | Invitation And Recruitment | Should failed invitation redemption attempts be recorded? | Needed for abuse detection and debugging expired/replayed codes. | Record failed attempts without storing raw code. | active | Add `invitation_redemptions` or event log design. |
| Q-GITHUB-001 | P1 | GitHub README Integration | How long are private README snapshots retained? | Private repo content may be sensitive. | Retain latest snapshot only unless project lead opts into history. | active | Add retention policy. |
| Q-GITHUB-002 | P1 | GitHub README Integration | Who can switch intro display source: internal, GitHub, newest, manual? | User decided project lead can select, members can request. | Project lead chooses; member requests require project lead approval. | active | Encode command/event. |
| Q-CONTACT-001 | P0 | Communication > Contact Request | Where is repeated/similar contact-request spam blocked: UI, RPC, DB, or edge rate limit? | Confirmation modal alone does not stop scripted API calls. | Server-side RPC rate limit plus confirmation UI. | active | Design `rate_limit_events` and command RPC. |
| Q-CONTACT-002 | P1 | Communication > Contact Request | Does reading a member phone/email inside a project roster create an audit event? | Sensitive data access may be important, but too many audit events can be noisy. | No audit for normal roster view; audit only for exceptional export/admin access. | active | Confirm privacy policy. |
| Q-CONTACT-003 | P1 | Communication > Public Inquiry | Is public `/contact` a general inquiry domain separate from member contact requests? | Public inquiry does not exchange member contact payloads and should not reuse ContactRequest rules blindly. | Keep public inquiry separate from member contact request. | active | Define inquiry submission/storage policy. |
| Q-CONTACT-004 | P1 | Communication > Contact Request | Which contact methods are allowed at acceptance: email, phone, open chat, Kakao ID, Discord, GitHub, or custom text? | Acceptance UI must show the exact payload options the recipient can disclose. | Email/phone/custom note in phase 1 unless expanded. | active | Confirm before implementing contact RPC. |
| Q-VOTE-002 | P0 | Voting And Governance > Eligibility | Is vote eligibility snapshotted when vote opens? | Membership/team changes during voting can change eligibility. | Snapshot eligibility at open time. | active | Add `vote_eligibility_snapshots`. |
| Q-AUDIT-002 | P0 | Audit Notification And Retention | Are raw phone, student ID, contact payloads, private README text, and vote selections forbidden from audit payloads? | Prevents personal-data over-retention. | Store redacted diff and references, not raw sensitive payload. | active | Add redaction helper/policy. |
| Q-LEGAL-001 | P1 | Legal And Privacy | What exact consent copy covers student ID, phone, department, club affiliation, nickname history, audit logs, and retention? | Required for transparent signup and privacy pages. | Signup shows collection/use/retention summary and links to privacy policy. | active | Update Terms/Privacy/join copy. |
| Q-SUPPORT-001 | P1 | Learning / Resources / Events | Are study, resource, equipment, office hours, and attendance first-release domains or UI placeholders? | Affects scope and whether DB tables must be designed now. | Treat as supporting domains with UI placeholders until chosen for implementation. | active | Convert each to a feature slice when implementation begins. |
| Q-NOTICE-001 | P1 | Communication | Are public notices and member announcements one aggregate with visibility or separate aggregates? | Public/internal visibility, author authority, and audit differ. | Separate read models; shared content model only if visibility is explicit. | active | Decide before implementing notice CRUD. |
| Q-TEAM-001 | P2 | Official Team Operations | What are canonical official team slugs and display names? | DB seed has English-ish names, user-facing Korean names differ. | Use stable English slugs with Korean display names. | active | Add seed/display mapping. |
| Q-DASH-001 | P1 | Member Workspace > Dashboard | Is the dashboard MVP for general active members, operators, or both with role-dependent tasks? | Dashboard should become action-focused, not just a static information card grid. | General active member dashboard first; operator queues appear by capability. | active | Define dashboard read model. |
| Q-DASH-002 | P1 | Member Workspace > Dashboard | Which task domains enter “today's actions”: approvals, project review, join requests, contact requests, votes, equipment, events, study logs? | Prevents dashboard from becoming an unbounded catch-all. | Include notifications, my projects, pending contact requests, active votes first. | active | Prioritize dashboard slices. |
| Q-PUBLIC-001 | P1 | Public Showcase > Recruit | Is public `/recruit` a real application form or a promotional lead form separate from `/member/join`? | Public recruit submission and authenticated member join request have different identity requirements. | Treat `/recruit` as promotional/public recruiting content until backend form is designed. | active | Split public recruit from join request. |
| Q-PUBLIC-002 | P2 | Public Showcase | Should past spring 2026 recruitment dates become archive copy or dynamic recruitment state? | Current date is 2026-05-01 and past D-day text can mislead users. | Convert past dates to archive/status copy before public release. | active | Update public copy when landing is revised. |
| Q-UX-001 | P1 | UX Copy | Should `mock`, `DB 연결 전`, and other developer-state text be removed or shown as internal beta labels? | Developer implementation status should not appear to end users. | Remove from production UI; use internal beta labels only if needed. | active | Add UX cleanup task. |
| Q-UX-002 | P1 | UX Copy > Permissions | Should `Admin/Leadership/Member/Guest` terminology be replaced with president/vice/official team lead/project lead/capability model? | Current permission page language conflicts with DDD authority terms. | Replace with capability model. | active | Update Permissions page spec before code. |

## 4. Resolved Archive

| ID | Domain Path | Answer | Evidence | Resolution Type |
| --- | --- | --- | --- | --- |
| R-ID-001 | Identity And Access > Login ID | `login_id` is lowercase `[a-z0-9]{4,20}`, globally unique, checked by authenticated RPC, and guarded by DB unique index. | `supabase/migrations/20260501043000_login_id_availability.sql`, `src/app/auth/AuthProvider.tsx` | resolved |
| R-UX-001 | Identity And Access > Login | Raw Supabase/PKCE/PostgREST errors should not be shown to users. | `src/app/auth/AuthProvider.tsx`, `src/app/pages/public/AuthCallback.tsx` | resolved |
| R-AUTH-002 | Member Registry | Canonical member statuses are `pending`, `active`, `suspended`, `rejected`, `alumni`, `project_only`, and `withdrawn`. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql`, `src/app/auth/types.ts` | resolved |
| R-AUTH-004 | Identity And Access > Login ID | ID/password login resolves only active accounts. Pending, suspended, rejected, alumni, project-only, and withdrawn accounts must use the Google/session flow and then be routed by status. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` | resolved |
| R-PROFILE-001 | Member Registry > Profile Identity | Public attribution defaults to `anonymous`; internal member screens can still use real-name/nickname context where authorized. | `supabase/migrations/20260428173000_member_workspace_core.sql`, `src/app/auth/AuthProvider.tsx`, `src/app/auth/types.ts`, `src/app/pages/member/ProfileSettings.tsx` | resolved |
| R-AUTHZ-001 | Authority And Capability | `current_user_is_project_team_lead` now means actual active project `lead` only. Maintainer/operator and temporary delegation use separate scoped helpers. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` | resolved |
| R-AUDIT-001 | Audit Notification And Retention | Normal authenticated members can no longer insert audit logs directly or call `create_audit_log`. Audit creation must move through command RPCs/triggers/service role. | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` | resolved |
| R-VOTE-001 | Voting And Governance > Anonymous Vote | Anonymous voting means normal users, team leads, vice president, and operators see aggregate results only. The president can inspect individual vote records only for audit purposes, and this must be disclosed before voting. | User decision on 2026-05-01, `docs/ddd-workflow/00-user-decision-checklist.md` | resolved |

## 5. Next Question Selection Rule

When implementing, pick the highest-priority active question under the affected domain path.

Example:

```text
Implement contact requests
-> read Communication > Contact Request
-> pull Q-CONTACT-001 and Q-CONTACT-002
-> answer or convert to task
-> rerun DDD Step 1 for Communication
```
