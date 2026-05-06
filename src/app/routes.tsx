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

const PublicProjects = lazy(() => import("./pages/public/Projects"));
const PublicNotice = lazy(() => import("./pages/public/Notice"));
const NoticeDetail = lazy(() => import("./pages/public/NoticeDetail"));
const Recruit = lazy(() => import("./pages/public/Recruit"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Activities = lazy(() => import("./pages/public/Activities"));
const FAQ = lazy(() => import("./pages/public/FAQ"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));
const Login = lazy(() => import("./pages/public/Login"));
const AuthCallback = lazy(() => import("./pages/public/AuthCallback"));
const InviteCourse = lazy(() => import("./pages/public/InviteCourse"));

const Dashboard = lazy(() => import("./pages/member/Dashboard"));
const Notifications = lazy(() => import("./pages/member/Notifications"));
const ContactRequests = lazy(() => import("./pages/member/ContactRequests"));
const Announcements = lazy(() => import("./pages/member/Announcements"));
const AnnouncementDetail = lazy(() => import("./pages/member/AnnouncementDetail"));
const StudyLog = lazy(() => import("./pages/member/StudyLog"));
const StudyProjectPosts = lazy(() => import("./pages/member/StudyProjectPosts"));
const StudyPlaylist = lazy(() => import("./pages/member/StudyPlaylist"));
const PeerReview = lazy(() => import("./pages/member/PeerReview"));
const MemberProjects = lazy(() => import("./pages/member/Projects"));
const ProjectAdmin = lazy(() => import("./pages/member/ProjectAdmin"));
const ProjectDetail = lazy(() => import("./pages/member/ProjectDetail"));
const Showcase = lazy(() => import("./pages/member/Showcase"));
const Events = lazy(() => import("./pages/member/Events"));
const SpaceBooking = lazy(() => import("./pages/member/SpaceBooking"));
const Members = lazy(() => import("./pages/member/Members"));
const Resources = lazy(() => import("./pages/member/Resources"));
const Templates = lazy(() => import("./pages/member/Templates"));
const Equipment = lazy(() => import("./pages/member/Equipment"));
const Roadmap = lazy(() => import("./pages/member/Roadmap"));
const Retro = lazy(() => import("./pages/member/Retro"));
const Changelog = lazy(() => import("./pages/member/Changelog"));
const Votes = lazy(() => import("./pages/member/Votes"));
const Forms = lazy(() => import("./pages/member/Forms"));
const Integrations = lazy(() => import("./pages/member/Integrations"));
const Permissions = lazy(() => import("./pages/member/Permissions"));
const NavConfig = lazy(() => import("./pages/member/NavConfig"));
const Tags = lazy(() => import("./pages/member/Tags"));
const TagDetail = lazy(() => import("./pages/member/TagDetail"));
const MemberAdmin = lazy(() => import("./pages/member/MemberAdmin"));
const Quests = lazy(() => import("./pages/member/Quests"));
const InviteCodes = lazy(() => import("./pages/member/InviteCodes"));
const ApprovalPending = lazy(() => import("./pages/member/ApprovalPending"));
const ProfileSettings = lazy(() => import("./pages/member/ProfileSettings"));
const Welcome = lazy(() => import("./pages/member/Welcome"));
const Profile = lazy(() => import("./pages/member/Profile"));
const Security = lazy(() => import("./pages/member/Security"));
const AccountInfo = lazy(() => import("./pages/member/AccountInfo"));
const StudyPostWrite = lazy(() => import("./pages/member/StudyPostWrite"));
const StudyPostDetail = lazy(() => import("./pages/member/StudyPostDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

type PageComponent = ComponentType | LazyExoticComponent<ComponentType>;

function PageFallback() {
  return (
    <div className="flex items-center justify-center px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
      불러오는 중입니다.
    </div>
  );
}

function lazyElement(Component: PageComponent) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

function memberElement(
  Component: PageComponent,
  requiredPermissions?: string[],
  options: { allowCourseMember?: boolean } = {},
) {
  const page = lazyElement(Component);

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
      { path: "projects", element: lazyElement(PublicProjects) },
      { path: "notice", element: lazyElement(PublicNotice) },
      { path: "notice/:slug", element: lazyElement(NoticeDetail) },
      { path: "recruit", element: lazyElement(Recruit) },
      { path: "contact", element: lazyElement(Contact) },
      { path: "activities", element: lazyElement(Activities) },
      { path: "faq", element: lazyElement(FAQ) },
      { path: "privacy", element: lazyElement(Privacy) },
      { path: "terms", element: lazyElement(Terms) },
      { path: "login", element: lazyElement(Login) },
    ],
  },
  {
    path: "/invite/course",
    element: lazyElement(InviteCourse),
  },
  {
    path: "/invite/course/:code",
    element: lazyElement(InviteCourse),
  },
  {
    path: "/auth/callback",
    element: lazyElement(AuthCallback),
  },
  {
    path: "/member",
    element: (
      <RequireSession>
    <MemberLayout />
      </RequireSession>
    ),
    children: [
      { path: "join", element: lazyElement(ProfileSettings) },
      { path: "welcome", element: lazyElement(Welcome) },
      { path: "pending", element: lazyElement(ApprovalPending) },
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
    element: lazyElement(NotFound),
  },
]);
