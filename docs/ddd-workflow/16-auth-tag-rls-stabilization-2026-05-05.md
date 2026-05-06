# Auth, Tag, and RLS Stabilization - DDD Loop Artifact

Date: 2026-05-05
Batch: First stabilization batch only
Ownership: Domain continuity note for AI/developer handoff

## Scope

This artifact covers the first stabilization batch across five bounded contexts:

- Identity/Authorization
- Tag Authority
- Announcements
- Quests
- Member Administration

It does not describe the whole application. Its purpose is to preserve domain decisions before code/SQL work continues.

## Bounded Contexts

| Context | Responsibility | Out of scope for this batch |
| --- | --- | --- |
| Identity/Authorization | Resolve current member identity, admin state, and authoritative permissions. | Full authentication redesign. |
| Tag Authority | Decide which member tags exist, who can grant/use them, and whether tags imply navigation or privileges. | General profile tag UX. |
| Announcements | Publish and read notices under explicit authority rules. | Full notice editor redesign. |
| Quests | Submit, review, complete, and reward quest activity. | Quest content taxonomy overhaul. |
| Member Administration | Change member status and preserve auditability of authority-impacting account changes. | Full member directory redesign. |

## Ubiquitous Language

| Term | Korean mapping | Domain meaning |
| --- | --- | --- |
| Member status | 회원 상태 | Account lifecycle and active-operation eligibility. It is not the source of club category, graduation, sidebar, or permission identity. |
| Tag | 태그 | A member-visible or authority-relevant label. Tags may be profile-only or system/permission-bearing. |
| Tag permission | 태그 권한 | Permission derived from or associated with a tag; must be confirmed by authoritative DB/RPC rules. |
| Tag nav | 태그 내비게이션 | UI navigation entry shown because a member has a relevant tag or permission. |
| Notice | 공지 | Announcement content that may require publish authority and controlled read scope. |
| Quest completion | 퀘스트 완료 | Durable record that a member completed a quest after valid submission/review flow. |
| Reward tag | 보상 태그 | Tag granted as a quest/review reward; source of truth must be DB/RPC. |
| Admin status change | 관리자 상태 변경 | Administrative mutation of member status or authority-impacting account state. |

## Aggregates And Invariants

### AuthorizationContext

- Represents the authoritative permission and lifecycle eligibility view for the current member.
- DB/RLS/RPC decisions are the source of truth for permissions, active eligibility, and reward eligibility.
- `member_accounts.status` is an eligibility gate (`active` can operate); tags carry category/visibility/permission meaning.
- UI fallback may improve resilience, but it must not grant authority after an authoritative RPC failure.
- Any local cached permission state is advisory until confirmed by the authoritative layer.

### MemberTag

- Represents a tag assignment to a member, including reward tags and permission-bearing tags.
- A tag that affects authority must be grantable only through approved DB/RPC paths.
- Tag navigation must be derived from confirmed tag/permission state, not from optimistic UI assumptions.
- Legacy tag sources must not silently bypass explicit permission rules.

### Notice

- Represents publishable announcement content.
- Publishing requires authoritative permission confirmation.
- Public/read scope must be explicit and enforced by RLS or RPC, not by UI filtering alone.
- Failed permission checks must leave the notice unpublished.

### QuestCompletion

- Represents completion of a quest by a member.
- Completion and reward tag grant must be durable and consistent.
- Review decisions must not create rewards unless the DB/RPC path confirms eligibility.
- Duplicate or conflicting completions should be rejected or idempotently resolved by the authoritative layer.

### MemberAccount

- Represents member identity, status, and admin-affecting account state.
- Admin status changes must be authorized before mutation.
- Status changes must not rely on UI-only checks.
- Changes that affect permissions must be observable enough for later review/audit.

## Event Storming Summary

| Flow | Commands | Domain events | Failures to preserve |
| --- | --- | --- | --- |
| Tag permission load | Load current member permissions; load member tags; resolve tag nav eligibility. | AuthorizationContextResolved; MemberTagPermissionsLoaded; TagNavVisibilityResolved. | RPC permission failure; stale local fallback; tag exists but permission is not confirmed. |
| Notice publish | Request notice publish; validate publish permission; persist notice. | NoticePublishRequested; NoticePublished. | Missing publish permission; RPC/RLS denial; UI fallback attempts to publish without authority. |
| Quest submit/review | Submit quest; review submission; approve/reject completion; grant reward tag when approved. | QuestSubmitted; QuestReviewed; QuestCompleted; RewardTagGranted. | Duplicate submission; reviewer lacks authority; reward tag grant fails after review; completion written without reward consistency. |
| Admin status change | Request member status change; authorize admin mutation; persist account status. | AdminStatusChangeRequested; MemberStatusChanged. | Actor lacks admin authority; target status violates policy; RPC/RLS denial; local state shows success after failed mutation. |

## Permission, RLS, And RPC Decisions

1. DB/RLS/RPC are the source of truth for permissions, active eligibility, reward tags, and authority-bearing tag state.
2. UI fallback must not grant authority after an authoritative RPC failure.
3. Fallback UI may hide controls, show degraded state, or retry loading, but it must not enable privileged mutations.
4. Permission-bearing tags and reward tags must be confirmed through authoritative reads/writes before the UI treats them as effective.
5. Member status changes and notice/quest mutations must fail closed when permission state cannot be confirmed.
6. Graduation is a tag, not a lifecycle status. Vote eligibility must be decided per vote from included/excluded tags plus explicit member overrides.

## Reviewer Checklist Placeholders

| Reviewer | Checklist placeholder | Status |
| --- | --- | --- |
| Domain Reviewer | Confirm aggregate names, ubiquitous language, and unresolved policy questions after code work. | Pass 1 found blockers; final focused pass approved after rework. |
| Implementation Reviewer | Confirm UI/API/RPC behavior matches the fail-closed permission decisions. | Pass 1 found blockers; final focused pass approved after rework. |
| Risk Reviewer | Confirm RLS/RPC denial paths, legacy data interactions, and reward/status mutation risks. | Pass 1 found blockers; final focused pass approved after rework. |

## Unresolved Questions

1. Explicit grant policy: which actors or roles can grant permission-bearing tags and reward tags?
2. Voting bounded context: implement per-vote included/excluded tag rules and explicit member overrides. Example: exclude the graduation tag by default for a vote, but allow a graduated member who still participates to be added back.

## Verification Evidence Placeholders

| Evidence | Expected proof | Result |
| --- | --- | --- |
| Permission RPC failure | UI does not grant authority or enable privileged mutation after failure. | Implemented: `AuthProvider` denies permissions while tag authority is loading, failed, or stale. |
| Tag nav resolution | Tag nav appears only from confirmed authority/tag state. | Implemented: tag permission/nav RPCs require active eligibility and validated permission codes. |
| Notice publish denial | Unauthorized publish attempt is blocked by DB/RLS/RPC and reflected in UI. | Implemented: create/update use transactional RPCs, public landing reads use `public_notices`, and tag-scoped reads go through RLS. |
| Quest reward consistency | Approved completion and reward tag grant are consistent or fail safely. | Implemented: quest visibility/completion path requires active eligibility unless the caller has manager authority. |
| Admin status mutation | Unauthorized status change is denied and no local success state remains. | Implemented: API/UI status surface matches latest lifecycle status domain. |

## DDD Loop Review Log

| Pass | Reviewer | Scope | Summary | Status |
| --- | --- | --- | --- | --- |
| 1 | Domain Reviewer | Domain model, read models, context boundaries | Direction matched source-of-truth principle, but tag read RPC ignored account status and notice visibility remained unresolved. | Needs rework |
| 1 | Implementation Reviewer | Frontend state, type surface, migration order | Fresh notices chain looked fixed, but `AdminMemberStatus` and `MemberAdmin` UI drifted; tag failure state could race after logout/account switch. | Needs rework |
| 1 | Risk Reviewer | RLS/RPC and privilege escalation | Direct quest completion insert could bypass quest audience checks; raw tag permission text needed validation; anonymous notice table access was too broad. | Needs rework |
| 2 | Focused Final Reviewer | Previous blocking issues only | Auth refresh is sequence/user guarded, anonymous notices use a definer read model, quest insert is audience-gated, tag permissions are validated through `permissions`, tag/nav RPCs are active-only. | Approved |
| 3 | Ouroboros closure reviewers | DB/RLS, frontend/API, domain docs | Found remaining fail-open gaps: tag loading exposed bootstrap permissions, notice audience update was not atomic, public notice comments were too broad, quest visibility did not require active eligibility, and SECURITY DEFINER grants were too broad. | Reworked |

## Disagreement Register

| Disagreement | Evidence | Impact | Decision | Classification |
| --- | --- | --- | --- | --- |
| Should `published` notices be fully public? | Landing page already reads published notices anonymously, but the DDD artifact had public/member-only scope unresolved. | Anonymous table access could expose future columns. | Use a whitelisted `public_notices` read model for anonymous reads; keep full notice table for authenticated/manage flows. | accepted |
| Should tag permissions become server permissions in this batch? | Existing product direction says tags own permissions; previous RLS did not include them. | Without integration, UI and DB authority stay split. | Include tag permissions in `current_user_has_permission`, but only after joining valid `permissions.code` and active account status. | accepted |
| Should direct quest completion insert remain open? | RPC has audience checks; previous RLS direct insert did not. | Hidden/ineligible quest submissions could be created. | Keep direct insert only if it is normalized to `submitted` and passes `current_user_can_see_quest`. | accepted |
| Should graduation remove all authority? | User clarified graduation should not automatically remove every permission; it is mostly voting eligibility context. | Status-based graduation would erase valid ongoing activity. | Model graduation as a tag. Voting decides exclusions per vote and can add explicit member exceptions. | accepted |

## Rework Decisions Applied

1. Tag permission and tag nav RPCs require `member_accounts.status = 'active'`.
2. Tag permission strings are accepted only when they join to `public.permissions.code`.
3. Client permissions fail closed when tag authority fails; no status-based hardcoded preload fallback remains.
4. `AuthProvider.refreshTags()` uses a request sequence/current-user guard so stale in-flight RPC results cannot repopulate permissions after logout/account switch.
5. Anonymous notice reads use `public.public_notices` instead of direct table select.
6. Quest completion direct insert requires `current_user_can_see_quest(quest_id)` and cannot set review metadata.
7. Member admin status UI now matches the current RPC value domain.
8. Notice create/update writes audience and notice content in one SECURITY DEFINER RPC transaction.
9. `current_user_can_see_quest` now requires active eligibility for normal quest visibility/submission; manager paths remain permission-gated.
10. New and replaced SECURITY DEFINER helper functions explicitly revoke `PUBLIC`/`anon` execution and grant only intended roles.

## User Decisions Added After First Closure

1. Notice visibility is tag-configurable. Public is one explicit scope; otherwise visibility is driven by selected member tags.
2. Quest reward tags are admin-created tags. The quest system should not add a separate hidden ban on reward tags carrying permissions; the authority belongs to the tag creation/configuration flow. Server permission evaluation still validates tag permission strings against `public.permissions.code`.
3. Status is lifecycle/eligibility only. Category, graduation, sidebar, notice scope, and permission meaning live on tags.
4. Future voting should store vote-level tag inclusion/exclusion rules plus member-level override rows.
