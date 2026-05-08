import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  filterNotifications,
  getNotificationActionLabel,
  getNotificationCategory,
  getNotificationTargetHref,
  getUnreadNotificationCount,
} from "../src/app/api/notification-policy.js";
import {
  getStableNotificationBody,
  getStableNotificationTitle,
} from "../src/app/api/notifications.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

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

test("routes membership application notifications to member admin approval flow", () => {
  const context = {
    type: "membership_application_submitted",
    relatedEntityTable: "membership_applications",
  };

  assert.equal(
    getNotificationTargetHref("/member/members", context),
    "/member/member-admin?filter=submitted",
  );
  assert.equal(getNotificationActionLabel(context), "멤버 관리에서 승인하기");
});

test("does not force every membership_applications row to the submitted approval CTA", () => {
  assert.equal(
    getNotificationTargetHref("/member/notifications", {
      type: "membership_application_approved",
      relatedEntityTable: "membership_applications",
    }),
    "/member/notifications",
  );
  assert.equal(
    getNotificationActionLabel({
      type: "membership_application_approved",
      relatedEntityTable: "membership_applications",
    }),
    "보러가기",
  );
});

test("keeps contact request toast titles stable even when persisted titles are corrupted", () => {
  assert.equal(
    getStableNotificationTitle({
      type: "contact_request_created",
      title: "?????",
      related_entity_table: "contact_requests",
      metadata: {},
    }),
    "연락 요청이 도착했습니다",
  );

  assert.equal(
    getStableNotificationTitle({
      type: "contact_request_decided",
      title: "?????",
      related_entity_table: "contact_requests",
      metadata: { decision: "accepted" },
    }),
    "연락 요청이 수락되었습니다",
  );
});

test("renders membership application toast copy in Korean even when persisted text is English", () => {
  const row = {
    type: "membership_application_submitted",
    title: "Membership application submitted",
    body: "이정훈 submitted a membership application.",
    related_entity_table: "membership_applications",
    metadata: {},
  };

  assert.equal(getStableNotificationTitle(row), "가입 신청이 도착했습니다");
  assert.equal(
    getStableNotificationBody(row, {
      id: "actor-1",
      displayName: "이정훈",
      loginId: "demo",
      avatarUrl: null,
    }),
    "이정훈 님이 가입 신청서를 제출했습니다.",
  );
});

test("replaces contact request notification write path and cleans persisted titles", () => {
  const migration = readFileSync(
    resolve(root, "supabase/migrations/20260507010000_fix_contact_notification_titles.sql"),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.create_contact_request/);
  assert.match(migration, /create or replace function public\.decide_contact_request/);
  assert.match(migration, /'연락 요청이 도착했습니다'/);
  assert.match(migration, /'연락 요청이 수락되었습니다'/);
  assert.match(migration, /'연락 요청이 거절되었습니다'/);
  assert.match(migration, /update public\.notifications/);
  assert.match(migration, /where related_entity_table = 'contact_requests'/);
});

test("replaces membership application notification write path and cleans English persisted rows", () => {
  const migration = readFileSync(
    resolve(
      root,
      "supabase/migrations/20260507011000_korean_membership_application_notifications.sql",
    ),
    "utf8",
  );

  assert.match(
    migration,
    /create or replace function public\.submit_current_membership_application/,
  );
  assert.match(migration, /'가입 신청이 도착했습니다'/);
  assert.match(migration, /' 님이 가입 신청서를 제출했습니다\.'/);
  assert.match(migration, /update public\.notifications n/);
  assert.match(migration, /type = 'membership_application_submitted'/);
  assert.match(
    migration,
    /regexp_replace\(n\.body, ' submitted a membership application\\\.\$'/,
  );
});
