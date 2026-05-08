import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const authProviderSource = readFileSync(
  resolve(process.cwd(), "src/app/auth/AuthProvider.tsx"),
  "utf8",
);
const loginPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/public/Login.tsx"),
  "utf8",
);
const sanitizeErrorSource = readFileSync(
  resolve(process.cwd(), "src/app/utils/sanitize-error.ts"),
  "utf8",
);

test("wrong password is caught and shown as a user-facing password error", () => {
  assert.match(authProviderSource, /signInWithPassword\(\{[\s\S]*?password,[\s\S]*?\}\)/);
  assert.match(authProviderSource, /if \(error\) \{\s+throw new Error\("비밀번호가 틀렸습니다\."\);\s+\}/);
  assert.match(loginPageSource, /catch \(error\) \{\s+setSubmitError\(sanitizeUserError\(error,/);
  assert.match(sanitizeErrorSource, /browser console output is still user-visible/);
  assert.doesNotMatch(authProviderSource, /console\.error\(/);
});
