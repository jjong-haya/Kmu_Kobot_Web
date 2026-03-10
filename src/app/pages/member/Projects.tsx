import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FolderKanban, Users, ExternalLink, Plus } from "lucide-react";

export default function MemberProjects() {
  const [view, setView] = useState<"grid" | "table">("grid");

  const projects = [
    {
      id: 1,
      name: "자율주행 로봇 개발",
      description:
        "SLAM 알고리즘을 활용한 실내 자율주행 로봇 시스템 개발. LiDAR 센서와 카메라를 통합하여 정밀한 위치 추정 및 장애물 회피 구현.",
      status: "진행중",
      progress: 65,
      members: ["김철수", "이영희", "박민수", "정지훈", "최서연"],
      myRole: "소프트웨어",
      tech: ["ROS", "Python", "Computer Vision", "SLAM"],
      startDate: "2025.09",
      links: {
        github: "https://github.com/project",
        docs: "https://docs.project.com",
      },
    },
    {
      id: 2,
      name: "딥러닝 기반 물체 인식",
      description:
        "YOLO 모델을 활용한 실시간 물체 인식 및 분류 시스템. ROS와 통합하여 로봇 응용 시스템 구축.",
      status: "진행중",
      progress: 40,
      members: ["이영희", "김철수", "홍길동", "이민지", "박지성", "정수진"],
      myRole: "AI 개발",
      tech: ["TensorFlow", "YOLO", "ROS", "Deep Learning"],
      startDate: "2025.09",
      links: {
        github: "https://github.com/project",
      },
    },
    {
      id: 3,
      name: "6축 로봇팔 제어 시스템",
      description:
        "역기구학 기반의 6축 로봇팔 정밀 제어 시스템. 궤적 계획 알고리즘과 PID 제어를 통한 안정적인 동작 구현.",
      status: "완료",
      progress: 100,
      members: ["박민수", "정지훈", "김영수", "이소현"],
      myRole: "참여",
      tech: ["C++", "ROS", "Control", "Kinematics"],
      startDate: "2025.03",
      endDate: "2025.08",
      links: {
        github: "https://github.com/project",
        docs: "https://docs.project.com",
      },
    },
  ];

  const myProjects = projects.filter((p) =>
    p.members.some((m) => m === "김철수" || m === "이영희")
  );
  const allProjects = projects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">프로젝트</h1>
          <p className="text-gray-600">진행중인 프로젝트와 내 참여 프로젝트</p>
        </div>
        <Button className="bg-[#103078] hover:bg-[#2048A0]">
          <Plus className="mr-2 h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 프로젝트</p>
                <p className="text-2xl font-bold">{allProjects.length}개</p>
              </div>
              <FolderKanban className="h-8 w-8 text-[#103078]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">내 프로젝트</p>
                <p className="text-2xl font-bold text-blue-600">
                  {myProjects.length}개
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">진행중</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter((p) => p.status === "진행중").length}개
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">완료</p>
                <p className="text-2xl font-bold text-gray-600">
                  {projects.filter((p) => p.status === "완료").length}개
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">내 프로젝트 ({myProjects.length})</TabsTrigger>
          <TabsTrigger value="all">전체 프로젝트 ({allProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-4 mt-6">
          {myProjects.map((project) => (
            <Card key={project.id} className="border-gray-200 hover:border-[#2048A0] hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge
                        variant={project.status === "진행중" ? "default" : "secondary"}
                        className={project.status === "진행중" ? "bg-[#103078]" : ""}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">진행률</span>
                    <span className="text-sm text-gray-600">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#103078]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <p className="text-sm font-semibold mb-2">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Members */}
                <div>
                  <p className="text-sm font-semibold mb-2">
                    팀원 ({project.members.length}명)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <Badge key={member} variant="secondary" className="text-xs">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>내 역할: {project.myRole}</span>
                    <span>•</span>
                    <span>
                      {project.startDate} {project.endDate && `- ${project.endDate}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {project.links.github && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {allProjects.map((project) => (
            <Card key={project.id} className="border-gray-200 hover:border-[#2048A0] hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge
                        variant={project.status === "진행중" ? "default" : "secondary"}
                        className={project.status === "진행중" ? "bg-[#103078]" : ""}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">진행률</span>
                    <span className="text-sm text-gray-600">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#103078]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <p className="text-sm font-semibold mb-2">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Members */}
                <div>
                  <p className="text-sm font-semibold mb-2">
                    팀원 ({project.members.length}명)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <Badge key={member} variant="secondary" className="text-xs">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {project.startDate} {project.endDate && `- ${project.endDate}`}
                  </div>
                  <div className="flex gap-2">
                    {project.links.github && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
