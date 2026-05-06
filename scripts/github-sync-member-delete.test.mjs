import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20260507008000_github_sync_member_delete_snapshot.sql", import.meta.url),
  "utf8",
);
const edgeFunction = readFileSync(
  new URL("../supabase/functions/github-sync/index.ts", import.meta.url),
  "utf8",
);

test("prevents member deletion cascade from persisting a deleted profile FK in GitHub jobs", () => {
  assert.match(migration, /'project_member_remove',\s*old\.project_team_id,\s*null,/s);
  assert.match(migration, /'removedUserId',\s*old\.user_id/s);
  assert.match(migration, /'githubLogin',\s*v_removed_identity\.github_login/s);
});

test("removes GitHub team membership from payload login when deleted profile row no longer exists", () => {
  assert.match(edgeFunction, /typeof job\.payload\.githubLogin === "string"/);
  assert.match(edgeFunction, /typeof job\.payload\.removedUserId === "string"/);
  assert.match(edgeFunction, /if \(!githubLogin && job\.user_id\)/);
  assert.doesNotMatch(
    edgeFunction,
    /Member remove job is missing project_team_id or user_id\./,
  );
});
