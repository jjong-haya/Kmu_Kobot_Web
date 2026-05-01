# 08. Task Checklist

## 1. Pre-Implementation Gate

- [ ] Step 1 domain understanding is written before implementation.
- [ ] Ubiquitous language is defined with banned ambiguous synonyms.
- [ ] The bounded context is identified.
- [ ] The aggregate owner is identified.
- [ ] Domain value objects are listed.
- [ ] Identity, uniqueness, ownership, lifecycle, permission, visibility, concurrency, and privacy invariants are written down.
- [ ] Commands and domain events are named before database/UI changes.
- [ ] Permission, state, and visibility scope is explicit.
- [ ] UI validation is not the only enforcement mechanism.
- [ ] A database constraint, RLS rule, trigger, or command RPC enforces critical invariants.
- [ ] Safe user-facing error copy is defined.
- [ ] Audit and notification side effects are defined when needed.
- [ ] Remaining user decisions are listed in `00-user-decision-checklist.md`.

## 2. Verification Gate

- [ ] Run `git diff --check`.
- [ ] Run `npm run build`.
- [ ] Push Supabase migrations when database changes exist.
- [ ] Verify local/remote migration history when database changes exist.
- [ ] Record evidence in `10-verification-and-release.md`.
- [ ] Collect every unresolved question, including small questions.
- [ ] If any question remains unresolved, return to Step 1 and rerun the DDD loop.
- [ ] Review with at least 3 independent perspectives: Domain, Implementation, Risk.
- [ ] Record reviewer disagreements as `accepted`, `rejected`, `deferred`, or `needs-rework`.
- [ ] Close the loop only after questions, assumptions, disagreements, and evidence are documented.

## 3. Phase 0: Workflow Foundation

- [x] TASK-0001: Create `ddd-spec-workflow` skill.
- [x] TASK-0002: Create the `docs/ddd-workflow` ledger.
- [x] TASK-0003: Perform first-pass domain review.
- [x] TASK-0004: Add invariant matrix and form-field gate to `ddd-spec-workflow`.
- [x] TASK-0005: Strengthen the DDD loop so unresolved questions force a Step 1 restart.
- [x] TASK-0006: Require 3 independent reviewer perspectives before DDD loop closure.
- [x] TASK-0007: Create `explain-before-action` skill for explanation-first work.

## 4. Phase 1: Auth / Join / Pending

- [x] TASK-0101: Separate `/member/join` from `/member/pending`.
- [x] TASK-0102: Hide raw OAuth/Supabase errors from user-facing callback UI.
- [x] TASK-0103: Make Landing CTA reflect authenticated state.
- [x] TASK-0104: Enforce `login_id` availability.
  - Spec: `13-domain-risk-review-2026-05-01.md`
  - Files: `src/app/auth/AuthProvider.tsx`, `src/app/auth/types.ts`, `src/app/pages/member/ProfileSettings.tsx`
  - Migration: `supabase/migrations/20260501043000_login_id_availability.sql`
  - Invariants: global uniqueness, lowercase normalization, first-claim lock, authenticated-only availability check

## 5. Phase 2: Capability / Permission

- [x] TASK-0201: Document broad permission risk.
- [x] TASK-0202: Design split helpers for project lead/operator/delegation/private-read/audit-read.
- [x] TASK-0203: Design scoped capability read model.
- [ ] TASK-0204: Implement capability-scope database/RLS migration.

## 6. Phase 3: Command RPC

- [ ] TASK-0301: Implement `redeem_invitation` RPC.
  - Must handle expiration, max uses, row locking, audit, and notification.
- [ ] TASK-0302: Implement Contact Request command RPCs.
  - Must handle accept, reject, report, auto-expire, and rate-limiting.
- [ ] TASK-0303: Restrict audit log writes to command RPCs/triggers.

## 7. Phase 4: Project / GitHub / Vote

- [ ] TASK-0401: Implement `project_creation_requests`.
- [ ] TASK-0402: Implement recruitment-card visibility policy.
- [ ] TASK-0403: Implement GitHub repository connection and README snapshot model.
- [ ] TASK-0404: Implement vote eligibility/result snapshots.
- [ ] TASK-0405: State the exact anonymity level for votes.

## 8. Current P0 Backlog

| ID | Task | Reason |
| --- | --- | --- |
| P0-RBAC-001 | Split capability scope/source | Prevent project leads from acting like global operators |
| P0-AUDIT-001 | Restrict direct audit inserts | Prevent forged audit history |
| P0-INVITE-001 | Add invitation redemption RPC | Prevent expired/replayed/concurrent invite use |
| P0-VOTE-001 | Define vote anonymity level | Prevent mismatch between user expectation and data model |
