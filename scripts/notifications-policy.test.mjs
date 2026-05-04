import test from "node:test";
import assert from "node:assert/strict";

import {
  filterNotifications,
  getNotificationCategory,
  getNotificationTargetHref,
  getUnreadNotificationCount,
} from "../src/app/api/notification-policy.js";

test("maps database notification types to stable UI categories", () => {
  assert.equal(
    getNotificationCategory({
      type: "membership_application_submitted",
      relatedEntityTable: "membership_applications",
    }),
    "member",
  );
  assert.equal(
    getNotificationCategory({
      type: "contact_request_created",
      relatedEntityTable: "contact_requests",
    }),
    "contact",
  );
  assert.equal(
    getNotificationCategory({
      type: "vote_started",
      relatedEntityTable: "votes",
    }),
    "vote",
  );
  assert.equal(
    getNotificationCategory({
      type: "role_transfer_requested",
      relatedEntityTable: "authority_delegations",
    }),
    "approval",
  );
});

test("filters unread and category groups from database-shaped rows", () => {
  const rows = [
    { id: "1", category: "member", readAt: null },
    { id: "2", category: "contact", readAt: "2026-05-05T01:00:00Z" },
    { id: "3", category: "approval", readAt: null },
  ];

  assert.deepEqual(filterNotifications(rows, "all").map((row) => row.id), ["1", "2", "3"]);
  assert.deepEqual(filterNotifications(rows, "unread").map((row) => row.id), ["1", "3"]);
  assert.deepEqual(filterNotifications(rows, "approval").map((row) => row.id), ["3"]);
  assert.equal(getUnreadNotificationCount(rows), 2);
});

test("allows only internal notification hrefs", () => {
  assert.equal(getNotificationTargetHref("/member/members"), "/member/members");
  assert.equal(getNotificationTargetHref("member/members"), "/member/members");
  assert.equal(getNotificationTargetHref("https://example.com/phishing"), null);
  assert.equal(getNotificationTargetHref("//example.com/phishing"), null);
});
