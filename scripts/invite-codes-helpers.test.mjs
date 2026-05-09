import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatInviteJoinTitle,
  generateInviteCode,
  getInviteIssueMessage,
  getInviteTargetLabel,
  hasHangulFinalConsonant,
  normalizeInviteCode,
  normalizeInviteTags,
} from "../src/app/api/invite-codes.ts";

const inviteCourseSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/public/InviteCourse.tsx"),
  "utf8",
);
const inviteCodesPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/InviteCodes.tsx"),
  "utf8",
);
const inviteCodesApiSource = readFileSync(
  resolve(process.cwd(), "src/app/api/invite-codes.ts"),
  "utf8",
);
const authCallbackSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/public/AuthCallback.tsx"),
  "utf8",
);
const previewMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260507014000_course_invite_public_preview.sql"),
  "utf8",
);
const inviteBoundaryMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260509003000_invite_link_status_and_role_tag_boundary.sql"),
  "utf8",
);

test("normalizeInviteCode trims, uppercases, and removes whitespace", () => {
  assert.equal(normalizeInviteCode("  abcdef  "), "ABCDEF");
  assert.equal(normalizeInviteCode("ab cd ef"), "ABCDEF");
  assert.equal(normalizeInviteCode("\t aB c \n"), "ABC");
});

test("normalizeInviteCode handles full-width and combining forms via NFKC", () => {
  assert.equal(normalizeInviteCode("ＡＢＣ"), "ABC");
});

test("generateInviteCode produces uppercase alphanumeric of given length", () => {
  for (let i = 0; i < 50; i++) {
    const code = generateInviteCode("", 6);
    assert.equal(code.length, 6);
    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  }
});

test("generateInviteCode prefix is joined with a hyphen", () => {
  const code = generateInviteCode("KOBOT", 4);
  assert.match(code, /^KOBOT-[A-HJ-NP-Z2-9]{4}$/);
});

test("generateInviteCode never produces visually-confusing chars", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateInviteCode("", 8);
    assert.doesNotMatch(code, /[I01O]/);
  }
});

test("generateInviteCode entropy: 30 codes are all distinct (probabilistic)", () => {
  const seen = new Set();
  for (let i = 0; i < 30; i++) seen.add(generateInviteCode("", 8));
  assert.equal(seen.size, 30);
});

test("normalizeInviteTags accepts comma- and newline-separated strings", () => {
  assert.deepEqual(normalizeInviteTags("foo, bar\nbaz"), ["foo", "bar", "baz"]);
});

test("normalizeInviteTags strips leading hashes", () => {
  assert.deepEqual(normalizeInviteTags("#hello, ##world"), ["hello", "world"]);
  assert.deepEqual(normalizeInviteTags("###tag"), ["tag"]);
});

test("normalizeInviteTags deduplicates case-insensitively", () => {
  assert.deepEqual(normalizeInviteTags(["Foo", "FOO", "foo", "Bar"]), ["Foo", "Bar"]);
});

test("normalizeInviteTags caps at 12 tags", () => {
  const fifteen = Array.from({ length: 15 }, (_, i) => `t${i}`);
  assert.equal(normalizeInviteTags(fifteen).length, 12);
});

test("normalizeInviteTags caps each tag at 32 chars", () => {
  const long = "a".repeat(50);
  const result = normalizeInviteTags([long]);
  assert.equal(result[0].length, 32);
});

test("normalizeInviteTags returns empty array for non-string/non-array input", () => {
  assert.deepEqual(normalizeInviteTags(undefined), []);
  assert.deepEqual(normalizeInviteTags(null), []);
  assert.deepEqual(normalizeInviteTags(42), []);
  assert.deepEqual(normalizeInviteTags({}), []);
});

test("normalizeInviteTags ignores non-string elements in arrays", () => {
  assert.deepEqual(normalizeInviteTags(["foo", 1, null, "bar"]), ["foo", "bar"]);
});

test("formats invite landing copy from the invite club tag label", () => {
  assert.equal(getInviteTargetLabel({ clubLabel: "연구팀" }), "연구팀");
  assert.equal(getInviteTargetLabel(null), "초대받은 동아리");
  assert.equal(hasHangulFinalConsonant("코봇"), true);
  assert.equal(hasHangulFinalConsonant("홍보"), false);
  assert.equal(formatInviteJoinTitle({ clubLabel: "코봇" }), "코봇으로 가입");
  assert.equal(formatInviteJoinTitle({ clubLabel: "홍보" }), "홍보로 가입");
  assert.equal(formatInviteJoinTitle({ clubLabel: "KOBOT" }), "KOBOT로 가입");
  assert.equal(formatInviteJoinTitle(null), "초대 코드로 가입");
});

test("invite landing page does not hard-code KOSS display copy", () => {
  assert.doesNotMatch(inviteCourseSource, /KOSS로 가입/);
  assert.doesNotMatch(inviteCourseSource, /KOSS 참여자용/);
  assert.doesNotMatch(inviteCourseSource, /KOSS 회원이 사용할 수 있는 메뉴/);
  assert.doesNotMatch(inviteCourseSource, /KOSS 권한/);
  assert.match(inviteCourseSource, /getInviteCoursePreview/);
  assert.match(inviteCourseSource, /formatInviteJoinTitle/);
});

test("invite link unavailable alerts distinguish expired and disappeared links", () => {
  assert.equal(
    getInviteIssueMessage("expired"),
    "만료된 초대 링크입니다. 운영진에게 새 링크를 요청해 주세요.",
  );
  assert.equal(
    getInviteIssueMessage("blocked"),
    "사라진 초대 링크입니다. 운영진에게 받은 최신 링크로 다시 접속해 주세요.",
  );
  assert.equal(
    getInviteIssueMessage("missing"),
    "사라진 초대 링크입니다. 운영진에게 받은 최신 링크로 다시 접속해 주세요.",
  );
  assert.match(inviteCourseSource, /availabilityStatus/);
  assert.match(inviteCourseSource, /previewChecked/);
  assert.match(authCallbackSource, /invite-error/);
  assert.match(authCallbackSource, /redeemResult\?\.success === false/);
});

test("prevents KOSS default invite tag pollution in new invite write paths", () => {
  assert.doesNotMatch(inviteCodesApiSource, /input\.defaultTags \?\? \["KOSS"\]/);
  assert.doesNotMatch(inviteCodesApiSource, /defaultTags\.length > 0 \? defaultTags : \["KOSS"\]/);
  assert.doesNotMatch(inviteCodesPageSource, /setSelectedTagSlugs\(\[koss\.slug\]\)/);
  assert.match(inviteCodesApiSource, /초대 코드는 동아리 태그만 기본 부여할 수 있습니다\./);
  assert.match(inviteCodesPageSource, /tag\.isClub && tag\.inviteAssignable/);
  assert.match(inviteBoundaryMigrationSource, /when lower\(btrim\(selected_tag\.slug\)\) = 'koss' then 'kobot'/);
  assert.match(inviteBoundaryMigrationSource, /invite_default_tags_required/);
  assert.match(inviteBoundaryMigrationSource, /invite_default_tag_must_be_club/);
});

test("invite codes table keeps header body and empty-state column counts aligned", () => {
  assert.match(inviteCodesPageSource, /id: "clubTags"/);
  assert.match(inviteCodesPageSource, /header: "동아리 태그"/);
  assert.match(inviteCodesPageSource, /const INVITE_TABLE_COLUMN_COUNT = inviteCodeColumns\.length \+ 1/);
  assert.match(inviteCodesPageSource, /colSpan={INVITE_TABLE_COLUMN_COUNT}/);
  assert.doesNotMatch(inviteCodesPageSource, /colSpan={8}/);
  assert.match(inviteCodesPageSource, /<colgroup>/);
  assert.match(inviteCodesPageSource, /tableLayout: "fixed"/);
});

test("invite preview RPC derives the public club label from club tags", () => {
  const source = `${previewMigrationSource}\n${inviteBoundaryMigrationSource}`;
  assert.match(source, /get_course_invite_preview/);
  assert.match(source, /cic\.default_tags/);
  assert.match(source, /mt\.is_club = true/);
  assert.match(source, /availability_status text/);
  assert.match(source, /when cic\.is_active = false then 'blocked'/);
  assert.match(source, /when cic\.expires_at is not null and cic\.expires_at < now\(\) then 'expired'/);
  assert.match(source, /grant execute on function public\.get_course_invite_preview\(text\) to anon, authenticated/);
});
