import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const confirmDialogSource = readFileSync(
  resolve(process.cwd(), "src/app/components/ConfirmActionDialog.tsx"),
  "utf8",
);

const deleteActionPages = [
  "src/app/pages/member/Announcements.tsx",
  "src/app/pages/member/MemberAdmin.tsx",
  "src/app/pages/member/Quests.tsx",
  "src/app/pages/member/TagDetail.tsx",
  "src/app/pages/member/Tags.tsx",
];

test("uses the app confirm dialog for destructive member/admin actions", () => {
  assert.match(confirmDialogSource, /AlertDialog/);
  assert.match(confirmDialogSource, /onConfirm/);

  for (const file of deleteActionPages) {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    assert.match(source, /ConfirmActionDialog/);
    assert.doesNotMatch(source, /window\.confirm\(/);
  }
});
