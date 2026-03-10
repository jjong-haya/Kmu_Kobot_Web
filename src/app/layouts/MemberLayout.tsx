import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Bell,
  Calendar,
  BookOpen,
  FolderKanban,
  FileText,
  Settings,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Users,
  HelpCircle,
  Megaphone,
  ClipboardList,
  Package,
  Link2,
  Target,
  MessageSquare,
  Clock,
  FolderOpen,
  Award,
  Presentation,
  GitBranch,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import logo from "@/assets/mainLogo.png";
import { ScrollToTop } from "../components/ScrollToTop";

export default function MemberLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Mock user role - in real app, get from auth context
  const isAdmin = true;

  const navigation = [
    {
      name: "Overview",
      items: [
        { name: "Dashboard", href: "/member", icon: LayoutDashboard },
        { name: "Notifications", href: "/member/notifications", icon: Bell },
      ],
    },
    {
      name: "Communication",
      items: [
        { name: "Announcements", href: "/member/announcements", icon: Megaphone },
        { name: "Q&A", href: "/member/qna", icon: HelpCircle },
      ],
    },
    {
      name: "Learning",
      items: [
        { name: "Study Log", href: "/member/study-log", icon: BookOpen },
        { name: "Study Playlist", href: "/member/study-playlist", icon: ListChecks },
        { name: "Peer Review", href: "/member/peer-review", icon: MessageSquare },
      ],
    },
    {
      name: "Projects",
      items: [
        { name: "Projects", href: "/member/projects", icon: FolderKanban },
        { name: "Showcase", href: "/member/showcase", icon: Presentation },
      ],
    },
    {
      name: "Events & People",
      items: [
        { name: "Events", href: "/member/events", icon: Calendar },
        { name: "Office Hours", href: "/member/office-hours", icon: Clock },
        { name: "Members", href: "/member/members", icon: Users },
      ],
    },
    {
      name: "Resources",
      items: [
        { name: "Resources", href: "/member/resources", icon: FileText },
        { name: "Templates", href: "/member/templates", icon: FolderOpen },
        { name: "Equipment", href: "/member/equipment", icon: Package },
      ],
    },
    {
      name: "Management",
      items: [
        { name: "Roadmap", href: "/member/roadmap", icon: Target },
        { name: "Retrospective", href: "/member/retro", icon: MessageSquare },
        { name: "Changelog", href: "/member/changelog", icon: GitBranch },
      ],
    },
  ];

  if (isAdmin) {
    navigation.push({
      name: "Admin",
      items: [
        { name: "Forms", href: "/member/forms", icon: ClipboardList },
        { name: "Integrations", href: "/member/integrations", icon: Link2 },
        { name: "Permissions", href: "/member/permissions", icon: Settings },
      ],
    });
  }

  const isActive = (path: string) => {
    if (path === "/member") return location.pathname === "/member";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
            <img src={logo} alt="Kookmin Robot" className="h-8" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.name} className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.name}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.href)
                          ? "bg-[#103078] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#103078] flex items-center justify-center text-white text-sm font-medium">
                    JD
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-gray-500">Member</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Award className="mr-2 h-4 w-4" />
                  My Badges
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex flex-col h-full">
              <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
                <img src={logo} alt="Kookmin Robot" className="h-8" />
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {navigation.map((section) => (
                  <div key={section.name} className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.name}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.href)
                              ? "bg-[#103078] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                              }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search everywhere... (projects, members, resources, events)"
                  className="pl-10 pr-4 py-3 text-base"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-500 text-center py-8">
                Start typing to search...
              </p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex gap-4">
                <span>
                  <kbd className="px-2 py-1 bg-white border rounded">↑↓</kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white border rounded">↵</kbd>{" "}
                  Select
                </span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <kbd className="px-2 py-1 bg-white border rounded">ESC</kbd>{" "}
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center gap-4 px-6">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-lg">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Search everywhere...</span>
                <kbd className="ml-auto px-2 py-0.5 bg-white border border-gray-200 rounded text-xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                asChild
              >
                <Link to="/member/notifications">
                  <Bell className="h-5 w-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    3
                  </Badge>
                </Link>
              </Button>
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full bg-[#103078] flex items-center justify-center text-white text-sm font-medium hover:bg-[#2048A0] transition-colors">
                      JD
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Award className="mr-2 h-4 w-4" />
                      My Badges
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <ScrollToTop />
          <Outlet />
        </main>
      </div>
    </div>
  );
}