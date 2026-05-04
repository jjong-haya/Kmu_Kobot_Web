import type { ComponentType } from "react";
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
import StudyLog from "./pages/member/StudyLog";
import StudyPlaylist from "./pages/member/StudyPlaylist";
import PeerReview from "./pages/member/PeerReview";
import MemberProjects from "./pages/member/Projects";
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
import InviteCodes from "./pages/member/InviteCodes";
import ApprovalPending from "./pages/member/ApprovalPending";
import ProfileSettings from "./pages/member/ProfileSettings";
import Welcome from "./pages/member/Welcome";
import Profile from "./pages/member/Profile";
import Security from "./pages/member/Security";
import AccountInfo from "./pages/member/AccountInfo";
import NotFound from "./pages/NotFound";

function memberElement(
  Component: ComponentType,
  requiredPermissions?: string[],
) {
  const page = <Component />;

  if (requiredPermissions && requiredPermissions.length > 0) {
    return (
      <RequireActiveMember>
        <RequirePermission anyOf={requiredPermissions}>{page}</RequirePermission>
      </RequireActiveMember>
    );
  }

  return <RequireActiveMember>{page}</RequireActiveMember>;
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
      { path: "profile", element: memberElement(Profile) },
      { path: "security", element: memberElement(Security) },
      { path: "account-info", element: memberElement(AccountInfo) },
      { index: true, element: memberElement(Dashboard, ["dashboard.read"]) },
      {
        path: "notifications",
        element: memberElement(Notifications, ["notifications.read"]),
      },
      { path: "contact-requests", element: memberElement(ContactRequests) },
      {
        path: "announcements",
        element: memberElement(Announcements, [
          "announcements.read",
          "announcements.manage",
        ]),
      },
      { path: "study-log", element: memberElement(StudyLog) },
      { path: "study-playlist", element: memberElement(StudyPlaylist) },
      { path: "peer-review", element: memberElement(PeerReview) },
      {
        path: "projects",
        element: memberElement(MemberProjects, ["projects.read", "projects.manage"]),
      },
      {
        path: "projects/:slug",
        element: memberElement(ProjectDetail, ["projects.read", "projects.manage"]),
      },
      {
        path: "showcase",
        element: memberElement(Showcase, ["projects.read", "projects.manage"]),
      },
      {
        path: "events",
        element: memberElement(Events, ["events.read", "events.manage"]),
      },
      { path: "space-booking", element: memberElement(SpaceBooking) },
      {
        path: "members",
        element: memberElement(Members, ["members.read", "members.manage"]),
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
