import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "초대 코드 처리 중 문제가 발생했습니다.";

export type InviteCodeRow = {
  id: string;
  code: string;
  label: string | null;
  club_affiliation: string | null;
  default_tags: string[];
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

function withDefaultTags(row: Partial<InviteCodeRow>): InviteCodeRow {
  return {
    ...(row as InviteCodeRow),
    default_tags: normalizeInviteTags(row.default_tags).length > 0 ? normalizeInviteTags(row.default_tags) : ["KOSS"],
  };
}

export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const supabase = getSupabaseBrowserClient();
  const extended = await supabase
    .from("course_invite_codes")
    .select(EXTENDED_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (!extended.error) return (extended.data ?? []).map((row) => withDefaultTags(row));
  if (!isMissingSchemaError(extended.error)) throw new Error(sanitizeUserError(extended.error, FALLBACK));

  const fallback = await supabase
    .from("course_invite_codes")
    .select(BASE_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));
  return (fallback.data ?? []).map((row) => withDefaultTags(row));
}

export type CreateInviteCodeInput = {
  code: string;
  label?: string | null;
  clubAffiliation?: string | null;
  defaultTags?: string[] | null;
  maxUses?: number | null;
  expiresAt?: string | null; // ISO timestamp
};

export async function createInviteCode(
  input: CreateInviteCodeInput,
): Promise<InviteCodeRow> {
  const supabase = getSupabaseBrowserClient();
  const defaultTags = normalizeInviteTags(input.defaultTags ?? ["KOSS"]);
  const extended = await supabase
    .from("course_invite_codes")
    .insert({
      code: input.code,
      label: input.label ?? null,
      club_affiliation: input.clubAffiliation ?? null,
      default_tags: defaultTags.length > 0 ? defaultTags : ["KOSS"],
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select(EXTENDED_SELECT_COLUMNS)
    .single();

  if (!extended.error) return withDefaultTags(extended.data);
  if (!isMissingSchemaError(extended.error)) throw new Error(sanitizeUserError(extended.error, FALLBACK));

  const fallback = await supabase
    .from("course_invite_codes")
    .insert({
      code: input.code,
      label: input.label ?? null,
      club_affiliation: input.clubAffiliation ?? null,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select(BASE_SELECT_COLUMNS)
    .single();

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));
  if (!fallback.data) throw new Error("저장 실패");
  return withDefaultTags(fallback.data);
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

/**
 * Generate a cryptographically random uppercase alphanumeric code,
 * e.g. "KOBOT-A7BC2D".
 *
 * SECURITY: uses crypto.getRandomValues() — Math.random() is predictable
 * (CWE-338) and unsuitable for invite-code generation, which is a low-grade
 * authentication factor.
 */
export function generateInviteCode(prefix = "KOBOT", length = 6): string {
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
