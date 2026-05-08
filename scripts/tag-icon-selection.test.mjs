import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(path) {
  try {
    return readFileSync(resolve(root, path), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

const tagApi = read("src/app/api/tags.ts");
const tagChip = read("src/app/components/TagChip.tsx");
const tagsPage = read("src/app/pages/member/Tags.tsx");
const memberDirectoryApi = read("src/app/api/member-directory.ts");
const memberAdminApi = read("src/app/api/member-admin.ts");
const memberAdminPage = read("src/app/pages/member/MemberAdmin.tsx");
const questsApi = read("src/app/api/quests.ts");
const questsPage = read("src/app/pages/member/Quests.tsx");
const iconConfig = read("src/app/config/tag-icons.ts");
const migration = read("supabase/migrations/20260507018000_member_tag_icons.sql");

test("member tag icon choice is persisted in the member_tags domain", () => {
  assert.ok(
    migration.includes("alter table public.member_tags") &&
      migration.includes("add column if not exists icon_name"),
    "member_tags should own the static icon choice",
  );
  assert.ok(tagApi.includes("icon_name?: string | null"), "API row should read icon_name");
  assert.ok(
    tagApi.includes("iconName: normalizeTagIconName(row.icon_name)"),
    "API model should expose normalized iconName",
  );
  assert.ok(tagApi.includes("iconName?: string | null"), "create/update input should accept iconName");
  assert.ok(tagApi.includes("update.icon_name"), "updateTag should persist icon_name");
});

test("TagChip renders the persisted icon before falling back to legacy slug icons", () => {
  assert.ok(tagChip.includes("tag.iconName"), "TagChip should read persisted iconName");
  assert.ok(
    tagChip.includes("getTagIconComponent(tag.iconName)") &&
      tagChip.includes("getLegacyTagIconDecoration"),
    "TagChip should prefer persisted icon and keep legacy president/KOBOT fallback",
  );
  assert.ok(iconConfig.includes("export const TAG_ICON_GROUPS"), "icon choices should be shared");
  assert.ok(iconConfig.includes("Bot") && iconConfig.includes("Crown"), "current icons should be available");
});

test("tag management editor exposes icon choice in the main edit popup", () => {
  assert.ok(tagsPage.includes("selectedIconName"), "editor should keep selected icon state");
  assert.ok(tagsPage.includes("IconPicker"), "editor should render the icon picker");
  assert.ok(tagsPage.includes("iconName: selectedIconName"), "save should include selected icon");
});

test("mobile tag list uses click-to-configure rows instead of clipped desktop columns", () => {
  assert.ok(tagsPage.includes("desktopTagTableStyle"), "desktop table should be desktop-only");
  assert.ok(tagsPage.includes("mobileTagListStyle"), "mobile should have a separate list layout");
  assert.ok(tagsPage.includes("openMobileTagActions"), "mobile row click should open a settings popup");
  assert.ok(
    tagsPage.includes("MobileTagActionsModal"),
    "mobile actions should be presented in a popup",
  );
});

test("tag icon selection is read by member and quest tag chip surfaces", () => {
  assert.ok(memberDirectoryApi.includes("icon_name"), "member directory should select tag icon_name");
  assert.ok(memberDirectoryApi.includes("iconName:"), "member directory tags should expose iconName");
  assert.ok(memberAdminApi.includes("icon_name"), "member admin should select tag icon_name");
  assert.ok(memberAdminApi.includes("iconName:"), "member admin tags should expose iconName");
  assert.ok(memberAdminPage.includes("iconName: tag.iconName"), "member admin should pass iconName to TagChip");
  assert.ok(questsApi.includes("icon_name"), "quest tag joins should select tag icon_name");
  assert.ok(questsApi.includes("iconName:"), "quest tag refs should expose iconName");
  assert.ok(
    questsPage.includes("iconName: tag.iconName"),
    "quest TagChip wrapper should pass iconName to the shared chip",
  );
});
