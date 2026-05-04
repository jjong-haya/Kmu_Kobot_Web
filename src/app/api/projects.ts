import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import {
  getProjectPrefix,
  getProjectRoleLabel,
  readProjectProgress,
} from "./project-policy.js";

const FALLBACK = "프로젝트 데이터를 불러오지 못했습니다.";

export type ProjectStatus = "pending" | "active" | "rejected" | "archived";
export type ProjectVisibility = "public" | "private";
export type ProjectType = "official_based" | "personal" | "autonomous";
export type ProjectMemberRole = "lead" | "maintainer" | "member" | "delegate";

export type ProjectProfile = {
  id: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
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
  progress: number | null;
  guide: string | null;
  idRule: string | null;
  branchRule: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  members: ProjectMember[];
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

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
): ProjectSummary {
  const metadata = metadataRecord(project.metadata);
  const myMembership = memberships.find((row) => row.user_id === viewerUserId) ?? null;
  const myRole = myMembership?.role ?? null;

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
    progress: readProjectProgress(metadata),
    guide: readMetadataString(metadata, "guide", "collaborationGuide", "collaboration_guide"),
    idRule: readMetadataString(metadata, "idRule", "id_rule", "taskIdRule"),
    branchRule: readMetadataString(metadata, "branchRule", "branch_rule"),
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

  return projects
    .map((project) =>
      mapProjectSummary(
        project,
        viewerUserId,
        membershipsByProject.get(project.id) ?? [],
        profilesById,
      ),
    )
    .sort((a, b) => {
      if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
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
  const summary = mapProjectSummary(project, viewerUserId, memberships, profilesById);

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
