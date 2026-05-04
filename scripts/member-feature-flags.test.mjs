import test from "node:test";
import assert from "node:assert/strict";

import {
  COMING_SOON_MEMBER_PAGE_KEYS,
  getComingSoonPageTitle,
  isMemberFeatureComingSoon,
} from "../src/app/api/member-feature-flags.js";

test("temporarily disables the requested member feature pages", () => {
  assert.deepEqual(
    COMING_SOON_MEMBER_PAGE_KEYS,
    ["study-log", "study-playlist", "events", "resources", "equipment", "votes"],
  );

  assert.equal(isMemberFeatureComingSoon("study-log"), true);
  assert.equal(isMemberFeatureComingSoon("projects"), false);
});

test("returns Korean titles for coming soon pages", () => {
  assert.equal(getComingSoonPageTitle("study-log"), "스터디 기록");
  assert.equal(getComingSoonPageTitle("equipment"), "장비 대여");
  assert.equal(getComingSoonPageTitle("unknown"), "준비 중");
});
