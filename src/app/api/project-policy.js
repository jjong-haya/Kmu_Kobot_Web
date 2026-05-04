export const PROJECT_FILTERS = [
  { key: "all", label: "전체" },
  { key: "mine", label: "내 프로젝트" },
  { key: "active", label: "진행중" },
  { key: "pending", label: "검토중" },
  { key: "archived", label: "종료" },
];

export function getProjectStatusLabel(status) {
  switch (status) {
    case "active":
      return "진행중";
    case "pending":
      return "검토중";
    case "rejected":
      return "반려";
    case "archived":
      return "종료";
    default:
      return status ?? "상태 없음";
  }
}

export function getProjectRoleLabel(role) {
  switch (role) {
    case "lead":
      return "리드";
    case "maintainer":
      return "관리";
    case "delegate":
      return "위임";
    case "member":
      return "참여";
    default:
      return "미참여";
  }
}

export function filterProjects(items, key) {
  switch (key) {
    case "all":
      return items;
    case "mine":
      return items.filter((item) => item.isMember);
    default:
      return items.filter((item) => item.status === key);
  }
}

function asciiInitials(source) {
  return source
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function koreanInitials(source) {
  return source
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getProjectPrefix(slug, name) {
  const fromSlug = typeof slug === "string" ? asciiInitials(slug) : "";
  if (fromSlug) return fromSlug.slice(0, 3);

  const fromName = typeof name === "string" ? koreanInitials(name) : "";
  return (fromName || "PR").slice(0, 3);
}

export function readProjectProgress(metadata) {
  if (!metadata || typeof metadata !== "object") return null;

  const value =
    metadata.progress ??
    metadata.progressPercent ??
    metadata.progress_percent ??
    metadata.completion ??
    metadata.completionPercent;

  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.min(100, Math.round(number)));
}

export function getProjectDetailPath(slug) {
  return `/member/projects/${encodeURIComponent(slug)}`;
}
