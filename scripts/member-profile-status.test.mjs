import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(resolve(root, "src/app/layouts/MemberLayout.tsx"), "utf8");

test("profile shell does not show a member status badge in the account header", () => {
  assert.ok(
    !layout.includes('<Badge variant="outline">{getMemberStatusLabel(memberStatus)}</Badge>'),
    "account/profile header should not render the member status badge",
  );
});
