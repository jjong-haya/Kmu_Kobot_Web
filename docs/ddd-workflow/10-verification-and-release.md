# 10. Verification And Release

## 1. Release Gate

### 1.1 Code Verification

- [ ] `git diff --check`
- [ ] `npm run build`
- [ ] Manual flow check when a UI path changes

### 1.2 Database Verification

- [ ] Migration is additive or has an explicit data migration plan.
- [ ] Existing data is compatible with new constraints.
- [ ] Remote Supabase migration is applied.
- [ ] Remote migration history matches local migration history.

### 1.3 Security / Privacy Verification

- [ ] Raw Supabase, PostgREST, PKCE, or environment errors are not shown to users.
- [ ] Sensitive data is not stored in audit payloads.
- [ ] RPCs that do not need anonymous access are granted only to `authenticated`.

### 1.4 DDD Loop Closure Verification

- [ ] `DDD Loop Review Log` exists for the current slice.
- [ ] At least 3 independent reviewer perspectives are recorded.
- [ ] `Disagreement Register` classifies every disagreement as `accepted`, `rejected`, `deferred`, or `needs-rework`.
- [ ] `Unresolved Questions Checklist` includes small questions, not only major blockers.
- [ ] Every unresolved question either has an answer or a user-approved assumption.
- [ ] If any question remains unresolved, the loop restarts from Step 1.
- [ ] The code or document changes created while resolving questions are checked for new questions.
- [ ] `Closure Decision` explains why it is safe to proceed.

## 2. 2026-05-01 Verification: Login ID Availability

### 2.1 Scope

| Area | File |
| --- | --- |
| DB | `supabase/migrations/20260501043000_login_id_availability.sql` |
| Auth | `src/app/auth/AuthProvider.tsx` |
| Types | `src/app/auth/types.ts` |
| UI | `src/app/pages/member/ProfileSettings.tsx` |
| Summary | `docs/ddd-workflow/SUMMARY-ko.md` |

### 2.2 Expected Behavior

1. A valid login ID is checked on input blur.
2. A duplicate ID shows `이미 사용 중인 ID입니다.` below the login ID field.
3. Submit re-checks availability before saving.
4. Duplicate submit scrolls to the login ID input and highlights it.
5. Concurrent duplicate claims are still blocked by the database unique index.
6. Anonymous users cannot call the availability RPC.

### 2.3 Evidence

| Command | Purpose | Result |
| --- | --- | --- |
| `git diff --check` | Whitespace and patch sanity | Passed |
| `npm run build` | TypeScript/Vite production build | Passed. Vite chunk-size warning remains. |
| `npx supabase db push --db-url ... --yes` | Apply remote Supabase RPC migration | Passed. `20260501043000` applied. |
| `npx supabase migration list --db-url ...` | Confirm local/remote migration history | Passed. Local and remote both include `20260501043000`. |

## 3. Release Note

The frontend calls `is_login_id_available`, so the Supabase migration must be deployed before or with the Vercel deployment.

## 4. 2026-05-01 Verification: DDD Skill And Loop Foundation

### 4.1 Scope

| Area | File |
| --- | --- |
| Local skill | `C:\Users\jongh\.codex\skills\ddd-spec-workflow\SKILL.md` |
| Local skill | `C:\Users\jongh\.codex\skills\ddd-spec-workflow\references\artifact-templates.md` |
| Local skill | `C:\Users\jongh\.codex\skills\ddd-spec-workflow\references\sub-agent-prompts.md` |
| Local skill | `C:\Users\jongh\.codex\skills\explain-before-action\SKILL.md` |
| Project docs | `docs/ddd-workflow/README.md` |
| Project docs | `docs/ddd-workflow/08-task-checklist.md` |
| Project docs | `docs/ddd-workflow/09-agent-review-log.md` |

### 4.2 Expected Behavior

1. DDD work starts with domain understanding, not code.
2. Explanation is required before editing when the user asks what something means or why it exists.
3. Verification collects every unresolved question, including small questions.
4. Any unresolved question restarts the loop from Step 1.
5. At least 3 independent reviewer perspectives are required before closure.
6. Reviewer disagreements are classified and integrated before closure.
7. Feature-specific DDD loops must run again; the workflow-foundation closure does not automatically approve future feature work.

### 4.3 Evidence

| Command | Purpose | Result |
| --- | --- | --- |
| `quick_validate.py C:\Users\jongh\.codex\skills\ddd-spec-workflow` | Validate skill metadata and structure | Passed |
| `quick_validate.py C:\Users\jongh\.codex\skills\explain-before-action` | Validate skill metadata and structure | Passed |
| `git diff --check` | Whitespace and patch sanity | Passed |
| `npm run build` | TypeScript/Vite production build | Passed. Vite chunk-size warning remains. |

## 5. 2026-05-01 Verification: Full Project DDD Restart

### 5.1 Scope

| Area | File |
| --- | --- |
| Cumulative domain tree | `docs/ddd-workflow/02-domain-discovery.md` |
| Cumulative event storming | `docs/ddd-workflow/03-event-storming.md` |
| Data/security ledger | `docs/ddd-workflow/04-data-schema-and-security.md` |
| Functional spec | `docs/ddd-workflow/05-functional-spec.md` |
| UX/design spec | `docs/ddd-workflow/06-design-spec.md` |
| Implementation plan | `docs/ddd-workflow/07-implementation-plan.md` |
| Task checklist | `docs/ddd-workflow/08-task-checklist.md` |
| Agent review log | `docs/ddd-workflow/09-agent-review-log.md` |
| Verification question queue | `docs/ddd-workflow/14-verification-question-ledger.md` |
| Korean summary | `docs/ddd-workflow/SUMMARY-ko.md` |

### 5.2 Expected Behavior

1. DDD Step 1 starts from the cumulative domain tree instead of rediscovering everything from scratch.
2. Terminology is shared across the project and ambiguous synonyms are banned.
3. Domain tree, event map, data/security map, functional spec, UX spec, and implementation plan are connected.
4. Active verification questions are tracked in a queue-like ledger and not silently deleted.
5. Solving a question restarts Step 1 for the affected domain path.
6. Three independent reviewer perspectives are integrated before closing the documentation pass.
7. Feature implementation remains blocked by its active P0 questions.

### 5.3 Evidence

| Command | Purpose | Result |
| --- | --- | --- |
| `git diff --check` | Whitespace and patch sanity | Passed |
| `npm run build` | TypeScript/Vite production build | Passed. Vite chunk-size warning remains. |
| UTF-8 file check | Ensure Korean summary has no replacement characters | Passed |

## 6. 2026-05-01 Verification: Identity / Audit / Project Scope Tightening

### 6.1 Scope

| Area | File |
| --- | --- |
| DB migration | `supabase/migrations/20260501060000_tighten_identity_audit_project_scope.sql` |
| Auth defaults | `src/app/auth/AuthProvider.tsx` |
| Auth types | `src/app/auth/types.ts` |
| Join/profile defaults | `src/app/pages/member/ProfileSettings.tsx` |
| Security ledger | `docs/ddd-workflow/04-data-schema-and-security.md` |
| Task checklist | `docs/ddd-workflow/08-task-checklist.md` |
| Review log | `docs/ddd-workflow/09-agent-review-log.md` |
| Question ledger | `docs/ddd-workflow/14-verification-question-ledger.md` |
| Korean summary | `docs/ddd-workflow/SUMMARY-ko.md` |

### 6.2 Expected Behavior

1. ID/password login resolves only active members with a registered password.
2. Pending, suspended, rejected, alumni, project-only, and withdrawn users cannot resolve login ID to email.
3. Public attribution defaults to anonymous unless the member changes it later.
4. Project lead helper means actual active project `lead` only.
5. Maintainer/operator and temporary delegation no longer count as project lead.
6. Temporary delegation is checked by explicit scope and expiration.
7. Normal authenticated users cannot directly insert audit logs or call the broad audit-log helper.
8. Project membership rows cannot be directly inserted/updated by `review_join_requests` delegates.
9. Project join requests cannot be directly updated by `review_join_requests` delegates until a command RPC exists.
10. Project join requesters cannot directly update their own request into an approved/reviewed state.
11. Official-team review authority is not mixed into `can_read_private_project`; review metadata needs a separate read model.

### 6.3 Evidence

| Command / Review | Purpose | Result |
| --- | --- | --- |
| `git diff --check` | Whitespace and patch sanity | Passed |
| `npm run build` | TypeScript/Vite production build | Passed. Vite chunk-size warning remains. |
| Domain reviewer | Check domain terms and invariants | Needs-rework findings integrated. |
| Implementation reviewer | Check RLS and SQL/TS risks | Needs-rework findings integrated. |
| Risk reviewer | Check privilege escalation and privacy leakage | Needs-rework findings integrated. |

### 6.4 Release Note

This migration has not been applied to the remote Supabase project in this pass.

Reason: previous remote migration attempts exposed migration-history and database-password setup issues. The safe release path is to commit/push the migration first, then apply it deliberately with the correct Supabase DB password and migration history repair/pull plan.

## 7. 2026-05-01 Verification: Vote Anonymity Decision

### 7.1 Decision

Anonymous vote means aggregate visibility for normal users/operators and president-only individual ballot audit access.

This must be disclosed before ballot submission.

### 7.2 Evidence

| Evidence | Result |
| --- | --- |
| User decision | President can inspect individual vote records only for audit purposes. |
| `14-verification-question-ledger.md` | `Q-VOTE-001` moved to resolved archive as `R-VOTE-001`. |
| `08-task-checklist.md` | `TASK-0405` marked complete; next work is eligibility snapshot and president-only audit read model. |
