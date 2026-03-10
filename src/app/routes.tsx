import { createBrowserRouter } from "react-router";
import PublicLayout from "./layouts/PublicLayout";
import MemberLayout from "./layouts/MemberLayout";
import Landing from "./pages/public/Landing";
import PublicProjects from "./pages/public/Projects";
import PublicNotice from "./pages/public/Notice";
import Recruit from "./pages/public/Recruit";
import Contact from "./pages/public/Contact";
import Activities from "./pages/public/Activities";
import FAQ from "./pages/public/FAQ";
import Dashboard from "./pages/member/Dashboard";
import Notifications from "./pages/member/Notifications";
import Announcements from "./pages/member/Announcements";
import QnA from "./pages/member/QnA";
import StudyLog from "./pages/member/StudyLog";
import StudyPlaylist from "./pages/member/StudyPlaylist";
import PeerReview from "./pages/member/PeerReview";
import MemberProjects from "./pages/member/Projects";
import Showcase from "./pages/member/Showcase";
import Events from "./pages/member/Events";
import OfficeHours from "./pages/member/OfficeHours";
import Members from "./pages/member/Members";
import Resources from "./pages/member/Resources";
import Templates from "./pages/member/Templates";
import Equipment from "./pages/member/Equipment";
import Roadmap from "./pages/member/Roadmap";
import Retro from "./pages/member/Retro";
import Changelog from "./pages/member/Changelog";
import Forms from "./pages/member/Forms";
import Integrations from "./pages/member/Integrations";
import Permissions from "./pages/member/Permissions";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: Landing },
      { path: "projects", Component: PublicProjects },
      { path: "notice", Component: PublicNotice },
      { path: "recruit", Component: Recruit },
      { path: "contact", Component: Contact },
      { path: "activities", Component: Activities },
      { path: "faq", Component: FAQ },
    ],
  },
  {
    path: "/member",
    Component: MemberLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "notifications", Component: Notifications },
      { path: "announcements", Component: Announcements },
      { path: "qna", Component: QnA },
      { path: "study-log", Component: StudyLog },
      { path: "study-playlist", Component: StudyPlaylist },
      { path: "peer-review", Component: PeerReview },
      { path: "projects", Component: MemberProjects },
      { path: "showcase", Component: Showcase },
      { path: "events", Component: Events },
      { path: "office-hours", Component: OfficeHours },
      { path: "members", Component: Members },
      { path: "resources", Component: Resources },
      { path: "templates", Component: Templates },
      { path: "equipment", Component: Equipment },
      { path: "roadmap", Component: Roadmap },
      { path: "retro", Component: Retro },
      { path: "changelog", Component: Changelog },
      { path: "forms", Component: Forms },
      { path: "integrations", Component: Integrations },
      { path: "permissions", Component: Permissions },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);