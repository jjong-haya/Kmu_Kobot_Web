/**
 * Single source of truth for what tags can grant.
 * Used by /member/tags/:slug detail editor to render permission/nav checkboxes.
 *
 * NAV_CATALOG must mirror the items declared in MemberLayout NAVIGATION.
 * PERMISSION_CATALOG must mirror the permission strings used as guards
 * across the app (RequirePermission, RLS check helpers, etc.).
 */

export type NavCatalogEntry = {
  href: string;
  label: string;
  group: string;
  description?: string;
};

export type PermissionCatalogEntry = {
  permission: string;
  label: string;
  group: string;
  description?: string;
};

export const NAV_CATALOG: NavCatalogEntry[] = [
  { href: "/member", label: "대시보드", group: "부원" },
  { href: "/member/notifications", label: "알림", group: "부원" },
  { href: "/member/announcements", label: "공지", group: "부원" },
  { href: "/member/contact-requests", label: "연락 요청", group: "부원" },
  { href: "/member/study-log", label: "스터디 기록", group: "부원" },
  { href: "/member/study-playlist", label: "스터디 플레이리스트", group: "부원" },
  { href: "/member/projects", label: "프로젝트", group: "부원" },
  { href: "/member/events", label: "행사", group: "부원" },
  { href: "/member/members", label: "멤버", group: "부원" },
  { href: "/member/resources", label: "자료실", group: "부원" },
  { href: "/member/space-booking", label: "공간 예약", group: "부원" },
  { href: "/member/equipment", label: "장비 대여", group: "부원" },
  { href: "/member/votes", label: "투표", group: "부원" },
  { href: "/member/quests", label: "미션 / 퀘스트", group: "부원" },
  { href: "/member/peer-review", label: "동료 리뷰", group: "공식팀장" },
  { href: "/member/showcase", label: "쇼케이스", group: "공식팀장" },
  { href: "/member/templates", label: "템플릿", group: "공식팀장" },
  { href: "/member/roadmap", label: "로드맵", group: "부회장" },
  { href: "/member/retro", label: "회고", group: "부회장" },
  { href: "/member/changelog", label: "변경 기록", group: "부회장" },
  { href: "/member/invite-codes", label: "초대 코드", group: "회장" },
  { href: "/member/forms", label: "신청/폼", group: "회장" },
  { href: "/member/integrations", label: "연동", group: "회장" },
  { href: "/member/permissions", label: "권한", group: "회장" },
  { href: "/member/tags", label: "태그", group: "회장" },
];

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  // 읽기
  { permission: "dashboard.read", label: "대시보드 보기", group: "읽기" },
  { permission: "notifications.read", label: "알림 보기", group: "읽기" },
  { permission: "announcements.read", label: "공지 보기", group: "읽기" },
  { permission: "members.read", label: "멤버 디렉토리 보기", group: "읽기" },
  { permission: "projects.read", label: "프로젝트 보기", group: "읽기" },
  { permission: "resources.read", label: "자료실 보기", group: "읽기" },
  { permission: "events.read", label: "행사 보기", group: "읽기" },
  // 작성/관리
  {
    permission: "announcements.manage",
    label: "공지 작성/수정/삭제",
    group: "관리",
  },
  { permission: "projects.manage", label: "프로젝트 관리", group: "관리" },
  { permission: "resources.manage", label: "자료실 관리", group: "관리" },
  { permission: "events.manage", label: "행사 관리", group: "관리" },
  { permission: "members.manage", label: "멤버 가입 승인/관리", group: "관리" },
  { permission: "forms.manage", label: "신청/폼 관리", group: "관리" },
  { permission: "integrations.manage", label: "외부 연동 관리", group: "관리" },
  { permission: "operations.manage", label: "운영 관리", group: "관리" },
  // 운영
  {
    permission: "permissions.manage",
    label: "권한·태그 관리 (회장 전용)",
    group: "운영",
  },
  {
    permission: "org_positions.manage",
    label: "직책 관리",
    group: "운영",
  },
];
