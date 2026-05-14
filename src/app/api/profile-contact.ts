import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import { extractGithubLoginFromUrl } from "../utils/github";
import { triggerGithubSyncInBackground } from "./github-sync";

const FALLBACK = "프로필 연락처 정보를 처리하지 못했습니다.";

export type OwnProfileContactFields = {
  profileBio: string | null;
  publicEmail: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
};

type ProfileContactRow = {
  profile_bio: string | null;
  public_email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNullableString(value: string) {
  return value.trim() || null;
}

export function extractGithubLoginFromProfileUrl(value: string | null | undefined) {
  return extractGithubLoginFromUrl(value);
}

export async function getOwnProfileContactFields(): Promise<OwnProfileContactFields> {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw new Error(sanitizeUserError(userError, FALLBACK));
  if (!userData.user) throw new Error("로그인 상태를 확인할 수 없습니다.");

  const { data, error } = await supabase
    .from("profiles")
    .select("profile_bio, public_email, github_url, linkedin_url")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const row = data as ProfileContactRow | null;
  return {
    profileBio: normalizeString(row?.profile_bio),
    publicEmail: normalizeString(row?.public_email),
    githubUrl: normalizeString(row?.github_url),
    linkedinUrl: normalizeString(row?.linkedin_url),
  };
}

export async function updateOwnProfileContactFields(
  input: OwnProfileContactFields,
): Promise<OwnProfileContactFields> {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw new Error(sanitizeUserError(userError, FALLBACK));
  if (!userData.user) throw new Error("로그인 상태를 확인할 수 없습니다.");

  const payload = {
    profile_bio: normalizeNullableString(input.profileBio ?? ""),
    public_email: normalizeNullableString(input.publicEmail ?? ""),
    github_url: normalizeNullableString(input.githubUrl ?? ""),
    linkedin_url: normalizeNullableString(input.linkedinUrl ?? ""),
    profile_completed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userData.user.id);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  triggerGithubSyncInBackground(10);

  return {
    profileBio: payload.profile_bio,
    publicEmail: payload.public_email,
    githubUrl: payload.github_url,
    linkedinUrl: payload.linkedin_url,
  };
}
