import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const roleTagSeedSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260506110000_project_create_permission_and_role_tags.sql"),
  "utf8",
);
const roleBoundaryMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260509003000_invite_link_status_and_role_tag_boundary.sql"),
  "utf8",
);
const authRbacSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260325150000_auth_rbac.sql"),
  "utf8",
);

test("prevents president vice-president display role tag permission pollution", () => {
  assert.match(roleTagSeedSource, /'president', '회장'/);
  assert.match(roleTagSeedSource, /'vice_president', '부회장'/);
  assert.match(roleBoundaryMigrationSource, /delete from public\.member_tag_permissions mtp/);
  assert.match(roleBoundaryMigrationSource, /lower\(mt\.slug\) in \('president', 'vice_president', 'vice-president'\)/);
  assert.match(roleBoundaryMigrationSource, /prevent_permissions_on_position_display_tags/);
  assert.match(roleBoundaryMigrationSource, /position_display_tag_cannot_have_permissions/);
});

test("keeps president vice-president authority in org position permission domain", () => {
  assert.match(authRbacSource, /create table if not exists public\.org_position_permissions/);
  assert.match(authRbacSource, /join public\.org_position_permissions opp/);
  assert.match(authRbacSource, /position_targets\.slug = 'president'/);
  assert.match(authRbacSource, /position_targets\.slug = 'vice-president'/);
  assert.match(roleBoundaryMigrationSource, /실제 권한은 org_position_permissions에서만 계산한다/);
});
