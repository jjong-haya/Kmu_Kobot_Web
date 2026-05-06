import type { PostgrestError } from "@supabase/supabase-js";
import { createContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
  EMPTY_AUTH_CONTEXT,
  type AuthContextValue,
  type AuthorizationContextData,
  type MemberStatus,
  type PublicCreditNameMode,
  type SaveProfileSettingsInput,
} from "./types";
import {
  getSupabaseAuthCallbackUrl,
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "./supabase";
import {
  findCollegeByDepartment,
  inferAcademicPlacementFromProfileName,
} from "./kookminAcademic";

const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;
const NICKNAME_DISPLAY_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9 ]{2,12}$/u;
const PUBLIC_CREDIT_NAME_MODES: PublicCreditNameMode[] = [
  "anonymous",
  "nickname",
  "real_name",
];
const MEMBER_STATUSES: Exclude<MemberStatus, null>[] = [
  "pending",
  "active",
  "suspended",
  "rejected",
  "alumni",
  "project_only",
  "course_member",
  "withdrawn",
];
const TAG_AUTHORITY_ERROR_MESSAGE =
  "태그 기반 권한 정보를 불러오지 못했습니다. 운영진은 권한 태그 RPC 상태를 확인해 주세요.";

export const AuthContext = createContext<AuthContextValue | null>(null);

function isTechnicalErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("supabase") ||
    normalized.includes("postgrest") ||
    normalized.includes("schema cache") ||
    normalized.includes("pkce") ||
    normalized.includes("code verifier") ||
    normalized.includes("vite_") ||
    normalized.includes(".env") ||
    normalized.includes("public.") ||
    normalized.includes("function") ||
    normalized.includes("relation") ||
    normalized.includes("column") ||
    normalized.includes("jwt") ||
    message.length > 120
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  let rawMessage: string | null = null;

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const combined = [
      record.message,
      record.details,
      record.hint,
      record.constraint,
      record.code,
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .toLowerCase();

    if (record.code === "23505") {
      if (combined.includes("login_id")) {
        return "이미 사용 중인 ID입니다.";
      }

      if (combined.includes("nickname")) {
        return "이미 사용 중인 닉네임입니다.";
      }

      return "이미 사용 중인 아이디 또는 닉네임입니다.";
    }

    if (typeof record.message === "string" && record.message.trim()) {
      rawMessage = record.message;
    }

    if (!rawMessage && typeof record.error_description === "string" && record.error_description.trim()) {
      rawMessage = record.error_description;
    }
  }

  if (!rawMessage && error instanceof Error && error.message.trim()) {
    rawMessage = error.message;
  }

  if (rawMessage && !isTechnicalErrorMessage(rawMessage)) {
    return rawMessage;
  }

  return fallback;
}

function isDuplicateLoginIdMessage(message: string) {
  return message.includes("이미 사용 중인 ID") || message.includes("이미 사용 중인 아이디");
}

function isMissingWorkspaceSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  const details = typeof record.details === "string" ? record.details.toLowerCase() : "";
  const hint = typeof record.hint === "string" ? record.hint.toLowerCase() : "";
  const combined = `${message} ${details} ${hint}`;

  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST205" ||
    (combined.includes("schema cache") &&
      (combined.includes("get_my_authorization_context") ||
        combined.includes("member_accounts") ||
        combined.includes("profiles")))
  );
}

function isAuthCallbackRoute() {
  return typeof window !== "undefined" && window.location.pathname === "/auth/callback";
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readProfileString(
  profile: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
) {
  return normalizeString(profile[camelKey] ?? profile[snakeKey]);
}

function normalizePublicCreditNameMode(value: unknown): PublicCreditNameMode {
  return PUBLIC_CREDIT_NAME_MODES.includes(value as PublicCreditNameMode)
    ? (value as PublicCreditNameMode)
    : "anonymous";
}

function normalizeMemberStatus(value: unknown): MemberStatus {
  return MEMBER_STATUSES.includes(value as Exclude<MemberStatus, null>)
    ? (value as Exclude<MemberStatus, null>)
    : null;
}

function normalizeNicknameDisplay(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function createNicknameSlug(value: string) {
  return normalizeNicknameDisplay(value).toLocaleLowerCase("ko-KR").replace(/\s+/g, "_");
}

function requireTrimmed(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label}을(를) 입력해 주세요.`);
  }

  return normalized;
}

function normalizeAuthorizationContext(data: unknown): AuthorizationContextData {
  if (!data || typeof data !== "object") {
    return EMPTY_AUTH_CONTEXT;
  }

  const record = data as Record<string, unknown>;
  const profile = (record.profile ?? {}) as Record<string, unknown>;
  const account = (record.account ?? {}) as Record<string, unknown>;
  const organization = (record.organization ?? {}) as Record<string, unknown>;
  const orgPositions = Array.isArray(record.orgPositions) ? record.orgPositions : [];
  const teamMemberships = Array.isArray(record.teamMemberships)
    ? record.teamMemberships
    : [];
  const permissions = Array.isArray(record.permissions)
    ? record.permissions.filter((value): value is string => typeof value === "string")
    : [];

  const nicknameDisplay = readProfileString(profile, "nicknameDisplay", "nickname_display");
  const displayName =
    nicknameDisplay ?? readProfileString(profile, "displayName", "display_name");
  const rawFullName = readProfileString(profile, "fullName", "full_name");
  const inferredAcademic = inferAcademicPlacementFromProfileName(rawFullName ?? displayName);
  const profileDepartment = readProfileString(profile, "department", "department");
  const profileCollege = readProfileString(profile, "college", "college");

  return {
    profile: {
      id: readProfileString(profile, "id", "id"),
      email: readProfileString(profile, "email", "email"),
      displayName,
      nicknameDisplay,
      nicknameSlug: readProfileString(profile, "nicknameSlug", "nickname_slug"),
      fullName: inferredAcademic.fullName ?? rawFullName,
      studentId: readProfileString(profile, "studentId", "student_id"),
      phone: readProfileString(profile, "phone", "phone"),
      college:
        profileCollege ??
        findCollegeByDepartment(profileDepartment)?.label ??
        inferredAcademic.college,
      department: profileDepartment ?? inferredAcademic.department,
      clubAffiliation: readProfileString(
        profile,
        "clubAffiliation",
        "club_affiliation",
      ),
      publicCreditNameMode: normalizePublicCreditNameMode(
        profile.publicCreditNameMode ?? profile.public_credit_name_mode,
      ),
      avatarUrl: readProfileString(profile, "avatarUrl", "avatar_url"),
      loginId: readProfileString(profile, "loginId", "login_id"),
    },
    account: {
      status:
        // course_member 는 동아리 구분일 뿐 활동 상태 자체는 active 와 동일.
        // 단일 진리원천을 태그로 옮긴 후 상태축은 lifecycle 만 표현하므로 active 로 정규화한다.
        // (docs/product/member-status.md)
        account.status === "course_member"
          ? "active"
          : account.status === "pending" ||
              account.status === "active" ||
              account.status === "suspended" ||
              account.status === "rejected" ||
              account.status === "alumni" ||
              account.status === "project_only" ||
              account.status === "withdrawn"
            ? account.status
            : null,
      hasLoginPassword: account.hasLoginPassword === true,
      isBootstrapAdmin: account.isBootstrapAdmin === true,
    },
    organization: {
      id: normalizeString(organization.id),
      slug: normalizeString(organization.slug),
      name: normalizeString(organization.name),
    },
    orgPositions: orgPositions
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const value = item as Record<string, unknown>;

        if (
          typeof value.id !== "string" ||
          typeof value.slug !== "string" ||
          typeof value.name !== "string"
        ) {
          return null;
        }

        return {
          id: value.id,
          slug: value.slug,
          name: value.name,
        };
      })
      .filter((item): item is AuthorizationContextData["orgPositions"][number] => item !== null),
    teamMemberships: teamMemberships
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const value = item as Record<string, unknown>;

        if (
          typeof value.teamId !== "string" ||
          typeof value.teamSlug !== "string" ||
          typeof value.teamName !== "string"
        ) {
          return null;
        }

        return {
          teamId: value.teamId,
          teamSlug: value.teamSlug,
          teamName: value.teamName,
          roleId: normalizeString(value.roleId),
          roleSlug: normalizeString(value.roleSlug),
          roleName: normalizeString(value.roleName),
        };
      })
      .filter(
        (item): item is AuthorizationContextData["teamMemberships"][number] => item !== null,
      ),
    permissions,
  };
}

function readUserMetadataString(
  user: NonNullable<AuthContextValue["user"]>,
  ...keys: string[]
) {
  const metadata = user.user_metadata as Record<string, unknown>;

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function fetchProfileFallback(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  userId: string,
) {
  const fullProfileQuery = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "email",
        "display_name",
        "nickname_display",
        "nickname_slug",
        "full_name",
        "student_id",
        "phone",
        "college",
        "department",
        "club_affiliation",
        "public_credit_name_mode",
        "avatar_url",
        "login_id",
      ].join(","),
    )
    .eq("id", userId)
    .maybeSingle();

  if (!fullProfileQuery.error) {
    return fullProfileQuery.data as Record<string, unknown> | null;
  }

  const minimalProfileQuery = await supabase
    .from("profiles")
    .select("id,email,display_name,full_name,student_id,avatar_url,login_id")
    .eq("id", userId)
    .maybeSingle();

  if (minimalProfileQuery.error) {
    return null;
  }

  return minimalProfileQuery.data as Record<string, unknown> | null;
}

async function buildNonActiveAuthorizationFallback(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: accountData, error: accountError } = await supabase
    .from("member_accounts")
    .select("status,has_login_password,is_bootstrap_admin,organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountError) {
    return null;
  }

  const accountRecord = (accountData ?? {}) as Record<string, unknown>;
  const status = normalizeMemberStatus(accountRecord.status);

  if (status === "active") {
    return null;
  }

  const profileRecord = (await fetchProfileFallback(supabase, user.id)) ?? {};
  const displayName =
    normalizeString(profileRecord.nickname_display) ??
    normalizeString(profileRecord.display_name) ??
    readUserMetadataString(user, "display_name", "full_name", "name") ??
    user.email?.split("@")[0] ??
    null;

  return normalizeAuthorizationContext({
    profile: {
      id: normalizeString(profileRecord.id) ?? user.id,
      email: normalizeString(profileRecord.email) ?? user.email ?? null,
      displayName,
      nicknameDisplay: normalizeString(profileRecord.nickname_display),
      nicknameSlug: normalizeString(profileRecord.nickname_slug),
      fullName:
        normalizeString(profileRecord.full_name) ??
        readUserMetadataString(user, "full_name", "name"),
      studentId: normalizeString(profileRecord.student_id),
      phone: normalizeString(profileRecord.phone),
      college: normalizeString(profileRecord.college),
      department: normalizeString(profileRecord.department),
      clubAffiliation: normalizeString(profileRecord.club_affiliation),
      publicCreditNameMode: profileRecord.public_credit_name_mode ?? "anonymous",
      avatarUrl:
        normalizeString(profileRecord.avatar_url) ??
        readUserMetadataString(user, "avatar_url", "picture"),
      loginId: normalizeString(profileRecord.login_id),
    },
    account: {
      status,
      hasLoginPassword: accountRecord.has_login_password === true,
      isBootstrapAdmin: accountRecord.is_bootstrap_admin === true,
    },
    organization: {
      id: normalizeString(accountRecord.organization_id),
      slug: null,
      name: null,
    },
    orgPositions: [],
    teamMemberships: [],
    permissions: [],
  });
}

async function buildSessionOnlyAuthorizationFallback(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const displayName =
    readUserMetadataString(user, "display_name", "full_name", "name") ??
    user.email?.split("@")[0] ??
    null;

  return normalizeAuthorizationContext({
    profile: {
      id: user.id,
      email: user.email ?? null,
      displayName,
      nicknameDisplay: null,
      nicknameSlug: null,
      fullName: readUserMetadataString(user, "full_name", "name"),
      studentId: null,
      phone: null,
      college: null,
      department: null,
      clubAffiliation: null,
      publicCreditNameMode: "anonymous",
      avatarUrl: readUserMetadataString(user, "avatar_url", "picture"),
      loginId: null,
    },
    account: {
      status: null,
      hasLoginPassword: false,
      isBootstrapAdmin: false,
    },
    organization: {
      id: null,
      slug: null,
      name: null,
    },
    orgPositions: [],
    teamMemberships: [],
    permissions: [],
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthContextValue["session"]>(null);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [authData, setAuthData] = useState(EMPTY_AUTH_CONTEXT);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [tagPermissions, setTagPermissions] = useState<string[]>([]);
  const [tagNavPaths, setTagNavPaths] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagAuthorityFailed, setTagAuthorityFailed] = useState(false);
  const refreshAuthDataPromiseRef = useRef<{
    userId: string | null;
    promise: Promise<AuthorizationContextData | null>;
  } | null>(null);
  const isWorkspaceSchemaMissingRef = useRef(false);
  const authRefreshSequenceRef = useRef(0);
  const tagRefreshSequenceRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const configured = isSupabaseConfigured();
  currentUserIdRef.current = user?.id ?? null;

  async function refreshTags() {
    const requestId = tagRefreshSequenceRef.current + 1;
    tagRefreshSequenceRef.current = requestId;
    const requestUserId = currentUserIdRef.current;

    if (!configured) {
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return;
    }

    if (!requestUserId) {
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return;
    }

    setTagPermissions([]);
    setTagNavPaths([]);
    setTagsLoaded(false);
    setTagAuthorityFailed(false);

    try {
      const supabase = getSupabaseBrowserClient();
      const [permsResult, navsResult] = await Promise.all([
        supabase.rpc("current_user_tag_permissions"),
        supabase.rpc("current_user_tag_nav_paths"),
      ]);

      const tagError = permsResult.error ?? navsResult.error;

      if (
        tagRefreshSequenceRef.current !== requestId ||
        currentUserIdRef.current !== requestUserId
      ) {
        return;
      }

      if (tagError) {
        setTagPermissions([]);
        setTagNavPaths([]);
        setTagAuthorityFailed(true);
        setAuthError((current) => current ?? TAG_AUTHORITY_ERROR_MESSAGE);
        return;
      }

      const perms = ((permsResult.data ?? []) as Array<string | { permission?: string }>)
        .map((row) =>
          typeof row === "string"
            ? row
            : row && typeof row === "object" && "permission" in row && row.permission
              ? row.permission
              : null,
        )
        .filter((value): value is string => Boolean(value));
      const navs = ((navsResult.data ?? []) as Array<string | { href?: string }>)
        .map((row) =>
          typeof row === "string"
            ? row
            : row && typeof row === "object" && "href" in row && row.href
              ? row.href
              : null,
        )
        .filter((value): value is string => Boolean(value));
      setTagPermissions(perms);
      setTagNavPaths(navs);
      setTagAuthorityFailed(false);
      setAuthError((current) =>
        current === TAG_AUTHORITY_ERROR_MESSAGE ? null : current,
      );
    } catch {
      if (
        tagRefreshSequenceRef.current !== requestId ||
        currentUserIdRef.current !== requestUserId
      ) {
        return;
      }
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagAuthorityFailed(true);
      setAuthError((current) => current ?? TAG_AUTHORITY_ERROR_MESSAGE);
    } finally {
      if (
        tagRefreshSequenceRef.current === requestId &&
        currentUserIdRef.current === requestUserId
      ) {
        setTagsLoaded(true);
      }
    }
  }

  async function refreshAuthData(expectedUserId = currentUserIdRef.current) {
    const requestUserId = expectedUserId;

    if (
      refreshAuthDataPromiseRef.current &&
      refreshAuthDataPromiseRef.current.userId === requestUserId
    ) {
      return refreshAuthDataPromiseRef.current.promise;
    }

    const requestId = authRefreshSequenceRef.current + 1;
    authRefreshSequenceRef.current = requestId;
    const requestPromise = refreshAuthDataInternal(requestId, requestUserId).finally(() => {
      if (refreshAuthDataPromiseRef.current?.promise === requestPromise) {
        refreshAuthDataPromiseRef.current = null;
      }
    });
    refreshAuthDataPromiseRef.current = { userId: requestUserId, promise: requestPromise };

    return requestPromise;
  }

  function shouldCommitAuthRefresh(requestId: number, requestUserId: string | null) {
    return (
      authRefreshSequenceRef.current === requestId &&
      currentUserIdRef.current === requestUserId
    );
  }

  async function refreshAuthDataInternal(
    requestId: number,
    requestUserId: string | null,
  ) {
    if (!configured) {
      if (shouldCommitAuthRefresh(requestId, requestUserId)) {
        setAuthData(EMPTY_AUTH_CONTEXT);
        setAuthError("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
      }
      return null;
    }

    const supabase = getSupabaseBrowserClient();

    if (isWorkspaceSchemaMissingRef.current) {
      const sessionOnlyAuthData = await buildSessionOnlyAuthorizationFallback(supabase);

      if (sessionOnlyAuthData) {
        if (shouldCommitAuthRefresh(requestId, requestUserId)) {
          setAuthData(sessionOnlyAuthData);
          setAuthError(null);
        }
        return sessionOnlyAuthData;
      }
    }

    const { data, error } = await supabase.rpc("get_my_authorization_context");

    if (error) {
      if (isMissingWorkspaceSchemaError(error)) {
        isWorkspaceSchemaMissingRef.current = true;
        const sessionOnlyAuthData = await buildSessionOnlyAuthorizationFallback(supabase);

        if (sessionOnlyAuthData) {
          if (shouldCommitAuthRefresh(requestId, requestUserId)) {
            setAuthData(sessionOnlyAuthData);
            setAuthError(null);
          }
          return sessionOnlyAuthData;
        }
      }

      const fallbackAuthData = await buildNonActiveAuthorizationFallback(supabase);

      if (fallbackAuthData) {
        if (shouldCommitAuthRefresh(requestId, requestUserId)) {
          setAuthData(fallbackAuthData);
          setAuthError(null);
        }
        return fallbackAuthData;
      }

      const message = toErrorMessage(error, "권한 정보를 불러오지 못했습니다.");
      if (shouldCommitAuthRefresh(requestId, requestUserId)) {
        setAuthError(message);
      }
      throw new Error(message);
    }

    const normalized = normalizeAuthorizationContext(data);
    if (shouldCommitAuthRefresh(requestId, requestUserId)) {
      isWorkspaceSchemaMissingRef.current = false;
      setAuthData(normalized);
      setAuthError(null);
    }
    return normalized;
  }

  async function syncFromSession(nextSession: AuthContextValue["session"]) {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    currentUserIdRef.current = nextSession?.user?.id ?? null;

    if (!nextSession?.user) {
      authRefreshSequenceRef.current += 1;
      tagRefreshSequenceRef.current += 1;
      currentUserIdRef.current = null;
      setAuthData(EMPTY_AUTH_CONTEXT);
      setAuthError(null);
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return null;
    }

    if (isAuthCallbackRoute()) {
      return null;
    }

    return refreshAuthData(nextSession.user.id);
  }

  useEffect(() => {
    if (!configured) {
      authRefreshSequenceRef.current += 1;
      tagRefreshSequenceRef.current += 1;
      setIsInitializing(false);
      setAuthError("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return;
    }

    let disposed = false;
    const supabase = getSupabaseBrowserClient();

    void (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (disposed) {
        return;
      }

      if (error) {
        setAuthError(toErrorMessage(error, "세션을 확인하지 못했습니다."));
      }

      try {
        await syncFromSession(data.session);
      } catch {
        // The provider already captured a user-facing error message.
      } finally {
        if (!disposed) {
          setIsInitializing(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (disposed) {
        return;
      }

      setIsInitializing(true);

      void syncFromSession(nextSession)
        .catch(() => {
          // The provider already captured a user-facing error message.
        })
        .finally(() => {
          if (!disposed) {
            setIsInitializing(false);
          }
        });
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  // Re-fetch the current user's tag-derived permissions and nav paths every
  // time the auth user changes (login, logout, refresh).
  useEffect(() => {
    if (!configured) return;
    if (!user) {
      tagRefreshSequenceRef.current += 1;
      currentUserIdRef.current = null;
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return;
    }
    void refreshTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user?.id]);

  async function signInWithGoogle(nextPath?: string) {
    if (!configured) {
      throw new Error("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getSupabaseAuthCallbackUrl(nextPath),
        scopes: "openid email profile",
        queryParams: {
          hd: "kookmin.ac.kr",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      throw new Error(toErrorMessage(error, "Google 로그인을 시작하지 못했습니다."));
    }
  }

  async function signInWithLoginId(loginId: string, password: string) {
    if (!configured) {
      throw new Error("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
    }

    const normalizedLoginId = loginId.trim().toLowerCase();

    if (!normalizedLoginId || !password.trim()) {
      throw new Error("아이디와 비밀번호를 모두 입력해 주세요.");
    }

    const supabase = getSupabaseBrowserClient();
    const { data: resolvedEmail, error: resolveError } = await supabase.rpc(
      "resolve_login_email",
      {
        login_id_input: normalizedLoginId,
      },
    );

    if (resolveError) {
      throw new Error(toErrorMessage(resolveError, "아이디 로그인을 준비하지 못했습니다."));
    }

    if (!resolvedEmail) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    return syncFromSession(data.session);
  }

  async function checkLoginIdAvailability(loginId: string) {
    if (!configured) {
      throw new Error("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
    }

    if (!user) {
      throw new Error("로그인 상태를 확인할 수 없습니다.");
    }

    const normalizedLoginId = loginId.trim().toLowerCase();

    if (!normalizedLoginId) {
      return true;
    }

    if (authData.profile.loginId === normalizedLoginId) {
      return true;
    }

    if (!LOGIN_ID_PATTERN.test(normalizedLoginId)) {
      return false;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("is_login_id_available", {
      login_id_input: normalizedLoginId,
    });

    if (error) {
      throw new Error(toErrorMessage(error, "ID 중복 확인을 완료하지 못했습니다."));
    }

    return data === true;
  }

  async function saveProfileSettings(input: SaveProfileSettingsInput) {
    if (!configured) {
      throw new Error("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
    }

    if (!user) {
      throw new Error("로그인 상태를 확인할 수 없습니다.");
    }

    const nicknameDisplay = normalizeNicknameDisplay(input.nicknameDisplay);
    const nicknameSlug = createNicknameSlug(nicknameDisplay);
    const fullName = requireTrimmed(input.fullName, "실명");
    const studentId = requireTrimmed(input.studentId, "학번");
    const phone = requireTrimmed(input.phone, "전화번호");
    const college = requireTrimmed(input.college, "단과대");
    const department = requireTrimmed(input.department, "학과");
    const clubAffiliation = normalizeString(input.clubAffiliation);
    const publicCreditNameMode = normalizePublicCreditNameMode(input.publicCreditNameMode);
    const normalizedLoginId = input.loginId?.trim().toLowerCase() || null;
    const password = input.password?.trim() || "";
    const currentLoginId = authData.profile.loginId;

    if (!NICKNAME_DISPLAY_PATTERN.test(nicknameDisplay) || nicknameDisplay.includes("_")) {
      throw new Error(
        "닉네임은 2~12자의 한글, 영문, 숫자, 공백만 사용할 수 있으며 밑줄(_)은 입력할 수 없습니다.",
      );
    }

    if (currentLoginId && !normalizedLoginId) {
      throw new Error("이미 설정한 아이디는 비워 둘 수 없습니다.");
    }

    if (currentLoginId && normalizedLoginId !== currentLoginId) {
      throw new Error("이미 설정한 아이디는 프로필 화면에서 직접 변경할 수 없습니다. 운영진에게 변경 요청해 주세요.");
    }

    if (!normalizedLoginId && password) {
      throw new Error("ID 로그인을 사용하려면 아이디를 먼저 입력해 주세요.");
    }

    if (normalizedLoginId && !LOGIN_ID_PATTERN.test(normalizedLoginId)) {
      throw new Error(
        "아이디는 4자 이상 20자 이하의 영어 소문자와 숫자만 사용할 수 있습니다.",
      );
    }

    if (!authData.account.hasLoginPassword && normalizedLoginId && !password) {
      throw new Error("첫 아이디 설정과 함께 비밀번호를 등록해야 합니다.");
    }

    if (password && password.length < 8) {
      throw new Error("비밀번호는 8자 이상으로 입력해 주세요.");
    }

    if (normalizedLoginId && normalizedLoginId !== currentLoginId) {
      const isLoginIdAvailable = await checkLoginIdAvailability(normalizedLoginId);

      if (!isLoginIdAvailable) {
        throw new Error("이미 사용 중인 ID입니다.");
      }
    }

    const supabase = getSupabaseBrowserClient();
    const profilePayload = {
      display_name: nicknameDisplay,
      nickname_display: nicknameDisplay,
      nickname_slug: nicknameSlug,
      full_name: fullName,
      student_id: studentId,
      phone,
      college,
      department,
      club_affiliation: clubAffiliation,
      public_credit_name_mode: publicCreditNameMode,
      login_id: normalizedLoginId,
      profile_completed_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", user.id);

    if (profileError) {
      const safeMessage = toErrorMessage(
        profileError as PostgrestError,
        "프로필 정보를 저장하지 못했습니다.",
      );

      if (isDuplicateLoginIdMessage(safeMessage)) {
        throw new Error("이미 사용 중인 ID입니다.");
      }

      throw new Error(safeMessage);
    }

    if (password) {
      const { error: authUpdateError } = await supabase.auth.updateUser({ password });

      if (authUpdateError) {
        throw new Error(
          toErrorMessage(authUpdateError, "로그인 계정 정보를 갱신하지 못했습니다."),
        );
      }
    }

    if (password) {
      const { error: markPasswordError } = await supabase.rpc(
        "mark_current_user_has_login_password",
      );

      if (markPasswordError) {
        throw new Error(
          toErrorMessage(markPasswordError, "비밀번호 등록 상태를 저장하지 못했습니다."),
        );
      }
    }

    if (authData.account.status === "pending" || authData.account.status === null) {
      const { error: submitApplicationError } = await supabase.rpc(
        "submit_current_membership_application",
      );

      if (submitApplicationError) {
        throw new Error(
          toErrorMessage(submitApplicationError, "회원가입 요청을 제출하지 못했습니다."),
        );
      }

      // KOSS 초대코드를 미리 redeem 해 둔 사용자는 가입 신청과 동시에
      // course_member 로 자동 승인. 코드가 없으면 RPC 가 false 만 돌려주므로
      // 일반 가입 흐름에 영향 없음.
      try {
        await supabase.rpc("apply_course_invite_after_application");
      } catch {
        // 자동 승인 실패는 일반 가입 신청을 막을 사유가 아니다.
      }
    }

    return refreshAuthData();
  }

  async function signOut() {
    authRefreshSequenceRef.current += 1;
    tagRefreshSequenceRef.current += 1;
    currentUserIdRef.current = null;
    if (!configured) {
      setSession(null);
      setUser(null);
      setAuthData(EMPTY_AUTH_CONTEXT);
      setTagPermissions([]);
      setTagNavPaths([]);
      setTagsLoaded(true);
      setTagAuthorityFailed(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    // scope: 'local' avoids the 403 "session_not_found" Supabase returns when
    // the JWT was already revoked or expired server-side. We just need to drop
    // the local copy of the session — there is nothing for the user to do
    // about a server-side revoked token at logout time.
    const { error } = await supabase.auth.signOut({ scope: "local" });

    // Ignore session-missing / expired errors. Anything else (network, etc.)
    // we still surface so the caller can show a toast.
    if (error) {
      const status = (error as { status?: number }).status ?? 0;
      const message = error.message ?? "";
      const isHarmless =
        status === 401 ||
        status === 403 ||
        /session_not_found|jwt expired|invalid token/i.test(message);
      if (!isHarmless) {
        throw new Error(toErrorMessage(error, "로그아웃하지 못했습니다."));
      }
    }

    setSession(null);
    setUser(null);
    setAuthData(EMPTY_AUTH_CONTEXT);
    setAuthError(null);
    setTagPermissions([]);
    setTagNavPaths([]);
    setTagsLoaded(true);
    setTagAuthorityFailed(false);
  }

  // Tag-driven permissions are authoritative. If tag authority cannot be
  // confirmed, the client fails closed; server RLS/RPC remains final.
  const effectivePermissions = !tagsLoaded || tagAuthorityFailed
    ? []
    : Array.from(new Set([...authData.permissions, ...tagPermissions]));

  const value: AuthContextValue = useMemo(
    () => ({
      isConfigured: configured,
      isInitializing,
      session,
      user,
      authData,
      memberStatus: authData.account.status,
      permissions: effectivePermissions,
      tagNavPaths,
      tagsLoaded,
      tagAuthorityFailed,
      authError,
      hasPermission: (...codes: string[]) => {
        if (!tagsLoaded || tagAuthorityFailed) {
          return false;
        }

        if (authData.account.status === "active" && authData.account.isBootstrapAdmin) {
          return true;
        }

        return codes.some((code) => effectivePermissions.includes(code));
      },
      refreshAuthData,
      refreshTags,
      signInWithGoogle,
      signInWithLoginId,
      checkLoginIdAvailability,
      saveProfileSettings,
      signOut,
    }),
    [
      configured,
      isInitializing,
      session,
      user,
      authData,
      effectivePermissions,
      tagNavPaths,
      tagsLoaded,
      tagAuthorityFailed,
      authError,
      refreshAuthData,
      refreshTags,
      signInWithGoogle,
      signInWithLoginId,
      checkLoginIdAvailability,
      saveProfileSettings,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
