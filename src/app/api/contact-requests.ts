import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";
import {
  buildContactPayload,
  getContactRequestRelation,
  normalizeContactMethods,
} from "./contact-request-policy.js";

const FALLBACK = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

export type ContactRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "auto_rejected"
  | "canceled";

export type ContactMethod = "email" | "phone";

export type ContactPayload = Partial<Record<ContactMethod, string>>;

export type ContactProfileSummary = {
  id: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  clubAffiliation: string | null;
  status: string | null;
};

export type ContactRequestItem = {
  id: string;
  requesterUserId: string;
  recipientUserId: string;
  requester: ContactProfileSummary | null;
  recipient: ContactProfileSummary | null;
  viewerRelation: string;
  status: ContactRequestStatus;
  reason: string;
  requestedContactMethods: ContactMethod[];
  requesterContactPayload: ContactPayload;
  responderContactPayload: ContactPayload;
  decisionReason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  spamReportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type CreateContactRequestInput = {
  recipientUserId: string;
  reason: string;
  requestedContactMethods: ContactMethod[];
};

export type DecideContactRequestInput = {
  contactRequestId: string;
  decision: "accepted" | "rejected";
  decisionReason?: string;
};

type ContactRequestDbRow = {
  id: string;
  requester_user_id: string;
  recipient_user_id: string;
  status: ContactRequestStatus;
  reason: string;
  requested_contact_methods: string[] | null;
  requester_contact_payload: unknown;
  responder_contact_payload: unknown;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  spam_reported_at: string | null;
  requester_deleted_at: string | null;
  recipient_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

type ProfileDbRow = {
  id: string;
  display_name: string | null;
  nickname_display?: string | null;
  full_name: string | null;
  login_id?: string | null;
  avatar_url: string | null;
  email: string | null;
  phone?: string | null;
  department?: string | null;
  club_affiliation?: string | null;
};

type AccountDbRow = {
  user_id: string;
  status: string | null;
};

const PROFILE_SELECT = [
  "id",
  "display_name",
  "nickname_display",
  "full_name",
  "login_id",
  "avatar_url",
  "email",
  "phone",
  "department",
  "club_affiliation",
].join(", ");

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function normalizePayload(value: unknown): ContactPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return buildContactPayload(value as ContactPayload, ["email", "phone"]) as ContactPayload;
}

function toProfileSummary(profile: ProfileDbRow, status: string | null): ContactProfileSummary {
  return {
    id: profile.id,
    displayName: displayNameFor(profile),
    loginId: normalizeString(profile.login_id),
    avatarUrl: normalizeString(profile.avatar_url),
    email: normalizeString(profile.email),
    phone: normalizeString(profile.phone),
    department: normalizeString(profile.department),
    clubAffiliation: normalizeString(profile.club_affiliation),
    status,
  };
}

async function listProfilesByIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, ContactProfileSummary>();

  const supabase = getSupabaseBrowserClient();
  const [profilesResult, accountsResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).in("id", ids),
    supabase.from("member_accounts").select("user_id, status").in("user_id", ids),
  ]);

  if (profilesResult.error) throw new Error(sanitizeUserError(profilesResult.error, FALLBACK));
  if (accountsResult.error) throw new Error(sanitizeUserError(accountsResult.error, FALLBACK));

  const statusByUserId = new Map(
    ((accountsResult.data ?? []) as AccountDbRow[]).map((row) => [row.user_id, row.status]),
  );

  return new Map(
    ((profilesResult.data ?? []) as ProfileDbRow[]).map((profile) => [
      profile.id,
      toProfileSummary(profile, statusByUserId.get(profile.id) ?? null),
    ]),
  );
}

function shouldShowRow(row: ContactRequestDbRow, viewerUserId: string) {
  if (row.requester_user_id === viewerUserId && row.requester_deleted_at) {
    return false;
  }

  if (row.recipient_user_id === viewerUserId && row.recipient_deleted_at) {
    return false;
  }

  return true;
}

function mapContactRequestRow(
  row: ContactRequestDbRow,
  viewerUserId: string,
  profilesById: Map<string, ContactProfileSummary>,
): ContactRequestItem {
  const item = {
    id: row.id,
    requesterUserId: row.requester_user_id,
    recipientUserId: row.recipient_user_id,
    requester: profilesById.get(row.requester_user_id) ?? null,
    recipient: profilesById.get(row.recipient_user_id) ?? null,
    viewerRelation: "",
    status: row.status,
    reason: row.reason,
    requestedContactMethods: normalizeContactMethods(row.requested_contact_methods) as ContactMethod[],
    requesterContactPayload: normalizePayload(row.requester_contact_payload),
    responderContactPayload: normalizePayload(row.responder_contact_payload),
    decisionReason: row.decision_reason,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    spamReportedAt: row.spam_reported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  } satisfies ContactRequestItem;

  return {
    ...item,
    viewerRelation: getContactRequestRelation(item, viewerUserId),
  };
}

export async function listContactRequests(viewerUserId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contact_requests")
    .select(
      [
        "id",
        "requester_user_id",
        "recipient_user_id",
        "status",
        "reason",
        "requested_contact_methods",
        "requester_contact_payload",
        "responder_contact_payload",
        "decision_reason",
        "decided_by",
        "decided_at",
        "spam_reported_at",
        "requester_deleted_at",
        "recipient_deleted_at",
        "created_at",
        "updated_at",
        "expires_at",
      ].join(", "),
    )
    .or(`requester_user_id.eq.${viewerUserId},recipient_user_id.eq.${viewerUserId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const rows = ((data ?? []) as ContactRequestDbRow[]).filter((row) =>
    shouldShowRow(row, viewerUserId),
  );
  const userIds = [
    ...new Set(rows.flatMap((row) => [row.requester_user_id, row.recipient_user_id])),
  ];
  const profilesById = await listProfilesByIds(userIds);

  return rows.map((row) => mapContactRequestRow(row, viewerUserId, profilesById));
}

export async function listContactRequestRecipients(viewerUserId: string) {
  const supabase = getSupabaseBrowserClient();
  const [profilesResult, accountsResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).order("display_name", { ascending: true }),
    supabase
      .from("member_accounts")
      .select("user_id, status")
      .in("status", ["active", "course_member"]),
  ]);

  if (profilesResult.error) throw new Error(sanitizeUserError(profilesResult.error, FALLBACK));
  if (accountsResult.error) throw new Error(sanitizeUserError(accountsResult.error, FALLBACK));

  const statusByUserId = new Map(
    ((accountsResult.data ?? []) as AccountDbRow[]).map((row) => [row.user_id, row.status]),
  );

  return ((profilesResult.data ?? []) as ProfileDbRow[])
    .filter((profile) => profile.id !== viewerUserId && statusByUserId.has(profile.id))
    .map((profile) => toProfileSummary(profile, statusByUserId.get(profile.id) ?? null))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
}

export async function createContactRequest(input: CreateContactRequestInput) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_contact_request", {
    recipient_user_id_input: input.recipientUserId,
    reason_input: input.reason,
    requested_contact_methods_input: normalizeContactMethods(input.requestedContactMethods),
  });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return data as string;
}

export async function decideContactRequest(input: DecideContactRequestInput) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("decide_contact_request", {
    contact_request_id_input: input.contactRequestId,
    decision_input: input.decision,
    decision_reason_input: input.decisionReason?.trim() || null,
  });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return data as boolean;
}

export async function reportContactRequestSpam(contactRequestId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("report_contact_request_spam", {
    contact_request_id_input: contactRequestId,
  });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return data as boolean;
}
