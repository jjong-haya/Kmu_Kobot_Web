import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(
  resolve(root, "supabase/migrations/20260507009000_official_team_lead_tags.sql"),
  "utf8",
);
const permissionMigration = readFileSync(
  resolve(root, "supabase/migrations/20260507012000_official_team_lead_tag_permissions.sql"),
  "utf8",
);
const correctiveMigration = readFileSync(
  resolve(root, "supabase/migrations/20260507017000_academic_official_team_lead_tags.sql"),
  "utf8",
);
const tagChip = readFileSync(resolve(root, "src/app/components/TagChip.tsx"), "utf8");

test("seeds official team lead tags for research, IOT, and academic", () => {
  const expectedTags = [
    { slug: "official_team_lead_research", label: "연구 팀장", color: "#b87333" },
    { slug: "official_team_lead_iot", label: "IOT 팀장", color: "#b87333" },
    { slug: "official_team_lead_academic", label: "학술팀장", color: "#34d399" },
  ];

  for (const tag of expectedTags) {
    assert.ok(correctiveMigration.includes(`'${tag.slug}'`), `${tag.slug} slug should be seeded`);
    assert.ok(correctiveMigration.includes(`'${tag.label}'`), `${tag.slug} label should be seeded`);
    assert.ok(correctiveMigration.includes(`'${tag.color}'`), `${tag.slug} color should be seeded`);
  }
});

test("backfills official team lead tags from the team membership domain", () => {
  assert.ok(migration.includes("insert into public.teams"), "earlier corrective seed should create teams");
  assert.ok(correctiveMigration.includes("insert into public.teams"), "corrective seed should keep teams present");
  assert.ok(correctiveMigration.includes("('academic'::citext"), "academic team slug should exist");

  const expectedMappings = [
    "('research'::citext, 'official_team_lead_research'::text)",
    "('web-iot'::citext, 'official_team_lead_iot'::text)",
    "('academic'::citext, 'official_team_lead_academic'::text)",
  ];

  for (const mapping of expectedMappings) {
    assert.ok(correctiveMigration.includes(mapping), `${mapping} should be mapped`);
  }

  assert.ok(
    correctiveMigration.includes("insert into public.member_tag_assignments"),
    "team lead rows should be copied into tag assignments",
  );
  assert.ok(
    correctiveMigration.includes("tr.slug = 'team-lead'::citext"),
    "only team-lead memberships should backfill role tags",
  );
});

test("renders academic team lead as bright emerald while research and IOT stay bronze", () => {
  assert.ok(tagChip.includes("type Texture = \"gold\" | \"silver\" | \"bronze\" | \"emerald\" | \"gunmetal\""));
  assert.ok(tagChip.includes("official_team_lead_research: BRONZE_TEAM_LEAD_DECORATION"));
  assert.ok(tagChip.includes("official_team_lead_iot: BRONZE_TEAM_LEAD_DECORATION"));
  assert.ok(tagChip.includes("official_team_lead_academic: EMERALD_TEAM_LEAD_DECORATION"));
  assert.ok(tagChip.includes("linear-gradient(135deg,#d1fae5 0%,#6ee7b7 30%,#10b981 62%,#a7f3d0 100%)"));
});

test("grants research, IOT, and academic team leads the official team lead permission bundle", () => {
  const officialLeadPermissions = [
    "dashboard.read",
    "notifications.read",
    "announcements.read",
    "members.read",
    "projects.read",
    "projects.manage",
    "resources.read",
    "events.read",
  ];

  for (const slug of [
    "official_team_lead_research",
    "official_team_lead_iot",
    "official_team_lead_academic",
  ]) {
    assert.ok(correctiveMigration.includes(`('${slug}'::text)`), `${slug} should be targeted`);
  }

  for (const permission of officialLeadPermissions) {
    assert.ok(correctiveMigration.includes(`('${permission}'::text)`), `${permission} should be granted`);
  }

  assert.ok(permissionMigration.includes("official_team_lead_research"));
  assert.ok(permissionMigration.includes("official_team_lead_iot"));
});

test("prevents official-team role tag domain pollution from legacy promotion tag", () => {
  assert.ok(
    correctiveMigration.includes("legacy_tag.slug = 'official_team_lead_promotion'"),
    "legacy promotion assignments should be explicitly migrated",
  );
  assert.ok(
    correctiveMigration.includes("delete from public.member_tags") &&
      correctiveMigration.includes("slug = 'official_team_lead_promotion'"),
    "legacy promotion role tag should be deleted from the tag domain",
  );
  assert.equal(
    tagChip.includes("official_team_lead_promotion: EMERALD_TEAM_LEAD_DECORATION"),
    false,
  );
});

test("keeps academic lead at official team lead level without event-create promotion grant", () => {
  assert.ok(correctiveMigration.includes("mt.slug = 'official_team_lead_academic'"));
  assert.ok(correctiveMigration.includes("mtp.permission not in"));
  assert.equal(correctiveMigration.includes("select mt.id, 'events.create'"), false);
});
