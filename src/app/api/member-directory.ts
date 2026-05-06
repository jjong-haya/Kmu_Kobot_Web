import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import { triggerGithubSync } from "./github-sync";

const FALLBACK = "멤버 정보를 처리하지 못했습니다.";

export type DirectoryViewMode = "cards" | "list";

export type MemberDirectoryTag = {
  id: string;
  slug: string;
  label: string;
  color: string;
  isClub: boolean;
};

export type MemberDirectoryProfile = {
  id: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  publicEmail: string | null;
  avatarUrl: string | null;
  loginId: string | null;
  college: string | null;
  department: string | null;
  clubAffiliation: string | null;
  displayClubTagId: string | null;
  profileBio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  status: string | null;
  joinedAt: string | null;
  positionLabels: string[];
  officialTeamLabels: string[];
  projectLabels: string[];
  roleLabels: string[];
  /** 라벨 문자열 배열. 검색·필터 호환용으로 유지. */
  tags: string[];
  /** 실제 태그 객체 (slug+label+color+isClub). 카드 칩 렌더용 — TagChip 에 그대로 전달 가능. */
  memberTags: MemberDirectoryTag[];
  projectCount: number;
  isPresident: boolean;
  isSelf: boolean;
  isFavorite: boolean;
};

export type MemberDirectoryData = {
  members: MemberDirectoryProfile[];
  clubOptions: string[];
  tagOptions: string[];
  profileExtensionsAvailable: boolean;
  favoritesAvailable: boolean;
};

export type UpdateOwnDirectoryProfileInput = {
  nicknameDisplay: string;
  profileBio: string;
  publicEmail: string;
  githubUrl: string;
  linkedinUrl: string;
  clubAffiliation?: string | null;
  displayClubTagId?: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  nickname_display?: string | null;
  login_id?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  college?: string | null;
  department?: string | null;
  club_affiliation?: string | null;
  display_club_tag_id?: string | null;
  profile_bio?: string | null;
  public_email?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  created_at: string | null;
};

type AccountRow = {
  user_id: string;
  status: string | null;
  approved_at: string | null;
  created_at: string | null;
};

type OrgPositionAssignmentRow = {
  user_id: string;
  org_positions?: { name?: string | null; slug?: string | null } | null;
};

type TeamMembershipRow = {
  user_id: string;
  teams?: { name?: string | null; slug?: string | null } | null;
  team_roles?: { name?: string | null; slug?: string | null } | null;
};

type ProjectMembershipRow = {
  user_id: string;
  role: string | null;
  project_teams?: { name?: string | null; slug?: string | null; status?: string | null } | null;
};

type FavoriteRow = {
  target_user_id: string;
};

type TagAssignmentRow = {
  user_id: string;
  member_tags?: {
    id?: string | null;
    slug?: string | null;
    label?: string | null;
    color?: string | null;
    is_club?: boolean | null;
  } | null;
};

const LOCAL_FAVORITES_KEY = "kobot.memberDirectory.favorites";
const PROFILE_EXTENSIONS_CACHE_KEY = "kobot.memberDirectory.profileExtensionsAvailable";
const FAVORITES_TABLE_CACHE_KEY = "kobot.memberDirectory.favoritesTableAvailable";
const TAG_IS_CLUB_CACHE_KEY = "kobot.memberDirectory.tagIsClubAvailable";
const SCHEMA_CAPABILITY_TTL_MS = 5 * 60 * 1000;

const PROFILE_SELECT_WITH_DISPLAY_CLUB = [
  "id",
  "email",
  "display_name",
  "nickname_display",
  "login_id",
  "full_name",
  "avatar_url",
  "college",
  "department",
  "club_affiliation",
  "display_club_tag_id",
  "profile_bio",
  "public_email",
  "github_url",
  "linkedin_url",
  "created_at",
].join(", ");

const EXTENDED_PROFILE_SELECT = [
  "id",
  "email",
  "display_name",
  "nickname_display",
  "login_id",
  "full_name",
  "avatar_url",
  "college",
  "department",
  "club_affiliation",
  "profile_bio",
  "public_email",
  "github_url",
  "linkedin_url",
  "created_at",
].join(", ");

const BASE_PROFILE_SELECT = [
  "id",
  "email",
  "display_name",
  "nickname_display",
  "login_id",
  "full_name",
  "avatar_url",
  "college",
  "department",
  "club_affiliation",
  "created_at",
].join(", ");

function isMissingSchemaError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42703" ||
    error?.code === "42P01" ||
    error?.code === "PGRST204" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  );
}

function readSchemaCapability(key: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { checkedAt?: unknown; value?: unknown };
    if (typeof parsed.checkedAt !== "number" || typeof parsed.value !== "boolean") return null;
    if (Date.now() - parsed.checkedAt > SCHEMA_CAPABILITY_TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeSchemaCapability(key: string, value: boolean) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify({ checkedAt: Date.now(), value }));
  } catch {
    // Capability caching is only a console-noise optimization.
  }
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function unique(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeString(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("ko-KR");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function groupByUser<T extends { user_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const current = map.get(row.user_id) ?? [];
    current.push(row);
    map.set(row.user_id, current);
  }
  return map;
}

function roleLabel(role: string | null) {
  switch (role) {
    case "lead":
      return "프로젝트 리드";
    case "maintainer":
      return "프로젝트 관리";
    case "delegate":
      return "권한 위임";
    case "member":
      return "프로젝트 참여";
    default:
      return null;
  }
}

function displayNameFor(profile: ProfileRow) {
  return (
    normalizeString(profile.nickname_display) ??
    normalizeString(profile.display_name) ??
    normalizeString(profile.full_name) ??
    normalizeString(profile.email)?.split("@")[0] ??
    "이름 없음"
  );
}

function hasPresidentPosition(positions: OrgPositionAssignmentRow[]) {
  return positions.some((row) => {
    const slug = normalizeString(row.org_positions?.slug)?.toLocaleLowerCase("ko-KR");
    const name = normalizeString(row.org_positions?.name)?.toLocaleLowerCase("ko-KR");
    return slug === "president" || name === "president" || name === "회장";
  });
}

function membershipTagsFor(_status: string | null) {
  // 동아리(KOBOT/KOSS)은 더 이상 status 에서 자동 파생되지 않는다.
  // 회장이 /member/tags 에서 직접 부여한 태그가 단일 진리원천이다.
  return [] as string[];
}

function localFavoriteKey(userId: string) {
  return `${LOCAL_FAVORITES_KEY}.${userId}`;
}

function readLocalFavorites(userId: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(localFavoriteKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeLocalFavorite(userId: string, targetUserId: string, favorite: boolean) {
  if (typeof window === "undefined") return;

  const favorites = readLocalFavorites(userId);
  if (favorite) {
    favorites.add(targetUserId);
  } else {
    favorites.delete(targetUserId);
  }

  window.localStorage.setItem(localFavoriteKey(userId), JSON.stringify([...favorites]));
}

async function listProfiles() {
  const supabase = getSupabaseBrowserClient();
  const profileExtensionsKnown = readSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY);

  if (profileExtensionsKnown !== false) {
    const withDisplayClub = await supabase
      .from("profiles")
      .select(PROFILE_SELECT_WITH_DISPLAY_CLUB)
      .order("display_name", { ascending: true });

    if (!withDisplayClub.error) {
      writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, true);
      return {
        rows: (withDisplayClub.data ?? []) as ProfileRow[],
        profileExtensionsAvailable: true,
      };
    }

    if (!isMissingSchemaError(withDisplayClub.error)) {
      throw new Error(sanitizeUserError(withDisplayClub.error, FALLBACK));
    }

    const extended = await supabase
      .from("profiles")
      .select(EXTENDED_PROFILE_SELECT)
      .order("display_name", { ascending: true });

    if (!extended.error) {
      writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, true);
      return {
        rows: (extended.data ?? []) as ProfileRow[],
        profileExtensionsAvailable: true,
      };
    }

    if (!isMissingSchemaError(extended.error)) {
      throw new Error(sanitizeUserError(extended.error, FALLBACK));
    }

    writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, false);
  }

  const fallback = await supabase
    .from("profiles")
    .select(BASE_PROFILE_SELECT)
    .order("display_name", { ascending: true });

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));

  return {
    rows: (fallback.data ?? []) as ProfileRow[],
    profileExtensionsAvailable: false,
  };
}

async function safeRows<T>(task: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const result = await task;
  if (result.error) return [] as T[];
  return (result.data ?? []) as T[];
}

async function listFavorites(currentUserId: string) {
  const supabase = getSupabaseBrowserClient();
  const favoritesTableKnown = readSchemaCapability(FAVORITES_TABLE_CACHE_KEY);

  if (favoritesTableKnown === false) {
    return { favorites: readLocalFavorites(currentUserId), favoritesAvailable: true };
  }

  const result = await supabase
    .from("member_favorite_profiles")
    .select("target_user_id")
    .eq("viewer_user_id", currentUserId);

  if (!result.error) {
    writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, true);
    return {
      favorites: new Set(((result.data ?? []) as FavoriteRow[]).map((row) => row.target_user_id)),
      favoritesAvailable: true,
    };
  }

  if (isMissingSchemaError(result.error)) {
    writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, false);
    return { favorites: readLocalFavorites(currentUserId), favoritesAvailable: true };
  }

  return { favorites: readLocalFavorites(currentUserId), favoritesAvailable: true };
}

export async function listMemberDirectory(currentUserId: string): Promise<MemberDirectoryData> {
  const supabase = getSupabaseBrowserClient();
  const [
    { rows: profileRows, profileExtensionsAvailable },
    accountRows,
    positionRows,
    teamRows,
    projectRows,
    tagAssignmentRows,
    favoriteData,
  ] = await Promise.all([
      listProfiles(),
      safeRows<AccountRow>(
        supabase
          .from("member_accounts")
          .select("user_id, status, approved_at, created_at"),
      ),
      safeRows<OrgPositionAssignmentRow>(
        supabase
          .from("org_position_assignments")
          .select("user_id, org_positions(name, slug)")
          .eq("active", true),
      ),
      safeRows<TeamMembershipRow>(
        supabase
          .from("team_memberships")
          .select("user_id, teams(name, slug), team_roles(name, slug)")
          .eq("active", true),
      ),
      safeRows<ProjectMembershipRow>(
        supabase
          .from("project_team_memberships")
          .select("user_id, role, project_teams(name, slug, status)")
          .eq("status", "active"),
      ),
      // 진짜 태그 assignments — 부원 카드 칩의 단일 진리원천.
      // (docs/product/tag-system.md)
      // is_club 컬럼이 운영 DB 에 없을 수도 있어 (마이그 전) 명시적 fallback 으로 재시도.
      // safeRows 가 에러를 통째 삼키기 때문에, 1차 SELECT 결과의 error 를 직접 검사하고
      // 컬럼 부재 / 스키마 오류면 is_club 빠진 SELECT 로 재시도해야 한다.
      (async () => {
        const useClubColumn = readSchemaCapability(TAG_IS_CLUB_CACHE_KEY) !== false;
        const first = await supabase
          .from("member_tag_assignments")
          .select(
            useClubColumn
              ? "user_id, member_tags(id, slug, label, color, is_club)"
              : "user_id, member_tags(id, slug, label, color)",
          );
        if (!first.error) {
          if (useClubColumn) writeSchemaCapability(TAG_IS_CLUB_CACHE_KEY, true);
          return (first.data ?? []) as TagAssignmentRow[];
        }
        if (isMissingSchemaError(first.error)) {
          writeSchemaCapability(TAG_IS_CLUB_CACHE_KEY, false);
        }
        const fallback = await supabase
          .from("member_tag_assignments")
          .select("user_id, member_tags(id, slug, label, color)");
        if (fallback.error) return [] as TagAssignmentRow[];
        return (fallback.data ?? []) as TagAssignmentRow[];
      })(),
      listFavorites(currentUserId),
    ]);

  const accountsByUser = new Map(accountRows.map((row) => [row.user_id, row]));
  const positionsByUser = groupByUser(positionRows);
  const teamsByUser = groupByUser(teamRows);
  const projectsByUser = groupByUser(projectRows);
  const tagsByUser = groupByUser(tagAssignmentRows);

  const members = profileRows
    .map((profile) => {
      const account = accountsByUser.get(profile.id);
      const positions = positionsByUser.get(profile.id) ?? [];
      const teams = teamsByUser.get(profile.id) ?? [];
      const projects = projectsByUser.get(profile.id) ?? [];
      const positionLabels = unique(positions.map((row) => row.org_positions?.name));
      const officialTeamLabels = unique(teams.map((row) => row.teams?.name));
      const teamRoleLabels = unique(teams.map((row) => row.team_roles?.name));
      const projectLabels = unique(projects.map((row) => row.project_teams?.name));
      const projectRoleLabels = unique(projects.map((row) => roleLabel(row.role)));
      const status = account?.status ?? null;
      const isPresident = hasPresidentPosition(positions);
      // 자유 문자열 기반 프로필 태그는 더 이상 쓰지 않는다. 모든 태그는 member_tag_assignments 단일 출처.
      const profileTags: string[] = [];
      const memberTagRows = (tagsByUser.get(profile.id) ?? [])
        .map((row) => row.member_tags)
        .filter(
          (m): m is { id: string; slug: string; label: string; color: string; is_club?: boolean | null } =>
            !!m &&
            typeof m.id === "string" &&
            typeof m.slug === "string" &&
            typeof m.label === "string" &&
            typeof m.color === "string",
        );
      // 동일 슬러그 중복 제거
      const seenTagSlugs = new Set<string>();
      const memberTags: MemberDirectoryTag[] = [];
      for (const m of memberTagRows) {
        const key = m.slug.toLowerCase();
        if (seenTagSlugs.has(key)) continue;
        seenTagSlugs.add(key);
        memberTags.push({
          id: m.id,
          slug: m.slug,
          label: m.label,
          color: m.color,
          isClub: m.is_club === true,
        });
      }
      // 레거시 org_position 이 아직 남아 있더라도, 실제 member_tags가 있으면 그 태그를 우선한다.
      // 아직 백필되지 않은 회장만 화면 깨짐 방지용 가상 태그로 보정한다.
      if (isPresident && !seenTagSlugs.has("president")) {
        memberTags.unshift({ id: "position:president", slug: "president", label: "회장", color: "#7c2d12", isClub: false });
        seenTagSlugs.add("president");
      }
      const assignedTagLabels = memberTags.map((m) => m.label);
      const systemTags = unique([
        // 동아리·소속·회장 칩은 memberTags 로 옮겨졌다. profile.department/club_affiliation 은 보조 메타라
        // 별도 칩으로 노출하지 않는다 (status 와 동일하게 lifecycle/메타 컬럼).
        ...assignedTagLabels,
      ]);
      const tags = unique([...systemTags, ...profileTags]);

      return {
        id: profile.id,
        displayName: displayNameFor(profile),
        fullName: normalizeString(profile.full_name),
        email: normalizeString(profile.email),
        publicEmail: normalizeString(profile.public_email),
        avatarUrl: normalizeString(profile.avatar_url),
        loginId: normalizeString(profile.login_id),
        college: normalizeString(profile.college),
        department: normalizeString(profile.department),
        clubAffiliation: normalizeString(profile.club_affiliation),
        displayClubTagId: normalizeString(profile.display_club_tag_id),
        profileBio: normalizeString(profile.profile_bio),
        githubUrl: normalizeString(profile.github_url),
        linkedinUrl: normalizeString(profile.linkedin_url),
        status,
        joinedAt: account?.approved_at ?? account?.created_at ?? profile.created_at,
        positionLabels,
        officialTeamLabels,
        projectLabels,
        roleLabels: unique([...teamRoleLabels, ...projectRoleLabels]),
        tags,
        memberTags,
        projectCount: projectLabels.length,
        isPresident,
        isSelf: profile.id === currentUserId,
        isFavorite: favoriteData.favorites.has(profile.id),
      } satisfies MemberDirectoryProfile;
    })
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      return a.displayName.localeCompare(b.displayName, "ko");
    });

  return {
    members,
    clubOptions: unique(members.map((member) => member.clubAffiliation)).sort((a, b) =>
      a.localeCompare(b, "ko"),
    ),
    tagOptions: unique(members.flatMap((member) => member.tags)).sort((a, b) =>
      a.localeCompare(b, "ko"),
    ),
    profileExtensionsAvailable,
    favoritesAvailable: favoriteData.favoritesAvailable,
  };
}

export async function updateOwnDirectoryProfile(input: UpdateOwnDirectoryProfileInput) {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw new Error(sanitizeUserError(userError, FALLBACK));
  if (!userData.user) throw new Error("로그인 상태를 확인할 수 없습니다.");

  const basePayload = {
    display_name: input.nicknameDisplay.trim(),
    nickname_display: input.nicknameDisplay.trim(),
    club_affiliation: input.clubAffiliation?.trim() || null,
    display_club_tag_id: input.displayClubTagId ?? null,
    profile_completed_at: new Date().toISOString(),
  };
  const basePayloadWithoutDisplayClub = {
    display_name: basePayload.display_name,
    nickname_display: basePayload.nickname_display,
    club_affiliation: basePayload.club_affiliation,
    profile_completed_at: basePayload.profile_completed_at,
  };

  const profileExtensionsKnown = readSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY);
  if (profileExtensionsKnown === false) {
    let fallback = await supabase
      .from("profiles")
      .update(basePayload)
      .eq("id", userData.user.id);
    if (fallback.error && isMissingSchemaError(fallback.error)) {
      fallback = await supabase
        .from("profiles")
        .update(basePayloadWithoutDisplayClub)
        .eq("id", userData.user.id);
    }

    if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));

    return { profileExtensionsSaved: false };
  }

  const payload = {
    ...basePayload,
    profile_bio: input.profileBio.trim() || null,
    public_email: input.publicEmail.trim() || null,
    github_url: input.githubUrl.trim() || null,
    linkedin_url: input.linkedinUrl.trim() || null,
  };
  const payloadWithoutDisplayClub = {
    ...basePayloadWithoutDisplayClub,
    profile_bio: payload.profile_bio,
    public_email: payload.public_email,
    github_url: payload.github_url,
    linkedin_url: payload.linkedin_url,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userData.user.id);

  if (!error) {
    writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, true);
    void triggerGithubSync(10);
    return { profileExtensionsSaved: true };
  }

  if (!isMissingSchemaError(error)) throw new Error(sanitizeUserError(error, FALLBACK));

  const retryWithoutDisplayClub = await supabase
    .from("profiles")
    .update(payloadWithoutDisplayClub)
    .eq("id", userData.user.id);
  if (!retryWithoutDisplayClub.error) {
    writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, true);
    void triggerGithubSync(10);
    return { profileExtensionsSaved: true };
  }
  if (!isMissingSchemaError(retryWithoutDisplayClub.error)) {
    throw new Error(sanitizeUserError(retryWithoutDisplayClub.error, FALLBACK));
  }

  writeSchemaCapability(PROFILE_EXTENSIONS_CACHE_KEY, false);

  let fallback = await supabase
    .from("profiles")
    .update(basePayload)
    .eq("id", userData.user.id);
  if (fallback.error && isMissingSchemaError(fallback.error)) {
    fallback = await supabase
      .from("profiles")
      .update(basePayloadWithoutDisplayClub)
      .eq("id", userData.user.id);
  }

  if (fallback.error) throw new Error(sanitizeUserError(fallback.error, FALLBACK));

  return { profileExtensionsSaved: false };
}

export async function setMemberFavorite(targetUserId: string, favorite: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw new Error(sanitizeUserError(userError, FALLBACK));
  if (!userData.user) throw new Error("로그인 상태를 확인할 수 없습니다.");

  if (targetUserId === userData.user.id) {
    return;
  }

  if (favorite) {
    if (readSchemaCapability(FAVORITES_TABLE_CACHE_KEY) === false) {
      writeLocalFavorite(userData.user.id, targetUserId, true);
      return;
    }

    const { error } = await supabase
      .from("member_favorite_profiles")
      .upsert({
        viewer_user_id: userData.user.id,
        target_user_id: targetUserId,
      });
    if (error) {
      if (!isMissingSchemaError(error)) throw new Error(sanitizeUserError(error, FALLBACK));
      writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, false);
      writeLocalFavorite(userData.user.id, targetUserId, true);
    } else {
      writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, true);
    }
    return;
  }

  if (readSchemaCapability(FAVORITES_TABLE_CACHE_KEY) === false) {
    writeLocalFavorite(userData.user.id, targetUserId, false);
    return;
  }

  const { error } = await supabase
    .from("member_favorite_profiles")
    .delete()
    .eq("viewer_user_id", userData.user.id)
    .eq("target_user_id", targetUserId);

  if (error) {
    if (!isMissingSchemaError(error)) throw new Error(sanitizeUserError(error, FALLBACK));
    writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, false);
    writeLocalFavorite(userData.user.id, targetUserId, false);
  } else {
    writeSchemaCapability(FAVORITES_TABLE_CACHE_KEY, true);
  }
}
