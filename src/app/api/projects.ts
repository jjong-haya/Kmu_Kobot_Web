import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import {
  getProjectPrefix,
  getProjectRoleLabel,
  readProjectProgress,
} from "./project-policy.js";
import { triggerGithubSync } from "./github-sync";

const FALLBACK = "프로젝트 데이터를 불러오지 못했습니다.";

export type ProjectStatus = "pending" | "recruiting" | "active" | "rejected" | "archived";
export type ProjectVisibility = "public" | "private";
export type ProjectType = "official_based" | "personal" | "autonomous";
export type ProjectMemberRole = "lead" | "maintainer" | "member" | "delegate";
export type ProjectRecruitmentStatus = "closed" | "open";

export type ProjectProfile = {
  id: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
};

export type ProjectGithubLink = {
  projectTeamId: string;
  githubOrg: string;
  repoName: string;
  repoFullName: string | null;
  htmlUrl: string | null;
  defaultBranch: string;
  visibility: "private" | "public";
  permissionState: "normal" | "read_only" | "disabled";
  syncStatus: "pending" | "synced" | "failed" | "read_only";
  lastSyncedAt: string | null;
  lastError: string | null;
};

export type GithubIdentityStatus = {
  githubUrl: string | null;
  githubLogin: string | null;
  connectionStatus: "linked" | "disconnected" | "invalid" | null;
  hasGithubIdentity: boolean;
};

export type ProjectMember = {
  userId: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
  role: ProjectMemberRole;
  roleLabel: string;
  joinedAt: string;
};

export type ProjectLeadCandidate = {
  userId: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
  role: ProjectMemberRole | null;
  roleLabel: string;
  isProjectMember: boolean;
};

export type ProjectSummary = {
  id: string;
  slug: string;
  prefix: string;
  name: string;
  summary: string | null;
  description: string | null;
  projectType: ProjectType;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  lead: ProjectProfile | null;
  owner: ProjectProfile | null;
  memberCount: number;
  myRole: ProjectMemberRole | null;
  myRoleLabel: string;
  isMember: boolean;
  isLead: boolean;
  recruitmentStatus: ProjectRecruitmentStatus;
  recruitmentNote: string | null;
  isRecruiting: boolean;
  coverImageUrl: string | null;
  progress: number | null;
  guide: string | null;
  idRule: string | null;
  branchRule: string | null;
  lastReviewDecision: string | null;
  lastReviewReason: string | null;
  lastReviewedAt: string | null;
  reviewRequestedAt: string | null;
  lastRestoreReason: string | null;
  lastRestoredAt: string | null;
  githubLink: ProjectGithubLink | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  members: ProjectMember[];
};

export type CreateProjectInput = {
  name: string;
  summary?: string | null;
  description?: string | null;
  projectType?: ProjectType;
  visibility?: ProjectVisibility;
  metadata?: Record<string, unknown>;
};

export type UpdateProjectInput = CreateProjectInput;

export type ProjectSettingsInput = {
  summary?: string | null;
  description?: string | null;
  visibility?: ProjectVisibility;
  metadata?: Record<string, unknown>;
  isRunning: boolean;
  isRecruiting: boolean;
  isCompleted: boolean;
};

export type ProjectReviewDecision = "approve" | "reject";
export type ProjectJoinDecision = "approve" | "reject";
export type ProjectRunStatus = "recruiting" | "active";

export type ProjectJoinRequest = {
  id: string;
  projectTeamId: string;
  requesterUserId: string;
  requester: ProjectProfile | null;
  status: "pending" | "approved" | "rejected" | "canceled" | "expired";
  reason: string | null;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectDbRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  project_type: ProjectType;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  owner_user_id: string | null;
  lead_user_id: string | null;
  recruitment_status?: ProjectRecruitmentStatus | null;
  recruitment_note?: string | null;
  created_by: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type MembershipDbRow = {
  project_team_id: string;
  user_id: string;
  role: ProjectMemberRole;
  status: string;
  nickname_snapshot: string | null;
  display_name_snapshot: string | null;
  joined_at: string;
};

type ProfileDbRow = {
  id: string;
  display_name: string | null;
  nickname_display?: string | null;
  full_name: string | null;
  login_id?: string | null;
  avatar_url: string | null;
  email: string | null;
};

type ProjectJoinRequestDbRow = {
  id: string;
  project_team_id: string;
  requester_user_id: string;
  status: ProjectJoinRequest["status"];
  reason: string | null;
  review_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectOrganizationDbRow = {
  organization_id: string;
};

type MemberAccountDbRow = {
  user_id: string;
};

type ProjectGithubLinkDbRow = {
  project_team_id: string;
  github_org: string;
  repo_name: string;
  repo_full_name: string | null;
  html_url: string | null;
  default_branch: string | null;
  visibility: "private" | "public";
  permission_state: ProjectGithubLink["permissionState"];
  sync_status: ProjectGithubLink["syncStatus"];
  last_synced_at: string | null;
  last_error: string | null;
};

type GithubIdentityDbRow = {
  user_id: string;
  github_login: string | null;
  github_url: string | null;
  connection_status: GithubIdentityStatus["connectionStatus"];
};

type GithubProfileDbRow = {
  github_url: string | null;
};

const PROJECT_SELECT = [
  "id",
  "slug",
  "name",
  "summary",
  "description",
  "project_type",
  "visibility",
  "status",
  "owner_user_id",
  "lead_user_id",
  "recruitment_status",
  "recruitment_note",
  "created_by",
  "metadata",
  "created_at",
  "updated_at",
].join(", ");

const PROFILE_SELECT = [
  "id",
  "display_name",
  "nickname_display",
  "full_name",
  "login_id",
  "avatar_url",
  "email",
].join(", ");

const PROJECT_JOIN_REQUEST_SELECT = [
  "id",
  "project_team_id",
  "requester_user_id",
  "status",
  "reason",
  "review_reason",
  "reviewed_by",
  "reviewed_at",
  "created_at",
  "updated_at",
].join(", ");

const PROJECT_GITHUB_LINK_SELECT = [
  "project_team_id",
  "github_org",
  "repo_name",
  "repo_full_name",
  "html_url",
  "default_branch",
  "visibility",
  "permission_state",
  "sync_status",
  "last_synced_at",
  "last_error",
].join(", ");

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractGithubLoginFromUrl(value: string | null | undefined) {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const match = normalized.match(/^https:\/\/github\.com\/([^/?#]+)(?:[/?#].*)?$/i);
  if (!match?.[1]) return null;

  const login = match[1].toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$/.test(login)) {
    return null;
  }

  if (
    [
      "about",
      "apps",
      "blog",
      "collections",
      "contact",
      "enterprise",
      "events",
      "explore",
      "features",
      "github",
      "login",
      "marketplace",
      "new",
      "notifications",
      "orgs",
      "organizations",
      "pricing",
      "pulls",
      "search",
      "settings",
      "sponsors",
      "topics",
    ].includes(login)
  ) {
    return null;
  }

  return login;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readMetadataString(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeString(metadata[key]);
    if (value) return value;
  }

  return null;
}

function readMetadataRecord(metadata: Record<string, unknown>, key: string) {
  return metadataRecord(metadata[key]);
}

function readRecruitmentStatus(project: ProjectDbRow): ProjectRecruitmentStatus {
  return project.recruitment_status === "open" ? "open" : "closed";
}

function displayNameFor(profile: ProfileDbRow) {
  return (
    normalizeString(profile.nickname_display) ??
    normalizeString(profile.display_name) ??
    normalizeString(profile.full_name) ??
    normalizeString(profile.email)?.split("@")[0] ??
    "이름 없음"
  );
}

function profileSummary(profile: ProfileDbRow | null | undefined): ProjectProfile | null {
  if (!profile) return null;

  return {
    id: profile.id,
    displayName: displayNameFor(profile),
    loginId: normalizeString(profile.login_id),
    avatarUrl: normalizeString(profile.avatar_url),
  };
}

function mapGithubLink(row: ProjectGithubLinkDbRow): ProjectGithubLink {
  return {
    projectTeamId: row.project_team_id,
    githubOrg: row.github_org,
    repoName: row.repo_name,
    repoFullName: row.repo_full_name,
    htmlUrl: normalizeString(row.html_url),
    defaultBranch: normalizeString(row.default_branch) ?? "main",
    visibility: row.visibility === "public" ? "public" : "private",
    permissionState: row.permission_state,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
  };
}

function isGithubIntegrationMissing(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? "");

  return (
    message.includes("project_github_links") ||
    message.includes("member_github_identities") ||
    message.toLowerCase().includes("schema cache")
  );
}

function groupMemberships(rows: MembershipDbRow[]) {
  const map = new Map<string, MembershipDbRow[]>();

  for (const row of rows) {
    const current = map.get(row.project_team_id) ?? [];
    current.push(row);
    map.set(row.project_team_id, current);
  }

  return map;
}

async function listProfiles(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, ProjectProfile>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", uniqueIds);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return new Map(
    ((data ?? []) as ProfileDbRow[])
      .map((profile) => profileSummary(profile))
      .filter((profile): profile is ProjectProfile => profile !== null)
      .map((profile) => [profile.id, profile]),
  );
}

async function listGithubLinks(projectIds: string[]) {
  const uniqueIds = [...new Set(projectIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, ProjectGithubLink>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_github_links")
    .select(PROJECT_GITHUB_LINK_SELECT)
    .in("project_team_id", uniqueIds);

  if (error) {
    if (isGithubIntegrationMissing(error)) {
      return new Map<string, ProjectGithubLink>();
    }

    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  return new Map(
    ((data ?? []) as ProjectGithubLinkDbRow[])
      .map((row) => mapGithubLink(row))
      .map((link) => [link.projectTeamId, link]),
  );
}

function chooseLead(
  project: ProjectDbRow,
  memberships: MembershipDbRow[],
  profilesById: Map<string, ProjectProfile>,
) {
  const leadMembership =
    memberships.find((row) => row.role === "lead") ??
    memberships.find((row) => row.role === "maintainer");

  return (
    (project.lead_user_id ? profilesById.get(project.lead_user_id) ?? null : null) ??
    (leadMembership ? profilesById.get(leadMembership.user_id) ?? null : null) ??
    (project.owner_user_id ? profilesById.get(project.owner_user_id) ?? null : null)
  );
}

function mapProjectSummary(
  project: ProjectDbRow,
  viewerUserId: string,
  memberships: MembershipDbRow[],
  profilesById: Map<string, ProjectProfile>,
  githubLinksByProject: Map<string, ProjectGithubLink> = new Map(),
): ProjectSummary {
  const metadata = metadataRecord(project.metadata);
  const lastReview = readMetadataRecord(metadata, "lastReview");
  const lastReviewRequest = readMetadataRecord(metadata, "lastReviewRequest");
  const lastRestore = readMetadataRecord(metadata, "lastRestore");
  const myMembership = memberships.find((row) => row.user_id === viewerUserId) ?? null;
  const myRole = myMembership?.role ?? null;
  const recruitmentStatus = readRecruitmentStatus(project);

  return {
    id: project.id,
    slug: project.slug,
    prefix: getProjectPrefix(project.slug, project.name),
    name: project.name,
    summary: project.summary,
    description: project.description,
    projectType: project.project_type,
    visibility: project.visibility,
    status: project.status,
    lead: chooseLead(project, memberships, profilesById),
    owner: project.owner_user_id ? profilesById.get(project.owner_user_id) ?? null : null,
    memberCount: memberships.length,
    myRole,
    myRoleLabel: getProjectRoleLabel(myRole),
    isMember: Boolean(myMembership),
    isLead: myRole === "lead" || myRole === "maintainer",
    recruitmentStatus,
    recruitmentNote:
      normalizeString(project.recruitment_note) ??
      readMetadataString(metadata, "recruitmentNote", "recruitment_note"),
    isRecruiting:
      (project.status === "active" || project.status === "recruiting") &&
      project.visibility === "public" &&
      recruitmentStatus === "open",
    coverImageUrl: readMetadataString(
      metadata,
      "coverImageUrl",
      "cover_image_url",
      "imageUrl",
      "image_url",
      "thumbnailUrl",
      "thumbnail_url",
    ),
    progress: readProjectProgress(metadata),
    guide: readMetadataString(metadata, "guide", "collaborationGuide", "collaboration_guide"),
    idRule: readMetadataString(metadata, "idRule", "id_rule", "taskIdRule"),
    branchRule: readMetadataString(metadata, "branchRule", "branch_rule"),
    lastReviewDecision: readMetadataString(lastReview, "decision"),
    lastReviewReason: readMetadataString(lastReview, "reason"),
    lastReviewedAt: readMetadataString(lastReview, "reviewedAt", "reviewed_at"),
    reviewRequestedAt: readMetadataString(lastReviewRequest, "requestedAt", "requested_at"),
    lastRestoreReason: readMetadataString(lastRestore, "reason"),
    lastRestoredAt: readMetadataString(lastRestore, "restoredAt", "restored_at"),
    githubLink: githubLinksByProject.get(project.id) ?? null,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function mapProjectMember(
  membership: MembershipDbRow,
  profilesById: Map<string, ProjectProfile>,
): ProjectMember {
  const profile = profilesById.get(membership.user_id);

  return {
    userId: membership.user_id,
    displayName:
      profile?.displayName ??
      normalizeString(membership.display_name_snapshot) ??
      normalizeString(membership.nickname_snapshot) ??
      "이름 없음",
    loginId: profile?.loginId ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    role: membership.role,
    roleLabel: getProjectRoleLabel(membership.role),
    joinedAt: membership.joined_at,
  };
}

function mapProjectJoinRequest(
  row: ProjectJoinRequestDbRow,
  profilesById: Map<string, ProjectProfile>,
): ProjectJoinRequest {
  return {
    id: row.id,
    projectTeamId: row.project_team_id,
    requesterUserId: row.requester_user_id,
    requester: profilesById.get(row.requester_user_id) ?? null,
    status: row.status,
    reason: row.reason,
    reviewReason: row.review_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listActiveMemberships(projectIds?: string[]) {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("project_team_memberships")
    .select(
      "project_team_id, user_id, role, status, nickname_snapshot, display_name_snapshot, joined_at",
    )
    .eq("status", "active");

  if (projectIds && projectIds.length > 0) {
    query = query.in("project_team_id", projectIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return (data ?? []) as MembershipDbRow[];
}

async function hydrateProjectSummary(project: ProjectDbRow, viewerUserId: string) {
  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);
  const githubLinksByProject = await listGithubLinks([project.id]);

  return mapProjectSummary(project, viewerUserId, memberships, profilesById, githubLinksByProject);
}

export async function listProjects(viewerUserId: string): Promise<ProjectSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_teams")
    .select(PROJECT_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const projects = (data ?? []) as ProjectDbRow[];
  if (projects.length === 0) return [];

  const memberships = await listActiveMemberships(projects.map((project) => project.id));
  const membershipsByProject = groupMemberships(memberships);
  const profileIds = [
    ...projects.flatMap((project) => [
      project.owner_user_id,
      project.lead_user_id,
      project.created_by,
    ]),
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);
  const githubLinksByProject = await listGithubLinks(projects.map((project) => project.id));

  return projects
    .map((project) =>
      mapProjectSummary(
        project,
        viewerUserId,
        membershipsByProject.get(project.id) ?? [],
        profilesById,
        githubLinksByProject,
      ),
    )
    .sort((a, b) => {
      if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export async function createProject(
  input: CreateProjectInput,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_project_team", {
    input_slug: null,
    input_name: input.name,
    input_summary: input.summary ?? null,
    input_description: input.description ?? null,
    input_project_type: input.projectType ?? "autonomous",
    input_visibility: input.visibility ?? "private",
    input_metadata: input.metadata ?? {},
  });

  if (error) throw new Error(sanitizeUserError(error, "프로젝트를 생성하지 못했습니다."));

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트를 생성했지만 서버 응답을 확인하지 못했습니다.");
  }

  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);
  const githubLinksByProject = await listGithubLinks([project.id]);

  return mapProjectSummary(project, viewerUserId, memberships, profilesById, githubLinksByProject);
}

export async function updateRejectedProjectAndRequestReview(
  projectId: string,
  input: UpdateProjectInput,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("resubmit_project_team", {
    p_project_team_id: projectId,
    p_name: input.name,
    p_summary: input.summary ?? null,
    p_description: input.description ?? null,
    p_project_type: input.projectType ?? "autonomous",
    p_visibility: input.visibility ?? "private",
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "프로젝트 재심사를 요청하지 못했습니다."));
  }

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 재심사 요청 결과를 확인하지 못했습니다.");
  }

  void triggerGithubSync(10);
  return hydrateProjectSummary(project, viewerUserId);
}

export async function updateProjectSettings(
  projectId: string,
  input: ProjectSettingsInput,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("update_project_team_settings", {
    p_project_team_id: projectId,
    p_summary: input.summary ?? null,
    p_description: input.description ?? null,
    p_visibility: input.visibility ?? "private",
    p_metadata: input.metadata ?? {},
    p_is_running: input.isRunning,
    p_is_recruiting: input.isRecruiting,
    p_is_completed: input.isCompleted,
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "프로젝트 설정을 저장하지 못했습니다."));
  }

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 설정 저장 결과를 확인하지 못했습니다.");
  }

  void triggerGithubSync(10);
  return hydrateProjectSummary(project, viewerUserId);
}

export async function getProjectBySlug(
  slug: string,
  viewerUserId: string,
): Promise<ProjectDetail | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_teams")
    .select(PROJECT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) return null;

  const project = data as ProjectDbRow;
  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);
  const githubLinksByProject = await listGithubLinks([project.id]);
  const summary = mapProjectSummary(
    project,
    viewerUserId,
    memberships,
    profilesById,
    githubLinksByProject,
  );

  return {
    ...summary,
    members: memberships
      .map((membership) => mapProjectMember(membership, profilesById))
      .sort((a, b) => {
        const roleRank: Record<ProjectMemberRole, number> = {
          lead: 0,
          maintainer: 1,
          delegate: 2,
          member: 3,
        };
        return roleRank[a.role] - roleRank[b.role] || a.displayName.localeCompare(b.displayName, "ko");
      }),
  };
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const memberships = await listActiveMemberships([projectId]);
  const profilesById = await listProfiles(memberships.map((membership) => membership.user_id));

  return memberships
    .map((membership) => mapProjectMember(membership, profilesById))
    .sort((a, b) => {
      const roleRank: Record<ProjectMemberRole, number> = {
        lead: 0,
        maintainer: 1,
        delegate: 2,
        member: 3,
      };
      return roleRank[a.role] - roleRank[b.role] || a.displayName.localeCompare(b.displayName, "ko");
    });
}

export async function listProjectLeadCandidates(projectId: string): Promise<ProjectLeadCandidate[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: projectData, error: projectError } = await supabase
    .from("project_teams")
    .select("organization_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(sanitizeUserError(projectError, "프로젝트 리드 후보를 불러오지 못했습니다."));
  }

  const project = projectData as ProjectOrganizationDbRow | null;
  if (!project?.organization_id) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  const [{ data: accountData, error: accountError }, projectMembers] = await Promise.all([
    supabase
      .from("member_accounts")
      .select("user_id")
      .eq("organization_id", project.organization_id)
      .eq("status", "active"),
    listProjectMembers(projectId),
  ]);

  if (accountError) {
    throw new Error(sanitizeUserError(accountError, "프로젝트 리드 후보를 불러오지 못했습니다."));
  }

  const activeUserIds = ((accountData ?? []) as MemberAccountDbRow[]).map((row) => row.user_id);
  const profilesById = await listProfiles(activeUserIds);
  const projectMemberByUser = new Map(projectMembers.map((member) => [member.userId, member]));
  const roleRank: Record<ProjectMemberRole, number> = {
    lead: 0,
    maintainer: 1,
    delegate: 2,
    member: 3,
  };

  return activeUserIds
    .map((userId) => {
      const profile = profilesById.get(userId);
      if (!profile) return null;

      const projectMember = projectMemberByUser.get(userId);

      return {
        userId,
        displayName: profile.displayName,
        loginId: profile.loginId,
        avatarUrl: profile.avatarUrl,
        role: projectMember?.role ?? null,
        roleLabel: projectMember?.roleLabel ?? "활성 부원",
        isProjectMember: Boolean(projectMember),
      } satisfies ProjectLeadCandidate;
    })
    .filter((candidate): candidate is ProjectLeadCandidate => candidate !== null)
    .sort((a, b) => {
      if (a.isProjectMember !== b.isProjectMember) return a.isProjectMember ? -1 : 1;
      const aRank = a.role ? roleRank[a.role] : 4;
      const bRank = b.role ? roleRank[b.role] : 4;
      return aRank - bRank || a.displayName.localeCompare(b.displayName, "ko");
    });
}

export async function setProjectLead(
  projectId: string,
  nextLeadUserId: string,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("set_project_team_lead", {
    p_project_team_id: projectId,
    p_lead_user_id: nextLeadUserId,
  });

  if (error) throw new Error(sanitizeUserError(error, "프로젝트 리드를 변경하지 못했습니다."));

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 리드 변경 결과를 확인하지 못했습니다.");
  }

  void triggerGithubSync(10);
  return hydrateProjectSummary(project, viewerUserId);
}

export async function reviewProjectTeam(
  projectId: string,
  decision: ProjectReviewDecision,
  reason: string | null,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("review_project_team", {
    p_project_team_id: projectId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error) throw new Error(sanitizeUserError(error, "프로젝트 검토를 처리하지 못했습니다."));

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 검토 결과를 확인하지 못했습니다.");
  }

  if (decision === "approve") {
    void triggerGithubSync(10);
  }

  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);

  return mapProjectSummary(project, viewerUserId, memberships, profilesById);
}

export async function restoreRejectedProject(
  projectId: string,
  reason: string | null,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("restore_rejected_project_team", {
    p_project_team_id: projectId,
    p_reason: reason,
  });

  if (error) throw new Error(sanitizeUserError(error, "반려 프로젝트를 복구하지 못했습니다."));

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("반려 프로젝트 복구 결과를 확인하지 못했습니다.");
  }

  void triggerGithubSync(10);
  return hydrateProjectSummary(project, viewerUserId);
}

export async function requestProjectJoin(
  projectId: string,
  reason: string | null,
): Promise<ProjectJoinRequest> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("request_project_join", {
    p_project_team_id: projectId,
    p_reason: reason,
  });

  if (error) throw new Error(sanitizeUserError(error, "프로젝트 참여 신청을 보내지 못했습니다."));

  const row = (Array.isArray(data) ? data[0] : data) as ProjectJoinRequestDbRow | null;
  if (!row?.id) {
    throw new Error("프로젝트 참여 신청 결과를 확인하지 못했습니다.");
  }

  const profilesById = await listProfiles([row.requester_user_id]);
  return mapProjectJoinRequest(row, profilesById);
}

export async function listProjectJoinRequests(projectId: string): Promise<ProjectJoinRequest[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_team_join_requests")
    .select(PROJECT_JOIN_REQUEST_SELECT)
    .eq("project_team_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(sanitizeUserError(error, "프로젝트 참여 신청을 불러오지 못했습니다."));

  const rows = (data ?? []) as ProjectJoinRequestDbRow[];
  const profilesById = await listProfiles(rows.map((row) => row.requester_user_id));
  return rows.map((row) => mapProjectJoinRequest(row, profilesById));
}

export async function reviewProjectJoinRequest(
  requestId: string,
  decision: ProjectJoinDecision,
  reason: string | null,
): Promise<ProjectJoinRequest> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("review_project_join_request", {
    p_request_id: requestId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "프로젝트 참여 신청 검토를 처리하지 못했습니다."));
  }

  const row = (Array.isArray(data) ? data[0] : data) as ProjectJoinRequestDbRow | null;
  if (!row?.id) {
    throw new Error("프로젝트 참여 신청 검토 결과를 확인하지 못했습니다.");
  }

  if (decision === "approve") {
    void triggerGithubSync(10);
  }

  const profilesById = await listProfiles([row.requester_user_id]);
  return mapProjectJoinRequest(row, profilesById);
}

export async function setProjectRecruitment(
  projectId: string,
  recruitmentStatus: ProjectRecruitmentStatus,
  recruitmentNote: string | null,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("set_project_recruitment", {
    p_project_team_id: projectId,
    p_recruitment_status: recruitmentStatus,
    p_recruitment_note: recruitmentNote,
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "프로젝트 모집 상태를 변경하지 못했습니다."));
  }

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 모집 상태 변경 결과를 확인하지 못했습니다.");
  }

  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);

  return mapProjectSummary(project, viewerUserId, memberships, profilesById);
}

export async function setProjectRunStatus(
  projectId: string,
  status: ProjectRunStatus,
  viewerUserId: string,
): Promise<ProjectSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("set_project_run_status", {
    p_project_team_id: projectId,
    p_status: status,
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "프로젝트 진행 상태를 변경하지 못했습니다."));
  }

  const project = (Array.isArray(data) ? data[0] : data) as ProjectDbRow | null;
  if (!project?.id) {
    throw new Error("프로젝트 진행 상태 변경 결과를 확인하지 못했습니다.");
  }

  void triggerGithubSync(10);

  const memberships = await listActiveMemberships([project.id]);
  const profileIds = [
    project.owner_user_id,
    project.lead_user_id,
    project.created_by,
    ...memberships.map((membership) => membership.user_id),
  ].filter((id): id is string => typeof id === "string");
  const profilesById = await listProfiles(profileIds);

  return mapProjectSummary(project, viewerUserId, memberships, profilesById);
}

export async function getCurrentUserGithubReadiness(
  userId: string,
): Promise<GithubIdentityStatus> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: identityData, error: identityError }, { data: profileData, error: profileError }] =
    await Promise.all([
      supabase
        .from("member_github_identities")
        .select("user_id, github_login, github_url, connection_status")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("profiles").select("github_url").eq("id", userId).maybeSingle(),
    ]);

  if (profileError) {
    throw new Error(sanitizeUserError(profileError, FALLBACK));
  }

  if (identityError && !isGithubIntegrationMissing(identityError)) {
    throw new Error(sanitizeUserError(identityError, FALLBACK));
  }

  const profile = profileData as GithubProfileDbRow | null;
  const identity = identityError ? null : (identityData as GithubIdentityDbRow | null);
  const githubUrl = normalizeString(identity?.github_url) ?? normalizeString(profile?.github_url);
  const githubLogin =
    normalizeString(identity?.github_login) ?? extractGithubLoginFromUrl(githubUrl);
  const connectionStatus = identity?.connection_status ?? (githubLogin ? "linked" : null);

  return {
    githubUrl,
    githubLogin,
    connectionStatus,
    hasGithubIdentity: Boolean(githubLogin && connectionStatus === "linked"),
  };
}
