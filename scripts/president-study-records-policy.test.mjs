import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("president can read study records across projects without getting write controls", () => {
  const migration = readFileSync(
    "supabase/migrations/20260514120000_president_study_record_read.sql",
    "utf8",
  );
  const studyLog = readFileSync("src/app/pages/member/StudyLog.tsx", "utf8");
  const projectBoard = readFileSync("src/app/pages/member/StudyProjectPosts.tsx", "utf8");

  assert.match(migration, /create or replace function public\.can_read_private_project/);
  assert.match(migration, /create or replace function public\.current_user_can_read_project_member_scope/);
  assert.match(migration, /create or replace function public\.current_user_can_read_study_session/);
  assert.match(migration, /create or replace function public\.current_user_can_read_study_record/);
  assert.ok(
    (migration.match(/public\.user_is_president\(auth\.uid\(\)\)/g) ?? []).length >= 4,
    "President read access must be explicit across project and study read helpers",
  );
  assert.match(migration, /grant execute on function public\.current_user_can_read_study_record/);

  assert.match(studyLog, /const \{ user, authData \} = useAuth\(\)/);
  assert.match(studyLog, /isPresident \? projects : projects\.filter\(\(project\) => project\.isMember\)/);
  assert.match(studyLog, /readableProjects\.filter/);
  assert.match(studyLog, /회장 열람/);

  assert.match(projectBoard, /const \{ user, authData \} = useAuth\(\)/);
  assert.match(projectBoard, /const isPresidentReadOnly = Boolean\(project && isPresident && !project\.isMember\)/);
  assert.match(projectBoard, /프로젝트 멤버와 회장이 볼 수 있는 자료함입니다\./);
  assert.match(projectBoard, /회장 열람/);
});
