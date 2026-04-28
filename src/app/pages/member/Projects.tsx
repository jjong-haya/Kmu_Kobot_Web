import { type ReactNode, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Github,
  LockKeyhole,
  Megaphone,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";

type ProjectMode = "official" | "personal";
type VisibilityScope = "public" | "private";
type DisclosureScope = "readmeOnly" | "memberOnly";
type RepositoryVisibility = "public" | "private";
type ProposalSource = "github" | "internalIntro";
type ApprovalStatus = "approved" | "pending" | "draft";
type RecruitmentStatus = "open" | "preparing" | "closed";

type ProjectRole = {
  name: string;
  capacity: number;
  filled: number;
};

type Project = {
  id: string;
  title: string;
  summary: string;
  mode: ProjectMode;
  leader: string;
  visibility: VisibilityScope;
  disclosure: DisclosureScope;
  repositoryVisibility: RepositoryVisibility;
  proposalSource: ProposalSource;
  approvalStatus: ApprovalStatus;
  recruitmentStatus: RecruitmentStatus;
  allowPreTeam: boolean;
  allowApplications: boolean;
  roles: ProjectRole[];
  techTags: string[];
  members: string[];
  approvedAt?: string;
  githubUrl?: string;
  progress: number;
};

type AuditLog = {
  id: string;
  title: string;
  description: string;
  actor: string;
  at: string;
  status: "done" | "pending" | "info";
};

type DraftProject = {
  title: string;
  summary: string;
  mode: ProjectMode;
  visibility: VisibilityScope;
  disclosure: DisclosureScope;
  repositoryVisibility: RepositoryVisibility;
  proposalSource: ProposalSource;
  allowPreTeam: boolean;
  allowApplications: boolean;
};

const creationPolicies: Record<
  ProjectMode,
  {
    label: string;
    description: string;
    approvalFlow: string[];
    accentClassName: string;
  }
> = {
  official: {
    label: "공식 팀 기반",
    description:
      "동아리 공식 활동, 대회, 산학/연구 연계처럼 대표성이 필요한 프로젝트입니다.",
    approvalFlow: ["공식팀장 검토", "회장/부회장 승인", "공개 목록 노출"],
    accentClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  personal: {
    label: "개인 자율 기반",
    description:
      "개인이 먼저 아이디어를 제안하고 사전 팀원 모집 또는 공개 신청을 받을 수 있습니다.",
    approvalFlow: ["제안자 제출", "팀장 1차 확인", "회장/부회장 승인"],
    accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

const proposalOptions: Record<
  ProposalSource,
  {
    label: string;
    description: string;
  }
> = {
  github: {
    label: "GitHub README로 소개",
    description:
      "공개/비공개 저장소 모두 연결 가능하며, 공개 화면에는 README 요약만 노출합니다.",
  },
  internalIntro: {
    label: "내부 소개서로 소개",
    description:
      "GitHub 공개가 어렵거나 기획 단계일 때 내부 소개서 기준으로 승인 검토를 받습니다.",
  },
};

const mockProjects: Project[] = [
  {
    id: "project-robot-delivery",
    title: "지능형 실내 배송 로봇",
    summary:
      "ROS2 기반 자율주행과 엘리베이터 연동을 묶어 학과 건물 내 물품 배송 MVP를 구현합니다.",
    mode: "official",
    leader: "김태현",
    visibility: "public",
    disclosure: "readmeOnly",
    repositoryVisibility: "private",
    proposalSource: "github",
    approvalStatus: "approved",
    recruitmentStatus: "open",
    allowPreTeam: true,
    allowApplications: true,
    roles: [
      { name: "ROS/제어", capacity: 2, filled: 1 },
      { name: "프론트엔드", capacity: 1, filled: 0 },
      { name: "문서/발표", capacity: 1, filled: 1 },
    ],
    techTags: ["ROS2", "Python", "SLAM", "React"],
    members: ["김태현", "이서연", "박준호"],
    approvedAt: "2026.04.19",
    githubUrl: "https://github.com/kobot/indoor-delivery",
    progress: 62,
  },
  {
    id: "project-vision-arm",
    title: "비전 기반 로봇팔 피킹",
    summary:
      "카메라로 물체 위치를 추정하고 6축 로봇팔 경로 계획까지 연결하는 실험 프로젝트입니다.",
    mode: "personal",
    leader: "정민서",
    visibility: "public",
    disclosure: "readmeOnly",
    repositoryVisibility: "public",
    proposalSource: "github",
    approvalStatus: "approved",
    recruitmentStatus: "preparing",
    allowPreTeam: true,
    allowApplications: false,
    roles: [
      { name: "컴퓨터비전", capacity: 2, filled: 1 },
      { name: "제어", capacity: 1, filled: 1 },
    ],
    techTags: ["OpenCV", "YOLO", "C++", "MoveIt"],
    members: ["정민서", "한유진"],
    approvedAt: "2026.04.12",
    githubUrl: "https://github.com/kobot/vision-arm",
    progress: 38,
  },
  {
    id: "project-private-dashboard",
    title: "팀 운영 대시보드",
    summary:
      "출석, 장비 예약, 프로젝트 히스토리를 통합하는 내부 운영 도구입니다.",
    mode: "official",
    leader: "오지훈",
    visibility: "private",
    disclosure: "memberOnly",
    repositoryVisibility: "private",
    proposalSource: "internalIntro",
    approvalStatus: "approved",
    recruitmentStatus: "closed",
    allowPreTeam: false,
    allowApplications: false,
    roles: [{ name: "풀스택", capacity: 2, filled: 2 }],
    techTags: ["Supabase", "TypeScript", "RLS"],
    members: ["오지훈", "최나은"],
    approvedAt: "2026.03.30",
    progress: 80,
  },
  {
    id: "project-scout-rover",
    title: "야외 정찰 로버",
    summary:
      "사전 팀원을 모아 센서 구성과 예산을 확정한 뒤 공식 프로젝트 전환을 검토합니다.",
    mode: "personal",
    leader: "윤서진",
    visibility: "public",
    disclosure: "readmeOnly",
    repositoryVisibility: "private",
    proposalSource: "internalIntro",
    approvalStatus: "pending",
    recruitmentStatus: "preparing",
    allowPreTeam: true,
    allowApplications: true,
    roles: [
      { name: "임베디드", capacity: 2, filled: 0 },
      { name: "기구 설계", capacity: 1, filled: 0 },
    ],
    techTags: ["STM32", "GPS", "CAD"],
    members: ["윤서진"],
    progress: 10,
  },
];

const auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    title: "공개 목록 반영",
    description: "지능형 실내 배송 로봇이 승인되어 README 공개 목록에 노출되었습니다.",
    actor: "부회장",
    at: "2026.04.19 18:20",
    status: "done",
  },
  {
    id: "audit-2",
    title: "승인 검토 대기",
    description: "야외 정찰 로버의 사전 팀원 모집 허용 여부를 팀장이 확인 중입니다.",
    actor: "팀장",
    at: "2026.04.22 11:05",
    status: "pending",
  },
  {
    id: "audit-3",
    title: "GitHub 공개 범위 변경",
    description: "팀 운영 대시보드는 비공개 저장소 유지, 내부 소개서 기준 검토로 기록되었습니다.",
    actor: "공식팀장",
    at: "2026.04.24 09:40",
    status: "info",
  },
];

const initialDraft: DraftProject = {
  title: "새 로봇 프로젝트",
  summary:
    "문제 정의, MVP 범위, 필요한 역할을 짧게 적어 모집 카드와 승인 검토에 함께 사용합니다.",
  mode: "official",
  visibility: "public",
  disclosure: "readmeOnly",
  repositoryVisibility: "private",
  proposalSource: "github",
  allowPreTeam: true,
  allowApplications: true,
};

function getModeLabel(mode: ProjectMode) {
  return creationPolicies[mode].label;
}

function getVisibilityLabel(visibility: VisibilityScope) {
  return visibility === "public" ? "전원 공개" : "비공개";
}

function getDisclosureLabel(disclosure: DisclosureScope) {
  return disclosure === "readmeOnly" ? "README만 공개" : "멤버 전용";
}

function getApprovalBadge(project: Project) {
  if (project.approvalStatus === "approved") {
    return { label: "승인 완료", className: "bg-emerald-600 text-white" };
  }

  if (project.approvalStatus === "pending") {
    return { label: "승인 대기", className: "bg-amber-500 text-white" };
  }

  return { label: "초안", className: "bg-slate-500 text-white" };
}

function getOpenRoleCount(project: Project) {
  return project.roles.reduce(
    (total, role) => total + Math.max(role.capacity - role.filled, 0),
    0,
  );
}

export default function MemberProjects() {
  const [draft, setDraft] = useState<DraftProject>(initialDraft);

  const approvedPublicProjects = useMemo(
    () =>
      mockProjects.filter(
        (project) =>
          project.approvalStatus === "approved" && project.visibility === "public",
      ),
    [],
  );

  const myProjects = useMemo(
    () => mockProjects.filter((project) => project.leader === "김태현"),
    [],
  );

  const pendingProjects = useMemo(
    () => mockProjects.filter((project) => project.approvalStatus === "pending"),
    [],
  );

  const openRoleCount = approvedPublicProjects.reduce(
    (total, project) => total + getOpenRoleCount(project),
    0,
  );

  const selectedPolicy = creationPolicies[draft.mode];

  const setDraftValue = <K extends keyof DraftProject>(
    key: K,
    value: DraftProject[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-800 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
              프로젝트 팀/모집 MVP
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                승인된 프로젝트만 공개하고, 모집 카드는 바로 공유할 수 있게
              </h1>
              <p className="text-sm leading-6 text-blue-100 sm:text-base">
                공식 팀 기반과 개인 자율 기반을 분리하고, GitHub README 공개와
                내부 소개서 검토를 모두 지원하는 운영 화면입니다.
              </p>
            </div>
          </div>
          <Button className="w-full bg-white text-slate-950 hover:bg-blue-50 sm:w-auto">
            <Plus className="h-4 w-4" />새 프로젝트 제안
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">공개 목록</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {approvedPublicProjects.length}개
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">승인 대기</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {pendingProjects.length}개
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <Clock3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">모집 중 역할</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {openRoleCount}자리
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">GitHub 연동</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  공개/비공개
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Github className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">프로젝트 생성 정책</CardTitle>
            <CardDescription>
              DB 연결 전 mock 상태입니다. 선택 값은 추후 Supabase의 projects,
              approvals, project_roles 테이블로 그대로 옮기기 쉬운 구조로 분리했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(Object.keys(creationPolicies) as ProjectMode[]).map((mode) => {
                const policy = creationPolicies[mode];
                const isSelected = draft.mode === mode;

                return (
                  <button
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? policy.accentClassName
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                    key={mode}
                    onClick={() => setDraftValue("mode", mode)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{policy.label}</p>
                      {isSelected && <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <p className="mt-2 text-sm leading-5 opacity-85">
                      {policy.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-title">프로젝트명</Label>
                <Input
                  id="project-title"
                  value={draft.title}
                  onChange={(event) => setDraftValue("title", event.target.value)}
                  placeholder="예: 지능형 실내 배송 로봇"
                />
              </div>
              <div className="space-y-2">
                <Label>공개 범위</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className={draft.visibility === "public" ? "bg-blue-700" : ""}
                    onClick={() => setDraftValue("visibility", "public")}
                    type="button"
                    variant={draft.visibility === "public" ? "default" : "outline"}
                  >
                    <Eye className="h-4 w-4" />전원 공개
                  </Button>
                  <Button
                    onClick={() => setDraftValue("visibility", "private")}
                    type="button"
                    variant={draft.visibility === "private" ? "default" : "outline"}
                  >
                    <EyeOff className="h-4 w-4" />비공개
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-summary">소개 요약</Label>
              <Textarea
                className="min-h-24"
                id="project-summary"
                value={draft.summary}
                onChange={(event) => setDraftValue("summary", event.target.value)}
                placeholder="카톡 공지방 공유와 승인 검토에 함께 쓰일 한 문단 소개"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PolicyToggle
                active={draft.disclosure === "readmeOnly"}
                description="공개 화면에는 README 요약만 노출"
                icon={<FileText className="h-4 w-4" />}
                label="README만 공개"
                onClick={() => setDraftValue("disclosure", "readmeOnly")}
              />
              <PolicyToggle
                active={draft.repositoryVisibility === "private"}
                description="공개/비공개 저장소 모두 연결 가능"
                icon={<LockKeyhole className="h-4 w-4" />}
                label="비공개 GitHub 허용"
                onClick={() =>
                  setDraftValue(
                    "repositoryVisibility",
                    draft.repositoryVisibility === "private" ? "public" : "private",
                  )
                }
              />
              <PolicyToggle
                active={draft.proposalSource === "internalIntro"}
                description="GitHub 대신 내부 소개서로 검토"
                icon={<ClipboardCheck className="h-4 w-4" />}
                label="내부 소개서 선택"
                onClick={() =>
                  setDraftValue(
                    "proposalSource",
                    draft.proposalSource === "internalIntro" ? "github" : "internalIntro",
                  )
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(Object.keys(proposalOptions) as ProposalSource[]).map((source) => (
                <div
                  className={`rounded-2xl border p-4 ${
                    draft.proposalSource === source
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                  key={source}
                >
                  <p className="font-semibold text-slate-900">
                    {proposalOptions[source].label}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    {proposalOptions[source].description}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">승인 흐름</p>
                  <p className="text-sm text-slate-600">
                    팀장, 회장, 부회장, 공식팀장 역할을 명시적으로 기록합니다.
                  </p>
                </div>
                <Badge className="w-fit bg-slate-900 text-white">
                  {selectedPolicy.label}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                {selectedPolicy.approvalFlow.map((step, index) => (
                  <div
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700"
                    key={step}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <RecruitmentPreview draft={draft} />
      </section>

      <section>
        <Tabs defaultValue="public" className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">프로젝트 목록</h2>
              <p className="text-sm text-slate-500">
                공개 목록 탭은 승인 완료 + 전원 공개 프로젝트만 보여줍니다.
              </p>
            </div>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="public">공개 목록</TabsTrigger>
              <TabsTrigger value="mine">내 운영</TabsTrigger>
              <TabsTrigger value="review">검토 큐</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="public" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {approvedPublicProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </TabsContent>
          <TabsContent value="mine" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {myProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </TabsContent>
          <TabsContent value="review" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-blue-700" />공개 정책 체크
            </CardTitle>
            <CardDescription>
              멤버가 이해해야 하는 핵심 운영 규칙을 한 화면에 고정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <PolicyLine text="승인 완료 전 프로젝트는 공개 목록에 노출하지 않습니다." />
            <PolicyLine text="전원 공개 프로젝트도 상세 구현 내용은 README 요약만 공개합니다." />
            <PolicyLine text="GitHub 저장소는 공개/비공개 모두 연결할 수 있습니다." />
            <PolicyLine text="사전 팀원 모으기와 공개 신청 받기는 동시에 허용할 수 있습니다." />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">승인 대기/감사 로그</CardTitle>
            <CardDescription>
              누가 어떤 기준으로 승인했는지 나중에 audit_logs 테이블로 분리하기 쉬운 구조입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditLogs.map((log) => (
              <div className="flex gap-3" key={log.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                      log.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : log.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {log.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : log.status === "pending" ? (
                      <Clock3 className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="h-full w-px bg-slate-200" />
                </div>
                <div className="pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{log.title}</p>
                    <Badge variant="outline">{log.actor}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {log.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{log.at}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function PolicyToggle({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${
        active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-2 font-semibold text-slate-950">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
    </button>
  );
}

function RecruitmentPreview({ draft }: { draft: DraftProject }) {
  return (
    <Card className="border-slate-200 bg-slate-950 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Megaphone className="h-5 w-5 text-blue-200" />모집 카드 미리보기
        </CardTitle>
        <CardDescription className="text-blue-100">
          카톡 공지방에 그대로 옮길 수 있는 요약 카드입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-700 text-white">{getModeLabel(draft.mode)}</Badge>
            <Badge variant="outline">{getVisibilityLabel(draft.visibility)}</Badge>
            <Badge variant="outline">{getDisclosureLabel(draft.disclosure)}</Badge>
          </div>
          <h3 className="mt-4 text-2xl font-bold leading-tight">{draft.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{draft.summary}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewInfo label="필요 역할" value="ROS/제어, 프론트, 문서" />
            <PreviewInfo label="기술 태그" value="ROS2, Python, React" />
            <PreviewInfo
              label="모집 방식"
              value={`${draft.allowPreTeam ? "사전 팀원" : "사전 팀원 없음"} · ${
                draft.allowApplications ? "신청 가능" : "신청 닫힘"
              }`}
            />
            <PreviewInfo
              label="소개 기준"
              value={proposalOptions[draft.proposalSource].label}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">공유 문구</p>
            <p className="mt-2 leading-6">
              [{draft.title}] 팀원을 모집합니다. 필요한 역할은 ROS/제어,
              프론트엔드, 문서/발표이며, 관심 있는 분은 신청 또는 사전 팀원
              참여로 연락해 주세요.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button className="bg-white text-slate-950 hover:bg-blue-50">
            카톡 공유용 복사
          </Button>
          <Button className="border-white/30 text-white hover:bg-white/10" variant="outline">
            승인 요청 미리보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const badge = getApprovalBadge(project);
  const openRoleCount = getOpenRoleCount(project);

  return (
    <Card className="border-slate-200 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{project.title}</CardTitle>
              <Badge className={badge.className}>{badge.label}</Badge>
            </div>
            <CardDescription className="leading-6">{project.summary}</CardDescription>
          </div>
          <Badge variant="outline">{getModeLabel(project.mode)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">진행률</span>
            <span className="text-slate-500">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.techTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CardMetric
            icon={<Users className="h-4 w-4" />}
            label="팀원"
            value={`${project.members.length}명`}
          />
          <CardMetric
            icon={<Megaphone className="h-4 w-4" />}
            label="모집"
            value={project.recruitmentStatus === "open" ? `${openRoleCount}자리` : "준비/마감"}
          />
          <CardMetric
            icon={project.visibility === "public" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            label="공개"
            value={`${getVisibilityLabel(project.visibility)} · ${getDisclosureLabel(project.disclosure)}`}
          />
          <CardMetric
            icon={<Github className="h-4 w-4" />}
            label="GitHub"
            value={project.repositoryVisibility === "public" ? "공개 저장소" : "비공개 저장소"}
          />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">필요 역할</p>
          <div className="mt-3 space-y-3">
            {project.roles.map((role) => (
              <div key={role.name}>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{role.name}</span>
                  <span>
                    {role.filled}/{role.capacity}
                  </span>
                </div>
                <Progress
                  className="mt-1 h-1.5 bg-slate-200"
                  value={(role.filled / role.capacity) * 100}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">팀장 {project.leader}</span>
            {project.approvedAt && <span> · 승인 {project.approvedAt}</span>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="justify-between" size="sm" variant="outline">
              README 보기 <ArrowRight className="h-4 w-4" />
            </Button>
            {project.allowApplications && project.recruitmentStatus !== "closed" && (
              <Button className="bg-blue-700 hover:bg-blue-800" size="sm">
                신청하기
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CardMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function PolicyLine({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p>{text}</p>
    </div>
  );
}
