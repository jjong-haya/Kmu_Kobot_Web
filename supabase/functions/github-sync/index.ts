import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

type GithubSyncJob = {
  id: string;
  organization_id: string | null;
  project_team_id: string | null;
  user_id: string | null;
  job_type:
    | "project_repo_provision"
    | "project_member_invite"
    | "project_member_remove"
    | "project_repo_freeze";
  status: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

type ProjectRow = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  status: string;
};

type MembershipRow = {
  project_team_id: string;
  user_id: string;
  role: "lead" | "maintainer" | "member" | "delegate";
  status: string;
};

type GithubIdentityRow = {
  user_id: string;
  github_login: string | null;
  github_user_id: number | null;
  github_url: string | null;
  connection_status: "linked" | "disconnected" | "invalid";
};

type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  private: boolean;
};

type GithubTeam = {
  id: number;
  name: string;
  slug: string;
};

type GithubUser = {
  id: number;
  login: string;
  html_url: string;
};

const GITHUB_API_VERSION = "2022-11-28";
const USER_AGENT = "kobot-project-sync";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const githubAppId = Deno.env.get("GITHUB_APP_ID") ?? "";
const githubPrivateKey = (Deno.env.get("GITHUB_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const githubInstallationId = Deno.env.get("GITHUB_INSTALLATION_ID") ?? "";
const defaultGithubOrg = Deno.env.get("GITHUB_ORG") ?? "Kookmin-Kobot";
const syncSecret = Deno.env.get("GITHUB_SYNC_SECRET") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase service configuration for github-sync.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

class GithubApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`GitHub API failed with ${status}: ${body.slice(0, 240)}`);
    this.status = status;
    this.body = body;
  }
}

class AuthorizationError extends Error {}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function base64Url(input: ArrayBuffer | Uint8Array | string) {
  let bytes: Uint8Array;

  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function derLength(length: number) {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  const bytes = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>= 8;
  }

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function derWrap(tag: number, content: Uint8Array) {
  return concatBytes([new Uint8Array([tag]), derLength(content.length), content]);
}

function pemToPkcs8ArrayBuffer(pem: string) {
  const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
  const body = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace("-----BEGIN RSA PRIVATE KEY-----", "")
    .replace("-----END RSA PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  if (!isPkcs1) {
    return bytes.buffer;
  }

  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaAlgorithmIdentifier = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ]);
  const privateKey = derWrap(0x04, bytes);
  const privateKeyInfo = derWrap(0x30, concatBytes([version, rsaAlgorithmIdentifier, privateKey]));

  return privateKeyInfo.buffer;
}

async function createGithubAppJwt() {
  if (!githubAppId || !githubPrivateKey) {
    throw new Error("GitHub App credentials are not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 540,
      iss: githubAppId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8ArrayBuffer(githubPrivateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64Url(signature)}`;
}

async function getInstallationToken() {
  if (!githubInstallationId) {
    throw new Error("GITHUB_INSTALLATION_ID is not configured.");
  }

  const jwt = await createGithubAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${githubInstallationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${jwt}`,
        "x-github-api-version": GITHUB_API_VERSION,
        "user-agent": USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new GithubApiError(response.status, await response.text());
  }

  const body = await response.json() as { token?: string };
  if (!body.token) {
    throw new Error("GitHub installation token response did not include a token.");
  }

  return body.token;
}

async function githubRequest<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
  options?: { allow404?: boolean },
): Promise<T | null> {
  const headers = new Headers({
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": GITHUB_API_VERSION,
    "user-agent": USER_AGENT,
  });

  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 404 && options?.allow404) {
    return null;
  }

  if (!response.ok) {
    throw new GithubApiError(response.status, await response.text());
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json() as T;
}

async function authorizeRequest(request: Request) {
  if (syncSecret && request.headers.get("x-github-sync-secret") === syncSecret) {
    return;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice("bearer ".length).trim()
    : "";

  if (!token) {
    throw new AuthorizationError("Missing authorization token.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new AuthorizationError("Invalid authorization token.");
  }
}

function repoNameFor(project: ProjectRow) {
  return project.slug
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || `project-${project.id.slice(0, 8)}`;
}

function teamBaseFor(repoName: string) {
  return repoName.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function isLeadRole(role: MembershipRow["role"] | string | null | undefined) {
  return role === "lead" || role === "maintainer";
}

async function recordEvent(
  job: GithubSyncJob,
  eventType: string,
  payload: Record<string, unknown>,
  status: "recorded" | "warning" | "failed" = "recorded",
) {
  await supabase.from("github_sync_events").insert({
    job_id: job.id,
    project_team_id: job.project_team_id,
    user_id: job.user_id,
    event_type: eventType,
    status,
    payload,
  });
}

async function loadProject(projectTeamId: string) {
  const { data, error } = await supabase
    .from("project_teams")
    .select("id, organization_id, slug, name, summary, description, status")
    .eq("id", projectTeamId)
    .single();

  if (error) throw error;
  return data as ProjectRow;
}

async function loadMemberships(projectTeamId: string) {
  const { data, error } = await supabase
    .from("project_team_memberships")
    .select("project_team_id, user_id, role, status")
    .eq("project_team_id", projectTeamId)
    .eq("status", "active");

  if (error) throw error;
  return (data ?? []) as MembershipRow[];
}

async function loadIdentities(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, GithubIdentityRow>();
  }

  const { data, error } = await supabase
    .from("member_github_identities")
    .select("user_id, github_login, github_user_id, github_url, connection_status")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map(
    ((data ?? []) as GithubIdentityRow[]).map((identity) => [identity.user_id, identity]),
  );
}

async function updateIdentityFromGithub(token: string, identity: GithubIdentityRow) {
  if (!identity.github_login || identity.connection_status !== "linked") {
    return identity;
  }

  if (identity.github_user_id) {
    return identity;
  }

  const user = await githubRequest<GithubUser>(
    token,
    "GET",
    `/users/${encodeURIComponent(identity.github_login)}`,
    undefined,
    { allow404: true },
  );

  if (!user) {
    await supabase
      .from("member_github_identities")
      .update({
        connection_status: "invalid",
        last_resolved_at: new Date().toISOString(),
      })
      .eq("user_id", identity.user_id);

    return { ...identity, connection_status: "invalid" as const };
  }

  await supabase
    .from("member_github_identities")
    .update({
      github_login: user.login,
      github_user_id: user.id,
      github_url: user.html_url,
      connection_status: "linked",
      last_resolved_at: new Date().toISOString(),
    })
    .eq("user_id", identity.user_id);

  return {
    ...identity,
    github_login: user.login,
    github_user_id: user.id,
    github_url: user.html_url,
    connection_status: "linked" as const,
  };
}

async function ensureRepo(token: string, project: ProjectRow, org: string) {
  const repoName = repoNameFor(project);
  const description = (project.summary ?? project.description ?? `${project.name} project`)
    .replace(/\s+/g, " ")
    .slice(0, 350);
  let repo = await githubRequest<GithubRepo>(
    token,
    "GET",
    `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repoName)}`,
    undefined,
    { allow404: true },
  );

  if (!repo) {
    try {
      repo = await githubRequest<GithubRepo>(
        token,
        "POST",
        `/orgs/${encodeURIComponent(org)}/repos`,
        {
          name: repoName,
          description,
          private: true,
          auto_init: true,
          has_issues: true,
          has_projects: true,
          has_wiki: false,
        },
      );
    } catch (error) {
      if (!(error instanceof GithubApiError) || error.status !== 422) {
        throw error;
      }

      repo = await githubRequest<GithubRepo>(
        token,
        "GET",
        `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repoName)}`,
      );
    }
  }

  if (!repo) {
    throw new Error("Repository could not be created or loaded.");
  }

  await supabase.from("project_github_links").upsert(
    {
      project_team_id: project.id,
      organization_id: project.organization_id,
      github_org: org,
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      repo_id: repo.id,
      html_url: repo.html_url,
      default_branch: repo.default_branch || "main",
      visibility: repo.private ? "private" : "public",
      permission_state: "normal",
      sync_status: "pending",
      last_synced_at: null,
      last_error: null,
    },
    { onConflict: "project_team_id" },
  );

  return repo;
}

async function ensureTeam(
  token: string,
  project: ProjectRow,
  org: string,
  kind: "leads" | "members",
  repoName: string,
  permission: "pull" | "push" | "maintain",
) {
  const base = teamBaseFor(repoName);
  const teamSlug = `${base}-${kind}`;
  const teamName = `${repoName}-${kind}`.slice(0, 120);
  let team = await githubRequest<GithubTeam>(
    token,
    "GET",
    `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}`,
    undefined,
    { allow404: true },
  );

  if (!team) {
    team = await githubRequest<GithubTeam>(
      token,
      "POST",
      `/orgs/${encodeURIComponent(org)}/teams`,
      {
        name: teamName,
        description: `${project.name} ${kind} access`,
        privacy: "closed",
      },
    );
  }

  if (!team) {
    throw new Error(`Team ${kind} could not be created or loaded.`);
  }

  await githubRequest(
    token,
    "PUT",
    `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(team.slug)}/repos/${encodeURIComponent(org)}/${encodeURIComponent(repoName)}`,
    { permission },
  );

  await supabase.from("project_github_teams").upsert(
    {
      project_team_id: project.id,
      github_org: org,
      team_kind: kind,
      github_team_id: team.id,
      team_slug: team.slug,
      team_name: team.name,
      repository_permission: permission,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "project_team_id,team_kind" },
  );

  return team;
}

async function ensureProjectGithub(
  token: string,
  project: ProjectRow,
  org: string,
  options?: { readOnly?: boolean },
) {
  const repo = await ensureRepo(token, project, org);
  const permission = options?.readOnly ? "pull" : undefined;
  const leads = await ensureTeam(token, project, org, "leads", repo.name, permission ?? "maintain");
  const members = await ensureTeam(token, project, org, "members", repo.name, permission ?? "push");
  const now = new Date().toISOString();

  await supabase
    .from("project_github_links")
    .update({
      permission_state: options?.readOnly ? "read_only" : "normal",
      sync_status: options?.readOnly ? "read_only" : "synced",
      last_synced_at: now,
      last_error: null,
    })
    .eq("project_team_id", project.id);

  return { repo, leads, members };
}

async function removeFromTeam(token: string, org: string, teamSlug: string, login: string) {
  try {
    await githubRequest(
      token,
      "DELETE",
      `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(login)}`,
      undefined,
      { allow404: true },
    );
  } catch (error) {
    if (error instanceof GithubApiError && error.status === 404) {
      return;
    }

    throw error;
  }
}

async function syncMembership(
  token: string,
  job: GithubSyncJob,
  project: ProjectRow,
  membership: MembershipRow,
  identity: GithubIdentityRow | undefined,
  teams: { leads: GithubTeam; members: GithubTeam },
  org: string,
) {
  if (!identity || identity.connection_status !== "linked" || !identity.github_login) {
    await recordEvent(
      job,
      "github.identity.missing",
      { userId: membership.user_id, role: membership.role },
      "warning",
    );
    return { invited: false, reason: "missing_identity" };
  }

  const resolved = await updateIdentityFromGithub(token, identity);
  if (!resolved.github_login || resolved.connection_status !== "linked") {
    await recordEvent(
      job,
      "github.identity.invalid",
      { userId: membership.user_id, githubLogin: identity.github_login },
      "warning",
    );
    return { invited: false, reason: "invalid_identity" };
  }

  const targetTeam = isLeadRole(membership.role) ? teams.leads : teams.members;
  const otherTeam = isLeadRole(membership.role) ? teams.members : teams.leads;

  await removeFromTeam(token, org, otherTeam.slug, resolved.github_login);
  await githubRequest(
    token,
    "PUT",
    `/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(targetTeam.slug)}/memberships/${encodeURIComponent(resolved.github_login)}`,
    { role: "member" },
  );

  await recordEvent(job, "github.member.synced", {
    userId: membership.user_id,
    githubLogin: resolved.github_login,
    role: membership.role,
    teamSlug: targetTeam.slug,
  });

  return { invited: true, githubLogin: resolved.github_login, teamSlug: targetTeam.slug };
}

async function processProvisionJob(token: string, job: GithubSyncJob) {
  if (!job.project_team_id) throw new Error("Project job does not include project_team_id.");
  const org = String(job.payload.githubOrg ?? defaultGithubOrg);
  const project = await loadProject(job.project_team_id);
  const teams = await ensureProjectGithub(token, project, org);
  const memberships = await loadMemberships(project.id);
  const identities = await loadIdentities(memberships.map((membership) => membership.user_id));
  const results = [];

  for (const membership of memberships) {
    results.push(
      await syncMembership(
        token,
        job,
        project,
        membership,
        identities.get(membership.user_id),
        teams,
        org,
      ),
    );
  }

  return {
    repo: teams.repo.full_name,
    membersProcessed: results.length,
    membersInvited: results.filter((result) => result.invited).length,
  };
}

async function processMemberInviteJob(token: string, job: GithubSyncJob) {
  if (!job.project_team_id || !job.user_id) {
    throw new Error("Member invite job is missing project_team_id or user_id.");
  }

  const org = String(job.payload.githubOrg ?? defaultGithubOrg);
  const project = await loadProject(job.project_team_id);
  const teams = await ensureProjectGithub(token, project, org);
  const { data, error } = await supabase
    .from("project_team_memberships")
    .select("project_team_id, user_id, role, status")
    .eq("project_team_id", job.project_team_id)
    .eq("user_id", job.user_id)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== "active") {
    return await processMemberRemoveJob(token, job);
  }

  const identities = await loadIdentities([job.user_id]);
  return await syncMembership(
    token,
    job,
    project,
    data as MembershipRow,
    identities.get(job.user_id),
    teams,
    org,
  );
}

async function processMemberRemoveJob(token: string, job: GithubSyncJob) {
  if (!job.project_team_id || !job.user_id) {
    throw new Error("Member remove job is missing project_team_id or user_id.");
  }

  const org = String(job.payload.githubOrg ?? defaultGithubOrg);
  const project = await loadProject(job.project_team_id);
  const teams = await ensureProjectGithub(token, project, org, {
    readOnly: project.status === "archived",
  });
  const identities = await loadIdentities([job.user_id]);
  const identity = identities.get(job.user_id);

  if (!identity?.github_login) {
    await recordEvent(job, "github.member.remove_skipped", {
      userId: job.user_id,
      reason: "missing_known_login",
    }, "warning");
    return { removed: false, reason: "missing_known_login" };
  }

  await removeFromTeam(token, org, teams.leads.slug, identity.github_login);
  await removeFromTeam(token, org, teams.members.slug, identity.github_login);
  await recordEvent(job, "github.member.removed", {
    userId: job.user_id,
    githubLogin: identity.github_login,
  });

  return { removed: true, githubLogin: identity.github_login };
}

async function processFreezeJob(token: string, job: GithubSyncJob) {
  if (!job.project_team_id) throw new Error("Freeze job does not include project_team_id.");
  const org = String(job.payload.githubOrg ?? defaultGithubOrg);
  const project = await loadProject(job.project_team_id);
  const teams = await ensureProjectGithub(token, project, org, { readOnly: true });

  await recordEvent(job, "github.repo.read_only", {
    repo: teams.repo.full_name,
    leadsTeam: teams.leads.slug,
    membersTeam: teams.members.slug,
  });

  return { repo: teams.repo.full_name, permission: "pull" };
}

async function processJob(token: string, job: GithubSyncJob) {
  switch (job.job_type) {
    case "project_repo_provision":
      return await processProvisionJob(token, job);
    case "project_member_invite":
      return await processMemberInviteJob(token, job);
    case "project_member_remove":
      return await processMemberRemoveJob(token, job);
    case "project_repo_freeze":
      return await processFreezeJob(token, job);
    default:
      throw new Error(`Unsupported job type: ${job.job_type}`);
  }
}

function nextRunAfter(attempts: number) {
  const seconds = Math.min(15 * 60, Math.max(30, 30 * 2 ** Math.max(0, attempts - 1)));
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function claimReadyJobs(limit: number) {
  const { data, error } = await supabase
    .from("github_sync_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const claimed: GithubSyncJob[] = [];
  const lockedBy = crypto.randomUUID();

  for (const job of (data ?? []) as GithubSyncJob[]) {
    const { data: locked, error: lockError } = await supabase
      .from("github_sync_jobs")
      .update({
        status: "processing",
        locked_by: lockedBy,
        locked_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (lockError) throw lockError;
    if (locked) claimed.push(locked as GithubSyncJob);
  }

  return claimed;
}

async function completeJob(job: GithubSyncJob, result: unknown) {
  await supabase
    .from("github_sync_jobs")
    .update({
      status: "succeeded",
      result,
      last_error: null,
      locked_by: null,
      locked_at: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function failJob(job: GithubSyncJob, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const terminal = job.attempts >= job.max_attempts;

  if (
    job.project_team_id &&
    (job.job_type === "project_repo_provision" || job.job_type === "project_repo_freeze")
  ) {
    await supabase
      .from("project_github_links")
      .update({
        sync_status: "failed",
        last_error: message.slice(0, 1000),
      })
      .eq("project_team_id", job.project_team_id);
  }

  await recordEvent(job, "github.job.failed", { message }, "failed");
  await supabase
    .from("github_sync_jobs")
    .update({
      status: terminal ? "failed" : "pending",
      last_error: message.slice(0, 1000),
      locked_by: null,
      locked_at: null,
      run_after: terminal ? new Date().toISOString() : nextRunAfter(job.attempts),
      completed_at: terminal ? new Date().toISOString() : null,
    })
    .eq("id", job.id);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    await authorizeRequest(request);

    if (!githubAppId || !githubPrivateKey || !githubInstallationId) {
      return jsonResponse(
        {
          error:
            "GitHub App is not configured. Set GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_INSTALLATION_ID.",
        },
        503,
      );
    }

    const body = await request.json().catch(() => ({})) as { limit?: number };
    const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 25);
    const token = await getInstallationToken();
    const jobs = await claimReadyJobs(limit);
    const processed = [];

    for (const job of jobs) {
      try {
        const result = await processJob(token, job);
        await completeJob(job, result);
        processed.push({ id: job.id, jobType: job.job_type, status: "succeeded" });
      } catch (error) {
        await failJob(job, error);
        processed.push({
          id: job.id,
          jobType: job.job_type,
          status: "failed_or_retrying",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return jsonResponse({ processed });
  } catch (error) {
    const status = error instanceof AuthorizationError
      ? 401
      : error instanceof GithubApiError
        ? error.status
        : 500;

    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      status,
    );
  }
});
