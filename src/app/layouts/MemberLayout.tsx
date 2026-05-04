import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  FolderKanban,
  FolderOpen,
  GitBranch,
  IdCard,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Presentation,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Target,
  User,
  Users,
  Vote,
  X,
  Megaphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { ScrollToTop } from "../components/ScrollToTop";
import { useAuth } from "../auth/useAuth";
import {
  getUnreadNotificationsCount,
  NOTIFICATIONS_CHANGED_EVENT,
} from "../api/notifications";
import wordLogo from "@/assets/wordLogo.png";
import { APP_VERSION_LABEL } from "../utils/version";

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  permissions?: string[];
};

type NavigationRoleLevel = "member" | "teamLead" | "vicePresident" | "president";

type NavigationSection = {
  name: string;
  items: NavigationItem[];
  minimumRole?: NavigationRoleLevel;
};

const NAVIGATION_ROLE_RANK: Record<NavigationRoleLevel, number> = {
  member: 0,
  teamLead: 1,
  vicePresident: 2,
  president: 3,
};

const NAVIGATION: NavigationSection[] = [
  {
    name: "부원",
    items: [
      {
        name: "대시보드",
        href: "/member",
        icon: LayoutDashboard,
        permissions: ["dashboard.read"],
      },
      {
        name: "알림",
        href: "/member/notifications",
        icon: Bell,
        permissions: ["notifications.read"],
      },
      {
        name: "공지",
        href: "/member/announcements",
        icon: Megaphone,
        permissions: ["announcements.read"],
      },
      {
        name: "연락 요청",
        href: "/member/contact-requests",
        icon: MessageSquare,
      },
      { name: "스터디 기록", href: "/member/study-log", icon: BookOpen },
      {
        name: "스터디 플레이리스트",
        href: "/member/study-playlist",
        icon: ListChecks,
      },
      {
        name: "프로젝트",
        href: "/member/projects",
        icon: FolderKanban,
        permissions: ["projects.read"],
      },
      {
        name: "행사",
        href: "/member/events",
        icon: Calendar,
        permissions: ["events.read"],
      },
      {
        name: "멤버",
        href: "/member/members",
        icon: Users,
        permissions: ["members.read"],
      },
      {
        name: "자료실",
        href: "/member/resources",
        icon: FileText,
        permissions: ["resources.read"],
      },
      { name: "공간 예약", href: "/member/space-booking", icon: Clock },
      {
        name: "장비 대여",
        href: "/member/equipment",
        icon: Package,
        permissions: ["resources.read"],
      },
      { name: "투표", href: "/member/votes", icon: Vote },
    ],
  },
  {
    name: "공식팀장",
    minimumRole: "teamLead",
    items: [
      { name: "동료 리뷰", href: "/member/peer-review", icon: MessageSquare },
      {
        name: "쇼케이스",
        href: "/member/showcase",
        icon: Presentation,
        permissions: ["projects.manage"],
      },
      {
        name: "템플릿",
        href: "/member/templates",
        icon: FolderOpen,
        permissions: ["resources.manage"],
      },
    ],
  },
  {
    name: "부회장",
    minimumRole: "vicePresident",
    items: [
      { name: "로드맵", href: "/member/roadmap", icon: Target },
      { name: "회고", href: "/member/retro", icon: MessageSquare },
      { name: "변경 기록", href: "/member/changelog", icon: GitBranch },
    ],
  },
  {
    name: "회장",
    minimumRole: "president",
    items: [
      {
        name: "초대 코드",
        href: "/member/invite-codes",
        icon: IdCard,
        permissions: ["members.manage"],
      },
      {
        name: "신청/폼",
        href: "/member/forms",
        icon: ClipboardList,
        permissions: ["forms.manage"],
      },
      {
        name: "연동",
        href: "/member/integrations",
        icon: Link2,
        permissions: ["integrations.manage"],
      },
      {
        name: "권한",
        href: "/member/permissions",
        icon: Settings,
        permissions: ["permissions.manage"],
      },
    ],
  },
];

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "KB";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getMemberStatusLabel(status: string | null) {
  switch (status) {
    case "active":
      return "승인 완료";
    case "pending":
    case null:
      return "승인 대기";
    case "suspended":
      return "일시 제한";
    case "rejected":
      return "승인 거절";
    case "alumni":
      return "졸업/비활동";
    case "project_only":
      return "프로젝트 참여";
    case "course_member":
      return "KOSS";
    case "withdrawn":
      return "탈퇴 처리";
    default:
      return "상태 확인 필요";
  }
}

/**
 * Sidebar items visible to course members (limited tier).
 * Anything not in this set is hidden when memberStatus === "course_member".
 */
function getMembershipDisplayLabel(status: string | null, clubAffiliation?: string | null) {
  const normalizedClub = clubAffiliation?.trim();

  switch (status) {
    case "active":
      return normalizedClub || "KOBOT";
    case "course_member":
      return normalizedClub || "KOSS";
    default:
      return getMemberStatusLabel(status);
  }
}

function getRoleDisplayLabel(slug?: string | null, name?: string | null) {
  const normalizedSlug = slug?.trim().toLocaleLowerCase("ko-KR");
  const normalizedName = name?.trim().toLocaleLowerCase("ko-KR");

  if (normalizedSlug === "president" || normalizedName === "president") return "회장";
  if (normalizedSlug === "vice-president" || normalizedName === "vice president") return "부회장";
  if (normalizedSlug === "team-lead" || normalizedName === "team lead") return "팀장";
  if (normalizedSlug === "team-member" || normalizedName === "team member") return "팀원";

  return name?.trim() || null;
}

const COURSE_MEMBER_ALLOWED_PATHS = new Set([
  "/member",
  "/member/notifications",
  "/member/announcements",
  "/member/contact-requests",
  "/member/members",
  "/member/space-booking",
  // account pages (everyone can view their own)
  "/member/profile",
  "/member/security",
  "/member/account-info",
]);

function NavigationLinks({
  sections,
  pathname,
  onNavigate,
  collapsed = false,
  showSectionHeaders = true,
}: {
  sections: NavigationSection[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  showSectionHeaders?: boolean;
}) {
  const isActive = (path: string) => {
    if (path === "/member") {
      return pathname === "/member";
    }

    return pathname.startsWith(path);
  };

  return (
    <>
      {sections.map((section) => (
        <div key={section.name} className="mb-4">
          {!collapsed && showSectionHeaders && (
            <h3
              className="mb-2 px-6 text-[12px] font-semibold uppercase"
              style={{ color: "rgba(255,255,255,0.38)", letterSpacing: "0.08em" }}
            >
              {section.name}
            </h3>
          )}
          {collapsed && (
            <div
              className="mx-3 mb-1.5"
              style={{ height: 1, background: "rgba(255,255,255,0.08)" }}
            />
          )}
          <div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center transition-colors ${
                    collapsed ? "justify-center px-2 py-3" : "gap-3.5 px-6 py-[9px]"
                  }`}
                  style={{
                    color: active ? "#0a0a0a" : "rgba(255,255,255,0.78)",
                    background: active ? "#fff" : "transparent",
                    fontWeight: active ? 600 : 400,
                    fontSize: 15,
                    borderLeft: collapsed
                      ? "0"
                      : `3px solid ${active ? "#fff" : "transparent"}`,
                  }}
                  onClick={onNavigate}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function KobotWordmark({ className = "" }: { className?: string }) {
  return (
    <img
      src={wordLogo}
      alt="Kookmin Robot"
      className={`block h-auto w-[196px] max-w-full object-contain ${className}`}
    />
  );
}

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authData, hasPermission, memberStatus, signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("kb-sidebar-collapsed") === "1";
  });
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kb-sidebar-collapsed", next ? "1" : "0");
      }
      return next;
    });
  };
  const sidebarWidthClass = collapsed ? "md:w-16" : "md:w-72";
  const mainPaddingClass = collapsed ? "md:pl-16" : "md:pl-72";
  const isActiveMember =
    memberStatus === "active" || memberStatus === "course_member";
  const canReadNotifications = hasPermission("notifications.read");

  const refreshUnreadNotificationCount = useCallback(async () => {
    if (!user || !canReadNotifications) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      setUnreadNotificationCount(await getUnreadNotificationsCount(user.id));
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [canReadNotifications, user?.id]);

  useEffect(() => {
    void refreshUnreadNotificationCount();

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshUnreadNotificationCount);
    return () => {
      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        refreshUnreadNotificationCount,
      );
    };
  }, [refreshUnreadNotificationCount]);

  const displayName =
    authData.profile.displayName ??
    authData.profile.fullName ??
    authData.profile.email?.split("@")[0] ??
    "Kobot member";
  const roleLabel =
    getRoleDisplayLabel(authData.orgPositions[0]?.slug, authData.orgPositions[0]?.name) ??
    getRoleDisplayLabel(authData.teamMemberships[0]?.roleSlug, authData.teamMemberships[0]?.roleName) ??
    getMembershipDisplayLabel(memberStatus, authData.profile.clubAffiliation);
  const initials = getInitials(displayName);

  const orgPositionSlugs = new Set(authData.orgPositions.map((position) => position.slug));
  const teamRoleSlugs = new Set(
    authData.teamMemberships
      .map((membership) => membership.roleSlug)
      .filter((roleSlug): roleSlug is string => roleSlug !== null),
  );
  const viewerRoleLevel: NavigationRoleLevel = hasPermission("permissions.manage") ||
    orgPositionSlugs.has("president")
    ? "president"
    : hasPermission("members.manage") || orgPositionSlugs.has("vice-president")
      ? "vicePresident"
      : hasPermission("projects.manage", "resources.manage") || teamRoleSlugs.has("team-lead")
        ? "teamLead"
        : "member";
  const viewerRoleRank = NAVIGATION_ROLE_RANK[viewerRoleLevel];

  const visibleSections = NAVIGATION.map((section) => {
    if (memberStatus === "course_member") {
      if (section.minimumRole && section.minimumRole !== "member") {
        return { ...section, items: [] };
      }

      return {
        ...section,
        items: section.items.filter((item) => COURSE_MEMBER_ALLOWED_PATHS.has(item.href)),
      };
    }

    const requiredRank = NAVIGATION_ROLE_RANK[section.minimumRole ?? "member"];

    if (requiredRank > viewerRoleRank) {
      return { ...section, items: [] };
    }

    return {
      ...section,
      items: section.items.filter((item) => {
        if (!item.permissions || item.permissions.length === 0) {
          return true;
        }

        return hasPermission(...item.permissions);
      }),
    };
  }).filter((section) => section.items.length > 0);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function renderAccountDropdown({ compact = false }: { compact?: boolean } = {}) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={
              compact
                ? "flex items-center gap-2.5 rounded-lg p-1.5 pr-2.5 hover:bg-[var(--kb-paper-3)] transition-colors"
                : "flex w-full items-center gap-3 rounded-lg p-2 hover:bg-[var(--kb-paper-3)]"
            }
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--kb-navy-800)] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className={compact ? "hidden text-left lg:block" : "min-w-0 flex-1 text-left"}>
              <p className="truncate text-[13px] font-medium leading-tight text-[var(--kb-ink-900)]">
                {displayName}
              </p>
              <p className="truncate text-[11px] leading-tight text-[var(--kb-ink-500)]">{roleLabel}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>내 계정</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/member/profile")}>
            <User className="mr-2 h-4 w-4" />
            프로필
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/member/security")}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            계정 보안
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/member/account-info")}>
            <IdCard className="mr-2 h-4 w-4" />
            회원 정보
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/member/pending")}>
            <Award className="mr-2 h-4 w-4" />
            멤버 상태 확인
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onSelect={() => void handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!isActiveMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ScrollToTop />
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="flex items-center">
              <KobotWordmark />
            </Link>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{getMemberStatusLabel(memberStatus)}</Badge>
              <Button size="sm" className="bg-[#103078] hover:bg-[#2048A0]" onClick={() => void handleSignOut()}>
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="kb-root min-h-screen" style={{ background: "#ffffff" }}>
      <aside
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col transition-[width] duration-200 ease-out ${sidebarWidthClass}`}
      >
        <div
          className="flex min-h-full flex-1 flex-col"
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          <div
            className={`flex items-center ${collapsed ? "flex-col gap-3 px-2 py-3" : "px-6"}`}
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              minHeight: 68,
            }}
          >
            {collapsed ? (
              <>
                <Link
                  to="/member"
                  className="kb-display inline-flex h-[28px] w-[28px] items-center justify-center rounded-lg"
                  style={{ background: "#2a52a3", color: "#fff", fontWeight: 800, fontSize: 15 }}
                >
                  K
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="사이드바 펼치기"
                  className="inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/member" className="flex items-center mr-auto">
                  <img src={wordLogo} alt="Kobot" style={{ height: 26, filter: "brightness(0) invert(1)" }} />
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="사이드바 접기"
                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <nav className="kb-no-scrollbar flex-1 overflow-y-auto py-4">
            <NavigationLinks
              sections={visibleSections}
              pathname={location.pathname}
              collapsed={collapsed}
            />
          </nav>

          <div
            className={`flex items-center ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-6 py-5"}`}
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              title={collapsed ? `${displayName} · ${roleLabel}` : undefined}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold"
              style={{ background: "#fff", color: "#0a0a0a", flexShrink: 0 }}
            >
              {initials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium" style={{ color: "#fff" }}>
                  {displayName}
                </div>
                <div className="truncate text-[12.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {roleLabel}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div
              className="px-6 pb-3 text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.25)" }}
              title="빌드 버전"
            >
              {APP_VERSION_LABEL}
            </div>
          )}
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          sidebarOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 w-72 shadow-2xl transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "#0a0a0a", color: "#fff" }}
        >
          <div className="flex h-full flex-col">
              <div
                className="flex items-center justify-between px-5 py-5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Link to="/member" className="flex items-center" onClick={() => setSidebarOpen(false)}>
                  <img src={wordLogo} alt="Kobot" style={{ height: 22, filter: "brightness(0) invert(1)" }} />
                </Link>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" style={{ color: "#fff" }} />
                </button>
              </div>
              <nav className="kb-no-scrollbar flex-1 overflow-y-auto py-4">
                <NavigationLinks
                  sections={visibleSections}
                  pathname={location.pathname}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </nav>
              <div
                className="px-5 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{ background: "#fff", color: "#0a0a0a" }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium" style={{ color: "#fff" }}>
                      {displayName}
                    </div>
                    <div className="truncate text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {roleLabel}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate("/member/profile");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <User className="h-3.5 w-3.5" />
                    프로필
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      void handleSignOut();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition-colors"
                    style={{
                      background: "rgba(220,38,38,0.15)",
                      color: "#fca5a5",
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="프로젝트, 멤버, 자료, 행사를 검색하세요"
                  className="pl-10 pr-4 py-3 text-base"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <p className="py-8 text-center text-sm text-gray-500">
                검색 데이터는 아직 연결 전입니다.
              </p>
            </div>
            <div className="flex items-center justify-between border-t bg-gray-50 p-3 text-xs text-gray-500">
              <div className="flex gap-4">
                <span>
                  <kbd className="rounded border bg-white px-2 py-1">↑↓</kbd> 이동
                </span>
                <span>
                  <kbd className="rounded border bg-white px-2 py-1">Enter</kbd> 선택
                </span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <kbd className="rounded border bg-white px-2 py-1">ESC</kbd> 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ease-out ${mainPaddingClass}`}>
        <header className="sticky top-0 z-40 border-b border-[var(--kb-hairline)] bg-[var(--kb-paper)]">
          <div className="flex h-16 items-center gap-4 px-6">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="max-w-lg flex-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-[var(--kb-hairline)] bg-[var(--kb-paper-2)] px-4 py-2 text-sm text-[var(--kb-ink-500)] transition-colors hover:border-[var(--kb-ink-300)]"
              >
                <Search className="h-4 w-4" />
                <span>Search everywhere…</span>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {canReadNotifications && (
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/member/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                      >
                        {unreadNotificationCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}
              <div className="hidden md:block">{renderAccountDropdown({ compact: true })}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <ScrollToTop />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
