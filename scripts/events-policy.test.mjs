import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  countEventsByStatus,
  filterEvents,
  getEnabledEventFeatureKeys,
  getEventDetailPath,
  getEventImageTones,
  getEventStatus,
  sortEvents,
} from "../src/app/api/events.ts";
import {
  canCreateEvents,
  EVENT_CREATE_PERMISSIONS,
} from "../src/app/api/event-policy.js";

const NOW = new Date("2026-05-06T12:00:00+09:00");
const routesSource = readFileSync(resolve(process.cwd(), "src/app/routes.tsx"), "utf8");
const eventsPageSource = readFileSync(resolve(process.cwd(), "src/app/pages/member/Events.tsx"), "utf8");
const eventDetailSource = readFileSync(resolve(process.cwd(), "src/app/pages/member/EventDetail.tsx"), "utf8");

const sampleEvents = [
  {
    id: "past",
    title: "지난 행사",
    description: "이미 마감된 행사",
    startsAt: "2026-05-01T10:00:00+09:00",
    endsAt: "2026-05-01T12:00:00+09:00",
    location: "랩실",
    imageTone: "slate",
  },
  {
    id: "now",
    title: "진행 행사",
    description: "현재 진행 중",
    startsAt: "2026-05-06T10:00:00+09:00",
    endsAt: "2026-05-06T18:00:00+09:00",
    location: "공학관",
    imageTone: "navy",
  },
  {
    id: "future",
    title: "예정 행사",
    description: "곧 열리는 행사",
    startsAt: "2026-05-09T10:00:00+09:00",
    endsAt: "2026-05-09T12:00:00+09:00",
    location: "세미나실",
    imageTone: "green",
  },
];

test("classifies event status from event time boundaries", () => {
  assert.equal(getEventStatus(sampleEvents[0], NOW), "closed");
  assert.equal(getEventStatus(sampleEvents[1], NOW), "ongoing");
  assert.equal(getEventStatus(sampleEvents[2], NOW), "scheduled");
});

test("filters events by scheduled, ongoing, and closed statuses", () => {
  assert.deepEqual(filterEvents(sampleEvents, "scheduled", "", NOW).map((event) => event.id), [
    "future",
  ]);
  assert.deepEqual(filterEvents(sampleEvents, "ongoing", "", NOW).map((event) => event.id), [
    "now",
  ]);
  assert.deepEqual(filterEvents(sampleEvents, "closed", "", NOW).map((event) => event.id), [
    "past",
  ]);
});

test("searches event title, description, and location inside a selected status", () => {
  assert.deepEqual(filterEvents(sampleEvents, "scheduled", "세미나", NOW).map((event) => event.id), [
    "future",
  ]);
  assert.deepEqual(filterEvents(sampleEvents, "scheduled", "랩실", NOW), []);
});

test("sorts active events before scheduled and closed events", () => {
  assert.deepEqual(sortEvents(sampleEvents, NOW).map((event) => event.id), [
    "now",
    "future",
    "past",
  ]);
});

test("counts events by computed status", () => {
  assert.deepEqual(countEventsByStatus(sampleEvents, NOW), {
    scheduled: 1,
    ongoing: 1,
    closed: 1,
  });
});

test("normalizes event image gallery tones without duplicates", () => {
  assert.deepEqual(
    getEventImageTones({
      imageTone: "navy",
      imageTones: ["green", "navy", "amber"],
    }),
    ["navy", "green", "amber"],
  );
});

test("builds stable event detail paths", () => {
  assert.equal(getEventDetailPath("kobot-game-cup-2026"), "/member/events/kobot-game-cup-2026");
});

test("reports enabled event creation features from event settings", () => {
  assert.deepEqual(
    getEnabledEventFeatureKeys({
      features: {
        externalForm: {
          enabled: true,
          provider: "google_forms",
          title: "참가 신청",
          requiredFields: [],
        },
        participantSurvey: {
          enabled: true,
          title: "사전 조사",
          description: "",
          questions: [],
        },
        attendanceCheck: {
          enabled: false,
          expectedCount: 0,
          checkedInCount: 0,
          method: "manual",
        },
        teamFormation: {
          enabled: true,
          teamSize: 3,
          description: "",
        },
      },
    }),
    ["externalForm", "participantSurvey", "teamFormation"],
  );
});

test("allows event creation without granting full event management", () => {
  assert.deepEqual(EVENT_CREATE_PERMISSIONS, ["events.create", "events.manage"]);
  assert.equal(canCreateEvents(["events.create"]), true);
  assert.equal(canCreateEvents(["events.manage"]), true);
  assert.equal(canCreateEvents(["events.read"]), false);
});

test("uses event creation permission for create routes and buttons", () => {
  assert.match(routesSource, /memberElement\(EventCreate, EVENT_CREATE_PERMISSIONS\)/);
  assert.match(eventsPageSource, /hasPermission\(\.\.\.EVENT_CREATE_PERMISSIONS\)/);
  assert.match(eventDetailSource, /hasPermission\(\.\.\.EVENT_CREATE_PERMISSIONS\)/);
});
