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
