import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  createContactRequest,
  decideContactRequest,
  listContactRequestRecipients,
  listContactRequests,
  reportContactRequestSpam,
  type ContactMethod,
  type ContactPayload,
  type ContactProfileSummary,
  type ContactRequestItem,
  type ContactRequestStatus,
} from "../../api/contact-requests";
import {
  CONTACT_METHODS,
  CONTACT_REQUEST_FILTERS,
  filterContactRequests,
  getContactMethodLabel,
  getContactRequestStatusLabel,
  isRejectedLikeStatus,
} from "../../api/contact-request-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

type FilterKey = "all" | "pending" | "accepted" | "rejected" | "incoming" | "outgoing";

const FILTERS = CONTACT_REQUEST_FILTERS as { key: FilterKey; label: string }[];

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const INPUT_STYLE: CSSProperties = {
  width: "100%",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  background: "#fff",
  color: "var(--kb-ink-900)",
  fontFamily: "inherit",
  fontSize: 14.5,
  outline: "none",
};

const STATUS_META: Record<
  ContactRequestStatus,
  { icon: typeof Clock3; bg: string; fg: string; bar: string }
> = {
  pending: {
    icon: Clock3,
    bg: "#fff3d8",
    fg: "#855600",
    bar: "var(--kb-navy-800)",
  },
  accepted: {
    icon: CheckCircle2,
    bg: "#e6f5ef",
    fg: "#116149",
    bar: "#15803d",
  },
  rejected: {
    icon: XCircle,
    bg: "#eeeeec",
    fg: "#55514c",
    bar: "#9a9a98",
  },
  auto_rejected: {
    icon: AlertTriangle,
    bg: "#fee2e2",
    fg: "#991b1b",
    bar: "#dc2626",
  },
  canceled: {
    icon: XCircle,
    bg: "#eeeeec",
    fg: "#55514c",
    bar: "#9a9a98",
  },
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDue(value: string, status: ContactRequestStatus) {
  if (status !== "pending") return getContactRequestStatusLabel(status);

  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return "기한 확인 필요";

  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return "기한 만료";

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) return `${diffHours}시간 남음`;

  return `D-${Math.ceil(diffHours / 24)}`;
}

function initialsFor(name: string) {
  const normalized = name.trim();
  if (!normalized) return "KB";
  return normalized.slice(0, 2).toUpperCase();
}

function statusCount(items: ContactRequestItem[], key: FilterKey, userId: string) {
  return filterContactRequests(items, key, userId).length;
}

function methodLabels(methods: ContactMethod[]) {
  if (methods.length === 0) return "선택 없음";
  return methods.map(getContactMethodLabel).join(", ");
}

function contactEntries(payload: ContactPayload) {
  return CONTACT_METHODS.map((method) => ({
    key: method.key as ContactMethod,
    label: method.label,
    value: payload[method.key as ContactMethod],
  })).filter((entry) => typeof entry.value === "string" && entry.value.trim());
}

function visibleContactPayload(item: ContactRequestItem, viewerUserId: string): ContactPayload {
  if (item.status !== "accepted") {
    return item.recipientUserId === viewerUserId ? item.requesterContactPayload : {};
  }

  if (item.requesterUserId === viewerUserId || item.recipientUserId === viewerUserId) {
    return item.responderContactPayload;
  }

  return {};
}

function profileSubtitle(profile: ContactProfileSummary | null) {
  if (!profile) return "프로필 없음";

  return [
    profile.loginId ? `@${profile.loginId}` : null,
    profile.clubAffiliation,
    profile.department,
  ]
    .filter(Boolean)
    .join(" · ");
}

function RequestRow({
  item,
  viewerUserId,
  working,
  onAccept,
  onReject,
  onReport,
}: {
  item: ContactRequestItem;
  viewerUserId: string;
  working: boolean;
  onAccept: (item: ContactRequestItem) => void;
  onReject: (item: ContactRequestItem) => void;
  onReport: (item: ContactRequestItem) => void;
}) {
  const meta = STATUS_META[item.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon;
  const isIncoming = item.recipientUserId === viewerUserId;
  const otherProfile = isIncoming ? item.requester : item.recipient;
  const pendingIncoming = isIncoming && item.status === "pending";
  const visibleContacts = contactEntries(visibleContactPayload(item, viewerUserId));

  return (
    <div className="relative flex gap-4 border-t border-[#f1ede4] px-5 py-5 sm:px-7">
      {item.status === "pending" && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: meta.bar,
          }}
        />
      )}

      <div
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
        style={{
          background: item.status === "pending" ? "#0a0a0a" : "#f1ede4",
          color: item.status === "pending" ? "#fff" : "var(--kb-ink-500)",
        }}
      >
        {otherProfile ? initialsFor(otherProfile.displayName) : <UserRound className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-semibold text-[var(--kb-ink-900)]">
            {otherProfile?.displayName ?? "알 수 없음"}
          </span>
          <span className="text-[13px] text-[var(--kb-ink-400)]">
            {item.viewerRelation}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: meta.bg, color: meta.fg }}
          >
            <StatusIcon className="h-3 w-3" />
            {getContactRequestStatusLabel(item.status)}
          </span>
          {item.spamReportedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-red-700">
              <Flag className="h-3 w-3" />
              신고됨
            </span>
          )}
        </div>

        <div className="mb-2 text-[13.5px] text-[var(--kb-ink-400)]">
          {profileSubtitle(otherProfile)}
        </div>

        <p className="m-0 text-[15px] leading-6 text-[var(--kb-ink-700)]">
          {item.reason}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--kb-ink-500)]">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            요청: {methodLabels(item.requestedContactMethods)}
          </span>
          <span>{formatDateTime(item.createdAt)}</span>
          <span style={{ fontWeight: 650, color: item.status === "pending" ? "var(--kb-navy-800)" : "var(--kb-ink-400)" }}>
            {formatDue(item.expiresAt, item.status)}
          </span>
        </div>

        {visibleContacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleContacts.map((entry) => {
              const Icon = entry.key === "phone" ? Phone : Mail;
              return (
                <span
                  key={entry.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e8e4] bg-[#fafaf6] px-3 py-1.5 text-[13px] text-[var(--kb-ink-700)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {entry.label}: {entry.value}
                </span>
              );
            })}
          </div>
        )}

        {item.decisionReason && isRejectedLikeStatus(item.status) && (
          <div className="mt-3 text-[13px] text-[var(--kb-ink-500)]">
            사유: {item.decisionReason}
          </div>
        )}

        {pendingIncoming && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={working}
              onClick={() => onAccept(item)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-4 py-2 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              수락
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => onReject(item)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e8e4] bg-white px-4 py-2 text-[14px] font-medium text-[var(--kb-ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              거절
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => onReport(item)}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-white px-4 py-2 text-[14px] font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Flag className="h-4 w-4" />
              신고
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ComposeDialog({
  open,
  recipients,
  ownContactProfile,
  onClose,
  onSubmit,
}: {
  open: boolean;
  recipients: ContactProfileSummary[];
  ownContactProfile: ContactPayload;
  onClose: () => void;
  onSubmit: (input: {
    recipientUserId: string;
    reason: string;
    requestedContactMethods: ContactMethod[];
  }) => Promise<void>;
}) {
  const [recipientUserId, setRecipientUserId] = useState("");
  const [reason, setReason] = useState("");
  const [methods, setMethods] = useState<ContactMethod[]>(["email"]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecipientUserId("");
    setReason("");
    setMethods(["email"]);
    setSearch("");
  }, [open]);

  if (!open) return null;

  const filteredRecipients = recipients.filter((recipient) => {
    const keyword = search.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return true;

    return [
      recipient.displayName,
      recipient.loginId,
      recipient.department,
      recipient.clubAffiliation,
    ]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
  });

  function toggleMethod(method: ContactMethod) {
    setMethods((current) => {
      if (current.includes(method)) {
        return current.filter((item) => item !== method);
      }

      return [...current, method];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        recipientUserId,
        reason,
        requestedContactMethods: methods,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#eeeae2] px-6 py-4">
          <div>
            <h2 className="m-0 text-[18px] font-semibold text-[var(--kb-ink-900)]">
              새 연락 요청
            </h2>
            <p className="m-0 mt-1 text-[13px] text-[var(--kb-ink-500)]">
              선택한 연락처가 상대에게 함께 전달됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--kb-ink-500)] hover:bg-[#f6f3ec]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-700)]">
              대상
            </span>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="이름, ID, 학과 검색"
                style={{ ...INPUT_STYLE, padding: "10px 12px 10px 36px" }}
              />
            </div>
            <select
              value={recipientUserId}
              onChange={(event) => setRecipientUserId(event.target.value)}
              required
              style={{ ...INPUT_STYLE, padding: "11px 12px" }}
            >
              <option value="">대상을 선택하세요</option>
              {filteredRecipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.displayName}
                  {recipient.loginId ? ` (@${recipient.loginId})` : ""}
                  {recipient.department ? ` · ${recipient.department}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-700)]">
              요청 사유
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={5}
              rows={4}
              placeholder="연락이 필요한 이유를 적어주세요."
              style={{ ...INPUT_STYLE, resize: "vertical", padding: "11px 12px" }}
            />
          </label>

          <div>
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-700)]">
              연락처
            </span>
            <div className="flex flex-wrap gap-2">
              {CONTACT_METHODS.map((method) => {
                const key = method.key as ContactMethod;
                const checked = methods.includes(key);
                const available = Boolean(ownContactProfile[key]);
                const Icon = key === "phone" ? Phone : Mail;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMethod(key)}
                    disabled={!available}
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      borderColor: checked ? "#0a0a0a" : "#e8e8e4",
                      background: checked ? "#0a0a0a" : "#fff",
                      color: checked ? "#fff" : "var(--kb-ink-700)",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eeeae2] bg-[#fafaf6] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#e8e8e4] bg-white px-4 py-2 text-[14px] font-medium text-[var(--kb-ink-700)]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || methods.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            요청 보내기
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ContactRequests() {
  const { authData, user } = useAuth();
  const [items, setItems] = useState<ContactRequestItem[]>([]);
  const [recipients, setRecipients] = useState<ContactProfileSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const viewerUserId = user?.id ?? "";
  const filtered = useMemo(
    () => filterContactRequests(items, activeFilter, viewerUserId) as ContactRequestItem[],
    [activeFilter, items, viewerUserId],
  );
  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending" && item.recipientUserId === viewerUserId).length,
    [items, viewerUserId],
  );
  const ownContactProfile: ContactPayload = {
    email: authData.profile.email ?? undefined,
    phone: authData.profile.phone ?? undefined,
  };

  async function refresh() {
    if (!user) {
      setItems([]);
      setRecipients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextItems, nextRecipients] = await Promise.all([
        listContactRequests(user.id),
        listContactRequestRecipients(user.id),
      ]);
      setItems(nextItems);
      setRecipients(nextRecipients);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "연락 요청을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  async function handleCreate(input: {
    recipientUserId: string;
    reason: string;
    requestedContactMethods: ContactMethod[];
  }) {
    setError(null);

    try {
      await createContactRequest(input);
      await refresh();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "연락 요청을 보내지 못했습니다."));
      throw requestError;
    }
  }

  async function handleDecision(item: ContactRequestItem, decision: "accepted" | "rejected") {
    setWorkingId(item.id);
    setError(null);

    try {
      await decideContactRequest({
        contactRequestId: item.id,
        decision,
      });
      await refresh();
    } catch (requestError) {
      setError(
        sanitizeUserError(
          requestError,
          decision === "accepted" ? "요청을 수락하지 못했습니다." : "요청을 거절하지 못했습니다.",
        ),
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleReport(item: ContactRequestItem) {
    setWorkingId(item.id);
    setError(null);

    try {
      await reportContactRequestSpam(item.id);
      await refresh();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "요청을 신고하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              Contact Requests
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              연락 요청
              <span className="ml-3 text-[17px] font-normal text-[var(--kb-ink-500)]">
                대기 {pendingCount}건
              </span>
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white"
            >
              <Send className="h-4 w-4" />
              새 요청
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-[#f8f9fc] px-4 py-3 text-[14px] text-[var(--kb-ink-500)]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--kb-navy-800)]" />
          서로 동의한 연락처만 공개됩니다.
        </div>

        <section style={{ ...CONTAINER_STYLE, overflow: "hidden" }}>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
            {FILTERS.map((filter) => {
              const count = viewerUserId ? statusCount(items, filter.key, viewerUserId) : 0;
              const active = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors"
                  style={{
                    borderColor: active ? "#0a0a0a" : "#ebe8e0",
                    background: active ? "#0a0a0a" : "#fff",
                    color: active ? "#fff" : "var(--kb-ink-700)",
                  }}
                >
                  {filter.label}
                  <span className="text-[12px]" style={{ opacity: active ? 0.8 : 0.55 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-[14px] text-red-700 sm:px-7">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-[15px] text-[var(--kb-ink-500)]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              연락 요청을 불러오는 중입니다.
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-[15px] text-[var(--kb-ink-500)]">
              <UserRound className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
              표시할 연락 요청이 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((item) => (
                <RequestRow
                  key={item.id}
                  item={item}
                  viewerUserId={viewerUserId}
                  working={workingId === item.id}
                  onAccept={(nextItem) => void handleDecision(nextItem, "accepted")}
                  onReject={(nextItem) => void handleDecision(nextItem, "rejected")}
                  onReport={(nextItem) => void handleReport(nextItem)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f1ede4] px-5 py-3 text-[13px] text-[var(--kb-ink-500)] sm:px-7">
            <span>
              {filtered.length} / {items.length}건
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              최근 요청순
            </span>
          </div>
        </section>
      </div>

      <ComposeDialog
        open={composeOpen}
        recipients={recipients}
        ownContactProfile={ownContactProfile}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
