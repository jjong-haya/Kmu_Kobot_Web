import test from "node:test";
import assert from "node:assert/strict";

import {
  buildContactPayload,
  filterContactRequests,
  getContactRequestRelation,
  getContactRequestStatusLabel,
  normalizeContactMethods,
} from "../src/app/api/contact-request-policy.js";

test("normalizes contact methods to supported unique values", () => {
  assert.deepEqual(
    normalizeContactMethods(["email", "phone", "email", "kakao", " PHONE "]),
    ["email", "phone"],
  );
});

test("builds payload only from selected contact methods that exist on the profile", () => {
  assert.deepEqual(
    buildContactPayload(
      { email: "member@kookmin.ac.kr", phone: "010-0000-0000" },
      ["email"],
    ),
    { email: "member@kookmin.ac.kr" },
  );
  assert.deepEqual(buildContactPayload({ email: "", phone: null }, ["email", "phone"]), {});
});

test("filters by pending, accepted, rejected group, and outgoing relation", () => {
  const rows = [
    { id: "1", status: "pending", requesterUserId: "me", recipientUserId: "you" },
    { id: "2", status: "accepted", requesterUserId: "you", recipientUserId: "me" },
    { id: "3", status: "auto_rejected", requesterUserId: "you", recipientUserId: "me" },
    { id: "4", status: "canceled", requesterUserId: "me", recipientUserId: "you" },
  ];

  assert.deepEqual(filterContactRequests(rows, "pending", "me").map((row) => row.id), ["1"]);
  assert.deepEqual(filterContactRequests(rows, "rejected", "me").map((row) => row.id), ["3", "4"]);
  assert.deepEqual(filterContactRequests(rows, "outgoing", "me").map((row) => row.id), ["1", "4"]);
});

test("labels viewer relation and database statuses in Korean", () => {
  assert.equal(
    getContactRequestRelation(
      { requesterUserId: "me", recipientUserId: "you" },
      "me",
    ),
    "보낸 요청",
  );
  assert.equal(
    getContactRequestRelation(
      { requesterUserId: "you", recipientUserId: "me" },
      "me",
    ),
    "받은 요청",
  );
  assert.equal(getContactRequestStatusLabel("pending"), "대기");
  assert.equal(getContactRequestStatusLabel("auto_rejected"), "자동 거절");
});
