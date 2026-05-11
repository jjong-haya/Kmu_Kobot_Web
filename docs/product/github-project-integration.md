# GitHub Project Integration

Last updated: 2026-05-12

## Goal

Approved KOBOT projects get one private repository under the `Kookmin-Kobot`
GitHub organization. The GitHub organization owns every repository. A project
lead only receives permissions for their own project repository.

## Free Plan Constraints

The organization is on GitHub Free. The app does not rely on private repository
branch protection, required reviewers, code owners, or repository rules.

Free-plan operating model:

- Project lead and maintainer team: repository permission `maintain`
- Project member team: repository permission `push`
- Main-branch PR workflow: operating rule, not GitHub-enforced while the repo is private on Free
- Completed project: repository remains, both project teams are downgraded to `pull`

## Data Ownership

GitHub integration data is not stored inside `project_teams.metadata`.

Tables:

- `member_github_identities`: derived GitHub identity from `profiles.github_url`
- `project_github_links`: repository link and sync status per project
- `project_github_teams`: GitHub team IDs/slugs per project
- `github_sync_jobs`: outbox jobs created by project lifecycle triggers
- `github_sync_events`: provider sync history and warnings

## Required Information Map

GitHub invitation does not use a member's public email, LinkedIn URL, login ID,
or personal GitHub token. The invitation path uses the member's GitHub profile
URL, derives the GitHub login, and then uses the KOBOT GitHub App installation
to add that login to the project repository team.

Member-provided profile fields:

| Field | Stored in | Used for GitHub invite? | Used for |
| --- | --- | --- | --- |
| Login email | `profiles.email` | No | Supabase Auth account, Google login, ID login resolution target |
| Public email | `profiles.public_email` | No | Member directory contact display/reveal only |
| GitHub URL | `profiles.github_url` | Yes | Source for deriving `github_login`; triggers GitHub identity sync |
| LinkedIn URL | `profiles.linkedin_url` | No | Member directory outbound link only |
| Login ID | `profiles.login_id` | No | App ID/password login; maps ID to `profiles.email` via `resolve_login_email` |

Derived GitHub identity fields:

| Field | Stored in | Source | Used for |
| --- | --- | --- | --- |
| GitHub login | `member_github_identities.github_login` | `profiles.github_url` through `extract_github_login()` | Team membership invite/add/remove target |
| GitHub user id | `member_github_identities.github_user_id` | GitHub API lookup in `github-sync` | Identity validation and delete cleanup snapshot |
| Connection status | `member_github_identities.connection_status` | Profile trigger and GitHub API validation | Blocks or allows invite jobs |
| Source | `member_github_identities.source` | Current implementation uses `profile_url` | Audit/diagnostic context |

Operational GitHub App inputs:

| Secret / setting | Stored in | Used for |
| --- | --- | --- |
| `GITHUB_ORG` | Supabase Edge Function secret | Target GitHub organization, currently `Kookmin-Kobot` |
| `GITHUB_APP_ID` | Supabase Edge Function secret | Build GitHub App JWT |
| `GITHUB_PRIVATE_KEY` | Supabase Edge Function secret | Sign GitHub App JWT |
| `GITHUB_INSTALLATION_ID` | Supabase Edge Function secret | Exchange JWT for installation token |
| `GITHUB_SYNC_SECRET` | Supabase Edge Function secret | Optional header auth for invoking `github-sync` without user bearer token |
| `SUPABASE_URL` | Supabase Edge Function secret | Service client endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secret | Service client for job processing and RLS-independent writes |

Current remote project check, 2026-05-12:

- `github-sync` Edge Function exists and is active.
- Required GitHub secrets exist by name: `GITHUB_ORG`, `GITHUB_APP_ID`,
  `GITHUB_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID`, `GITHUB_SYNC_SECRET`.
- Supabase service secrets exist by name: `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`.

## GitHub Invite Readiness

A member is ready for a GitHub project invite when all of these are true:

1. `profiles.github_url` is set to a valid GitHub profile URL.
2. The URL is accepted by the profile constraint: `https://`, no whitespace,
   max 200 characters.
3. `extract_github_login()` can parse it as `https://github.com/{login}`.
4. The derived login is not a reserved GitHub path and matches GitHub username
   shape.
5. `member_github_identities.connection_status = 'linked'`.
6. The member has an active project membership in `project_team_memberships`.
7. The project is `active` or `recruiting`.
8. `github-sync` can obtain a GitHub App installation token and call GitHub
   organization/team APIs.

If the member is approved without a valid GitHub URL, KOBOT membership is not
blocked. The GitHub invite job is stored as `blocked` with
`missing_github_identity`. When the user later adds a valid GitHub URL,
`profiles_sync_github_identity` refreshes the identity and unblocks the pending
invite job.

## End-To-End Flow

Member profile setup:

1. User edits GitHub URL in the profile page or member directory profile editor.
2. The client updates `profiles.github_url`.
3. `profiles_sync_github_identity` runs after insert/update of `github_url`.
4. `refresh_member_github_identity()` parses the URL into `github_login`.
5. A row is inserted or updated in `member_github_identities`.
6. Any blocked `project_member_invite` jobs for the user are moved back to
   `pending`.

Project approval:

1. `project_teams.status` changes from `pending` to `active` or `recruiting`.
2. `project_teams_github_status_sync` enqueues `project_repo_provision`.
3. `github-sync` creates or loads the private repository.
4. It creates or loads `{repo}-leads` and `{repo}-members`.
5. It grants `maintain` to leads and `push` to members.
6. It scans active project memberships and invites/syncs members with linked
   GitHub identities.

Project join approval:

1. `project_team_memberships.status` becomes `active`.
2. `project_team_memberships_github_sync` enqueues `project_member_invite`.
3. `enqueue_github_sync_job()` calls `refresh_member_github_identity()`.
4. If identity is linked, the job stays `pending`.
5. If identity is missing or invalid, the job becomes `blocked`.
6. `github-sync` processes pending jobs and adds the GitHub login to the target
   team.

Team mapping:

| KOBOT project role | GitHub team | Repository permission |
| --- | --- | --- |
| `lead` | `{repo}-leads` | `maintain` |
| `maintainer` | `{repo}-leads` | `maintain` |
| `member` | `{repo}-members` | `push` |
| `delegate` | `{repo}-members` | `push` |

On project completion, `project_repo_freeze` keeps the repository but changes
both teams to read-only `pull`.

## Implementation Touchpoints

Client/UI:

- Account profile contact editor: `src/app/pages/member/Profile.tsx`
- Account profile contact API: `src/app/api/profile-contact.ts`
- Member profile editor for GitHub URL: `src/app/pages/member/Members.tsx`
- Directory profile update API: `src/app/api/member-directory.ts`
- Project GitHub readiness/read model: `src/app/api/projects.ts`
- Fire-and-forget Edge Function trigger: `src/app/api/github-sync.ts`
- Project creation gate: `src/app/pages/member/Projects.tsx`
- Project detail join gate: `src/app/pages/member/ProjectDetail.tsx`

Database/migrations:

- Profile contact fields and constraints:
  `supabase/migrations/20260505093000_member_directory_profile.sql`
- GitHub identity, repo/team links, sync jobs/events, and triggers:
  `supabase/migrations/20260507006000_github_project_sync.sql`
- Delete cleanup snapshot for removed members:
  `supabase/migrations/20260507008000_github_sync_member_delete_snapshot.sql`

Edge Function:

- `supabase/functions/github-sync/index.ts`
- Reads pending `github_sync_jobs`.
- Uses service role to load KOBOT rows.
- Uses GitHub App installation token to create/load repos, create/load teams,
  grant permissions, and add/remove team members.

## Required Supabase Secrets

Already set:

- `GITHUB_ORG=Kookmin-Kobot`
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY`
- `GITHUB_INSTALLATION_ID`
- `GITHUB_SYNC_SECRET`

The GitHub App must be installed on `Kookmin-Kobot` and needs permissions for
organization members/teams and repository administration.

## Required GitHub App Permissions

Repository permissions:

- Administration: Read and write
- Contents: Read and write
- Metadata: Read-only
- Issues: Read-only
- Pull requests: Read-only

Organization permissions:

- Members: Read and write

The repository permission creates or loads each private project repo. The
organization Members permission is required for team creation and team
membership changes. If it is missing or the app installation has not been
updated after changing permissions, `github-sync` fails with:

`GitHub API failed with 403: Resource not accessible by integration`

The failure usually appears at GitHub's `Create a team` endpoint.

After changing GitHub App permissions, update/reapprove the app installation
for `Kookmin-Kobot`, then rerun the `github-sync` Edge Function.

## Sync Status Rules

`project_github_links.sync_status` must only be `synced` after repo, project
teams, repository permissions, and member invitation sync have completed.

If only the repo was created but team permission sync failed, the link stays
`failed` with `last_error`. This prevents the UI from showing a partially
provisioned repository as fully connected.

## UI Behavior

- Project creation checks the current user's GitHub readiness before opening the
  creation modal. If missing, the user is sent to
  `/member/profile?focus=github`.
- Project join request checks the current user's GitHub readiness before
  submitting. If missing, the request is not created and the user is sent to the
  same profile GitHub field.
- The profile page highlights and focuses the GitHub URL field when
  `focus=github` is present. Saving a valid URL updates `profiles.github_url`
  and triggers a background GitHub sync.
- Existing approved users without GitHub identity remain in KOBOT but their
  GitHub invite job stays blocked until they add a GitHub URL.
- Project detail/admin screens show GitHub linked, pending, or read-only state.
