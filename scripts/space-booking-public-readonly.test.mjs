import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const routesSource = readFileSync(resolve(process.cwd(), "src/app/routes.tsx"), "utf8");
const memberPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/SpaceBooking.tsx"),
  "utf8",
);
const publicPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/public/SpaceBookingPublic.tsx"),
  "utf8",
);
const apiSource = readFileSync(resolve(process.cwd(), "src/app/api/space-bookings.ts"), "utf8");
const columnGrantMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260508003000_public_space_booking_column_grants.sql"),
  "utf8",
);
const authenticatedRolesMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260508004000_space_booking_rls_authenticated_roles.sql"),
  "utf8",
);

test("keeps public space booking calendar read-only and outside member navigation", () => {
  assert.match(routesSource, /const SpaceBookingPublic = lazy/);
  assert.match(
    routesSource,
    /path: "\/space-booking",\s+element: lazyElement\(SpaceBookingPublic\),/,
  );
  assert.match(
    routesSource,
    /path: "space-booking",\s+element: memberElement\(SpaceBooking, undefined, \{ allowCourseMember: true \}\),/,
  );
  assert.match(publicPageSource, /<SpaceBooking readOnly bare \/>/);
  assert.match(memberPageSource, /readOnly \? listPublicBookingsInRange : listBookingsInRange/);
  assert.match(memberPageSource, /\{!readOnly && modalOpen && \(/);
  assert.match(memberPageSource, /\{!readOnly && \(\s*<div style=\{\{ display: "flex", justifyContent: "flex-end" \}\}>/);
});

test("exposes anonymous space booking calendar through narrow read-only columns only", () => {
  assert.match(apiSource, /\.from\("space_bookings"\)/);
  assert.match(apiSource, /participants: \[\]/);
  assert.match(apiSource, /audienceTags: \[\]/);
  assert.match(apiSource, /audienceTeams: \[\]/);
  assert.match(columnGrantMigrationSource, /drop function if exists public\.list_public_space_booking_calendar\(date, date\)/);
  assert.match(columnGrantMigrationSource, /create policy "anon can read public booking calendar fields"/);
  assert.match(columnGrantMigrationSource, /revoke all on public\.space_bookings from anon/);
  assert.match(columnGrantMigrationSource, /grant select \(\s+id,\s+title,\s+booking_date,\s+start_time,\s+end_time,\s+organizer_name,\s+type,\s+scope,\s+attendees\s+\) on public\.space_bookings to anon/);
  assert.match(columnGrantMigrationSource, /revoke all on public\.space_booking_participants from anon/);
  assert.match(columnGrantMigrationSource, /revoke all on public\.space_booking_audience_tags from anon/);
  assert.match(columnGrantMigrationSource, /revoke all on public\.space_booking_audience_teams from anon/);
  assert.match(columnGrantMigrationSource, /notify pgrst, 'reload schema'/);
  assert.doesNotMatch(columnGrantMigrationSource, /grant .*space_booking_participants.*anon/);
  assert.doesNotMatch(columnGrantMigrationSource, /grant .*space_booking_audience_tags.*anon/);
  assert.doesNotMatch(columnGrantMigrationSource, /grant .*space_booking_audience_teams.*anon/);
  assert.doesNotMatch(columnGrantMigrationSource, /organizer_id/);
});

test("keeps anonymous space booking access read-only by making mutation policies authenticated-only", () => {
  assert.match(authenticatedRolesMigrationSource, /create policy "members can insert own booking"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "members can update own booking"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "members can delete own booking"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "ops can manage all bookings"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "booking organizer can manage participants"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "booking organizer can manage owned club tags"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /create policy "booking organizer can manage own teams"[\s\S]*?to authenticated/);
  assert.match(authenticatedRolesMigrationSource, /tm\.team_id = space_booking_audience_teams\.team_id/);
  assert.match(authenticatedRolesMigrationSource, /revoke insert, update, delete on public\.space_bookings from anon/);
  assert.doesNotMatch(authenticatedRolesMigrationSource, /for (insert|update|delete)[\s\S]*?to anon/);
});
