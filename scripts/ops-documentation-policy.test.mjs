import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const productReadmeSource = readFileSync(resolve(process.cwd(), "docs/product/README.md"), "utf8");
const governanceSource = readFileSync(
  resolve(process.cwd(), "docs/product/documentation-governance.md"),
  "utf8",
);
const eventsDocSource = readFileSync(resolve(process.cwd(), "docs/product/events.md"), "utf8");
const opsDocSource = readFileSync(
  resolve(process.cwd(), "docs/product/codex-operational-capabilities.md"),
  "utf8",
);

test("operational capability documentation is linked from product docs", () => {
  assert.match(productReadmeSource, /codex-operational-capabilities\.md/);
  assert.match(governanceSource, /codex-operational-capabilities\.md/);
  assert.match(governanceSource, /원격 migration 검증/);
});

test("Supabase remote migration work requires capability checks and endpoint verification", () => {
  assert.match(opsDocSource, /npx supabase --version/);
  assert.match(opsDocSource, /SUPABASE_ACCESS_TOKEN/);
  assert.match(opsDocSource, /SUPABASE_DB_PASSWORD/);
  assert.match(opsDocSource, /VITE_SUPABASE_ANON_KEY/);
  assert.match(opsDocSource, /값을 출력하지 않고/);
  assert.match(opsDocSource, /npx supabase migration list --linked/);
  assert.match(opsDocSource, /npx supabase db push --yes/);
  assert.match(opsDocSource, /REST\/RPC endpoint/);
});

test("events remote 404 fix is documented with applied migrations and REST result", () => {
  assert.match(eventsDocSource, /20260509001000_events_persistence\.sql/);
  assert.match(eventsDocSource, /20260509002000_forms_management_nav_for_vice_president\.sql/);
  assert.match(eventsDocSource, /20260509003000_invite_link_status_and_role_tag_boundary\.sql/);
  assert.match(eventsDocSource, /\/rest\/v1\/events\?select=id&limit=1/);
  assert.match(eventsDocSource, /200 OK/);
  assert.match(eventsDocSource, /\[\]/);
  assert.match(opsDocSource, /\/rest\/v1\/events\?select=id&limit=1/);
  assert.match(opsDocSource, /200 OK/);
});
