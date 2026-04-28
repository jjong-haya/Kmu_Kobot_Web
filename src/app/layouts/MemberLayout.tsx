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
  HelpCircle,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Presentation,
  Search,
  Settings,
  Sparkles,
  Target,
  User,
  Users,
  Vote,
  X,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
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
import logo from "@/assets/mainLogo.png";

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  permissions?: string[];
};

type NavigationSection = {
  name: string;
  items: NavigationItem[];
};

const NAVIGATION: NavigationSection[] = [
  {
    name: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/member",
        icon: LayoutDashboard,
        permissions: ["dashboard.read"],
      },
      {
        name: "Notifications",
        href: "/member/notifications",
        icon: Bell,
        permissions: ["notifications.read"],
      },
      {
        name: "연락 요청",
        href: "/member/contact-requests",
        icon: MessageSquare,
      },
    ],
  },
  {
    name: "Communication",
    items: [
      {
        name: "Announcements",
        href: "/member/announcements",
        icon: Megaphone,
        permissions: ["announcements.read", "announcements.manage"],
      },
      { name: "Q&A", href: "/member/qna", icon: HelpCircle },
    ],
  },
  {
    name: "Learning",
    items: [
      { name: "Study Log", href: "/member/study-log", icon: BookOpen },
      {
        name: "Study Playlist",
        href: "/member/study-playlist",
        icon: ListChecks,
      },
      { name: "Peer Review", href: "/member/peer-review", icon: MessageSquare },
    ],
  },
  {
    name: "Projects",
    items: [
      {
        name: "Projects",
        href: "/member/projects",
        icon: FolderKanban,
        permissions: ["projects.read", "projects.manage"],
      },
      {
        name: "Showcase",
        href: "/member/showcase",
        icon: Presentation,
        permissions: ["projects.read", "projects.manage"],
      },
    ],
  },
  {
    name: "Events & People",
    items: [
      {
        name: "Events",
        href: "/member/events",
        icon: Calendar,
        permissions: ["events.read", "events.manage"],
      },
      { name: "Office Hours", href: "/member/office-hours", icon: Clock },
      {
        name: "Members",
        href: "/member/members",
        icon: Users,
        permissions: ["members.read", "members.manage"],
      },
    ],
  },
  {
    name: "Resources",
    items: [
      {
        name: "Resources",
        href: "/member/resources",
        icon: FileText,
        permissions: ["resources.read", "resources.manage"],
      },
      {
        name: "Templates",
        href: "/member/templates",
        icon: FolderOpen,
        permissions: ["resources.read", "resources.manage"],
      },
      {
        name: "Equipment",
        href: "/member/equipment",
        icon: Package,
        permissions: ["resources.read", "resources.manage"],
      },
    ],
  },
  {
    name: "Management",
    items: [
      { name: "Roadmap", href: "/member/roadmap", icon: Target },
      { name: "Retrospective", href: "/member/retro", icon: MessageSquare },
      { name: "Changelog", href: "/member/changelog", icon: GitBranch },
      { name: "투표", href: "/member/votes", icon: Vote },
    ],
  },
  {
    name: "Admin",
    items: [
      {
        name: "Forms",
        href: "/member/forms",
        icon: ClipboardList,
        permissions: ["forms.manage"],
      },
      {
        name: "Integrations",
        href: "/member/integrations",
        icon: Link2,
        permissions: ["integrations.manage"],
      },
      {
        name: "Permissions",
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

function NavigationLinks({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavigationSection[];
  pathname: string;
  onNavigate?: () => void;
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
        <div key={section.name} className="mb-6">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {section.name}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-[#103078] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={onNavigate}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authData, hasPermission, memberStatus, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isActiveMember = memberStatus === "active";

  const displayName =
    authData.profile.displayName ??
    authData.profile.fullName ??
    authData.profile.email?.split("@")[0] ??
    "Kobot member";
  const roleLabel =
    authData.orgPositions[0]?.name ??
    authData.teamMemberships[0]?.roleName ??
    (memberStatus ? memberStatus.toUpperCase() : "MEMBER");
  const initials = getInitials(displayName);

  const visibleSections = NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permissions || item.permissions.length === 0) {
          return true;
        }

        return hasPermission(...item.permissions);
      }),
    })).filter((section) => section.items.length > 0);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function renderAccountDropdown() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#103078] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
              <p className="truncate text-xs text-gray-500">{roleLabel}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/member/profile")}>
            <User className="mr-2 h-4 w-4" />
            프로필 설정
          </DropdownMenuItem>
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
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Kobot" className="h-8" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Kobot member</p>
                <p className="text-xs text-gray-500">승인 전용 셸</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{memberStatus ?? "pending"}</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/member/profile")}>
                <User className="h-4 w-4" />
                프로필
              </Button>
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
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-full flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
            <img src={logo} alt="Kobot" className="h-8" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Kobot</p>
              <p className="text-xs text-gray-500">member workspace</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <NavigationLinks sections={visibleSections} pathname={location.pathname} />
          </nav>

          <div className="border-t border-gray-200 p-4">{renderAccountDropdown()}</div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Kobot" className="h-8" />
                  <span className="text-sm font-semibold text-gray-900">Kobot</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <NavigationLinks
                  sections={visibleSections}
                  pathname={location.pathname}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </nav>
              <div className="border-t border-gray-200 p-4">{renderAccountDropdown()}</div>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20">
          <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search projects, members, resources, events..."
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
                  <kbd className="rounded border bg-white px-2 py-1">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="rounded border bg-white px-2 py-1">Enter</kbd> Select
                </span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <kbd className="rounded border bg-white px-2 py-1">ESC</kbd> Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center gap-4 px-6">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="max-w-lg flex-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-300"
              >
                <Search className="h-4 w-4" />
                <span>Search everywhere...</span>
                <kbd className="ml-auto rounded border border-gray-200 bg-white px-2 py-0.5 text-xs">
                  /
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission("notifications.read") && (
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/member/notifications">
                    <Bell className="h-5 w-5" />
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                    >
                      3
                    </Badge>
                  </Link>
                </Button>
              )}
              <div className="hidden md:block">{renderAccountDropdown()}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <ScrollToTop />
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#103078]/10 bg-white px-4 py-3">
            <Badge className="bg-[#103078] text-white hover:bg-[#103078]">
              {roleLabel}
            </Badge>
            {authData.teamMemberships.slice(0, 2).map((membership) => (
              <Badge key={membership.teamId} variant="outline">
                {membership.teamName}
                {membership.roleName ? ` · ${membership.roleName}` : ""}
              </Badge>
            ))}
            {authData.teamMemberships.length > 2 && (
              <Badge variant="outline">+{authData.teamMemberships.length - 2} teams</Badge>
            )}
            <div className="ml-auto hidden items-center gap-2 text-sm text-gray-500 lg:flex">
              <Sparkles className="h-4 w-4 text-[#103078]" />
              로그인 사용자: {displayName}
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
