export function canManageAnnouncements(permissions = []) {
  return permissions.includes("announcements.manage");
}

export function getAnnouncementRoleLabel(slug, name) {
  const normalizedSlug = slug?.trim().toLocaleLowerCase("ko-KR");
  const normalizedName = name?.trim().toLocaleLowerCase("ko-KR");

  if (normalizedSlug === "president" || normalizedName === "president") return "회장";
  if (normalizedSlug === "vice-president" || normalizedName === "vice president") return "부회장";
  if (normalizedSlug === "team-lead" || normalizedName === "team lead") return "팀장";
  if (normalizedSlug === "team-member" || normalizedName === "team member") return "팀원";

  return name?.trim() || "부원";
}

export function getNoticeDetailPath(id) {
  return `/member/announcements/${encodeURIComponent(id)}`;
}
