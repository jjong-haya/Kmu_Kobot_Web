import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import {
  getNotificationCategory,
  getNotificationTargetHref,
} from "./notification-policy.js";

const FALLBACK = "알림 처리 중 문제가 발생했습니다.";

export const NOTIFICATIONS_CHANGED_EVENT = "kobot:notifications-changed";

export type NotificationImportance = "normal" | "important";
export type NotificationCategory =
  | "member"
  | "contact"
  | "vote"
  | "approval"
  | "project"
  | "announcement"
  | "system";

export type NotificationActor = {
  id: string;
  displayName: string | null;
  loginId: string | null;
  avatarUrl: string | null;
};

export type NotificationMembershipApplication = {
  id: string;
  userId: string;
  status: string;
  submittedAt: string | null;
  profileSnapshot: Record<string, unknown>;
  source: string | null;
};

export type NotificationItem = {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  actor: NotificationActor | null;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string | null;
  channel: string;
  importance: NotificationImportance;
  relatedEntityTable: string | null;
  relatedEntityId: string | null;
  href: string | null;
  targetHref: string | null;
  membershipApplication: NotificationMembershipApplication | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  expiresAt: string;
};

type NotificationDbRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  channel: string;
  importance: NotificationImportance;
  related_entity_table: string | null;
  related_entity_id: string | null;
  href: string | null;
  metadata: unknown;
  read_at: string | null;
  created_at: string;
  expires_at: string;
};

type ProfileDbRow = {
  id: string;
  display_name: string | null;
  nickname_display: string | null;
  login_id: string | null;
  avatar_url: string | null;
};

type MembershipApplicationDbRow = {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  profile_snapshot: unknown;
  metadata: unknown;
};

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toActor(row: ProfileDbRow): NotificationActor {
  return {
    id: row.id,
    displayName: row.nickname_display ?? row.display_name,
    loginId: row.login_id,
    avatarUrl: row.avatar_url,
  };
}

function toMembershipApplication(
  row: MembershipApplicationDbRow,
): NotificationMembershipApplication {
  const metadata = normalizeMetadata(row.metadata);

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    submittedAt: row.submitted_at,
    profileSnapshot: normalizeMetadata(row.profile_snapshot),
    source: readString(metadata.source),
  };
}

function mapNotificationRow(
  row: NotificationDbRow,
  actorsById: Map<string, NotificationActor>,
  applicationsById: Map<string, NotificationMembershipApplication>,
): NotificationItem {
  const relatedEntityTable = row.related_entity_table;
  const category = getNotificationCategory({
    type: row.type,
    relatedEntityTable,
  }) as NotificationCategory;

  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    actor: row.actor_user_id ? actorsById.get(row.actor_user_id) ?? null : null,
    type: row.type,
    category,
    title: row.title,
    body: row.body,
    channel: row.channel,
    importance: row.importance,
    relatedEntityTable,
    relatedEntityId: row.related_entity_id,
    href: row.href,
    targetHref: getNotificationTargetHref(row.href, {
      type: row.type,
      relatedEntityTable,
    }),
    membershipApplication:
      row.type === "membership_application_submitted" && row.related_entity_id
        ? applicationsById.get(row.related_entity_id) ?? null
        : null,
    metadata: normalizeMetadata(row.metadata),
    readAt: row.read_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

async function listActors(actorIds: string[]) {
  if (actorIds.length === 0) {
    return new Map<string, NotificationActor>();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, nickname_display, login_id, avatar_url")
    .in("id", actorIds);

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  return new Map(
    ((data ?? []) as ProfileDbRow[]).map((row) => [row.id, toActor(row)]),
  );
}

async function listMembershipApplications(applicationIds: string[]) {
  if (applicationIds.length === 0) {
    return new Map<string, NotificationMembershipApplication>();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("membership_applications")
    .select("id, user_id, status, submitted_at, profile_snapshot, metadata")
    .in("id", applicationIds);

  if (error) {
    throw new Error(sanitizeUserError(error, "가입 신청 상세를 불러오지 못했습니다."));
  }

  return new Map(
    ((data ?? []) as MembershipApplicationDbRow[]).map((row) => [
      row.id,
      toMembershipApplication(row),
    ]),
  );
}

export async function listNotifications(userId: string, limit = 80) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      [
        "id",
        "recipient_user_id",
        "actor_user_id",
        "type",
        "title",
        "body",
        "channel",
        "importance",
        "related_entity_table",
        "related_entity_id",
        "href",
        "metadata",
        "read_at",
        "created_at",
        "expires_at",
      ].join(","),
    )
    .eq("recipient_user_id", userId)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  const rows = (data ?? []) as NotificationDbRow[];
  const actorIds = [
    ...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id))),
  ];
  const applicationIds = [
    ...new Set(
      rows
        .filter(
          (row) =>
            row.type === "membership_application_submitted" &&
            row.related_entity_table === "membership_applications",
        )
        .map((row) => row.related_entity_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const [actorsById, applicationsById] = await Promise.all([
    listActors(actorIds),
    listMembershipApplications(applicationIds).catch(
      () => new Map<string, NotificationMembershipApplication>(),
    ),
  ]);

  return rows.map((row) => mapNotificationRow(row, actorsById, applicationsById));
}

export async function getUnreadNotificationsCount(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("deleted_at", null)
    .is("read_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  return count ?? 0;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = getSupabaseBrowserClient();
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("id", notificationId)
    .eq("recipient_user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  dispatchNotificationsChanged();
  return readAt;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("recipient_user_id", userId)
    .is("deleted_at", null)
    .is("read_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  dispatchNotificationsChanged();
  return readAt;
}

export async function dismissNotification(userId: string, notificationId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(sanitizeUserError(error, FALLBACK));
  }

  dispatchNotificationsChanged();
}

export function dispatchNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}
