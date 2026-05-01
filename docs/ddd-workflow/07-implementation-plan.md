# 07. Implementation Plan

## 1. Purpose

Implementation must follow the domain tree and active verification queue.

Do not implement a feature slice until its P0 questions in `14-verification-question-ledger.md` are answered, approved as assumptions, or converted into explicit tasks.

## 2. Working Sequence

Every implementation slice uses this sequence:

1. Select domain path from `02-domain-discovery.md`.
2. Pull active questions from `14-verification-question-ledger.md`.
3. Update event commands in `03-event-storming.md`.
4. Update schema/RLS/RPC impact in `04-data-schema-and-security.md`.
5. Update functional and UX spec.
6. Create small tasks in `08-task-checklist.md`.
7. Implement only one bounded context or coordinated transaction.
8. Verify.
9. If verification creates new questions, add them to `14-verification-question-ledger.md` and restart Step 1 for that domain path.

## 3. Phase 0: DDD Foundation

Status: in progress.

Completed:

- Created/updated DDD workflow skill.
- Created explanation-before-action skill.
- Built cumulative domain discovery ledger.
- Built cumulative event-storming ledger.
- Built data/security ledger.
- Built active verification question ledger.

Next:

- Keep Korean user-facing summaries in `SUMMARY-ko.md`.
- Use English working specs for AI/developer continuity.

## 4. Phase 1: Identity / Join / Status Alignment

Priority: P0.

Blocked by:

- `Q-AUTH-001`
- `Q-AUTH-002`
- `Q-AUTH-003`
- `Q-AUTH-004`
- `Q-PROFILE-001`

Implementation goals:

1. Verify Supabase Auth Hook connection.
2. Align `member_accounts.status` between DB and frontend.
3. Decide login ID resolution for non-active statuses.
4. Separate join profile draft from submitted join request if needed.
5. Align public credit default.

Expected files:

- `supabase/migrations/*`
- `src/app/auth/AuthProvider.tsx`
- `src/app/auth/types.ts`
- `src/app/auth/onboarding.ts`
- `src/app/pages/member/ProfileSettings.tsx`
- `src/app/pages/member/ApprovalPending.tsx`

## 5. Phase 2: Capability / Permission / Private Visibility

Priority: P0.

Blocked by:

- `Q-AUTHZ-001`
- `Q-AUTHZ-002`
- `Q-PROJECT-001`
- `Q-AUDIT-001`

Implementation goals:

1. Split project lead, project operator, and temporary delegation helpers.
2. Replace broad permission checks for state-changing project commands.
3. Add scoped capability read model or equivalent RPC layer.
4. Restrict audit log insertion to command paths.
5. Split project read models: intro, review metadata, internal material.

Expected files:

- `supabase/migrations/*`
- `src/app/auth/types.ts`
- `src/app/auth/AuthProvider.tsx`
- `src/app/layouts/MemberLayout.tsx`
- `src/app/pages/member/Permissions.tsx`
- `src/app/pages/member/Projects.tsx`

## 6. Phase 3: Invitation / Project Creation Commands

Priority: P0.

Blocked by:

- `Q-PROJECT-002`
- `Q-PROJECT-003`
- `Q-INVITE-001`
- `Q-INVITE-002`

Implementation goals:

1. Add project creation request model.
2. Add pre-team member model.
3. Implement `redeem_invitation` RPC.
4. Add invitation redemption history.
5. Add audit/notification side effects.

Expected files:

- `supabase/migrations/*`
- `src/app/pages/member/Projects.tsx`
- future project service/hooks.

## 7. Phase 4: Contact Request Commands

Priority: P1 after P0 capability/audit safety.

Blocked by:

- `Q-CONTACT-001`
- `Q-CONTACT-002`
- `Q-CONTACT-004`

Implementation goals:

1. Implement send/accept/reject/report RPCs.
2. Add rate-limit event model.
3. Add 3-day auto-reject execution plan.
4. Remove developer-state text from contact UI.

## 8. Phase 5: Voting And Governance

Priority: P0 for governance, P1 for general voting.

Blocked by:

- `Q-VOTE-002`

Implementation goals:

1. Add eligibility snapshot.
2. Implement ballot submission RPC.
3. Split aggregate result read model from president-only audit read model.
4. Add voter-facing anonymity disclosure copy before submission.
5. Implement election rerun / winner acceptance workflow.

## 9. Phase 6: UX Cleanup And Dashboard

Priority: P1.

Blocked by:

- `Q-DASH-001`
- `Q-DASH-002`
- `Q-PUBLIC-001`
- `Q-PUBLIC-002`
- `Q-UX-001`
- `Q-UX-002`

Implementation goals:

1. Remove production-facing developer-state copy.
2. Replace permissions terminology with capability model.
3. Convert dashboard from card wall to action hub.
4. Separate public recruit from authenticated join request.
5. Update stale public recruiting dates.

## 10. Verification Gate

Each implementation slice must record:

- Active questions pulled from `14-verification-question-ledger.md`.
- Questions resolved and moved to archive.
- New questions discovered.
- DB migration result if any.
- `git diff --check`.
- `npm run build`.
- Manual browser flow if UI changed.
- Reviewer findings from at least 3 perspectives before closure.
