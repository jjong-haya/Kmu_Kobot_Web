# Architecture Review — KOOBOT (2026-05-06)

Scope: structural / boundary / coupling. Style and bug reports are out of scope. Author cross-checked `docs/analysis/01`, `docs/analysis/08`, `docs/analysis/09`, `docs/ddd/01`, and the live tree under `src/app`.

---

## Top 3 architectural issues

### 1. AuthProvider is a load-bearing god-object holding the entire RBAC pipeline

`src/app/auth/AuthProvider.tsx` is **~36 KB / one file** and concentrates: session bootstrap, `get_my_authorization_context` RPC, `current_user_tag_permissions` + `current_user_tag_nav_paths` RPCs, error normalization (`isTechnicalErrorMessage`, `isMissingWorkspaceSchemaError`), profile-settings save, onboarding routing, status fallback rules, public-credit name policy, plus the React context.

Why it matters: the file is the single point where a) frontend-derived `effectivePermissions` and b) tag-driven nav paths are computed. Per `docs/analysis/09-full-code-reaudit-v2`, frontend tag permissions are not yet aligned with `current_user_has_permission()` in DB. The mismatch is bound by `AuthProvider` deciding when to fall back to status-based permissions (the `tag RPC empty → status fallback` branch). Any change to fallback policy ripples through every guarded route at once. A single regression here silently grants/denies access across the whole `/member/*` tree.

Direction: split into `auth/session.ts` (session+supabase listener), `auth/authorization.ts` (RPC orchestration, pure), `auth/policy.ts` (fallback rules, pure), and `auth/AuthContext.tsx` (React shell). Make fallback rules data-tested and explicit, not embedded in the same file as RPC plumbing.

### 2. `*-policy.js` files are an undocumented JS island inside an otherwise typed app

Six files under `src/app/api/` are still `.js` and export domain rules consumed from `.ts` neighbors:
- `announcement-policy.js`, `clipboard.js`, `contact-request-policy.js`, `member-feature-flags.js`, `notification-policy.js`, `project-policy.js`

`projects.ts` line 6 imports `./project-policy.js` — TypeScript files importing untyped JS. None of the docs (`docs/analysis/01`, `docs/ddd/01`, `docs/product/README.md`) mention this hybrid; there is no migration plan. These files contain real policy: notification category routing (membership_application → `/member/member-admin?filter=submitted`), project status filters, project role labels, project URL builder. Bugs here are typed away — refactors in `projects.ts` cannot rely on the compiler to flag mismatched filter keys or role enums.

Direction: convert all `*-policy.js` to `.ts` in one pass (no behavior change), then move them to `src/app/domain/` so policy is not co-mingled with Supabase resource files. Currently `src/app/api/` mixes "Supabase resource client" and "pure domain rules" in the same folder.

### 3. Module-boundary leak: pages and layouts call Supabase directly instead of the API layer

The documented intent (`docs/analysis/01` §4 + `docs/ddd/01` §3) is a layered SPA: pages render, API layer owns Supabase. In practice:
- `src/app/layouts/MemberLayout.tsx:49` — direct `getSupabaseBrowserClient`
- `src/app/pages/member/AccountInfo.tsx:327` — `.from("profile_change_requests")` direct table write
- `src/app/pages/member/Welcome.tsx:39` — `supabase.rpc(...)` direct call
- `src/app/pages/member/Security.tsx:11` — direct client
- `src/app/pages/public/AuthCallback.tsx:273` — `supabase.rpc("redeem_course_invite", ...)` direct
- `src/app/hooks/useLandingData.ts:2` — direct client

This means `src/app/api/*.ts` is *not* the only Supabase boundary. Any RLS or schema drift (which `docs/analysis/08` already flags as the dominant risk axis) has multiple uncovered ingress points. The "API layer per resource" pattern is partial — `tags.ts`, `projects.ts`, `notifications.ts` follow it cleanly; auth-adjacent pages bypass it.

Direction: enforce that `getSupabaseBrowserClient` is imported only from `src/app/api/*` and `src/app/auth/*`. Add an ESLint `no-restricted-imports` rule. Move the `redeem_course_invite`, `profile_change_requests` calls into `src/app/api/invite-codes.ts` and a new `src/app/api/account.ts`.

---

## Module map verdict

**Score: 6/10.** The skeleton is correct: `routes.tsx` is a flat, readable react-router config; guards (`RequireSession`, `RequireActiveMember`, `RequirePermission`) live in `src/app/auth/guards.tsx` and are composed via a `memberElement(...)` helper; `components/ui` is unambiguously shadcn primitives; `components/member` and `components/public` are properly segregated. What drags the score down: the API layer is inconsistent (six `.js` policy files + ten `.ts` resource files in the same folder), pages bypass the API layer for auth-adjacent operations, and `AuthProvider` absorbs cross-cutting concerns the docs assume are split. Coherent at the surface, leaky underneath.

---

## Drift from documented design

- `docs/analysis/01` §6 says "no API client, no common hook." That's stale — `src/app/api/*.ts` now exists with ~5,400 LOC. Docs need updating.
- `docs/ddd/01` defines bounded contexts (Identity, Membership, OfficialTeam, Project, Vote, Audit, Notification). The folder structure does **not** mirror this — there is no `src/app/domain/identity/`, etc. Resources are flat under `src/app/api/`. The DDD doc is aspirational; the code is resource-flat.
- `docs/product/README.md` declares tag system as "single source of truth for permissions." Code partially implements it (`current_user_tag_permissions`, `member_tag_nav`), but `MemberLayout.tsx`'s `NavigationRoleLevel` ranking (`member|teamLead|vicePresident|president`) is a parallel role hierarchy hard-coded in the layout. This is a second source of truth competing with tags — undocumented and silently filtering nav sections.
- Routes guard `Quests` with `{ allowCourseMember: true }` — a third permission concept (course membership) not surfaced in `docs/ddd/01`.

---

## Hidden tech debt

- **Status-based fallback in `AuthProvider`** — when tag RPCs return empty, status permissions are added. This branch is intended to be transitional but is uncommented; nothing pins it to a removal date or feature flag. It will silently outlive the migration.
- **`MemberLayout`'s `NAVIGATION_ROLE_RANK`** — a parallel role model that bypasses the tag system. Adding a new role requires editing the layout file. Should be data-driven from `member_tag_nav` exclusively.
- **Direct event-bus coupling** — `NOTIFICATIONS_CHANGED_EVENT` is exported from `src/app/api/notifications.ts` and consumed in the layout. Cross-feature wiring via DOM events is invisible to the type checker.
- **No barrel files / index.ts** — every page imports `useAuth` via deep relative paths (`../../auth/useAuth`). Refactor cost is high.
- **No client-state library** — auth, notifications, and tag state are all hand-rolled `useState` + manual refetch. The unread-count poll in `MemberLayout` is independent of the toast subscriber. Two consumers of the same resource → two fetches. React Query / SWR would collapse this; absence is structural.
- **`src/app/api/security-events.ts` (20 LOC)** vs **`projects.ts` (749 LOC)** — sizes inconsistent; some "API" files are one-function shims, others are mini-applications. No convention on what belongs there.
- **`src/app/pages/member/{Admin,Attendance,Notice,Study}.tsx`** still on disk per `docs/analysis/01` §2 but unrouted — dead code accumulating.
- **`src/app/components/figma/ImageWithFallback.tsx`** — vendor-prefixed folder from the Figma Make origin still lives in production. Either rename or remove.

---

Total: ~690 words.
