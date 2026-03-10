import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  TrendingUp,
  Calendar,
  FolderKanban,
  FileText,
  Clock,
  ArrowRight,
  Bell,
} from "lucide-react";

export default function Dashboard() {
  const kpiCards = [
    {
      title: "출석률",
      value: "94%",
      icon: TrendingUp,
      trend: "+2%",
      color: "text-green-600",
    },
    {
      title: "이번 달 세션",
      value: "8회",
      icon: Calendar,
      trend: "4회 남음",
      color: "text-blue-600",
    },
    {
      title: "진행중 프로젝트",
      value: "2개",
      icon: FolderKanban,
      trend: "1개 완료",
      color: "text-purple-600",
    },
    {
      title: "마감 임박 과제",
      value: "1개",
      icon: Clock,
      trend: "D-3",
      color: "text-orange-600",
    },
  ];

  const upcomingEvents = [
    {
      title: "ROS 2 Navigation 세미나",
      date: "2026.02.18",
      time: "19:00",
      type: "세미나",
    },
    {
      title: "프로젝트 중간 발표",
      date: "2026.02.20",
      time: "18:00",
      type: "발표",
    },
    {
      title: "정기 총회",
      date: "2026.02.22",
      time: "19:00",
      type: "회의",
    },
  ];

  const todos = [
    { title: "컴퓨터 비전 과제 제출", priority: "high", dueDate: "2.18" },
    { title: "프로젝트 문서 작성", priority: "medium", dueDate: "2.20" },
    { title: "세미나 자료 준비", priority: "low", dueDate: "2.25" },
  ];

  const recentNotices = [
    {
      title: "2026년 상반기 신입 부원 모집 공고",
      date: "2.15",
      category: "모집",
    },
    {
      title: "ROS 2 고급 세미나 안내",
      date: "2.14",
      category: "세미나",
    },
    {
      title: "국제 로봇 경진대회 참가 안내",
      date: "2.13",
      category: "행사",
    },
  ];

  const recentResources = [
    { title: "ROS 2 Navigation Stack 가이드", type: "PDF", date: "2.14" },
    { title: "자율주행 프로젝트 코드", type: "ZIP", date: "2.13" },
    { title: "로봇팔 제어 시뮬레이션", type: "VIDEO", date: "2.12" },
  ];

  const myProjects = [
    {
      name: "자율주행 로봇 개발",
      role: "소프트웨어",
      status: "진행중",
      progress: 65,
      link: "/member/projects",
    },
    {
      name: "딥러닝 기반 물체 인식",
      role: "AI 개발",
      status: "진행중",
      progress: 40,
      link: "/member/projects",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">안녕하세요, John Doe님 👋</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            3 New
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                    <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                    <p className={`text-xs ${kpi.color}`}>{kpi.trend}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#103078]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-[#2048A0]">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/member/study-log">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Write Study Log</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/member/equipment">
                <FolderKanban className="h-5 w-5" />
                <span className="text-xs">Borrow Equipment</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/member/events">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Register Event</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
              <a href="/member/qna">
                <Bell className="h-5 w-5" />
                <span className="text-xs">Ask Question</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">이번 주 일정</CardTitle>
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#103078] mt-2" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600">
                        {event.date} • {event.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* To-do List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">오늘 할 일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todos.map((todo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{todo.title}</p>
                      <p className="text-xs text-gray-600">
                        마감: {todo.dueDate}
                      </p>
                    </div>
                    <Badge
                      variant={
                        todo.priority === "high"
                          ? "destructive"
                          : todo.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        todo.priority === "medium" ? "bg-[#103078]" : ""
                      }
                    >
                      {todo.priority === "high"
                        ? "높음"
                        : todo.priority === "medium"
                        ? "보통"
                        : "낮음"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Notices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">최근 공지</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/member/notice">
                    전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNotices.map((notice, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Bell className="h-4 w-4 text-[#103078] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notice.title}
                      </p>
                      <p className="text-xs text-gray-600">{notice.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {notice.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Resources */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">최근 자료</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/member/resources">
                    전체보기 <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[#103078] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {resource.title}
                      </p>
                      <p className="text-xs text-gray-600">{resource.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {resource.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">내 프로젝트</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/member/projects">
                전체보기 <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로젝트명</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진행률</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myProjects.map((project, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.role}</TableCell>
                  <TableCell>
                    <Badge className="bg-[#103078]">{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#103078]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {project.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={project.link}>보기</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}