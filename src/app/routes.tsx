import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { createBrowserRouter } from "react-router";
import {
  RequireActiveMember,
  RequirePermission,
  RequireSession,
} from "./auth/guards";
import PublicLayout from "./layouts/PublicLayout";
import MemberLayout from "./layouts/MemberLayout";
import Landing from "./pages/public/Landing";
import PublicProjects from "./pages/public/Projects";
import PublicNotice from "./pages/public/Notice";
import NoticeDetail from "./pages/public/NoticeDetail";
import Recruit from "./pages/public/Recruit";
import Contact from "./pages/public/Contact";
import Activities from "./pages/public/Activities";
import FAQ from "./pages/public/FAQ";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import Login from "./pages/public/Login";
import AuthCallback from "./pages/public/AuthCallback";
import InviteCourse from "./pages/public/InviteCourse";
import DesignLab from "./pages/public/DesignLab";
import Dashboard from "./pages/member/Dashboard";
import Notifications from "./pages/member/Notifications";
import ContactRequests from "./pages/member/ContactRequests";
import Announcements from "./pages/member/Announcements";
import AnnouncementDetail from "./pages/member/AnnouncementDetail";
import StudyLog from "./pages/member/StudyLog";
import StudyProjectPosts from "./pages/member/StudyProjectPosts";
import StudyPlaylist from "./pages/member/StudyPlaylist";
import PeerReview from "./pages/member/PeerReview";
import MemberProjects from "./pages/member/Projects";
import ProjectAdmin from "./pages/member/ProjectAdmin";
import ProjectDetail from "./pages/member/ProjectDetail";
import Showcase from "./pages/member/Showcase";
import Events from "./pages/member/Events";
import SpaceBooking from "./pages/member/SpaceBooking";
import Members from "./pages/member/Members";
import Resources from "./pages/member/Resources";
import Templates from "./pages/member/Templates";
import Equipment from "./pages/member/Equipment";
import Roadmap from "./pages/member/Roadmap";
import Retro from "./pages/member/Retro";
import Changelog from "./pages/member/Changelog";
import Votes from "./pages/member/Votes";
import Forms from "./pages/member/Forms";
import Integrations from "./pages/member/Integrations";
import Permissions from "./pages/member/Permissions";
import NavConfig from "./pages/member/NavConfig";
import Tags from "./pages/member/Tags";
import TagDetail from "./pages/member/TagDetail";
import MemberAdmin from "./pages/member/MemberAdmin";
import Quests from "./pages/member/Quests";
import InviteCodes from "./pages/member/InviteCodes";
import ApprovalPending from "./pages/member/ApprovalPending";
import ProfileSettings from "./pages/member/ProfileSettings";
import Welcome from "./pages/member/Welcome";
import Profile from "./pages/member/Profile";
import Security from "./pages/member/Security";
import AccountInfo from "./pages/member/AccountInfo";
import NotFound from "./pages/NotFound";

const StudyPostWrite = lazy(() => import("./pages/member/StudyPostWrite"));
const StudyPostDetail = lazy(() => import("./pages/member/StudyPostDetail"));

type PageComponent = ComponentType | LazyExoticComponent<ComponentType>;

function PageFallback() {
  return (
    <div className="flex items-center justify-center px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
      불러오는 중입니다.
    </div>
  );
}

function memberElement(
  Component: PageComponent,
  requiredPermissions?: string[],
  options: { allowCourseMember?: boolean } = {},
) {
  const page = (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );

  if (requiredPermissions && requiredPermissions.length > 0) {
    return (
      <RequireActiveMember allowCourseMember={options.allowCourseMember}>
        <RequirePermission
          allowCourseMember={options.allowCourseMember}
          anyOf={requiredPermissions}
        >
          {page}
        </RequirePermission>
      </RequireActiveMember>
    );
  }

  return (
    <RequireActiveMember allowCourseMember={options.allowCourseMember}>
      {page}
    </RequireActiveMember>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: Landing },
      { path: "projects", Component: PublicProjects },
      { path: "notice", Component: PublicNotice },
      { path: "notice/:slug", Component: NoticeDetail },
      { path: "recruit", Component: Recruit },
      { path: "contact", Component: Contact },
      { path: "activities", Component: Activities },
      { path: "faq", Component: FAQ },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      { path: "login", Component: Login },
    ],
  },
  {
    path: "/invite/course",
    Component: InviteCourse,
  },
  {
    path: "/invite/course/:code",
    Component: InviteCourse,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/design-lab",
    Component: DesignLab,
  },
  {
    path: "/member",
    element: (
      <RequireSession>
    <MemberLayout />
      </RequireSession>
    ),
    children: [
      { path: "join", Component: ProfileSettings },
      { path: "welcome", Component: Welcome },
      { path: "pending", Component: ApprovalPending },
      {
        path: "profile",
        element: memberElement(Profile, undefined, { allowCourseMember: true }),
      },
      {
        path: "security",
        element: memberElement(Security, undefined, { allowCourseMember: true }),
      },
      {
        path: "account-info",
        element: memberElement(AccountInfo, undefined, { allowCourseMember: true }),
      },
      {
        index: true,
        element: memberElement(Dashboard, ["dashboard.read"], {
          allowCourseMember: true,
        }),
      },
      {
        path: "notifications",
        element: memberElement(Notifications, ["notifications.read"], {
          allowCourseMember: true,
        }),
      },
      {
        path: "contact-requests",
        element: memberElement(ContactRequests, undefined, {
          allowCourseMember: true,
        }),
      },
      {
        path: "announcements",
        element: memberElement(
          Announcements,
          ["announcements.read", "announcements.manage"],
          { allowCourseMember: true },
        ),
      },
      {
        path: "announcements/:noticeId",
        element: memberElement(
          AnnouncementDetail,
          ["announcements.read", "announcements.manage"],
          { allowCourseMember: true },
        ),
      },
      { path: "study-log", element: memberElement(StudyLog) },
      { path: "study-log/:slug/write", element: memberElement(StudyPostWrite) },
      { path: "study-log/:slug/posts/:recordId/edit", element: memberElement(StudyPostWrite) },
      { path: "study-log/:slug/posts/:recordId", element: memberElement(StudyPostDetail) },
      { path: "study-log/:slug", element: memberElement(StudyProjectPosts) },
      { path: "study-playlist", element: memberElement(StudyPlaylist) },
      { path: "peer-review", element: memberElement(PeerReview) },
      {
        path: "projects",
        element: memberElement(MemberProjects),
      },
      {
        path: "project-admin",
        element: memberElement(ProjectAdmin, ["projects.manage", "members.manage"]),
      },
      {
        path: "projects/:slug",
        element: memberElement(ProjectDetail),
      },
      {
        path: "showcase",
        element: memberElement(Showcase, ["projects.read", "projects.manage"]),
      },
      {
        path: "events",
        element: memberElement(Events, ["events.read", "events.manage"]),
      },
      {
        path: "space-booking",
        element: memberElement(SpaceBooking, undefined, { allowCourseMember: true }),
      },
      {
        path: "members",
        element: memberElement(Members, ["members.read", "members.manage"], {
          allowCourseMember: true,
        }),
      },
      {
        path: "resources",
        element: memberElement(Resources, ["resources.read", "resources.manage"]),
      },
      {
        path: "templates",
        element: memberElement(Templates, ["resources.read", "resources.manage"]),
      },
      {
        path: "equipment",
        element: memberElement(Equipment, ["resources.read", "resources.manage"]),
      },
      { path: "roadmap", element: memberElement(Roadmap) },
      { path: "retro", element: memberElement(Retro) },
      { path: "changelog", element: memberElement(Changelog) },
      { path: "votes", element: memberElement(Votes) },
      { path: "forms", element: memberElement(Forms, ["forms.manage"]) },
      {
        path: "integrations",
        element: memberElement(Integrations, ["integrations.manage"]),
      },
      {
        path: "permissions",
        element: memberElement(Permissions, ["permissions.manage"]),
      },
      {
        path: "nav-config",
        element: memberElement(NavConfig, ["permissions.manage"]),
      },
      {
        path: "tags",
        element: memberElement(Tags, ["permissions.manage"]),
      },
      {
        path: "tags/:slug",
        element: memberElement(TagDetail, ["permissions.manage"]),
      },
      {
        path: "member-admin",
        element: memberElement(MemberAdmin, ["members.manage", "permissions.manage"]),
      },
      {
        path: "quests",
        element: memberElement(Quests, undefined, { allowCourseMember: true }),
      },
      {
        path: "invite-codes",
        element: memberElement(InviteCodes, ["members.manage"]),
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
