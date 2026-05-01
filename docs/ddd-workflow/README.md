# KOBOT Web Domain Workflow

## 1. Purpose

This folder is the working specification ledger for KOBOT Web.

These files are primarily for AI agents and developers, so the working language is English. Korean-facing explanations should live in separate `*-ko.md` summary documents.

## 2. Document Map

| Order | Document | Purpose |
| --- | --- | --- |
| 0 | `00-user-decision-checklist.md` | User-owned decisions and unresolved questions |
| 1 | `01-project-inventory.md` | Repository inventory and layer map |
| 2 | `02-domain-discovery.md` | Bounded contexts, aggregates, entities, value objects |
| 3 | `03-event-storming.md` | Actors, commands, events, policies, read models |
| 4 | `04-data-schema-and-security.md` | Tables, RLS, RPC, constraints, audit, privacy |
| 5 | `05-functional-spec.md` | Feature requirements and acceptance criteria |
| 6 | `06-design-spec.md` | IA, screen states, UX copy rules |
| 7 | `07-implementation-plan.md` | Sequenced implementation plan |
| 8 | `08-task-checklist.md` | Small executable tasks |
| 9 | `09-agent-review-log.md` | Reviewer findings and why-review notes |
| 10 | `10-verification-and-release.md` | Build, migration, release evidence |
| 11 | `11-harness-engineering.md` | Windows, encoding, shell, deployment harness rules |
| 12 | `12-supabase-migration-plan.md` | Supabase migration strategy |
| 13 | `13-domain-risk-review-2026-05-01.md` | Working risk review for the current domain slice |
| 14 | `14-verification-question-ledger.md` | Active verification question queue and resolved archive |
| KO | `SUMMARY-ko.md` | Korean human-readable summary |

## 3. Working Rule

Before implementation, classify any field named `id`, `slug`, `code`, `email`, `login`, `nickname`, `role`, `status`, `visibility`, `permission`, `token`, `url`, `repository`, `phone`, or `studentId` as a domain value object until proven otherwise.

For each value object, answer:

- What is the normalization rule?
- What is the uniqueness scope?
- Who owns it?
- Who can change it?
- When does it become locked?
- Which database constraint, RLS policy, or RPC enforces it?
- What safe user-facing error appears when it fails?

## 4. DDD Loop Closure Rule

The workflow is not complete just because a document exists or a build passes.

Every non-trivial change must move through the loop:

1. Domain understanding
2. Ubiquitous language
3. Bounded contexts
4. Entities and value objects
5. Aggregates
6. Invariants
7. Event storming
8. Permission, state, and visibility review
9. Data schema, RLS, RPC, and audit design
10. UX and product flow
11. Implementation plan
12. Verification, questions, and loop decision

At Step 12, collect every unresolved question, including small questions. If any question remains unanswered, return to Step 1 using the newly discovered information. A resolved question can create new domain terms, state transitions, permissions, data rules, UX states, or implementation risks, so the loop must be rechecked from the beginning.

The loop can close only when:

- All questions are answered or explicitly approved by the user as assumptions.
- At least 3 independent reviewer perspectives have checked the artifacts.
- Reviewer disagreements are accepted, rejected, deferred, or marked as needs-rework.
- The closure decision explains why it is safe to proceed.
- Verification evidence is recorded in `10-verification-and-release.md`.

Minimum closure reviewer roles:

- Domain Reviewer
- Implementation Reviewer
- Risk Reviewer

## 5. Korean Summary Rule

Do not mix Korean summary prose into working specs unless the text is user-facing product copy.

Use `SUMMARY-ko.md` for user-readable status, decisions, and next actions.

## 6. Cumulative Versus Per-Run Artifacts

Some DDD artifacts should grow over time. Do not rebuild them from zero unless the project direction changes.

| Artifact Type | File | Update Rule |
| --- | --- | --- |
| Cumulative domain tree | `02-domain-discovery.md` | Add domains, terms, aggregates, value objects, and invariants as they are discovered. |
| Cumulative event map | `03-event-storming.md` | Add commands/events/policies/read models under the owning domain. |
| Cumulative data/security map | `04-data-schema-and-security.md` | Add tables, RLS/RPC rules, audit/privacy constraints, and known gaps. |
| Active verification queue | `14-verification-question-ledger.md` | Keep active questions until answered, approved as assumptions, or converted to tasks. |
| Per-run review evidence | `09-agent-review-log.md`, `10-verification-and-release.md` | Append review results and closure decisions for each significant DDD pass. |

When a new domain appears during design or implementation, add it to the tree first, then add its questions to the active queue.
