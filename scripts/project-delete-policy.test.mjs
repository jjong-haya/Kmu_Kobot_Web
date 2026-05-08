import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

test("deletes projects only through an authenticated permission-checked RPC and confirmed workspace action", () => {
  const migration = readIfExists("supabase/migrations/20260508006000_delete_project_team.sql");
  const api = readIfExists("src/app/api/projects.ts");
  const detail = readIfExists("src/app/pages/member/ProjectDetail.tsx");

  assert.match(migration, /create or replace function public\.delete_project_team\(/);
  assert.match(migration, /returns void/);
  assert.match(migration, /security definer/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /public\.current_user_can_manage_project\(v_project\.id\)/);
  assert.match(migration, /delete from public\.project_teams/);
  assert.match(migration, /grant execute on function public\.delete_project_team\(uuid\) to authenticated/);
  assert.doesNotMatch(migration, /grant execute on function public\.delete_project_team\(uuid\) to anon/);

  assert.match(api, /export async function deleteProject\(/);
  assert.match(api, /\.rpc\("delete_project_team"/);
  assert.doesNotMatch(api, /\.from\("project_teams"\)\s*\.\s*delete\(/);

  assert.match(detail, /deleteProject/);
  assert.match(detail, /삭제하려면 프로젝트 이름을 입력해 주세요\./);
  assert.match(detail, /deleteConfirmText\.trim\(\) !== project\.name/);
  assert.match(detail, /navigate\(projectListPath\(\), \{ replace: true \}\)/);
});
