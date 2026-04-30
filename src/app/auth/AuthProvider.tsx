import type { PostgrestError } from "@supabase/supabase-js";
import { createContext, useEffect, useState, type PropsWithChildren } from "react";
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

const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,18}[a-z0-9]$/;
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
  "withdrawn",
];

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

    if (record.code === "23505") {
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
    : "nickname";
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

function normalizeTechTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,]+/)
      : [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of rawTags) {
    if (typeof rawTag !== "string") {
      continue;
    }

    const tag = rawTag.trim().replace(/^#+/, "");
    const key = tag.toLocaleLowerCase("ko-KR");

    if (!tag || seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(tag);
  }

  return tags;
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

  const nicknameDisplay =
    readProfileString(profile, "nicknameDisplay", "nickname_display") ??
    readProfileString(profile, "displayName", "display_name");
  const displayName =
    nicknameDisplay ?? readProfileString(profile, "displayName", "display_name");

  return {
    profile: {
      id: readProfileString(profile, "id", "id"),
      email: readProfileString(profile, "email", "email"),
      displayName,
      nicknameDisplay,
      nicknameSlug: readProfileString(profile, "nicknameSlug", "nickname_slug"),
      fullName: readProfileString(profile, "fullName", "full_name"),
      studentId: readProfileString(profile, "studentId", "student_id"),
      phone: readProfileString(profile, "phone", "phone"),
      college: readProfileString(profile, "college", "college"),
      department: readProfileString(profile, "department", "department"),
      clubAffiliation: readProfileString(
        profile,
        "clubAffiliation",
        "club_affiliation",
      ),
      publicCreditNameMode: normalizePublicCreditNameMode(
        profile.publicCreditNameMode ?? profile.public_credit_name_mode,
      ),
      techTags: normalizeTechTags(profile.techTags ?? profile.tech_tags),
      avatarUrl: readProfileString(profile, "avatarUrl", "avatar_url"),
      loginId: readProfileString(profile, "loginId", "login_id"),
    },
    account: {
      status:
        account.status === "pending" ||
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
        "tech_tags",
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
      publicCreditNameMode: profileRecord.public_credit_name_mode ?? "nickname",
      techTags: profileRecord.tech_tags ?? [],
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthContextValue["session"]>(null);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [authData, setAuthData] = useState(EMPTY_AUTH_CONTEXT);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const configured = isSupabaseConfigured();

  async function refreshAuthData() {
    if (!configured) {
      setAuthData(EMPTY_AUTH_CONTEXT);
      setAuthError("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
      return null;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("get_my_authorization_context");

    if (error) {
      const fallbackAuthData = await buildNonActiveAuthorizationFallback(supabase);

      if (fallbackAuthData) {
        setAuthData(fallbackAuthData);
        setAuthError(null);
        return fallbackAuthData;
      }

      const message = toErrorMessage(error, "권한 정보를 불러오지 못했습니다.");
      setAuthError(message);
      throw new Error(message);
    }

    const normalized = normalizeAuthorizationContext(data);
    setAuthData(normalized);
    setAuthError(null);
    return normalized;
  }

  async function syncFromSession(nextSession: AuthContextValue["session"]) {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setAuthData(EMPTY_AUTH_CONTEXT);
      setAuthError(null);
      return null;
    }

    return refreshAuthData();
  }

  useEffect(() => {
    if (!configured) {
      setIsInitializing(false);
      setAuthError("서비스 설정을 확인하지 못했습니다. 운영진에게 문의해 주세요.");
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
    const clubAffiliation = input.clubAffiliation?.trim() || null;
    const publicCreditNameMode = normalizePublicCreditNameMode(input.publicCreditNameMode);
    const techTags = normalizeTechTags(input.techTags);
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

    if (normalizedLoginId && !LOGIN_ID_PATTERN.test(normalizedLoginId)) {
      throw new Error(
        "아이디는 영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-) 조합으로 4자 이상 20자 이하만 사용할 수 있습니다.",
      );
    }

    if (!authData.account.hasLoginPassword && normalizedLoginId && !password) {
      throw new Error("첫 아이디 설정과 함께 비밀번호를 등록해야 합니다.");
    }

    if (password && password.length < 8) {
      throw new Error("비밀번호는 8자 이상으로 입력해 주세요.");
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
      tech_tags: techTags,
      login_id: normalizedLoginId,
      profile_completed_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", user.id);

    if (profileError) {
      throw new Error(
        toErrorMessage(profileError as PostgrestError, "프로필 정보를 저장하지 못했습니다."),
      );
    }

    if (password || nicknameDisplay || fullName) {
      const updatePayload: {
        password?: string;
        data?: Record<string, string>;
      } = {};

      if (password) {
        updatePayload.password = password;
      }

      const metadata: Record<string, string> = {
        display_name: nicknameDisplay,
        nickname_display: nicknameDisplay,
        full_name: fullName,
      };

      if (Object.keys(metadata).length > 0) {
        updatePayload.data = metadata;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser(updatePayload);

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

    return refreshAuthData();
  }

  async function signOut() {
    if (!configured) {
      setSession(null);
      setUser(null);
      setAuthData(EMPTY_AUTH_CONTEXT);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(toErrorMessage(error, "로그아웃하지 못했습니다."));
    }

    setSession(null);
    setUser(null);
    setAuthData(EMPTY_AUTH_CONTEXT);
    setAuthError(null);
  }

  const value: AuthContextValue = {
    isConfigured: configured,
    isInitializing,
    session,
    user,
    authData,
    memberStatus: authData.account.status,
    permissions: authData.permissions,
    authError,
    hasPermission: (...codes: string[]) => {
      if (authData.account.isBootstrapAdmin) {
        return true;
      }

      return codes.some((code) => authData.permissions.includes(code));
    },
    refreshAuthData,
    signInWithGoogle,
    signInWithLoginId,
    saveProfileSettings,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
