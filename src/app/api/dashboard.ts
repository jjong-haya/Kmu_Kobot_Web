import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import { listBookingsInRange } from "./space-bookings";

const FALLBACK = "대시보드 데이터를 불러오지 못했습니다.";

export type DashboardNotice = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export type DashboardBooking = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  organizer: string;
  organizerId: string;
  type: string;
  attendees: number;
  isMine: boolean;
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
  notices: DashboardNotice[];
  bookings: DashboardBooking[];
  contactRequests: DashboardContactRequest[];
  failedSections: DashboardSection[];
};

export type DashboardSection =
  | "notifications"
  | "notices"
  | "bookings"
  | "contactRequests";

type NoticeRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
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

type MemberTagAssignmentRow = {
  tag_id: string;
};

type TeamMembershipTargetRow = {
  team_id: string;
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

async function listDashboardNotifications(userId: string) {
  const supabase = getSupabaseBrowserClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("deleted_at", null)
    .is("read_at", null);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return {
    unreadNotificationCount: count ?? 0,
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

async function listDashboardBookingTargets(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const [tagResult, teamResult] = await Promise.all([
    supabase
      .from("member_tag_assignments")
      .select("tag_id")
      .eq("user_id", userId),
    supabase
      .from("team_memberships")
      .select("team_id")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  if (tagResult.error) throw new Error(sanitizeUserError(tagResult.error, FALLBACK));
  if (teamResult.error) throw new Error(sanitizeUserError(teamResult.error, FALLBACK));

  return {
    tagIds: new Set(((tagResult.data ?? []) as MemberTagAssignmentRow[]).map((row) => row.tag_id)),
    teamIds: new Set(((teamResult.data ?? []) as TeamMembershipTargetRow[]).map((row) => row.team_id)),
  };
}

function isDashboardBookingMine(
  booking: Awaited<ReturnType<typeof listBookingsInRange>>[number],
  userId: string,
  userTagIds: Set<string>,
  userTeamIds: Set<string>,
) {
  return (
    booking.organizerId === userId ||
    booking.participants.some((participant) => participant.id === userId) ||
    booking.audienceTags.some((tag) => userTagIds.has(tag.id)) ||
    booking.audienceTeams.some((team) => userTeamIds.has(team.id))
  );
}

async function listDashboardBookings(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [bookings, targets] = await Promise.all([
    listBookingsInRange(toIsoDate(today), toIsoDate(addDays(today, 45))),
    listDashboardBookingTargets(userId),
  ]);

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    date: booking.date,
    start: booking.start,
    end: booking.end,
    organizer: booking.organizer,
    organizerId: booking.organizerId,
    type: booking.type,
    attendees: booking.attendees,
    isMine: isDashboardBookingMine(booking, userId, targets.tagIds, targets.teamIds),
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
  const [notificationResult, noticesResult, bookingsResult, contactResult] =
    await Promise.all([
      withFallback(
        "notifications",
        listDashboardNotifications(userId),
        { unreadNotificationCount: 0 },
      ),
      withFallback("notices", listDashboardNotices(), []),
      withFallback("bookings", listDashboardBookings(userId), []),
      withFallback("contactRequests", listDashboardContactRequests(userId), []),
    ]);

  const failedSections = [
    notificationResult,
    noticesResult,
    bookingsResult,
    contactResult,
  ]
    .filter((result) => result.failed)
    .map((result) => result.section);

  return {
    unreadNotificationCount: notificationResult.data.unreadNotificationCount,
    notices: noticesResult.data,
    bookings: bookingsResult.data,
    contactRequests: contactResult.data,
    failedSections,
  };
}
