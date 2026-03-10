import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Clock, CheckCircle2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Study() {
  const [selectedTab, setSelectedTab] = useState("ongoing");

  const assignments = [
    {
      id: 1,
      title: "ROS 2 Navigation Stack 실습",
      description:
        "Navigation Stack을 이용한 자율주행 로봇 구현. nav2 패키지를 활용하여 경로 계획 및 장애물 회피를 구현하세요.",
      dueDate: "2026.02.18",
      status: "ongoing",
      priority: "high",
      subject: "ROS",
      submitRequired: true,
      attachments: ["navigation_guide.pdf", "map_files.zip"],
    },
    {
      id: 2,
      title: "컴퓨터 비전 - 객체 추적 알고리즘",
      description:
        "OpenCV를 이용한 실시간 객체 추적 구현. KCF, CSRT 등의 추적 알고리즘을 비교 분석하세요.",
      dueDate: "2026.02.20",
      status: "ongoing",
      priority: "medium",
      subject: "Computer Vision",
      submitRequired: true,
      attachments: ["tracking_tutorial.pdf"],
    },
    {
      id: 3,
      title: "제어 이론 - PID 제어기 설계",
      description:
        "DC 모터의 속도 제어를 위한 PID 제어기를 설계하고 시뮬레이션하세요.",
      dueDate: "2026.02.25",
      status: "ongoing",
      priority: "low",
      subject: "Control",
      submitRequired: true,
      attachments: ["pid_theory.pdf", "simulation_code.m"],
    },
    {
      id: 4,
      title: "딥러닝 - YOLO 모델 학습",
      description:
        "YOLOv8을 활용한 커스텀 객체 인식 모델 학습 및 평가",
      dueDate: "2026.02.10",
      status: "submitted",
      priority: "high",
      subject: "Deep Learning",
      submitRequired: true,
      attachments: ["yolo_guide.pdf"],
      submittedDate: "2026.02.09",
      feedback: "잘 완료하셨습니다. mAP 값이 우수합니다.",
    },
    {
      id: 5,
      title: "SLAM 알고리즘 비교 분석",
      description:
        "EKF-SLAM과 Particle Filter SLAM의 성능 비교 및 분석",
      dueDate: "2026.02.05",
      status: "submitted",
      priority: "medium",
      subject: "SLAM",
      submitRequired: true,
      attachments: ["slam_comparison.pdf"],
      submittedDate: "2026.02.04",
      feedback: "이론적 분석이 충실합니다. 실험 결과를 추가하면 더 좋겠습니다.",
    },
  ];

  const studySessions = [
    {
      date: "2026.02.18",
      title: "ROS 2 Navigation Stack 세미나",
      presenter: "김철수",
      type: "세미나",
    },
    {
      date: "2026.02.14",
      title: "컴퓨터 비전 스터디 #5",
      presenter: "이영희",
      type: "스터디",
    },
    {
      date: "2026.02.12",
      title: "프로젝트 중간 발표",
      presenter: "전체",
      type: "발표",
    },
  ];

  const ongoingAssignments = assignments.filter((a) => a.status === "ongoing");
  const submittedAssignments = assignments.filter((a) => a.status === "submitted");
  const completedAssignments = assignments.filter((a) => a.status === "completed");

  const handleSubmit = (assignmentId: number) => {
    toast.success("과제가 제출되었습니다!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">스터디 & 과제</h1>
        <p className="text-gray-600">학습 자료와 과제를 확인하고 제출하세요</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">진행중 과제</p>
                <p className="text-2xl font-bold text-orange-600">
                  {ongoingAssignments.length}개
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">제출 완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {submittedAssignments.length}개
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">최근 세션</p>
                <p className="text-2xl font-bold text-blue-600">3개</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="ongoing">
            진행중 ({ongoingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            제출 완료 ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">세션 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="space-y-4 mt-6">
          {ongoingAssignments.map((assignment) => (
            <Card
              key={assignment.id}
              className={`border-gray-200 ${
                assignment.priority === "high"
                  ? "border-l-4 border-l-red-500"
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {assignment.title}
                        </h3>
                        <Badge variant="outline">{assignment.subject}</Badge>
                        {assignment.priority === "high" && (
                          <Badge variant="destructive">긴급</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          마감: {assignment.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">첨부 자료:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((file, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <FileText className="mr-1 h-3 w-3" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {assignment.submitRequired && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSubmit(assignment.id)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        파일 업로드
                      </Button>
                      <Button
                        className="flex-1 bg-[#103078] hover:bg-[#2048A0]"
                        onClick={() => handleSubmit(assignment.id)}
                      >
                        제출하기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {ongoingAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">진행중인 과제가 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4 mt-6">
          {submittedAssignments.map((assignment) => (
            <Card key={assignment.id} className="border-green-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-lg">
                          {assignment.title}
                        </h3>
                        <Badge variant="outline">{assignment.subject}</Badge>
                        <Badge className="bg-green-600">제출 완료</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>제출일: {assignment.submittedDate}</span>
                        <span>•</span>
                        <span>마감일: {assignment.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  {assignment.feedback && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold mb-1 text-blue-900">
                        피드백:
                      </p>
                      <p className="text-sm text-blue-800">
                        {assignment.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {submittedAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">제출한 과제가 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-6">
          {studySessions.map((session, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{session.title}</h3>
                      <Badge
                        variant="outline"
                        className={
                          session.type === "세미나" ? "bg-[#103078] text-white" : ""
                        }
                      >
                        {session.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.date} • 발표자: {session.presenter}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    자료 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
