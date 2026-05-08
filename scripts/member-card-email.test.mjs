import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const membersPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/Members.tsx"),
  "utf8",
);

test("member email action reveals the email in-place instead of opening a mailto link", () => {
  assert.match(
    membersPageSource,
    /import \{ copyTextToClipboard \} from "\.\.\/\.\.\/api\/clipboard\.js";/,
  );
  assert.doesNotMatch(membersPageSource, /mailto:/);
  assert.match(membersPageSource, /function EmailToggleButton/);
  assert.match(membersPageSource, /aria-expanded=\{open\}/);
  assert.match(membersPageSource, /function EmailRevealPanel/);
  assert.match(membersPageSource, /await copyTextToClipboard\(email\);/);
  assert.match(membersPageSource, /gridTemplateRows: open && email \? "1fr" : "0fr"/);
});

test("member card and list row both use the expandable email panel", () => {
  const panelUsageCount = membersPageSource.match(/<EmailRevealPanel/g)?.length ?? 0;

  assert.equal(panelUsageCount, 2);
  assert.match(membersPageSource, /member-card-email-/);
  assert.match(membersPageSource, /member-row-email-/);
});
