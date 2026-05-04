import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import { listBookingsInRange } from "./space-bookings";

const FALLBACK = "대시보드 데이터를 불러오지 못했습니다.";

export type DashboardNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  importance: "normal" | "important";
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type DashboardNotice = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export type DashboardProject = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  role: string;
  status: string;
  members: number;
  progress: number | null;
  updatedAt: string;
};

export type DashboardBooking = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  organizer: string;
  type: string;
  attendees: number;
};

export type DashboardContactRequest = {
  id: string;
  reason: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  requesterUserId: string;
  recipientUserId: string;
};

export type DashboardData = {
  unreadNotificationCount: number;
  notifications: DashboardNotification[];
  notices: DashboardNotice[];
  projects: DashboardProject[];
  bookings: DashboardBooking[];
  contactRequests: DashboardContactRequest[];
  failedSections: DashboardSection[];
};

export type DashboardSection =
  | "notifications"
  | "notices"
  | "projects"
  | "bookings"
  | "contactRequests";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  importance: "normal" | "important";
  href: string | null;
  read_at: string | null;
  created_at: string;
};

type NoticeRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type ProjectMembershipRow = {
  project_team_id: string;
  role: string;
};

type ProjectTeamRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  status: string;
  metadata: unknown;
  updated_at: string;
};

type ProjectMemberCountRow = {
  project_team_id: string;
};

type ContactRequestRow = {
  id: string;
  reason: string;
  status: string;
  expires_at: string;
  created_at: string;
  requester_user_id: string;
  recipient_user_id: string;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function readProgress(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;

  const bag = metadata as Record<string, unknown>;
  const raw =
    bag.progress ??
    bag.progressPercent ??
    bag.progress_percent ??
    bag.completion ??
    bag.completionPercent;

  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw)
        : Number.NaN;

  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapProjectRole(role: string) {
  switch (role) {
    case "lead":
      return "리드";
    case "maintainer":
      return "관리";
    case "delegate":
      return "위임";
    default:
      return "참여";
  }
}

async function listDashboardNotifications(userId: string) {
  const supabase = getSupabaseBrowserClient();

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, importance, href, read_at, created_at")
      .eq("recipient_user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .is("deleted_at", null)
      .is("read_at", null),
  ]);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (countError) throw new Error(sanitizeUserError(countError, FALLBACK));

  return {
    unreadNotificationCount: count ?? 0,
    notifications: ((data ?? []) as NotificationRow[]).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      importance: row.importance,
      href: row.href,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
  };
}

async function listDashboardNotices() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notices")
    .select("id, title, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return ((data ?? []) as NoticeRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function listDashboardProjects(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data: membershipRows, error: membershipError } = await supabase
    .from("project_team_memberships")
    .select("project_team_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(20);

  if (membershipError) throw new Error(sanitizeUserError(membershipError, FALLBACK));

  const memberships = (membershipRows ?? []) as ProjectMembershipRow[];
  const projectIds = [...new Set(memberships.map((row) => row.project_team_id))];

  if (projectIds.length === 0) return [];

  const [{ data: projectRows, error: projectError }, { data: memberRows, error: membersError }] =
    await Promise.all([
      supabase
        .from("project_teams")
        .select("id, slug, name, summary, status, metadata, updated_at")
        .in("id", projectIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("project_team_memberships")
        .select("project_team_id")
        .in("project_team_id", projectIds)
        .eq("status", "active"),
    ]);

  if (projectError) throw new Error(sanitizeUserError(projectError, FALLBACK));
  if (membersError) throw new Error(sanitizeUserError(membersError, FALLBACK));

  const roleByProject = new Map(
    memberships.map((row) => [row.project_team_id, mapProjectRole(row.role)]),
  );
  const membersByProject = new Map<string, number>();

  for (const row of (memberRows ?? []) as ProjectMemberCountRow[]) {
    membersByProject.set(
      row.project_team_id,
      (membersByProject.get(row.project_team_id) ?? 0) + 1,
    );
  }

  return ((projectRows ?? []) as ProjectTeamRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    role: roleByProject.get(row.id) ?? "참여",
    status: row.status,
    members: membersByProject.get(row.id) ?? 1,
    progress: readProgress(row.metadata),
    updatedAt: row.updated_at,
  }));
}

async function listDashboardBookings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookings = await listBookingsInRange(toIsoDate(today), toIsoDate(addDays(today, 45)));

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    date: booking.date,
    start: booking.start,
    end: booking.end,
    organizer: booking.organizer,
    type: booking.type,
    attendees: booking.attendees,
  }));
}

async function listDashboardContactRequests(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contact_requests")
    .select(
      "id, reason, status, expires_at, created_at, requester_user_id, recipient_user_id",
    )
    .or(`requester_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .eq("status", "pending")
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(5);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return ((data ?? []) as ContactRequestRow[]).map((row) => ({
    id: row.id,
    reason: row.reason,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    requesterUserId: row.requester_user_id,
    recipientUserId: row.recipient_user_id,
  }));
}

async function withFallback<T>(
  section: DashboardSection,
  task: Promise<T>,
  fallback: T,
): Promise<{ section: DashboardSection; data: T; failed: boolean }> {
  try {
    return { section, data: await task, failed: false };
  } catch {
    return { section, data: fallback, failed: true };
  }
}

export async function loadDashboardData(userId: string): Promise<DashboardData> {
  const [notificationResult, noticesResult, projectsResult, bookingsResult, contactResult] =
    await Promise.all([
      withFallback(
        "notifications",
        listDashboardNotifications(userId),
        { unreadNotificationCount: 0, notifications: [] },
      ),
      withFallback("notices", listDashboardNotices(), []),
      withFallback("projects", listDashboardProjects(userId), []),
      withFallback("bookings", listDashboardBookings(), []),
      withFallback("contactRequests", listDashboardContactRequests(userId), []),
    ]);

  const failedSections = [
    notificationResult,
    noticesResult,
    projectsResult,
    bookingsResult,
    contactResult,
  ]
    .filter((result) => result.failed)
    .map((result) => result.section);

  return {
    unreadNotificationCount: notificationResult.data.unreadNotificationCount,
    notifications: notificationResult.data.notifications,
    notices: noticesResult.data,
    projects: projectsResult.data,
    bookings: bookingsResult.data,
    contactRequests: contactResult.data,
    failedSections,
  };
}
