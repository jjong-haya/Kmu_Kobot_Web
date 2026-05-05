import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "태그 정보를 처리하지 못했습니다.";

export type TagAutoStatus = "active" | "course_member" | null;

export type MemberTag = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  autoStatus: TagAutoStatus;
  createdAt: string;
  updatedAt: string;
};

export type TagDetail = MemberTag & {
  permissions: string[];
  navHrefs: string[];
  members: TagMember[];
};

export type TagMember = {
  userId: string;
  displayName: string;
  loginId: string | null;
  email: string | null;
  status: string | null;
};

type MemberTagDbRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string;
  is_system: boolean;
  auto_status: TagAutoStatus;
  created_at: string;
  updated_at: string;
};

function rowToTag(row: MemberTagDbRow): MemberTag {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    color: row.color,
    isSystem: row.is_system,
    autoStatus: row.auto_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TAG_SELECT =
  "id, slug, label, description, color, is_system, auto_status, created_at, updated_at";

export async function listTags(): Promise<MemberTag[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("member_tags")
    .select(TAG_SELECT)
    .order("is_system", { ascending: false })
    .order("label", { ascending: true });
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return ((data ?? []) as MemberTagDbRow[]).map(rowToTag);
}

export type MemberTagWithCounts = MemberTag & {
  permissionCount: number;
  navCount: number;
  memberCount: number;
};

export async function listTagsWithCounts(): Promise<MemberTagWithCounts[]> {
  const supabase = getSupabaseBrowserClient();
  const [tagsResult, permsResult, navsResult, assignsResult] = await Promise.all([
    supabase
      .from("member_tags")
      .select(TAG_SELECT)
      .order("is_system", { ascending: false })
      .order("label", { ascending: true }),
    supabase.from("member_tag_permissions").select("tag_id"),
    supabase.from("member_tag_nav").select("tag_id"),
    supabase.from("member_tag_assignments").select("tag_id"),
  ]);
  if (tagsResult.error) throw new Error(sanitizeUserError(tagsResult.error, FALLBACK));
  if (permsResult.error) throw new Error(sanitizeUserError(permsResult.error, FALLBACK));
  if (navsResult.error) throw new Error(sanitizeUserError(navsResult.error, FALLBACK));
  if (assignsResult.error) throw new Error(sanitizeUserError(assignsResult.error, FALLBACK));

  function tally(rows: Array<{ tag_id: string }> | null) {
    const map = new Map<string, number>();
    for (const row of rows ?? []) map.set(row.tag_id, (map.get(row.tag_id) ?? 0) + 1);
    return map;
  }

  const permMap = tally((permsResult.data ?? []) as Array<{ tag_id: string }>);
  const navMap = tally((navsResult.data ?? []) as Array<{ tag_id: string }>);
  const assignMap = tally((assignsResult.data ?? []) as Array<{ tag_id: string }>);

  return ((tagsResult.data ?? []) as MemberTagDbRow[]).map((row) => ({
    ...rowToTag(row),
    permissionCount: permMap.get(row.id) ?? 0,
    navCount: navMap.get(row.id) ?? 0,
    memberCount: assignMap.get(row.id) ?? 0,
  }));
}

export async function getTagBySlug(slug: string): Promise<TagDetail | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("member_tags")
    .select(TAG_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) return null;
  const tag = rowToTag(data as MemberTagDbRow);

  const [permsResult, navResult, assignResult] = await Promise.all([
    supabase.from("member_tag_permissions").select("permission").eq("tag_id", tag.id),
    supabase.from("member_tag_nav").select("href").eq("tag_id", tag.id),
    supabase
      .from("member_tag_assignments")
      .select("user_id")
      .eq("tag_id", tag.id),
  ]);

  if (permsResult.error) throw new Error(sanitizeUserError(permsResult.error, FALLBACK));
  if (navResult.error) throw new Error(sanitizeUserError(navResult.error, FALLBACK));
  if (assignResult.error) throw new Error(sanitizeUserError(assignResult.error, FALLBACK));

  const memberIds = ((assignResult.data ?? []) as Array<{ user_id: string }>).map(
    (r) => r.user_id,
  );
  const members = await loadTagMembers(memberIds);

  return {
    ...tag,
    permissions: ((permsResult.data ?? []) as Array<{ permission: string }>).map(
      (r) => r.permission,
    ),
    navHrefs: ((navResult.data ?? []) as Array<{ href: string }>).map((r) => r.href),
    members,
  };
}

async function loadTagMembers(userIds: string[]): Promise<TagMember[]> {
  if (userIds.length === 0) return [];
  const supabase = getSupabaseBrowserClient();
  const [profilesResult, accountsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, nickname_display, full_name, login_id, email")
      .in("id", userIds),
    supabase.from("member_accounts").select("user_id, status").in("user_id", userIds),
  ]);
  if (profilesResult.error)
    throw new Error(sanitizeUserError(profilesResult.error, FALLBACK));
  if (accountsResult.error)
    throw new Error(sanitizeUserError(accountsResult.error, FALLBACK));

  const statusByUser = new Map(
    ((accountsResult.data ?? []) as Array<{ user_id: string; status: string }>).map(
      (r) => [r.user_id, r.status],
    ),
  );

  return ((profilesResult.data ?? []) as Array<{
    id: string;
    display_name: string | null;
    nickname_display: string | null;
    full_name: string | null;
    login_id: string | null;
    email: string | null;
  }>).map((row) => ({
    userId: row.id,
    displayName:
      row.nickname_display?.trim() ||
      row.display_name?.trim() ||
      row.full_name?.trim() ||
      row.email?.split("@")[0] ||
      "이름 없음",
    loginId: row.login_id?.trim() || null,
    email: row.email?.trim() || null,
    status: statusByUser.get(row.id) ?? null,
  }));
}

export type CreateTagInput = {
  slug: string;
  label: string;
  description?: string | null;
  color?: string;
};

export async function createTag(input: CreateTagInput): Promise<MemberTag> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("member_tags")
    .insert({
      slug: input.slug.trim(),
      label: input.label.trim(),
      description: input.description?.trim() || null,
      color: input.color?.trim() || "#6b7280",
    })
    .select(TAG_SELECT)
    .single();
  if (error) throw new Error(sanitizeUserError(error, "태그를 생성하지 못했습니다."));
  return rowToTag(data as MemberTagDbRow);
}

export type UpdateTagInput = {
  label?: string;
  description?: string | null;
  color?: string;
};

export async function updateTag(id: string, patch: UpdateTagInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) update.label = patch.label.trim();
  if (patch.description !== undefined)
    update.description = patch.description?.trim() || null;
  if (patch.color !== undefined) update.color = patch.color.trim();
  const { error } = await supabase.from("member_tags").update(update).eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, "태그를 수정하지 못했습니다."));
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("member_tags").delete().eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, "태그를 삭제하지 못했습니다."));
}

export async function setTagPermissions(
  tagId: string,
  permissions: string[],
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const distinct = Array.from(new Set(permissions.map((p) => p.trim()).filter(Boolean)));

  // delete-then-insert is simplest with the small row counts we expect.
  const del = await supabase.from("member_tag_permissions").delete().eq("tag_id", tagId);
  if (del.error) throw new Error(sanitizeUserError(del.error, FALLBACK));
  if (distinct.length === 0) return;
  const { error } = await supabase
    .from("member_tag_permissions")
    .insert(distinct.map((permission) => ({ tag_id: tagId, permission })));
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function setTagNav(tagId: string, hrefs: string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const distinct = Array.from(new Set(hrefs.map((h) => h.trim()).filter(Boolean)));
  const del = await supabase.from("member_tag_nav").delete().eq("tag_id", tagId);
  if (del.error) throw new Error(sanitizeUserError(del.error, FALLBACK));
  if (distinct.length === 0) return;
  const { error } = await supabase
    .from("member_tag_nav")
    .insert(distinct.map((href) => ({ tag_id: tagId, href })));
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function assignTagToUser(tagId: string, userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("member_tag_assignments")
    .upsert(
      { tag_id: tagId, user_id: userId },
      { onConflict: "user_id,tag_id" },
    );
  if (error) throw new Error(sanitizeUserError(error, "태그 부여에 실패했습니다."));
}

export async function removeTagFromUser(tagId: string, userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("member_tag_assignments")
    .delete()
    .eq("tag_id", tagId)
    .eq("user_id", userId);
  if (error) throw new Error(sanitizeUserError(error, "태그 회수에 실패했습니다."));
}

export async function listMyTagPermissions(): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("current_user_tag_permissions");
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return ((data ?? []) as Array<string | { permission?: string }>).flatMap((row) => {
    if (typeof row === "string") return [row];
    if (row && typeof row === "object" && "permission" in row && row.permission)
      return [row.permission];
    return [];
  });
}

export async function listMyTagNavPaths(): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("current_user_tag_nav_paths");
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return ((data ?? []) as Array<string | { href?: string }>).flatMap((row) => {
    if (typeof row === "string") return [row];
    if (row && typeof row === "object" && "href" in row && row.href) return [row.href];
    return [];
  });
}
