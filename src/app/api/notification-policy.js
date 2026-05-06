export const NOTIFICATION_FILTERS = [
  { key: "all", label: "전체" },
  { key: "unread", label: "읽지 않음" },
  { key: "member", label: "회원" },
  { key: "contact", label: "연락 요청" },
  { key: "vote", label: "투표" },
  { key: "approval", label: "승인/권한" },
  { key: "system", label: "시스템" },
];

const CATEGORY_BY_SIGNAL = [
  {
    category: "contact",
    signals: ["contact", "contact_request"],
  },
  {
    category: "vote",
    signals: ["vote", "ballot", "nomination"],
  },
  {
    category: "announcement",
    signals: ["notice", "announcement"],
  },
  {
    category: "project",
    signals: ["project", "showcase", "study"],
  },
  {
    category: "approval",
    signals: ["permission", "role", "authority", "delegation", "approval", "invite"],
  },
  {
    category: "member",
    signals: ["membership", "member_account", "profile", "member"],
  },
];

const MEMBERSHIP_APPLICATION_TARGET = "/member/member-admin?filter=submitted";

function normalizeSignal(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isMembershipApplicationContext(context = {}) {
  const type = normalizeSignal(context.type);

  return type === "membership_application_submitted";
}

export function getNotificationCategory({ type, relatedEntityTable } = {}) {
  const haystack = `${normalizeSignal(type)} ${normalizeSignal(relatedEntityTable)}`;

  for (const { category, signals } of CATEGORY_BY_SIGNAL) {
    if (signals.some((signal) => haystack.includes(signal))) {
      return category;
    }
  }

  return "system";
}

export function filterNotifications(items, key) {
  switch (key) {
    case "all":
      return items;
    case "unread":
      return items.filter((item) => !item.readAt);
    case "approval":
      return items.filter(
        (item) => item.category === "approval" || item.category === "project",
      );
    case "system":
      return items.filter(
        (item) => item.category === "system" || item.category === "announcement",
      );
    default:
      return items.filter((item) => item.category === key);
  }
}

export function getUnreadNotificationCount(items) {
  return items.filter((item) => !item.readAt).length;
}

export function getNotificationTargetHref(href, context = {}) {
  if (isMembershipApplicationContext(context)) {
    return MEMBERSHIP_APPLICATION_TARGET;
  }

  if (typeof href !== "string") {
    return null;
  }

  const trimmed = href.trim();

  if (!trimmed || trimmed.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return null;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function getNotificationActionLabel(context = {}) {
  if (isMembershipApplicationContext(context)) {
    return "멤버 관리에서 승인하기";
  }

  return "보러가기";
}
