import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, Filter } from "lucide-react";

export default function PublicProjects() {
  const [selectedFilter, setSelectedFilter] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["전체", "진행중", "완료", "계획중"];

  const projects = [
    {
      id: 1,
      title: "자율주행 로봇 개발",
      description:
        "SLAM 알고리즘을 활용한 실내 자율주행 로봇 시스템 개발. LiDAR 센서와 카메라를 통합하여 정밀한 위치 추정 및 장애물 회피 구현.",
      tags: ["ROS", "Python", "Computer Vision", "SLAM"],
      status: "진행중",
      team: "5명",
      duration: "2025.09 - 현재",
      image: null,
    },
    {
      id: 2,
      title: "6축 로봇팔 제어 시스템",
      description:
        "역기구학 기반의 6축 로봇팔 정밀 제어 시스템. 궤적 계획 알고리즘과 PID 제어를 통한 안정적인 동작 구현.",
      tags: ["C++", "ROS", "Control", "Kinematics"],
      status: "완료",
      team: "4명",
      duration: "2025.03 - 2025.08",
      image: null,
    },
    {
      id: 3,
      title: "드론 자동 착륙 시스템",
      description:
        "컴퓨터 비전 기반 정밀 착륙 시스템. ArUco 마커 인식과 PX4 제어를 통한 자동 착륙 구현.",
      tags: ["OpenCV", "Python", "ArduPilot", "Computer Vision"],
      status: "진행중",
      team: "3명",
      duration: "2025.11 - 현재",
      image: null,
    },
    {
      id: 4,
      title: "휴머노이드 보행 알고리즘",
      description:
        "2족 보행 로봇의 안정적인 보행을 위한 ZMP 기반 보행 패턴 생성 및 제어 알고리즘 연구.",
      tags: ["MATLAB", "Control", "Simulation"],
      status: "완료",
      team: "4명",
      duration: "2025.01 - 2025.06",
      image: null,
    },
    {
      id: 5,
      title: "딥러닝 기반 물체 인식",
      description:
        "YOLO 모델을 활용한 실시간 물체 인식 및 분류 시스템. ROS와 통합하여 로봇 응용 시스템 구축.",
      tags: ["TensorFlow", "YOLO", "ROS", "Deep Learning"],
      status: "진행중",
      team: "6명",
      duration: "2025.09 - 현재",
      image: null,
    },
    {
      id: 6,
      title: "협동 로봇 시스템",
      description:
        "다중 로봇 간 통신 및 협업 알고리즘 연구. ROS2 DDS를 활용한 분산 제어 시스템 구현.",
      tags: ["Multi-Agent", "ROS2", "Python", "DDS"],
      status: "계획중",
      team: "5명",
      duration: "2026.03 - 예정",
      image: null,
    },
    {
      id: 7,
      title: "로봇 비전 시스템",
      description:
        "스테레오 비전 기반 3D 인식 시스템. 깊이 정보 추출 및 물체 위치 추정 알고리즘 개발.",
      tags: ["OpenCV", "Python", "Computer Vision", "3D Vision"],
      status: "완료",
      team: "3명",
      duration: "2024.09 - 2025.02",
      image: null,
    },
    {
      id: 8,
      title: "모바일 매니퓰레이터",
      description:
        "이동 로봇과 로봇팔을 결합한 모바일 매니퓰레이터 개발. 동시 위치 추정 및 물체 조작 통합 시스템.",
      tags: ["ROS", "C++", "Navigation", "Manipulation"],
      status: "진행중",
      team: "7명",
      duration: "2025.06 - 현재",
      image: null,
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      selectedFilter === "전체" || project.status === selectedFilter;
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">프로젝트</h1>
          <p className="text-lg text-gray-600">K⚙️BOT이 진행하는 다양한 프로젝트를 확인하세요</p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className={
                  selectedFilter === filter
                    ? "bg-[#103078] hover:bg-[#2048A0]"
                    : ""
                }
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="border-gray-200 hover:border-[#2048A0] hover:shadow-lg transition-all cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <Badge
                    variant={
                      project.status === "완료"
                        ? "secondary"
                        : project.status === "진행중"
                        ? "default"
                        : "outline"
                    }
                    className={
                      project.status === "진행중"
                        ? "bg-[#103078] text-white"
                        : ""
                    }
                  >
                    {project.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs border-gray-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <span>팀원: {project.team}</span>
                    <span>{project.duration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
