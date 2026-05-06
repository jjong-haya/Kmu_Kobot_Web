import { getSupabaseBrowserClient } from "../auth/supabase";
import {
  getSensitivePermissions,
  SENSITIVE_PERMISSION_MESSAGE,
} from "../config/tag-policy";
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
  /** 동아리 태그 여부. true 면 부원 카드의 "건물 아이콘 + 동아리명" 메타에 자동 노출 */
  isClub: boolean;
  autoStatus: TagAutoStatus;
  createdAt: string;
  updatedAt: string;
};

export type TagDetail = MemberTag & {
  permissions: string[];
  navHrefs: string[];
  members: TagMember[];
};

export type MemberTagPolicySummary = MemberTag & {
  sensitivePermissions: string[];
  inviteAssignable: boolean;
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
  is_club?: boolean | null;
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
    isClub: row.is_club === true,
    autoStatus: row.auto_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TAG_SELECT_FULL =
  "id, slug, label, description, color, is_system, is_club, auto_status, created_at, updated_at";
const TAG_SELECT_LEGACY =
  "id, slug, label, description, color, is_system, auto_status, created_at, updated_at";

const IS_CLUB_SCHEMA_CACHE_KEY = "kobot.memberTags.isClubColumnAvailable";
const SCHEMA_CAPABILITY_TTL_MS = 5 * 60 * 1000;
const CLUB_TAG_SERVER_CONFIG_ERROR =
  "서버 설정이 아직 반영되지 않아 동아리 태그를 저장할 수 없습니다. 잠시 후 다시 시도하거나 운영 설정을 확인해 주세요.";

// 운영 DB 에 20260506030000 마이그레이션이 아직 안 올라간 경우를 대비해 defensive fallback.
function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true; // PG: undefined_column
  if (error.code === "PGRST204") return true; // PostgREST schema cache cannot find column
  const message = error.message?.toLowerCase() ?? "";
  return (
    /column .* does not exist/i.test(error.message ?? "") ||
    message.includes("could not find") ||
    message.includes("schema cache") ||
    message.includes("is_club")
  );
}

function readSchemaCapability() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(IS_CLUB_SCHEMA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { checkedAt?: unknown; value?: unknown };
    if (typeof parsed.checkedAt !== "number" || typeof parsed.value !== "boolean") return null;
    if (Date.now() - parsed.checkedAt > SCHEMA_CAPABILITY_TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeSchemaCapability(value: boolean) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      IS_CLUB_SCHEMA_CACHE_KEY,
      JSON.stringify({ checkedAt: Date.now(), value }),
    );
  } catch {
    // Capability caching only prevents repeated schema-cache 400s.
  }
}

function shouldSelectIsClub() {
  return readSchemaCapability() !== false;
}

function rememberSelectSuccess(usedFullSelect: boolean) {
  if (usedFullSelect) writeSchemaCapability(true);
}

export async function listTags(): Promise<MemberTag[]> {
  const supabase = getSupabaseBrowserClient();
  const useFullSelect = shouldSelectIsClub();
  let usedFullSelectSuccessfully = useFullSelect;
  let { data, error } = await supabase
    .from("member_tags")
    .select(useFullSelect ? TAG_SELECT_FULL : TAG_SELECT_LEGACY)
    .order("is_system", { ascending: false })
    .order("label", { ascending: true });
  if (error && isMissingColumn(error)) {
    writeSchemaCapability(false);
    usedFullSelectSuccessfully = false;
    ({ data, error } = await supabase
      .from("member_tags")
      .select(TAG_SELECT_LEGACY)
      .order("is_system", { ascending: false })
      .order("label", { ascending: true }));
  }
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  rememberSelectSuccess(usedFullSelectSuccessfully);
  return ((data ?? []) as MemberTagDbRow[]).map(rowToTag);
}

export async function listTagsForInviteDefaults(): Promise<MemberTagPolicySummary[]> {
  const supabase = getSupabaseBrowserClient();
  const tags = await listTags();
  if (tags.length === 0) return [];

  const { data, error } = await supabase
    .from("member_tag_permissions")
    .select("tag_id, permission")
    .in(
      "tag_id",
      tags.map((tag) => tag.id),
    );
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const sensitiveByTag = new Map<string, string[]>();
  for (const row of (data ?? []) as Array<{ tag_id: string; permission: string }>) {
    const sensitive = getSensitivePermissions([row.permission]);
    if (sensitive.length === 0) continue;
    sensitiveByTag.set(row.tag_id, [...(sensitiveByTag.get(row.tag_id) ?? []), ...sensitive]);
  }

  return tags.map((tag) => {
    const sensitivePermissions = sensitiveByTag.get(tag.id) ?? [];
    return {
      ...tag,
      sensitivePermissions,
      inviteAssignable: sensitivePermissions.length === 0,
    };
  });
}

export type MemberTagWithCounts = MemberTag & {
  permissionCount: number;
  navCount: number;
  memberCount: number;
};

export async function listTagsWithCounts(): Promise<MemberTagWithCounts[]> {
  const supabase = getSupabaseBrowserClient();
  const useFullSelect = shouldSelectIsClub();
  let usedFullSelectSuccessfully = useFullSelect;
  let tagsQuery = supabase
    .from("member_tags")
    .select(useFullSelect ? TAG_SELECT_FULL : TAG_SELECT_LEGACY)
    .order("is_system", { ascending: false })
    .order("label", { ascending: true });
  let tagsResult = await tagsQuery;
  if (tagsResult.error && isMissingColumn(tagsResult.error)) {
    writeSchemaCapability(false);
    usedFullSelectSuccessfully = false;
    tagsQuery = supabase
      .from("member_tags")
      .select(TAG_SELECT_LEGACY)
      .order("is_system", { ascending: false })
      .order("label", { ascending: true });
    tagsResult = await tagsQuery;
  }
  const [permsResult, navsResult, assignsResult] = await Promise.all([
    supabase.from("member_tag_permissions").select("tag_id"),
    supabase.from("member_tag_nav").select("tag_id"),
    supabase.from("member_tag_assignments").select("tag_id"),
  ]);
  if (tagsResult.error) throw new Error(sanitizeUserError(tagsResult.error, FALLBACK));
  if (permsResult.error) throw new Error(sanitizeUserError(permsResult.error, FALLBACK));
  if (navsResult.error) throw new Error(sanitizeUserError(navsResult.error, FALLBACK));
  if (assignsResult.error) throw new Error(sanitizeUserError(assignsResult.error, FALLBACK));
  rememberSelectSuccess(usedFullSelectSuccessfully);

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
  const useFullSelect = shouldSelectIsClub();
  let usedFullSelectSuccessfully = useFullSelect;
  let { data, error } = await supabase
    .from("member_tags")
    .select(useFullSelect ? TAG_SELECT_FULL : TAG_SELECT_LEGACY)
    .eq("slug", slug)
    .maybeSingle();
  if (error && isMissingColumn(error)) {
    writeSchemaCapability(false);
    usedFullSelectSuccessfully = false;
    ({ data, error } = await supabase
      .from("member_tags")
      .select(TAG_SELECT_LEGACY)
      .eq("slug", slug)
      .maybeSingle());
  }
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) return null;
  rememberSelectSuccess(usedFullSelectSuccessfully);
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
  isClub?: boolean;
};

export async function createTag(input: CreateTagInput): Promise<MemberTag> {
  const supabase = getSupabaseBrowserClient();
  const baseRow: Record<string, unknown> = {
    slug: input.slug.trim(),
    label: input.label.trim(),
    description: input.description?.trim() || null,
    color: input.color?.trim() || "#6b7280",
  };
  const useFullSelect = shouldSelectIsClub();
  let usedFullSelectSuccessfully = useFullSelect;
  let { data, error } = await supabase
    .from("member_tags")
    .insert(useFullSelect ? { ...baseRow, is_club: input.isClub === true } : baseRow)
    .select(useFullSelect ? TAG_SELECT_FULL : TAG_SELECT_LEGACY)
    .single();
  if (error && isMissingColumn(error)) {
    writeSchemaCapability(false);
    usedFullSelectSuccessfully = false;
    if (input.isClub === true) {
      throw new Error(CLUB_TAG_SERVER_CONFIG_ERROR);
    }
    ({ data, error } = await supabase
      .from("member_tags")
      .insert(baseRow)
      .select(TAG_SELECT_LEGACY)
      .single());
  }
  if (error) throw new Error(sanitizeUserError(error, "태그를 생성하지 못했습니다."));
  rememberSelectSuccess(usedFullSelectSuccessfully);
  return rowToTag(data as MemberTagDbRow);
}

export type UpdateTagInput = {
  label?: string;
  description?: string | null;
  color?: string;
  isClub?: boolean;
};

export async function updateTag(id: string, patch: UpdateTagInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const canWriteIsClub = shouldSelectIsClub();
  if (patch.isClub === true && !canWriteIsClub) {
    throw new Error(CLUB_TAG_SERVER_CONFIG_ERROR);
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) update.label = patch.label.trim();
  if (patch.description !== undefined)
    update.description = patch.description?.trim() || null;
  if (patch.isClub !== undefined && canWriteIsClub) update.is_club = patch.isClub;
  if (patch.color !== undefined) update.color = patch.color.trim();
  let { error } = await supabase.from("member_tags").update(update).eq("id", id);
  if (error && isMissingColumn(error) && patch.isClub !== undefined) {
    writeSchemaCapability(false);
    const legacyUpdate = { ...update };
    delete legacyUpdate.is_club;
    ({ error } = await supabase.from("member_tags").update(legacyUpdate).eq("id", id));
  }
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
  const sensitive = getSensitivePermissions(distinct);

  if (sensitive.length > 0) {
    const { data, error } = await supabase
      .from("member_tags")
      .select("is_club")
      .eq("id", tagId)
      .maybeSingle();
    if (error) throw new Error(sanitizeUserError(error, FALLBACK));
    if ((data as { is_club?: boolean } | null)?.is_club === true) {
      throw new Error(SENSITIVE_PERMISSION_MESSAGE);
    }
  }

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
