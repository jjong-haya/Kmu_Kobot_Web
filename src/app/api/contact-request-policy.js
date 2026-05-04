export const CONTACT_METHODS = [
  { key: "email", label: "이메일" },
  { key: "phone", label: "전화번호" },
];

export const CONTACT_REQUEST_FILTERS = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기" },
  { key: "accepted", label: "수락" },
  { key: "rejected", label: "거절" },
  { key: "incoming", label: "받은 요청" },
  { key: "outgoing", label: "보낸 요청" },
];

const SUPPORTED_METHODS = new Set(CONTACT_METHODS.map((method) => method.key));

export function normalizeContactMethods(methods) {
  const result = [];
  const seen = new Set();

  for (const method of Array.isArray(methods) ? methods : []) {
    if (typeof method !== "string") continue;

    const key = method.trim().toLowerCase();
    if (!SUPPORTED_METHODS.has(key) || seen.has(key)) continue;

    seen.add(key);
    result.push(key);
  }

  return result;
}

export function getContactMethodLabel(method) {
  return CONTACT_METHODS.find((item) => item.key === method)?.label ?? method;
}

export function buildContactPayload(profile, methods) {
  const normalizedMethods = normalizeContactMethods(methods);
  const payload = {};

  for (const method of normalizedMethods) {
    const value = profile?.[method];

    if (typeof value === "string" && value.trim()) {
      payload[method] = value.trim();
    }
  }

  return payload;
}

export function getContactRequestStatusLabel(status) {
  switch (status) {
    case "pending":
      return "대기";
    case "accepted":
      return "수락";
    case "rejected":
      return "거절";
    case "auto_rejected":
      return "자동 거절";
    case "canceled":
      return "취소";
    default:
      return status ?? "상태 없음";
  }
}

export function getContactRequestRelation(request, viewerUserId) {
  if (request.requesterUserId === viewerUserId) return "보낸 요청";
  if (request.recipientUserId === viewerUserId) return "받은 요청";
  return "관련 요청";
}

export function isRejectedLikeStatus(status) {
  return status === "rejected" || status === "auto_rejected" || status === "canceled";
}

export function filterContactRequests(items, key, viewerUserId) {
  switch (key) {
    case "all":
      return items;
    case "incoming":
      return items.filter((item) => item.recipientUserId === viewerUserId);
    case "outgoing":
      return items.filter((item) => item.requesterUserId === viewerUserId);
    case "rejected":
      return items.filter((item) => isRejectedLikeStatus(item.status));
    default:
      return items.filter((item) => item.status === key);
  }
}
