import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("project join requests require a GitHub profile URL before any request row is created", () => {
  const migration = readFileSync(
    "supabase/migrations/20260512030000_require_github_identity_for_project_join.sql",
    "utf8",
  );
  const api = readFileSync("src/app/api/projects.ts", "utf8");
  const detail = readFileSync("src/app/pages/member/ProjectDetail.tsx", "utf8");

  assert.match(migration, /create or replace function public\.request_project_join/);
  assert.match(migration, /v_has_github_identity := public\.refresh_member_github_identity\(v_actor\)/);
  assert.match(migration, /프로젝트 참여 신청 전에 프로필에 GitHub URL을 등록해야 합니다\./);
  assert.match(migration, /insert into public\.project_team_join_requests/s);
  assert.ok(
    migration.indexOf("v_has_github_identity := public.refresh_member_github_identity(v_actor)") <
      migration.indexOf("insert into public.project_team_join_requests"),
    "GitHub identity guard must run before inserting a join request",
  );
  assert.match(migration, /grant execute on function public\.request_project_join\(uuid, text\) to authenticated/);

  assert.match(api, /getCurrentUserGithubReadiness\(userData\.user\.id\)/);
  assert.match(api, /if \(!githubStatus\.hasGithubIdentity\)/);
  assert.match(api, /\.rpc\("request_project_join"/);

  assert.match(detail, /const githubChecking = joinable && githubStatus === null/);
  assert.match(detail, /const githubMissing = joinable && githubStatus\?\.hasGithubIdentity === false/);
  assert.match(detail, /disabled=\{joining \|\| githubChecking\}/);
  assert.match(detail, /프로필에서 GitHub URL 입력/);
  assert.match(detail, /GitHub URL 입력 전에는 참여 신청이 잠겨 있습니다\./);
});
