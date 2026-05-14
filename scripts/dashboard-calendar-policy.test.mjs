import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const dashboardApiSource = readFileSync(
  resolve(process.cwd(), "src/app/api/dashboard.ts"),
  "utf8",
);
const dashboardPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/Dashboard.tsx"),
  "utf8",
);
const migrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260507016000_space_booking_calendar_read_all.sql"),
  "utf8",
);

test("space booking calendar read policy is all-member visibility, not club-tag visibility", () => {
  assert.match(migrationSource, /current_user_can_read_space_booking_calendar/);
  assert.match(migrationSource, /create policy "calendar users can read all bookings"/);
  assert.match(migrationSource, /member_accounts ma/);
  assert.match(migrationSource, /ma\.status in \('active', 'course_member', 'project_only'\)/);
  assert.match(migrationSource, /drop policy if exists "booking audience can read bookings"/);
  assert.doesNotMatch(migrationSource, /create policy "booking audience can read bookings"/);
});

test("dashboard loads all space bookings and marks whether each booking is mine separately", () => {
  assert.match(dashboardApiSource, /return bookings\.map/);
  assert.match(dashboardApiSource, /isDashboardBookingMine/);
  assert.match(dashboardApiSource, /member_tag_assignments/);
  assert.match(dashboardApiSource, /team_memberships/);
  assert.match(dashboardApiSource, /isMine: isDashboardBookingMine/);
  assert.doesNotMatch(dashboardApiSource, /booking\.audienceTags\.length > 0/);
  assert.doesNotMatch(dashboardApiSource, /booking\.audienceTeams\.length > 0/);
});

test("dashboard calendar has a persisted my-schedule-only checkbox", () => {
  assert.match(dashboardPageSource, /DASHBOARD_CALENDAR_MY_ONLY_KEY/);
  assert.match(dashboardPageSource, /localStorage\.getItem\(DASHBOARD_CALENDAR_MY_ONLY_KEY\)/);
  assert.match(dashboardPageSource, /localStorage\.setItem\(DASHBOARD_CALENDAR_MY_ONLY_KEY/);
  assert.match(dashboardPageSource, /type="checkbox"/);
  assert.match(dashboardPageSource, /내 일정만 보기/);
  assert.match(dashboardPageSource, /buildCalendarEvents\(data, \{ onlyMine: calendarMyOnly \}\)/);
  assert.match(dashboardPageSource, /\.filter\(\(booking\) => !options\.onlyMine \|\| booking\.isMine\)/);
});

test("dashboard uses the former Today slot for notices", () => {
  assert.match(dashboardPageSource, /function DashboardNoticePanel/);
  assert.match(dashboardPageSource, /<DashboardNoticePanel loading=\{loading\} data=\{data\} \/>/);
  assert.match(dashboardPageSource, /to=\{getNoticeDetailPath\(notice\.id\)\}/);
  assert.doesNotMatch(
    dashboardPageSource,
    /\.filter\(\(booking\) => booking\.date === todayKey && booking\.isMine\)/,
  );
  assert.doesNotMatch(
    dashboardPageSource,
    /data\?\.bookings\.filter\(\(booking\) => booking\.date === today\.key && booking\.isMine\)\.length/,
  );
});
