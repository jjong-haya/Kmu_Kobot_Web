# Member Directory System Tags - DDD Note

Date: 2026-05-05

## Domain Understanding

The member directory exposes a read model of club identity. Tags in this view have two different meanings:

- Profile tags: user-maintained interests or skills stored on `profiles.tech_tags`.
- System tags: tags derived from membership state, invitation source, or authority assignment.

Mixing these without a rule causes missing identity tags such as `KOBOT`, `KOSS`, or `회장`.

## Ubiquitous Language

| Korean | Code term | Meaning |
| --- | --- | --- |
| 시스템 태그 | `systemTags` | Derived tag that users do not manually maintain in the profile editor. |
| 프로필 태그 | `profileTags` | Tags stored in `profiles.tech_tags`. |
| 부여 태그 | `course_invite_codes.default_tags` | Tags applied when an invite link is redeemed. |
| 회장 표시 | `isPresident` | Directory badge/crown derived from an active president org position. |

## Rules

1. `active` member accounts receive the `KOBOT` system tag.
2. `course_member` accounts receive the `KOSS` system tag.
3. An active `president` org position receives the `회장` system tag and crown avatar mark.
4. Profile tags remain visible after system tags.
5. Course invite links can define `default_tags`; redeeming a link merges those tags into `profiles.tech_tags`.

The current `hu0315` account is assigned to the `president` org position as data, not treated as a special case in UI logic.

## Data And Security

- Read model: `src/app/api/member-directory.ts`.
- Invite issuing: `course_invite_codes.default_tags`.
- Invite redemption: `redeem_course_invite` merges default tags by DB RPC.
- RLS note: the member directory still requires the member-directory RLS migration to be applied remotely.

## Review Log

| Reviewer | Scope | Result |
| --- | --- | --- |
| Domain Reviewer | Tag meaning and invitation source | Approved: split system tags from profile tags. |
| Implementation Reviewer | Frontend/API shape | Approved: derived fields avoid manual UI-only tagging. |
| Risk Reviewer | Data integrity and future invite links | Approved with deployment note: DB migration must be applied with Postgres password. |

## Verification

- `npm run build` passed.
- Browser checked `/member/members`: active test member shows `KOBOT`.

## Unresolved Operational Item

Remote Supabase migration push is blocked until `SUPABASE_DB_PASSWORD` or a SQL Editor session is available.
