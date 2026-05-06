import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Archive,
  ArrowRight,
  Bell,
  Check,
  Handshake,
  MailOpen,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Vote,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import {
  dismissNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationCategory,
  type NotificationItem,
} from "../../api/notifications";
import {
  filterNotifications,
  getNotificationActionLabel,
  getUnreadNotificationCount,
  NOTIFICATION_FILTERS,
} from "../../api/notification-policy.js";
import { sanitizeUserError } from "../../utils/sanitize-error";

type FilterKey = "all" | "unread" | "member" | "contact" | "vote" | "approval" | "system";

const FILTERS = NOTIFICATION_FILTERS as { key: FilterKey; label: string }[];

type DetailRow = {
  label: string;
  value: string;
};

const CATEGORY_META: Record<
  NotificationCategory,
  {
    label: string;
    icon: typeof Bell;
    chipBg: string;
    chipFg: string;
    iconBg: string;
    iconFg: string;
  }
> = {
  member: {
    label: "회원",
    icon: UserPlus,
    chipBg: "#e7efff",
    chipFg: "#183b80",
    iconBg: "#dce8ff",
    iconFg: "#183b80",
  },
  contact: {
    label: "연락 요청",
    icon: Handshake,
    chipBg: "#e6f5ef",
    chipFg: "#116149",
    iconBg: "#d9f0e8",
    iconFg: "#116149",
  },
  vote: {
    label: "투표",
    icon: Vote,
    chipBg: "#fff3d8",
    chipFg: "#855600",
    iconBg: "#ffe8a8",
    iconFg: "#855600",
  },
  approval: {
    label: "승인/권한",
    icon: ShieldCheck,
    chipBg: "#f0e7ff",
    chipFg: "#5d2aa1",
    iconBg: "#e6d7ff",
    iconFg: "#5d2aa1",
  },
  project: {
    label: "프로젝트",
    icon: ShieldCheck,
    chipBg: "#e5f1ff",
    chipFg: "#15548a",
    iconBg: "#d6eaff",
    iconFg: "#15548a",
  },
  announcement: {
    label: "공지",
    icon: Megaphone,
    chipBg: "#f4eadf",
    chipFg: "#71451e",
    iconBg: "#ead8c6",
    iconFg: "#71451e",
  },
  system: {
    label: "시스템",
    icon: Bell,
    chipBg: "#eeeeec",
    chipFg: "#44403c",
    iconBg: "#e8e5e0",
    iconFg: "#44403c",
  },
};

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) return "방금 전";
  if (absMs < hour) return `${Math.floor(absMs / minute)}분 전`;
  if (absMs < day) return `${Math.floor(absMs / hour)}시간 전`;
  if (absMs < day * 7) return `${Math.floor(absMs / day)}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "기록 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "기록 없음";

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readSnapshotText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getActorLabel(item: NotificationItem) {
  return (
    item.actor?.displayName?.trim() ||
    item.actor?.loginId?.trim() ||
    readSnapshotText(item.membershipApplication?.profileSnapshot ?? {}, "fullName") ||
    readSnapshotText(item.membershipApplication?.profileSnapshot ?? {}, "nicknameDisplay") ||
    "알 수 없음"
  );
}

function getApplicationStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "submitted":
      return "승인 대기";
    case "approved":
      return "승인됨";
    case "rejected":
      return "보류/반려";
    case "canceled":
      return "취소됨";
    default:
      return status ?? "상태 없음";
  }
}

function getApplicationSourceLabel(source: string | null | undefined) {
  switch (source) {
    case "member_profile_settings":
      return "프로필 설정에서 가입 신청 제출";
    default:
      return source ?? "기록 없음";
  }
}

function getNotificationTitle(item: NotificationItem) {
  if (item.type === "membership_application_submitted") {
    return "가입 신청이 도착했습니다";
  }

  return item.title;
}

function getNotificationDescription(item: NotificationItem) {
  if (item.type === "membership_application_submitted") {
    return `${getActorLabel(item)} 님이 가입 신청서를 제출했습니다. 승인 여부는 멤버 관리에서 처리합니다.`;
  }

  return item.body ?? "알림 상세 내용을 확인하세요.";
}

function getNotificationStatus(item: NotificationItem) {
  if (item.importance === "important" && !item.readAt) return "중요";
  if (!item.readAt) return "새 알림";
  return "읽음";
}

function buildDetailRows(item: NotificationItem) {
  const application = item.membershipApplication;
  const snapshot = application?.profileSnapshot ?? {};
  const compact = (rows: Array<[string, string | null | undefined]>): DetailRow[] =>
    rows
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([label, value]) => ({ label, value: value as string }));

  if (item.type === "membership_application_submitted") {
    return compact([
      ["작업", "가입 신청 제출"],
      ["신청자", getActorLabel(item)],
      ["로그인 ID", item.actor?.loginId ?? null],
      ["실명", readSnapshotText(snapshot, "fullName")],
      ["닉네임", readSnapshotText(snapshot, "nicknameDisplay")],
      ["이메일", readSnapshotText(snapshot, "email")],
      ["학번", readSnapshotText(snapshot, "studentId")],
      ["연락처", readSnapshotText(snapshot, "phone")],
      ["단과대", readSnapshotText(snapshot, "college")],
      ["학과", readSnapshotText(snapshot, "department")],
      ["프로필 동아리", readSnapshotText(snapshot, "clubAffiliation")],
      ["신청 상태", getApplicationStatusLabel(application?.status)],
      ["신청 시각", formatDateTime(application?.submittedAt ?? item.createdAt)],
      ["신청 경로", getApplicationSourceLabel(application?.source)],
    ]);
  }

  return compact([
    ["분류", CATEGORY_META[item.category]?.label ?? "시스템"],
    ["상태", getNotificationStatus(item)],
    ["보낸 사람", getActorLabel(item)],
    ["생성 시각", formatDateTime(item.createdAt)],
    ["연결 데이터", item.relatedEntityTable ?? null],
  ]);
}

function NotificationRow({
  item,
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onMarkRead: (item: NotificationItem) => void;
  onDismiss: (item: NotificationItem) => void;
}) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.system;
  const Icon = meta.icon;
  const unread = !item.readAt;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className="group flex w-full gap-4 border-t border-[#f1ede4] px-5 py-4 text-left transition-colors hover:bg-[#fafaf6] sm:px-7"
      style={{ position: "relative" }}
    >
      {unread && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--kb-navy-800)",
          }}
        />
      )}

      <span
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          background: unread ? "var(--kb-navy-800)" : meta.iconBg,
          color: unread ? "#fff" : meta.iconFg,
        }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: meta.chipBg, color: meta.chipFg }}
          >
            {meta.label}
          </span>
          <span className="text-[12.5px] font-medium text-[var(--kb-ink-500)]">
            {getNotificationStatus(item)}
          </span>
          {item.actor && (
            <span className="truncate text-[12.5px] text-[var(--kb-ink-400)]">
              {item.actor.displayName ?? item.actor.loginId ?? "알 수 없음"}
            </span>
          )}
        </span>

        <span
          className="block text-[15.5px] leading-6 text-[var(--kb-ink-900)]"
          style={{ fontWeight: unread ? 700 : 550 }}
        >
          {getNotificationTitle(item)}
        </span>
        {item.body && (
          <span className="mt-1 block text-[14px] leading-6 text-[var(--kb-ink-500)]">
            {item.body}
          </span>
        )}
      </span>

      <span className="flex shrink-0 flex-col items-end gap-2">
        <span className="whitespace-nowrap text-[12.5px] text-[var(--kb-ink-400)]">
          {formatRelativeTime(item.createdAt)}
        </span>
        <span className="flex opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          {unread && (
            <button
              type="button"
              aria-label="읽음 처리"
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(item);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--kb-ink-500)] hover:bg-white hover:text-[var(--kb-ink-900)]"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="삭제"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(item);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--kb-ink-500)] hover:bg-white hover:text-red-600"
          >
            <Archive className="h-4 w-4" />
          </button>
        </span>
      </span>
    </div>
  );
}

function NotificationDetailModal({
  item,
  onClose,
  onAction,
}: {
  item: NotificationItem;
  onClose: () => void;
  onAction: (item: NotificationItem) => void;
}) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.system;
  const Icon = meta.icon;
  const rows = buildDetailRows(item);
  const actionLabel = getNotificationActionLabel({
    type: item.type,
    relatedEntityTable: item.relatedEntityTable,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        background: "rgba(0,0,0,0.42)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 12,
          background: "#fff",
          border: "1px solid #e8e8e4",
          boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            padding: "22px 24px 16px",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: meta.chipBg, color: meta.chipFg }}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="text-[12.5px] font-medium text-[var(--kb-ink-500)]">
                {getNotificationStatus(item)}
              </span>
            </div>
            <h2
              id="notification-detail-title"
              className="m-0 mt-3 text-[22px] font-bold leading-8 text-[var(--kb-ink-900)]"
              style={{ letterSpacing: 0 }}
            >
              {getNotificationTitle(item)}
            </h2>
            <p className="m-0 mt-2 text-[14.5px] leading-6 text-[var(--kb-ink-600)]">
              {getNotificationDescription(item)}
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#ebe8e0] text-[var(--kb-ink-500)] hover:text-[var(--kb-ink-900)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(110px, 0.34fr) minmax(0, 1fr)",
              rowGap: 0,
              borderTop: "1px solid #f1ede4",
            }}
          >
            {rows.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "contents",
                }}
              >
                <dt
                  style={{
                    padding: "11px 12px 11px 0",
                    borderBottom: "1px solid #f1ede4",
                    color: "var(--kb-ink-500)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    padding: "11px 0",
                    borderBottom: "1px solid #f1ede4",
                    color: "var(--kb-ink-900)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {item.type === "membership_application_submitted" ? (
            <div
              className="mt-4 rounded-md border border-[#e8e8e4] bg-[#fafaf9] px-4 py-3 text-[13px] leading-6 text-[var(--kb-ink-600)]"
            >
              이 알림은 신청 내용을 확인하는 입구입니다. 승인은 공개 멤버 목록이 아니라
              멤버 관리의 "승인 대기 (신청 제출)" 흐름에서 처리합니다.
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: 8,
            padding: "14px 24px 20px",
            borderTop: "1px solid #f1ede4",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
          >
            닫기
          </button>
          {item.targetHref ? (
            <button
              type="button"
              onClick={() => onAction(item)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#202020]"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  const filtered = useMemo(
    () => filterNotifications(items, activeFilter) as NotificationItem[],
    [items, activeFilter],
  );
  const unreadCount = useMemo(() => getUnreadNotificationCount(items), [items]);
  const deepLinkedNotificationId = useMemo(
    () => new URLSearchParams(location.search).get("notification"),
    [location.search],
  );

  async function refreshNotifications() {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setItems(await listNotifications(user.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "알림을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!deepLinkedNotificationId || loading || selectedItem?.id === deepLinkedNotificationId) {
      return;
    }

    const deepLinkedItem = items.find((item) => item.id === deepLinkedNotificationId);
    if (deepLinkedItem) {
      void handleOpen(deepLinkedItem);
    }
  }, [deepLinkedNotificationId, items, loading, selectedItem?.id]);

  async function handleOpen(item: NotificationItem) {
    if (!user) return;

    setSelectedItem(item);

    if (!item.readAt) {
      const readAt = await handleMarkRead(item, { keepWorking: true });
      if (readAt) {
        setSelectedItem((current) =>
          current?.id === item.id ? { ...current, readAt } : current,
        );
      }
    }
  }

  async function handleMarkRead(
    item: NotificationItem,
    options: { keepWorking?: boolean } = {},
  ): Promise<string | null> {
    if (!user) return null;
    if (item.readAt) return item.readAt;

    if (!options.keepWorking) {
      setWorkingId(item.id);
    }

    try {
      const readAt = await markNotificationRead(user.id, item.id);
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, readAt } : currentItem,
        ),
      );
      return readAt;
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "알림 읽음 처리를 완료하지 못했습니다."));
      return null;
    } finally {
      if (!options.keepWorking) {
        setWorkingId(null);
      }
    }
  }

  async function handleMarkAllRead() {
    if (!user || unreadCount === 0) return;

    setWorkingId("all");

    try {
      const readAt = await markAllNotificationsRead(user.id);
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "모두 읽음 처리를 완료하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDismiss(item: NotificationItem) {
    if (!user) return;

    setWorkingId(item.id);

    try {
      await dismissNotification(user.id, item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setSelectedItem((current) => (current?.id === item.id ? null : current));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "알림을 삭제하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  function handleAction(item: NotificationItem) {
    if (!item.targetHref) return;
    setSelectedItem(null);
    navigate(item.targetHref);
  }

  function closeDetailModal() {
    setSelectedItem(null);
    if (deepLinkedNotificationId) {
      navigate("/member/notifications", { replace: true });
    }
  }

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "calc(100vh - 4rem)",
        margin: -32,
        padding: 32,
        background: "#ffffff",
      }}
    >
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              Notifications
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              알림
              <span className="ml-3 text-[17px] font-normal text-[var(--kb-ink-500)]">
                읽지 않은 알림 {unreadCount}건
              </span>
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refreshNotifications()}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0 || workingId === "all"}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Check className="h-4 w-4" />
              모두 읽음 처리
            </button>
          </div>
        </div>

        <section style={{ ...CARD_STYLE, overflow: "hidden" }}>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
            {FILTERS.map((filter) => {
              const count = filterNotifications(items, filter.key).length;
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
              알림을 불러오는 중입니다.
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-[15px] text-[var(--kb-ink-500)]">
              <MailOpen className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
              도착한 알림이 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={(nextItem) => void handleOpen(nextItem)}
                  onMarkRead={(nextItem) => void handleMarkRead(nextItem)}
                  onDismiss={(nextItem) => void handleDismiss(nextItem)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f1ede4] px-5 py-3 text-[13px] text-[var(--kb-ink-500)] sm:px-7">
            <span>
              {filtered.length} / {items.length}건
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              {workingId && workingId !== "all" ? "처리 중" : "최근 알림순"}
            </span>
          </div>
        </section>
      </div>

      {selectedItem ? (
        <NotificationDetailModal
          item={selectedItem}
          onClose={closeDetailModal}
          onAction={handleAction}
        />
      ) : null}
    </div>
  );
}
