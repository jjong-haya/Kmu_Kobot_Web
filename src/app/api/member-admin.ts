import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "처리에 실패했습니다.";

export type AdminMemberStatus =
  | "pending"
  | "active"
  | "rejected"
  | "withdrawn";

export type AdminApplicationStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | null;

export type AdminMemberRow = {
  id: string;
  email: string | null;
  displayName: string;
  fullName: string | null;
  loginId: string | null;
  studentId: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  clubAffiliation: string | null;
  status: AdminMemberStatus | null;
  approvedAt: string | null;
  createdAt: string | null;
  tags: AdminMemberTag[];
  isPresident: boolean;
  applicationStatus: AdminApplicationStatus;
  applicationSubmittedAt: string | null;
};

export type AdminMemberTag = {
  id: string;
  slug: string;
  label: string;
  color: string;
  isSystem: boolean;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  nickname_display: string | null;
  full_name: string | null;
  login_id: string | null;
  student_id: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  club_affiliation: string | null;
  created_at: string | null;
};

type AccountRow = {
  user_id: string;
  status: AdminMemberStatus | null;
  approved_at: string | null;
  created_at: string | null;
};

type AssignmentJoinRow = {
  user_id: string;
  member_tags: {
    id: string;
    slug: string;
    label: string;
    color: string;
    is_system: boolean;
  } | null;
};

type OrgPositionAssignmentRow = {
  user_id: string;
  org_positions: { slug: string | null } | null;
};

const PROFILE_SELECT = [
  "id",
  "email",
  "display_name",
  "nickname_display",
  "full_name",
  "login_id",
  "student_id",
  "phone",
  "college",
  "department",
  "club_affiliation",
  "created_at",
].join(", ");

function pickDisplayName(row: ProfileRow) {
  return (
    row.nickname_display?.trim() ||
    row.display_name?.trim() ||
    row.full_name?.trim() ||
    row.email?.split("@")[0] ||
    "이름 없음"
  );
}

export async function listAdminMembers(): Promise<AdminMemberRow[]> {
  const supabase = getSupabaseBrowserClient();
  const [
    profilesResult,
    accountsResult,
    assignmentsResult,
    positionsResult,
    applicationsResult,
  ] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).order("created_at", { ascending: false }),
    supabase.from("member_accounts").select("user_id, status, approved_at, created_at"),
    supabase
      .from("member_tag_assignments")
      .select("user_id, member_tags(id, slug, label, color, is_system)"),
    supabase
      .from("org_position_assignments")
      .select("user_id, org_positions(slug)")
      .eq("active", true),
    supabase
      .from("membership_applications")
      .select("user_id, status, submitted_at"),
  ]);

  if (profilesResult.error) throw new Error(sanitizeUserError(profilesResult.error, FALLBACK));
  if (accountsResult.error) throw new Error(sanitizeUserError(accountsResult.error, FALLBACK));
  if (assignmentsResult.error)
    throw new Error(sanitizeUserError(assignmentsResult.error, FALLBACK));
  // applications fetch may fail if RLS doesn't expose it; degrade silently.
  const applicationByUser = new Map<
    string,
    { status: AdminApplicationStatus; submittedAt: string | null }
  >();
  if (!applicationsResult.error) {
    for (const row of (applicationsResult.data ?? []) as Array<{
      user_id: string;
      status: AdminApplicationStatus;
      submitted_at: string | null;
    }>) {
      applicationByUser.set(row.user_id, {
        status: row.status,
        submittedAt: row.submitted_at,
      });
    }
  }

  const accountByUser = new Map(
    ((accountsResult.data ?? []) as AccountRow[]).map((row) => [row.user_id, row]),
  );

  const tagsByUser = new Map<string, AdminMemberTag[]>();
  for (const row of (assignmentsResult.data ?? []) as AssignmentJoinRow[]) {
    if (!row.member_tags) continue;
    const arr = tagsByUser.get(row.user_id) ?? [];
    arr.push({
      id: row.member_tags.id,
      slug: row.member_tags.slug,
      label: row.member_tags.label,
      color: row.member_tags.color,
      isSystem: row.member_tags.is_system,
    });
    tagsByUser.set(row.user_id, arr);
  }

  const presidentSet = new Set(
    ((positionsResult.data ?? []) as OrgPositionAssignmentRow[])
      .filter((row) => row.org_positions?.slug?.toLowerCase() === "president")
      .map((row) => row.user_id),
  );

  return ((profilesResult.data ?? []) as ProfileRow[]).map((row) => {
    const account = accountByUser.get(row.id);
    return {
      id: row.id,
      email: row.email,
      displayName: pickDisplayName(row),
      fullName: row.full_name,
      loginId: row.login_id,
      studentId: row.student_id,
      phone: row.phone,
      college: row.college,
      department: row.department,
      clubAffiliation: row.club_affiliation,
      status: account?.status ?? null,
      approvedAt: account?.approved_at ?? null,
      createdAt: row.created_at ?? account?.created_at ?? null,
      tags: tagsByUser.get(row.id) ?? [],
      isPresident: presidentSet.has(row.id),
      applicationStatus: applicationByUser.get(row.id)?.status ?? null,
      applicationSubmittedAt: applicationByUser.get(row.id)?.submittedAt ?? null,
    };
  });
}

export async function adminSetMemberStatus(
  userId: string,
  status: AdminMemberStatus,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("admin_set_member_status", {
    target_user_id: userId,
    new_status: status,
  });
  if (error) throw new Error(sanitizeUserError(error, "상태를 변경하지 못했습니다."));
}

export async function adminUpdateMemberProfile(
  userId: string,
  patch: Partial<{
    displayName: string;
    nicknameDisplay: string;
    fullName: string;
    studentId: string;
    phone: string;
    college: string;
    department: string;
    clubAffiliation: string;
    loginId: string;
  }>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const dbPatch: Record<string, string | null> = {};
  if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
  if (patch.nicknameDisplay !== undefined) dbPatch.nickname_display = patch.nicknameDisplay;
  if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
  if (patch.studentId !== undefined) dbPatch.student_id = patch.studentId;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.college !== undefined) dbPatch.college = patch.college;
  if (patch.department !== undefined) dbPatch.department = patch.department;
  if (patch.clubAffiliation !== undefined) dbPatch.club_affiliation = patch.clubAffiliation;
  if (patch.loginId !== undefined) dbPatch.login_id = patch.loginId;

  const { error } = await supabase.rpc("admin_update_member_profile", {
    target_user_id: userId,
    patch: dbPatch,
  });
  if (error) throw new Error(sanitizeUserError(error, "프로필을 수정하지 못했습니다."));
}

export async function adminDeleteMember(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("admin_delete_member", {
    target_user_id: userId,
  });
  if (error) throw new Error(sanitizeUserError(error, "계정을 삭제하지 못했습니다."));
}
