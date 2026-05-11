import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("project workspace can invite searchable members through a guarded RPC", () => {
  const migration = readFileSync(
    "supabase/migrations/20260512050000_project_member_invite_rpc.sql",
    "utf8",
  );
  const api = readFileSync("src/app/api/projects.ts", "utf8");
  const detail = readFileSync("src/app/pages/member/ProjectDetail.tsx", "utf8");

  assert.match(migration, /create or replace function public\.current_user_can_invite_project_member/);
  assert.match(migration, /current_user_is_project_team_lead\(target_project_team_id\)/);
  assert.match(migration, /current_user_has_project_delegated_scope\(target_project_team_id, 'invite_members'\)/);
  assert.match(migration, /create or replace function public\.invite_project_team_member/);
  assert.match(migration, /ma\.status = 'active'/);
  assert.match(migration, /v_github_login := public\.extract_github_login\(v_github_url\)/);
  assert.match(migration, /초대하려면 해당 멤버가 프로필에 GitHub URL을 등록해야 합니다\./);
  assert.match(migration, /insert into public\.member_github_identities/);
  assert.match(migration, /insert into public\.project_team_memberships/);
  assert.match(migration, /'project\.member\.invite'/);
  assert.match(migration, /'project\.member_invited'/);
  assert.match(migration, /grant execute on function public\.invite_project_team_member\(uuid, uuid\) to authenticated/);

  assert.match(api, /export type ProjectInviteCandidate/);
  assert.match(api, /export async function listProjectInviteCandidates/);
  assert.match(api, /\.select\(`\$\{PROFILE_SELECT\}, github_url`\)/);
  assert.match(api, /hasGithubIdentity: Boolean\(githubLogin && connectionStatus === "linked"\)/);
  assert.match(api, /export async function inviteProjectMember/);
  assert.match(api, /\.rpc\("invite_project_team_member"/);
  assert.match(api, /export async function inviteProjectMember[\s\S]*triggerGithubSyncInBackground\(10\)/);

  assert.match(detail, /function ProjectMemberInviteDialog/);
  assert.match(detail, /listProjectInviteCandidates/);
  assert.match(detail, /inviteProjectMember/);
  assert.match(detail, /placeholder="이름, ID, GitHub 검색"/);
  assert.match(detail, />\s*초대하기\s*</);
  assert.match(detail, /candidate\.isProjectMember \|\|[\s\S]*!candidate\.hasGithubIdentity/);
});
