# 06. UX And Design Specification Ledger

## 1. Purpose

This file is the cumulative DDD Step 10 UX ledger.

Screens must express domain state in user language. Do not expose developer terms such as raw Supabase errors, `mock`, `DB 연결 전`, schema cache, PKCE internals, or table names.

## 2. Information Architecture

### 2.1 Public Surface

| Route | Domain | User Goal | UX Rule |
| --- | --- | --- | --- |
| `/` | Public Showcase | Understand KOBOT and navigate to projects/recruit/login. | No internal workspace data. No stale recruitment deadline. |
| `/projects` | Public Project Catalog | Browse approved public projects. | Show only approved + public-safe intro. |
| `/notice` | Public Notice | Read public announcements. | Separate from internal announcements unless visibility is explicit. |
| `/recruit` | Public Recruiting | Understand how to join. | Do not pretend public form is authenticated join request unless implemented. |
| `/contact` | Public Inquiry | Send general inquiry. | Separate from member-to-member contact request. |
| `/activities` | Public Activity Gallery | Browse activity records. | Avoid private member/project details. |
| `/faq` | Public Help | Read common questions. | Keep terms aligned with join/member workflow. |
| `/privacy`, `/terms` | Legal / Privacy | Understand rules and data use. | Must match actual collected fields. |
| `/login` | Identity And Access | Log in with Google or existing ID. | Minimal, user-facing, no path/debug details. |
| `/auth/callback` | Identity And Access | Wait while account is verified. | Show step progress and safe retry actions. |

### 2.2 Member Access Surface

| Route | Domain | User Goal | UX Rule |
| --- | --- | --- | --- |
| `/member/join` | Join Request | Submit required join information. | Field-level validation, scroll/focus to errors, no top-level generic alerts for field errors. |
| `/member/pending` | Approval Pending / Restricted | Understand status and available actions. | CTA whitelist: refresh, home, logout, inquiry. No ID creation/profile edit CTA here. |
| `/member/profile` | Profile Identity | Edit active-member profile. | Active-only unless explicitly allowed. |

### 2.3 Member Workspace Surface

| Navigation Section | Routes | Domain |
| --- | --- | --- |
| My Activity | `/member`, `/member/notifications`, `/member/contact-requests` | Dashboard, Notification, Contact |
| Communication | `/member/announcements`, `/member/qna` | Internal Comms, Q&A |
| Learning | `/member/study-log`, `/member/study-playlist`, `/member/peer-review` | Learning And Knowledge |
| Projects | `/member/projects`, `/member/showcase` | Project Workspace, Public Showcase Management |
| Events And People | `/member/events`, `/member/office-hours`, `/member/members` | Events, Office Hours, Member Directory |
| Resources | `/member/resources`, `/member/templates`, `/member/equipment` | Resources And Equipment |
| Operations | `/member/roadmap`, `/member/retro`, `/member/changelog`, `/member/votes` | Operations, Retrospective, Voting |
| Global Operations | `/member/forms`, `/member/integrations`, `/member/permissions` | Forms, Integrations, Capability |

## 3. Screen State Requirements

Every non-static screen should define:

- Loading state
- Empty state
- Restricted state
- Pending state if domain lifecycle supports it
- Error state with user-safe copy
- Success state
- Mobile behavior

## 4. Critical UX Rules

### 4.1 Login And Callback

Allowed copy:

- `국민대학교 계정인지 확인하는 중`
- `KOBOT 멤버 상태를 확인하는 중`
- `워크스페이스로 이동 준비 중`
- `로그인 정보를 다시 확인해 주세요`

Forbidden copy:

- `PKCE code verifier not found`
- `schema cache`
- `public.get_my_authorization_context`
- Raw URL/path debugging such as `/member로 이동합니다`

### 4.2 Join Form

Rules:

- Remove explanatory cards that repeat the page title.
- Use field-level feedback.
- Invalid nickname/login ID should shake the field and show a short reason below it.
- Submit button should scroll to the first invalid field.
- Email should not be re-entered if Google already supplied it.
- Public credit display setting is not part of initial join unless explicitly required by product policy.

### 4.3 Pending / Restricted

Rules:

- Pending page explains status, not the whole product.
- No ID creation CTA.
- No project creation CTA.
- No confusing workspace menu.
- Non-school/restricted account pages should explain the account restriction and recovery path.

### 4.4 Dashboard

The dashboard should become an action hub, not a static card wall.

Phase 1 dashboard sections:

| Section | Source Domain | Rule |
| --- | --- | --- |
| Today / Needs Action | Notification, Vote, Contact, Project | Role-dependent items only. |
| My Projects | Project Workspace | Only projects the user belongs to or can review. |
| Active Votes | Voting | Show eligibility and closing time. |
| Contact Requests | Contact | Show pending received/sent items. |
| Recent Announcements | Communication | Internal announcements only. |

Active questions:

- `Q-DASH-001`
- `Q-DASH-002`

### 4.5 Project Screens

Rules:

- Public project list shows only approved and public-safe items.
- Recruitment share page shows intro/README/needed roles/skills, not internal material.
- Project lead screen should not look like global admin.
- Private project badges must explain who can see what.
- Developer-state text must be removed before release.

### 4.6 Permissions Screen

Rules:

- Do not use `Admin`, `Leadership`, `Member`, `Guest` as the core model.
- Use `President`, `Vice President`, `Official Team Lead`, `Project Lead`, `Project Operator`, `Temporary Delegate`, `Active Member`.
- Explain `Role`, `Capability`, `Scope`, `Source`, and `Expiry`.

Active question:

- `Q-UX-002`

## 5. Copy Risk Register

| Risky Copy | Risk | Replacement Direction |
| --- | --- | --- |
| `팀장 이상` | Mixes official team lead and project lead. | `운영진`, `공식 팀장`, or `이 프로젝트 관리자` depending on scope. |
| `승인` | Ambiguous approval target. | `가입 승인`, `프로젝트 생성 승인`, `참여 승인`, `권한 이전 승인`. |
| `대기` | Ambiguous status. | `가입 승인 대기`, `연락 응답 대기`, `프로젝트 검토 대기`. |
| `관리자` | Too broad. | `회장`, `부회장`, `공식 팀장`, `프로젝트 팀장`. |
| `mock`, `DB 연결 전` | Developer state exposed. | `준비 중`, `아직 표시할 항목이 없습니다`, or hide in production. |
| `익명 투표` | Can mislead if database remains linkable. | `결과 화면에서는 익명`, or explicit stronger guarantee. |
| `프로젝트 자료` | Could mean intro or internal materials. | `프로젝트 소개서`, `README`, `프로젝트 내부 자료`. |

## 6. Mobile Requirements

- Login/join pages use single-column flow.
- Member sidebar becomes a mobile sheet.
- Primary action stays visible after long forms where possible.
- Field errors must remain close to the field.
- Motion must respect `prefers-reduced-motion`.

## 7. Accessibility Requirements

- Error states must be text, not only color/shake.
- Focus must move to the first invalid field on submit.
- Icon-only buttons need accessible labels.
- Status badges need readable text labels.
- Contact/vote/privacy decisions must be readable before action confirmation.

## 8. UX Questions

Open UX questions are tracked in `14-verification-question-ledger.md`:

- `Q-DASH-001`
- `Q-DASH-002`
- `Q-PUBLIC-001`
- `Q-PUBLIC-002`
- `Q-UX-001`
- `Q-UX-002`
