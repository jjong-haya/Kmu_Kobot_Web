import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  countEventsByStatus,
  filterEvents,
  getEnabledEventFeatureKeys,
  getEventDetailPath,
  getEventEditPath,
  getEventImageTones,
  getEventParticipation,
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
const eventCreateSource = readFileSync(resolve(process.cwd(), "src/app/pages/member/EventCreate.tsx"), "utf8");
const eventDetailSource = readFileSync(resolve(process.cwd(), "src/app/pages/member/EventDetail.tsx"), "utf8");
const eventsApiSource = readFileSync(resolve(process.cwd(), "src/app/api/events.ts"), "utf8");
const eventsPersistenceMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260509001000_events_persistence.sql"),
  "utf8",
);
const eventsMediaMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260510020000_events_media_and_form_link.sql"),
  "utf8",
);

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
  assert.equal(getEventEditPath("kobot-game-cup-2026"), "/member/events/kobot-game-cup-2026/edit");
});

test("resolves event participation from selected internal forms before legacy external links", () => {
  const features = {
    externalForm: {
      enabled: true,
      provider: "google_forms",
      title: "외부 링크",
      url: "https://forms.gle/example",
      requiredFields: [],
    },
    participantSurvey: {
      enabled: false,
      title: "",
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
      enabled: false,
      teamSize: 1,
      description: "",
    },
  };

  assert.deepEqual(
    getEventParticipation({
      features,
      formId: "kobot-game-cup",
      formTitle: "게임컵 참가 신청",
    }),
    {
      external: false,
      href: "/member/forms/kobot-game-cup",
      title: "게임컵 참가 신청",
    },
  );

  assert.deepEqual(
    getEventParticipation({
      features,
      formId: null,
      formTitle: null,
    }),
    {
      external: true,
      href: "https://forms.gle/example",
      title: "외부 링크",
    },
  );
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

test("uses event creation permission for the create route and list-level create button", () => {
  assert.match(routesSource, /memberElement\(EventCreate, EVENT_CREATE_PERMISSIONS\)/);
  assert.match(routesSource, /path: "events\/:eventId\/edit"/);
  assert.match(eventsPageSource, /hasPermission\(\.\.\.EVENT_CREATE_PERMISSIONS\)/);
  assert.match(eventsPageSource, /to="\/member\/events\/new"/);
  assert.doesNotMatch(eventDetailSource, /to="\/member\/events\/new"/);
  assert.doesNotMatch(eventDetailSource, /행사 만들기/);
});

test("event list supports card and list view modes", () => {
  assert.match(eventsPageSource, /type EventViewMode = "card" \| "list"/);
  assert.match(eventsPageSource, /useState<EventViewMode>\("card"\)/);
  assert.match(eventsPageSource, /LayoutGrid/);
  assert.match(eventsPageSource, /List/);
  assert.match(eventsPageSource, /label: "카드"/);
  assert.match(eventsPageSource, /label: "목록"/);
  assert.match(eventsPageSource, /function EventListItem/);
  assert.match(eventsPageSource, /viewMode === "card"/);
  assert.match(eventsPageSource, /<EventCard key=\{event\.id\} event=\{event\} canEdit=\{canEditEvent\(event\)\} \/>/);
  assert.match(eventsPageSource, /<EventListItem key=\{event\.id\} event=\{event\} canEdit=\{canEditEvent\(event\)\} \/>/);
});

test("event cards open detail on card click and expose edit from a top-right action menu", () => {
  assert.match(eventsPageSource, /function EventActionsMenu/);
  assert.match(eventsPageSource, /MoreVertical/);
  assert.match(eventsPageSource, /getEventEditPath/);
  assert.match(eventsPageSource, /navigate\(getEventDetailPath\(event\.id\)\)/);
  assert.match(eventsPageSource, /isEventCardControl/);
  assert.match(eventsPageSource, /aria-label=\{`\$\{event\.title\} 작업 메뉴`\}/);
  assert.match(eventsPageSource, /canEditEvent\(event\)/);
  assert.match(eventDetailSource, /getEventEditPath/);
  assert.match(eventDetailSource, /to=\{getEventEditPath\(event\.id\)\}/);
});

test("event creation uses an image upload and form picker workbench, not tone or operation cards", () => {
  assert.match(eventCreateSource, /event-create-studio/);
  assert.match(eventCreateSource, /event-create-workbench/);
  assert.match(eventCreateSource, /lg:grid-cols-\[360px_minmax\(0,1fr\)\]/);
  assert.match(eventCreateSource, /type="file"/);
  assert.match(eventCreateSource, /accept="image\/\*"/);
  assert.match(eventCreateSource, /mainLogo/);
  assert.match(eventCreateSource, /이미지 교체/);
  assert.match(eventCreateSource, /삭제/);
  assert.match(eventCreateSource, /listForms/);
  assert.match(eventCreateSource, /참여 폼 선택/);
  assert.match(eventCreateSource, /폼 제목, 설명, 분류로 검색/);
  assert.match(eventCreateSource, /Array\.from\(new Set\(requiredFields\)\)/);
  assert.doesNotMatch(eventCreateSource, /EVENT_IMAGE_TONE_OPTIONS/);
  assert.doesNotMatch(eventCreateSource, /대표 이미지 톤/);
  assert.doesNotMatch(eventCreateSource, /function FeatureDisclosure/);
  assert.doesNotMatch(eventCreateSource, /EVENT_FEATURE_OPTIONS/);
  assert.doesNotMatch(eventCreateSource, /신청 폼 설정/);
  assert.doesNotMatch(eventCreateSource, /운영 기능/);
  assert.doesNotMatch(eventCreateSource, /\{checked \? "사용" : "끔"\}/);
  assert.doesNotMatch(eventCreateSource, /useForm|zodResolver/);
  assert.doesNotMatch(eventCreateSource, /return;\s*if \(!title\.trim\(\)\)/);
});

test("event required field labels are normalized before persistence to prevent duplicate render keys", () => {
  assert.match(eventsApiSource, /function uniqueStrings/);
  assert.match(eventsApiSource, /requiredFields: uniqueStrings\(externalForm\.requiredFields\)/);
  assert.match(eventsApiSource, /const normalizedFeatures = features\(input\.features\)/);
  assert.match(eventsApiSource, /features: normalizedFeatures/);
  assert.match(eventCreateSource, /Array\.from\(new Set\(requiredFields\)\)/);
});

test("event list and detail expose image-aware participation calls to action", () => {
  assert.match(eventsPageSource, /getEventParticipation/);
  assert.match(eventsPageSource, /hasEventImage/);
  assert.match(eventsPageSource, /aspect-video/);
  assert.match(eventsPageSource, /참여하기/);
  assert.match(eventsPageSource, /자세히 보기/);
  assert.match(eventDetailSource, /getEventParticipation/);
  assert.match(eventDetailSource, /hasEventImage/);
  assert.match(eventDetailSource, /aspect-video/);
  assert.match(eventDetailSource, /KOBOT 참여 폼/);
  assert.match(eventDetailSource, /참여하기/);
  assert.doesNotMatch(eventDetailSource, /생성 옵션/);
});

test("persists club events through the Supabase events table, not browser-local writes", () => {
  const listEventsSource = eventsApiSource.slice(
    eventsApiSource.indexOf("export async function listEvents"),
    eventsApiSource.indexOf("export async function getEvent"),
  );
  const createEventSource = eventsApiSource.slice(eventsApiSource.indexOf("export async function createEvent"));
  const updateEventSource = eventsApiSource.slice(eventsApiSource.indexOf("export async function updateEvent"));

  assert.match(eventsPersistenceMigrationSource, /create table if not exists public\.events/);
  assert.match(eventsPersistenceMigrationSource, /created_by uuid not null default auth\.uid\(\)/);
  assert.match(eventsPersistenceMigrationSource, /events_insert_creators/);
  assert.match(eventsMediaMigrationSource, /add column if not exists image_url text/);
  assert.match(eventsMediaMigrationSource, /add column if not exists form_id text/);
  assert.match(eventsMediaMigrationSource, /add column if not exists form_title text/);
  assert.match(eventsApiSource, /image_url/);
  assert.match(eventsApiSource, /form_id/);
  assert.match(eventsApiSource, /form_title/);
  assert.match(listEventsSource, /\.from\("events"\)/);
  assert.match(createEventSource, /\.from\("events"\)/);
  assert.match(updateEventSource, /\.from\("events"\)/);
  assert.match(updateEventSource, /\.update\(/);
  assert.match(updateEventSource, /\.eq\("id", normalizedId\)/);
  assert.doesNotMatch(listEventsSource, /readLocalEvents|localStorage/);
  assert.doesNotMatch(createEventSource, /writeLocalEvents|localStorage/);
  assert.doesNotMatch(updateEventSource, /writeLocalEvents|localStorage/);
});
