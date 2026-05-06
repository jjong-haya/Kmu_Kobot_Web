import test from "node:test";
import assert from "node:assert/strict";
import {
  getSafeInternalPath,
  isSafeInternalPath,
  withNextPath,
} from "../src/app/auth/redirects.ts";

test("isSafeInternalPath rejects null/empty/non-leading-slash", () => {
  assert.equal(isSafeInternalPath(null), false);
  assert.equal(isSafeInternalPath(undefined), false);
  assert.equal(isSafeInternalPath(""), false);
  assert.equal(isSafeInternalPath("foo"), false);
  assert.equal(isSafeInternalPath("https://evil.example/foo"), false);
});

test("isSafeInternalPath rejects protocol-relative and backslash escapes", () => {
  assert.equal(isSafeInternalPath("//evil.example/foo"), false);
  assert.equal(isSafeInternalPath("/\\evil.example"), false);
});

test("isSafeInternalPath rejects CRLF injection", () => {
  assert.equal(isSafeInternalPath("/path\nLocation: https://evil.example"), false);
  assert.equal(isSafeInternalPath("/path\rfoo"), false);
});

test("isSafeInternalPath accepts plain internal paths", () => {
  assert.equal(isSafeInternalPath("/"), true);
  assert.equal(isSafeInternalPath("/member"), true);
  assert.equal(isSafeInternalPath("/member/notifications"), true);
  assert.equal(isSafeInternalPath("/notice/foo-bar?tab=1"), true);
  assert.equal(isSafeInternalPath("/path#fragment"), true);
});

test("getSafeInternalPath returns the path on safe input, null otherwise", () => {
  assert.equal(getSafeInternalPath("/member"), "/member");
  assert.equal(getSafeInternalPath("//evil.example"), null);
  assert.equal(getSafeInternalPath(null), null);
});

test("withNextPath ignores unsafe nextPath", () => {
  assert.equal(withNextPath("/login", "//evil.example"), "/login");
  assert.equal(withNextPath("/login", "https://evil.example/x"), "/login");
});

test("withNextPath appends safe nextPath as ?next=...", () => {
  assert.equal(withNextPath("/login", "/member"), "/login?next=%2Fmember");
});

test("withNextPath does not echo the same path back as next", () => {
  assert.equal(withNextPath("/member", "/member"), "/member");
});

test("withNextPath preserves existing query params", () => {
  const result = withNextPath("/login?foo=1", "/member/projects");
  const url = new URL(result, "https://x.local");
  assert.equal(url.pathname, "/login");
  assert.equal(url.searchParams.get("foo"), "1");
  assert.equal(url.searchParams.get("next"), "/member/projects");
});
