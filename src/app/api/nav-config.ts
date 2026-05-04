import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "사이드바 설정을 처리하지 못했습니다.";

export type NavRoleKey = "course_member";

export type NavVisibilityRow = {
  href: string;
  visible: boolean;
  updatedAt: string | null;
};

type NavVisibilityDbRow = {
  href: string;
  visible: boolean;
  updated_at: string | null;
};

export const COURSE_MEMBER_DEFAULT_PATHS: ReadonlyArray<string> = [
  "/member",
  "/member/notifications",
  "/member/announcements",
  "/member/contact-requests",
  "/member/members",
  "/member/space-booking",
];

export async function listNavVisibility(
  roleKey: NavRoleKey,
): Promise<NavVisibilityRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("nav_visibility")
    .select("href, visible, updated_at")
    .eq("role_key", roleKey);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return ((data ?? []) as NavVisibilityDbRow[]).map((row) => ({
    href: row.href,
    visible: row.visible,
    updatedAt: row.updated_at,
  }));
}

export async function setNavVisibility(
  roleKey: NavRoleKey,
  href: string,
  visible: boolean,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("nav_visibility").upsert(
    {
      role_key: roleKey,
      href,
      visible,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "role_key,href" },
  );

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function fetchCourseMemberAllowedPaths(): Promise<Set<string>> {
  try {
    const rows = await listNavVisibility("course_member");
    if (rows.length === 0) return new Set(COURSE_MEMBER_DEFAULT_PATHS);
    return new Set(rows.filter((row) => row.visible).map((row) => row.href));
  } catch {
    // RLS or network failure — return defaults so the sidebar still works.
    return new Set(COURSE_MEMBER_DEFAULT_PATHS);
  }
}
