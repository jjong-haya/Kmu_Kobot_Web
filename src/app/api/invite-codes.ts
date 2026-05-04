import { getSupabaseBrowserClient } from "../auth/supabase";

export type InviteCodeRow = {
  id: string;
  code: string;
  label: string | null;
  club_affiliation: string | null;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
};

const SELECT_COLUMNS =
  "id, code, label, club_affiliation, max_uses, uses, expires_at, is_active, created_at, created_by";

export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("course_invite_codes")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type CreateInviteCodeInput = {
  code: string;
  label?: string | null;
  clubAffiliation?: string | null;
  maxUses?: number | null;
  expiresAt?: string | null; // ISO timestamp
};

export async function createInviteCode(
  input: CreateInviteCodeInput,
): Promise<InviteCodeRow> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("course_invite_codes")
    .insert({
      code: input.code,
      label: input.label ?? null,
      club_affiliation: input.clubAffiliation ?? null,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("저장 실패");
  return data;
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
  if (error) throw new Error(error.message);
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
