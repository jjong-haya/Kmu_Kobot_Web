import { getSupabaseBrowserClient } from "../auth/supabase";
import { SENSITIVE_PERMISSION_MESSAGE } from "../config/tag-policy";
import { sanitizeUserError } from "../utils/sanitize-error";
import {
  listTags,
  listTagsForInviteDefaults,
  type MemberTag,
  type MemberTagPolicySummary,
} from "./tags";

const FALLBACK = "초대 코드 처리 중 문제가 발생했습니다.";

export type InviteCodeTag = Pick<MemberTag, "id" | "slug" | "label" | "color" | "isClub">;

export type InviteCodeRow = {
  id: string;
  code: string;
  label: string | null;
  /** 레거시 DB 컬럼. 새 UI 판단에는 쓰지 않고 defaultTagObjects 의 동아리 태그에서 파생한다. */
  club_affiliation: string | null;
  default_tags: string[];
  defaultTagObjects: InviteCodeTag[];
  clubLabel: string | null;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
};

const BASE_SELECT_COLUMNS =
  "id, code, label, club_affiliation, max_uses, uses, expires_at, is_active, created_at, created_by";
const EXTENDED_SELECT_COLUMNS =
  "id, code, label, club_affiliation, default_tags, max_uses, uses, expires_at, is_active, created_at, created_by";

function isMissingSchemaError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  );
}

function slugKey(slug: string) {
  return slug.trim().toLocaleLowerCase("ko-KR");
}

function compareSlugAsc(a: { slug: string }, b: { slug: string }) {
  return a.slug.localeCompare(b.slug, "en", { sensitivity: "base" });
}

export function normalizeInviteTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n]+/)
      : [];
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of rawTags) {
    if (typeof raw !== "string") continue;
    const tag = raw.normalize("NFKC").trim().replace(/^#+/, "").replace(/\s+/g, " ");
    const key = tag.toLocaleLowerCase("ko-KR");
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag.slice(0, 32));
    if (tags.length >= 12) break;
  }

  return tags;
}

function tagMapFor(catalog: InviteCodeTag[]) {
  return new Map(catalog.map((tag) => [slugKey(tag.slug), tag]));
}

function fallbackTagFor(slug: string): InviteCodeTag {
  return {
    id: `missing:${slug}`,
    slug,
    label: slug,
    color: "#6b7280",
    isClub: false,
  };
}

function tagsForSlugs(slugs: string[], catalog: InviteCodeTag[]) {
  const bySlug = tagMapFor(catalog);
  return slugs.map((slug) => bySlug.get(slugKey(slug)) ?? fallbackTagFor(slug));
}

function requireInviteAssignableTags(slugs: string[], catalog: MemberTagPolicySummary[]) {
  const bySlug = tagMapFor(catalog);
  const missing: string[] = [];
  const selected: MemberTagPolicySummary[] = [];

  for (const slug of slugs) {
    const tag = bySlug.get(slugKey(slug)) as MemberTagPolicySummary | undefined;
    if (!tag) {
      missing.push(slug);
      continue;
    }
    selected.push(tag);
  }

  if (missing.length > 0) {
    throw new Error("존재하는 태그만 초대 코드에 부여할 수 있습니다.");
  }

  const blocked = selected.filter((tag) => !tag.inviteAssignable);
  if (blocked.length > 0) {
    throw new Error(SENSITIVE_PERMISSION_MESSAGE);
  }

  return selected;
}

function firstClubLabel(tags: InviteCodeTag[]) {
  return [...tags].filter((tag) => tag.isClub).sort(compareSlugAsc)[0]?.label ?? null;
}

function withDefaultTags(row: Partial<InviteCodeRow>, catalog: InviteCodeTag[] = []): InviteCodeRow {
  const defaultTags = normalizeInviteTags(row.default_tags);
  const normalizedDefaultTags = defaultTags.length > 0 ? defaultTags : ["KOSS"];
  const defaultTagObjects = tagsForSlugs(normalizedDefaultTags, catalog);
  return {
    ...(row as InviteCodeRow),
    default_tags: normalizedDefaultTags,
    defaultTagObjects,
    clubLabel: firstClubLabel(defaultTagObjects),
  };
}

export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const supabase = getSupabaseBrowserClient();
  const tags = await listTags();
  const extended = await supabase
    .from("course_invite_codes")
    .select(EXTENDED_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (!extended.error) return (extended.data ?? []).map((row) => withDefaultTags(row, tags));
  if (!isMissingSchemaError(extended.error)) throw new Error(sanitizeUserError(extended.error, FALLBACK));

  const fallback = await supabase
    .from("course_invite_codes")
    .select(BASE_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));
  return (fallback.data ?? []).map((row) => withDefaultTags(row, tags));
}

export type CreateInviteCodeInput = {
  code: string;
  label?: string | null;
  /** @deprecated 동아리는 defaultTags 중 isClub=true 태그에서 slug ASC 첫 항목으로 파생한다. */
  clubAffiliation?: string | null;
  defaultTags?: string[] | null;
  maxUses?: number | null;
  expiresAt?: string | null; // ISO timestamp
};

export async function createInviteCode(
  input: CreateInviteCodeInput,
): Promise<InviteCodeRow> {
  const supabase = getSupabaseBrowserClient();
  const code = normalizeInviteCode(input.code);
  if (!code) throw new Error("초대 코드를 입력해 주세요.");

  const defaultTags = normalizeInviteTags(input.defaultTags ?? ["KOSS"]);
  const inviteTags = await listTagsForInviteDefaults();
  const selectedSlugs = defaultTags.length > 0 ? defaultTags : ["KOSS"];
  const tagObjects = requireInviteAssignableTags(selectedSlugs, inviteTags);
  const derivedClubLabel = firstClubLabel(tagObjects);
  const extended = await supabase
    .from("course_invite_codes")
    .insert({
      code,
      label: input.label ?? null,
      club_affiliation: derivedClubLabel,
      default_tags: selectedSlugs,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select(EXTENDED_SELECT_COLUMNS)
    .single();

  if (!extended.error) return withDefaultTags(extended.data, inviteTags);
  if (!isMissingSchemaError(extended.error)) throw new Error(sanitizeUserError(extended.error, FALLBACK));

  const fallback = await supabase
    .from("course_invite_codes")
    .insert({
      code,
      label: input.label ?? null,
      club_affiliation: derivedClubLabel,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select(BASE_SELECT_COLUMNS)
    .single();

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));
  if (!fallback.data) throw new Error("저장 실패");
  return withDefaultTags(fallback.data, inviteTags);
}

export async function setInviteCodeActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("course_invite_codes")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export function normalizeInviteCode(value: string): string {
  return value.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Generate a cryptographically random uppercase alphanumeric code,
 * e.g. "A7BC2D". Pass a prefix only when a branded legacy code is needed.
 *
 * SECURITY: uses crypto.getRandomValues() — Math.random() is predictable
 * (CWE-338) and unsuitable for invite-code generation, which is a low-grade
 * authentication factor.
 */
export function generateInviteCode(prefix = "", length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 (visual confusion)
  const buf = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    // Fallback for very old envs only — flag for review.
    for (let i = 0; i < length; i++) buf[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += chars[buf[i] % chars.length];
  }
  return prefix ? `${prefix}-${suffix}` : suffix;
}
