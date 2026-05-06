import type { Session, User } from "@supabase/supabase-js";

export type MemberStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected"
  | "alumni"
  | "project_only"
  | "course_member"
  | "withdrawn"
  | null;

export type PublicCreditNameMode = "anonymous" | "nickname" | "real_name";

export interface AuthProfile {
  id: string | null;
  email: string | null;
  displayName: string | null;
  nicknameDisplay: string | null;
  nicknameSlug: string | null;
  fullName: string | null;
  studentId: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  clubAffiliation: string | null;
  publicCreditNameMode: PublicCreditNameMode;
  avatarUrl: string | null;
  loginId: string | null;
}

export interface AuthAccount {
  status: MemberStatus;
  hasLoginPassword: boolean;
  isBootstrapAdmin: boolean;
}

export interface AuthOrganization {
  id: string | null;
  slug: string | null;
  name: string | null;
}

export interface AuthOrgPosition {
  id: string;
  slug: string;
  name: string;
}

export interface AuthTeamMembership {
  teamId: string;
  teamSlug: string;
  teamName: string;
  roleId: string | null;
  roleSlug: string | null;
  roleName: string | null;
}

export interface AuthorizationContextData {
  profile: AuthProfile;
  account: AuthAccount;
  organization: AuthOrganization;
  orgPositions: AuthOrgPosition[];
  teamMemberships: AuthTeamMembership[];
  permissions: string[];
}

export interface SaveProfileSettingsInput {
  nicknameDisplay: string;
  fullName: string;
  studentId: string;
  phone: string;
  college: string;
  department: string;
  clubAffiliation: string | null;
  publicCreditNameMode: PublicCreditNameMode;
  loginId: string | null;
  password?: string;
}

export interface AuthContextValue {
  isConfigured: boolean;
  isInitializing: boolean;
  session: Session | null;
  user: User | null;
  authData: AuthorizationContextData;
  memberStatus: MemberStatus;
  permissions: string[];
  /**
   * Sidebar paths granted to the current user via assigned tags. Empty until
   * the first refreshTags call resolves.
   */
  tagNavPaths: string[];
  tagsLoaded: boolean;
  tagAuthorityFailed: boolean;
  authError: string | null;
  hasPermission: (...codes: string[]) => boolean;
  refreshAuthData: () => Promise<AuthorizationContextData | null>;
  refreshTags: () => Promise<void>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signInWithLoginId: (
    loginId: string,
    password: string,
  ) => Promise<AuthorizationContextData | null>;
  checkLoginIdAvailability: (loginId: string) => Promise<boolean>;
  saveProfileSettings: (
    input: SaveProfileSettingsInput,
  ) => Promise<AuthorizationContextData | null>;
  signOut: () => Promise<void>;
}

export const EMPTY_AUTH_CONTEXT: AuthorizationContextData = {
  profile: {
    id: null,
    email: null,
    displayName: null,
    nicknameDisplay: null,
    nicknameSlug: null,
    fullName: null,
    studentId: null,
    phone: null,
    college: null,
    department: null,
    clubAffiliation: null,
    publicCreditNameMode: "anonymous",
    avatarUrl: null,
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
};
