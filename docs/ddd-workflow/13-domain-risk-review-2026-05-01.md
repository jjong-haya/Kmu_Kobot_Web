# 13. Domain Risk Review - 2026-05-01

## 1. Purpose

This is an internal working document for the current domain slice. It is not a user-facing summary.

The goal is to prevent implementation work from treating domain identifiers, roles, statuses, and visibility settings as simple UI fields.

## 2. Current Trigger

The login ID flow exposed a process gap:

`login_id` was initially handled as input formatting and submit validation, but its actual domain role is stronger. It is a globally unique alternate account identifier.

## 3. Corrected Invariant

| Invariant | Rule |
| --- | --- |
| Format | `^[a-z0-9]{4,20}$` |
| Normalization | Lowercase and trim |
| Uniqueness | Global uniqueness across `profiles.login_id` |
| Mutability | Users cannot directly change an already-claimed ID |
| Availability API | Authenticated-only boolean RPC |
| Final race guard | Database unique index |
| Login failure copy | Do not reveal whether a login ID exists to anonymous users |

## 4. Implemented Slice

| Layer | Change |
| --- | --- |
| DB | Added `is_login_id_available(login_id_input text)` |
| DB | Kept `profiles_login_id_unique_idx` as final guard |
| Auth | Added `checkLoginIdAvailability` |
| Auth | Re-checks ID before profile save |
| UI | Checks availability on blur and submit |
| UI | Shows field-level error and focuses the login ID input |

## 5. Bounded Context Risk Map

### 5.1 Account / Onboarding

| Value | Risk | Control |
| --- | --- | --- |
| `email` | Non-school or unauthorized account access | Supabase auth and onboarding policy |
| `login_id` | Duplicate alternate identifier | RPC plus unique index |
| `nickname` | Duplicate visible identity | Active-member nickname invariant |
| `student_id` | Personal-data exposure | Internal-only display rules needed |
| `phone` | Personal-data exposure | Internal-only display rules needed |

### 5.2 Member Registry

| Value | Risk | Control |
| --- | --- | --- |
| `member_status` | Invalid transition | Command RPC needed |
| `public_credit_name_mode` | Public identity mismatch | Profile-level setting and withdrawal confirmation |
| `nickname_history` | Privacy and attribution conflict | President/vice-president visibility rules |

### 5.3 Capability / Permission

| Value | Risk | Control |
| --- | --- | --- |
| `permission` | Too broad | Scoped capability model needed |
| `role_transfer` | Unauthorized leadership change | Request/accept/audit workflow |
| `delegation` | Expired authority remains active | Expiration-aware capability checks |

### 5.4 Project / GitHub

| Value | Risk | Control |
| --- | --- | --- |
| `project_visibility` | Private project leakage | Read model and policy split |
| `github_repository` | Private README leakage | Snapshot with KOBOT-side authorization |
| `recruitment_code` | Unbounded auto-join | Expiring invitation code with audit |

### 5.5 Contact / Vote / Audit

| Value | Risk | Control |
| --- | --- | --- |
| `contact_request` | Spam or harassment | RPC rate limiting and reporting |
| `vote_ballot` | Misleading anonymity | Explicit anonymity level and snapshot design |
| `audit_payload` | Personal-data over-retention | Redaction and command-only insert |

## 6. Next P0 Work

| Priority | Work |
| --- | --- |
| P0 | Implement scoped capability checks |
| P0 | Restrict direct audit-log writes |
| P0 | Implement invitation redemption RPC |
| P0 | Define vote anonymity guarantees |

## 7. Rule For Future Work

If a field affects identity, permission, state transition, visibility, invite access, voting, contact exchange, or external integration, do not implement it as a UI-only validation.

First define the domain invariant and persistence-level enforcement.

## 8. Loop Restart Rule

This risk review is not a one-time checklist. It is input to the DDD loop.

When a question is answered, treat the answer as new domain input and re-run the checks from Step 1:

- Did the answer create or change a term?
- Did it change a bounded context?
- Did it create a new entity, value object, aggregate, command, event, or policy?
- Did it change permission, state, visibility, retention, audit, or notification rules?
- Did it require a database constraint, RLS policy, trigger, or RPC?
- Did it create a new UX state, validation error, loading state, or restricted state?
- Did the implementation create a new edge case?

If any answer is yes, update the relevant DDD artifact before implementation continues.
