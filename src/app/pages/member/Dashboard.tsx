import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  FolderKanban,
} from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../auth/useAuth";

const metrics = [
  { label: "출석률", value: "94%", note: "지난달 대비 +2%" },
  { label: "이번 달 세션", value: "8회", note: "남은 일정 4회" },
  { label: "진행 프로젝트", value: "2개", note: "내 역할 확인 필요" },
  { label: "마감 임박", value: "1건", note: "D-3" },
];

const quickActions = [
  { label: "스터디 기록", href: "/member/study-log", icon: FileText },
  { label: "장비 대여", href: "/member/equipment", icon: FolderKanban },
  { label: "일정 확인", href: "/member/events", icon: Calendar },
  { label: "알림", href: "/member/notifications", icon: Bell },
];

const upcomingEvents = [
  { title: "ROS 2 Navigation 세미나", meta: "2026.02.18 · 19:00", type: "세미나" },
  { title: "프로젝트 중간 발표", meta: "2026.02.20 · 18:00", type: "발표" },
  { title: "정기 총회", meta: "2026.02.22 · 19:00", type: "회의" },
];

const todos = [
  { title: "컴퓨터 비전 과제 제출", meta: "마감 2.18", priority: "높음" },
  { title: "프로젝트 문서 작성", meta: "마감 2.20", priority: "보통" },
  { title: "세미나 자료 준비", meta: "마감 2.25", priority: "낮음" },
];

const updates = [
  { title: "2026년 상반기 신입 부원 모집 공고", meta: "공지 · 2.15" },
  { title: "ROS 2 고급 세미나 안내", meta: "자료 · 2.14" },
  { title: "국제 로봇 경진대회 참가 안내", meta: "행사 · 2.13" },
];

const myProjects = [
  { name: "자율주행 로봇 개발", role: "소프트웨어", status: "진행중", progress: 65 },
  { name: "딥러닝 기반 물체 인식", role: "AI 개발", status: "진행중", progress: 40 },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#103078]">
      {children}
    </p>
  );
}

function getGreetingName(value: string | null) {
  if (!value) {
    return "멤버";
  }

  return value.trim().split(/\s+/)[0] || "멤버";
}

export default function Dashboard() {
  const { authData } = useAuth();
  const greetingName = getGreetingName(
    authData.profile.nicknameDisplay ?? authData.profile.fullName ?? authData.profile.displayName,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <section className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel>Member Dashboard</SectionLabel>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {greetingName}님, 오늘 필요한 것만 먼저 확인하세요.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            대시보드는 모든 기능을 나열하는 곳이 아니라, 오늘 처리할 일정과 기록,
            프로젝트 상태를 빠르게 확인하는 출발점입니다.
          </p>
        </div>

        <Link
          to="/member/notifications"
          className="inline-flex h-11 w-fit items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition hover:border-[#103078]/30 hover:text-[#103078]"
        >
          알림 3건
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
          {metrics.map((metric) => (
            <div className="border-t border-slate-200 p-6 first:border-t-0 sm:[&:nth-child(-n+2)]:border-t-0 lg:border-t-0" key={metric.label}>
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{metric.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <SectionLabel>Quick Start</SectionLabel>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
              자주 쓰는 작업은 한 줄로 충분합니다.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              버튼을 카드처럼 키우지 않고, 실제 이동이 필요한 작업만 남겼습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="group flex items-center justify-between rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#103078]/30 hover:text-[#103078]"
                  key={action.href}
                  to={action.href}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-[#103078]" />
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#103078]" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid border-t border-slate-200 lg:grid-cols-3 lg:divide-x lg:divide-slate-200">
          <section className="border-t border-slate-200 p-6 first:border-t-0 lg:border-t-0 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-950">이번 주 일정</h3>
              <Link to="/member/events" className="text-xs font-semibold text-[#103078]">
                전체보기
              </Link>
            </div>
            <div className="mt-6 divide-y divide-slate-100">
              {upcomingEvents.map((event) => (
                <div className="py-4 first:pt-0 last:pb-0" key={event.title}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.meta}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 p-6 lg:border-t-0 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-950">오늘 할 일</h3>
              <Link to="/member/study-log" className="text-xs font-semibold text-[#103078]">
                기록하기
              </Link>
            </div>
            <div className="mt-6 divide-y divide-slate-100">
              {todos.map((todo) => (
                <label className="flex cursor-pointer items-start gap-3 py-4 first:pt-0 last:pb-0" key={todo.title}>
                  <input
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#103078] focus:ring-[#103078]"
                    type="checkbox"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{todo.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{todo.meta}</span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {todo.priority}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 p-6 lg:border-t-0 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-950">최근 업데이트</h3>
              <Link to="/member/announcements" className="text-xs font-semibold text-[#103078]">
                공지 보기
              </Link>
            </div>
            <div className="mt-6 divide-y divide-slate-100">
              {updates.map((update) => (
                <div className="py-4 first:pt-0 last:pb-0" key={update.title}>
                  <p className="truncate text-sm font-semibold text-slate-900">{update.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{update.meta}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="border-t border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel>Projects</SectionLabel>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                내 프로젝트
              </h3>
            </div>
            <Link to="/member/projects" className="text-sm font-semibold text-[#103078]">
              프로젝트 전체보기
            </Link>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {myProjects.map((project) => (
              <div className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[1.2fr_0.7fr_1fr_auto] md:items-center" key={project.name}>
                <div>
                  <p className="font-semibold text-slate-950">{project.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{project.role}</p>
                </div>
                <span className="w-fit rounded-full border border-[#103078]/20 px-3 py-1 text-xs font-semibold text-[#103078]">
                  {project.status}
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#103078]" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm tabular-nums text-slate-500">
                    {project.progress}%
                  </span>
                </div>
                <Link
                  to="/member/projects"
                  className="inline-flex items-center text-sm font-semibold text-slate-700 transition hover:text-[#103078]"
                >
                  보기
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="flex flex-col gap-4 border-y border-slate-200 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
            필요한 기능은 왼쪽 메뉴에서 계속 이어집니다.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            대시보드는 요약만 보여주고, 세부 작업은 각 메뉴에서 처리하도록 분리했습니다.
          </p>
        </div>
        <CheckCircle2 className="h-6 w-6 shrink-0 text-[#103078]" />
      </section>
    </div>
  );
}
