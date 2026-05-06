# GitHub Project Integration

Last updated: 2026-05-06

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

## Write Flow

Project approval:

1. `project_teams.status` changes from `pending` to `active` or `recruiting`.
2. `project_teams_github_status_sync` enqueues `project_repo_provision`.
3. `github-sync` Edge Function creates or loads the private repo.
4. It creates or loads `{repo}-leads` and `{repo}-members`.
5. It grants `maintain` to leads and `push` to members.
6. It invites active project members who have linked GitHub identities.

Project join approval:

1. `project_team_memberships.status` becomes `active`.
2. `project_team_memberships_github_sync` enqueues `project_member_invite`.
3. If the user has no valid GitHub URL, the job is `blocked`.
4. When the user later adds a GitHub URL, `profiles_sync_github_identity` unblocks the job.

Project completion:

1. `project_teams.status` becomes `archived`.
2. `project_repo_freeze` is enqueued.
3. The Edge Function keeps the repo and changes both project teams to `pull`.

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

- Project join page warns when the current user has no GitHub URL.
- The user can still apply; approval is not blocked.
- Approved users without GitHub identity remain in KOBOT but their GitHub invite
  job stays blocked until they add a GitHub URL.
- Project detail/admin screens show GitHub linked, pending, or read-only state.
