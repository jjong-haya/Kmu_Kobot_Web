import test from "node:test";
import assert from "node:assert/strict";

import {
  canManageAnnouncements,
  getAnnouncementRoleLabel,
  getNoticeDetailPath,
} from "../src/app/api/announcement-policy.js";

test("regular members can read announcements but cannot manage them", () => {
  assert.equal(canManageAnnouncements(["announcements.read"]), false);
});

test("official team leads and above can manage announcements through manage permission", () => {
  assert.equal(canManageAnnouncements(["announcements.read", "announcements.manage"]), true);
});

test("announcement role labels are shown in Korean", () => {
  assert.equal(getAnnouncementRoleLabel("president", "President"), "회장");
  assert.equal(getAnnouncementRoleLabel("team-lead", "Team Lead"), "팀장");
});

test("member notice detail links are stable id routes", () => {
  assert.equal(getNoticeDetailPath("abc-123"), "/member/announcements/abc-123");
});
