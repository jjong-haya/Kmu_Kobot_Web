import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

test("deletes projects only through an authenticated permission-checked RPC and confirmed workspace action", () => {
  const migration = readIfExists("supabase/migrations/20260508006000_delete_project_team.sql");
  const trashMigration = readIfExists("supabase/migrations/20260512020000_project_trash_lifecycle.sql");
  const api = readIfExists("src/app/api/projects.ts");
  const detail = readIfExists("src/app/pages/member/ProjectDetail.tsx");
  const admin = readIfExists("src/app/pages/member/ProjectAdmin.tsx");

  assert.match(migration, /create or replace function public\.delete_project_team\(/);
  assert.match(migration, /security definer/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /grant execute on function public\.delete_project_team\(uuid\) to authenticated/);
  assert.doesNotMatch(migration, /grant execute on function public\.delete_project_team\(uuid\) to anon/);

  assert.match(trashMigration, /add column if not exists deleted_at/);
  assert.match(trashMigration, /create or replace function public\.current_user_can_delete_project/);
  assert.match(trashMigration, /public\.user_is_president\(auth\.uid\(\)\)/);
  assert.match(trashMigration, /ptm\.role = 'lead'/);
  assert.doesNotMatch(trashMigration, /current_user_can_manage_project\(v_project\.id\)/);
  assert.match(trashMigration, /create or replace function public\.restore_deleted_project_team/);
  assert.match(trashMigration, /create or replace function public\.purge_deleted_project_team/);
  assert.match(trashMigration, /delete from public\.project_teams/);

  assert.match(api, /export async function deleteProject\(/);
  assert.match(api, /\.rpc\("delete_project_team"/);
  assert.match(api, /export async function restoreDeletedProject\(/);
  assert.match(api, /\.rpc\("restore_deleted_project_team"/);
  assert.match(api, /export async function purgeDeletedProject\(/);
  assert.match(api, /\.rpc\("purge_deleted_project_team"/);
  assert.doesNotMatch(api, /\.from\("project_teams"\)\s*\.\s*delete\(/);

  assert.match(detail, /deleteProject/);
  assert.match(detail, /삭제하려면 프로젝트 이름을 입력해 주세요\./);
  assert.match(detail, /deleteConfirmText\.trim\(\) !== project\.name/);
  assert.match(detail, /navigate\(projectListPath\(\), \{ replace: true \}\)/);
  assert.match(detail, /canDeleteCurrentProject/);
  assert.match(detail, /project\.myRole === "lead"/);

  assert.match(admin, /activeView.*"trash"/s);
  assert.match(admin, /restoreDeletedProject/);
  assert.match(admin, /purgeDeletedProject/);
  assert.match(admin, /project\.myRole === "lead"/);
  assert.match(admin, /position\.slug === "president"/);
});
