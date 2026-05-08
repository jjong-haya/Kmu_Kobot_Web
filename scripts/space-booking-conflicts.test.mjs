import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildSameDaySpaceBookingMessage,
  buildSpaceBookingConflictMessage,
  findSpaceBookingConflict,
  isInvalidSpaceBookingRange,
  isSameDayOrPastSpaceBookingDate,
} from "../src/app/api/space-booking-conflicts.ts";

const migrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260507013000_prevent_space_booking_overlap.sql"),
  "utf8",
);
const typeMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260507015000_space_booking_meeting_study_only.sql"),
  "utf8",
);
const sameDayMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260508005000_prevent_same_day_space_booking.sql"),
  "utf8",
);
const apiSource = readFileSync(
  resolve(process.cwd(), "src/app/api/space-bookings.ts"),
  "utf8",
);
const pageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/SpaceBooking.tsx"),
  "utf8",
);

const existingBookings = [
  {
    id: "booking-1",
    date: "2026-05-06",
    start: "18:00",
    end: "20:00",
    title: "기존 스터디",
  },
  {
    id: "booking-2",
    date: "2026-05-07",
    start: "18:00",
    end: "20:00",
    title: "다른 날짜",
  },
];

test("detects same-day overlapping space booking ranges", () => {
  const conflict = findSpaceBookingConflict(
    { date: "2026-05-06", start: "19:00", end: "21:00" },
    existingBookings,
  );

  assert.deepEqual(conflict, {
    date: "2026-05-06",
    start: "18:00",
    end: "20:00",
    title: "기존 스터디",
  });
});

test("allows adjacent space booking ranges without false conflicts", () => {
  assert.equal(
    findSpaceBookingConflict(
      { date: "2026-05-06", start: "20:00", end: "21:00" },
      existingBookings,
    ),
    null,
  );
  assert.equal(
    findSpaceBookingConflict(
      { date: "2026-05-06", start: "17:00", end: "18:00" },
      existingBookings,
    ),
    null,
  );
});

test("rejects empty or reversed time ranges before submission", () => {
  assert.equal(isInvalidSpaceBookingRange("20:00", "19:00"), true);
  assert.equal(isInvalidSpaceBookingRange("20:00", "20:00"), true);
  assert.equal(isInvalidSpaceBookingRange("19:00", "20:00"), false);
});

test("rejects same-day and past space booking dates before submission", () => {
  assert.equal(isSameDayOrPastSpaceBookingDate("2026-05-08", "2026-05-08"), true);
  assert.equal(isSameDayOrPastSpaceBookingDate("2026-05-07", "2026-05-08"), true);
  assert.equal(isSameDayOrPastSpaceBookingDate("2026-05-09", "2026-05-08"), false);
  assert.equal(buildSameDaySpaceBookingMessage(), "당일 예약은 불가합니다. 다음 날부터 예약해 주세요.");
});

test("explains the next possible start and earlier possible end", () => {
  const message = buildSpaceBookingConflictMessage({
    date: "2026-05-06",
    start: "18:00",
    end: "20:00",
    title: "기존 스터디",
  });

  assert.match(message, /20:00 이후/);
  assert.match(message, /18:00까지/);
});

test("prevents overlap in the database write path, not only in the UI", () => {
  assert.match(migrationSource, /prevent_space_booking_overlap/);
  assert.match(migrationSource, /before insert or update of booking_date, start_time, end_time/);
  assert.match(migrationSource, /pg_advisory_xact_lock/);
  assert.match(migrationSource, /space_booking_time_conflict/);
  assert.match(migrationSource, /find_space_booking_time_conflict/);
});

test("prevents same-day space booking in the database write path, not only in the UI", () => {
  assert.match(sameDayMigrationSource, /prevent_space_booking_overlap/);
  assert.match(sameDayMigrationSource, /new\.booking_date <= \(now\(\) at time zone 'Asia\/Seoul'\)::date/);
  assert.match(sameDayMigrationSource, /space_booking_same_day_not_allowed/);
  assert.match(sameDayMigrationSource, /before insert or update of booking_date, start_time, end_time/);
  assert.match(apiSource, /isSameDayOrPastSpaceBookingDate\(input\.date, localIsoDateKey\(new Date\(\)\)\)/);
  assert.match(apiSource, /buildSameDaySpaceBookingMessage\(\)/);
  assert.match(pageSource, /min=\{minBookingDate\}/);
  assert.match(pageSource, /aria-invalid=\{Boolean\(dateError\)\}/);
  assert.match(pageSource, /disabled=\{saving \|\| Boolean\(dateError\) \|\| Boolean\(timeError\) \|\| checkingConflict\}/);
});

test("marks the reservation modal and time inputs as invalid when times conflict", () => {
  assert.match(pageSource, /findSpaceBookingConflict/);
  assert.match(pageSource, /SpaceBookingConflictError/);
  assert.match(pageSource, /aria-invalid=\{Boolean\(timeError\)\}/);
  assert.match(pageSource, /sb-modal-scroll::-webkit-scrollbar-button/);
});

test("prevents the removed personal booking type from reviving through UI or write paths", () => {
  assert.match(pageSource, /const BOOKING_TYPE_OPTIONS: ReservationType\[\] = \["meeting", "study"\]/);
  assert.doesNotMatch(pageSource, /gridTemplateColumns: "repeat\(3, 1fr\)"/);
  assert.match(apiSource, /export type ReservationType = "meeting" \| "study";/);
  assert.match(apiSource, /export type StoredReservationType = ReservationType \| "personal";/);
  assert.match(apiSource, /isCreatableReservationType/);
  assert.match(typeMigrationSource, /set type = 'study'\s+where type = 'personal'/);
  assert.match(typeMigrationSource, /check \(type in \('meeting', 'study'\)\)/);
  assert.match(typeMigrationSource, /p_type not in \('meeting', 'study'\)/);
});
