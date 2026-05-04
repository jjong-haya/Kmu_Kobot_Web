import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  Archive,
  ChevronRight,
  CircleDot,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { listProjects, type ProjectStatus, type ProjectSummary } from "../../api/projects";
import {
  filterProjects,
  getProjectDetailPath,
  getProjectStatusLabel,
  PROJECT_FILTERS,
} from "../../api/project-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

type FilterKey = "all" | "mine" | "active" | "pending" | "archived";

const FILTERS = PROJECT_FILTERS as { key: FilterKey; label: string }[];

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const STATUS_META: Record<ProjectStatus, { bg: string; fg: string; dot: string }> = {
  active: {
    bg: "#e7efff",
    fg: "#183b80",
    dot: "var(--kb-navy-800)",
  },
  pending: {
    bg: "#fff3d8",
    fg: "#855600",
    dot: "#d97706",
  },
  rejected: {
    bg: "#fee2e2",
    fg: "#991b1b",
    dot: "#dc2626",
  },
  archived: {
    bg: "#eeeeec",
    fg: "#55514c",
    dot: "#9a9a98",
  },
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "업데이트 없음";

  const diffMs = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diffMs < 60 * 1000) return "방금 전";
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60 * 1000))}시간 전`;
  if (diffMs < day * 7) return `${Math.floor(diffMs / day)}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function filterCount(projects: ProjectSummary[], key: FilterKey) {
  return filterProjects(projects, key).length;
}

function matchesSearch(project: ProjectSummary, keyword: string) {
  if (!keyword) return true;

  return [
    project.name,
    project.slug,
    project.summary,
    project.description,
    project.lead?.displayName,
    project.myRoleLabel,
  ]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

function ProjectRow({ project }: { project: ProjectSummary }) {
  const meta = STATUS_META[project.status] ?? STATUS_META.pending;

  return (
    <Link
      to={getProjectDetailPath(project.slug)}
      className="relative flex gap-4 border-t border-[#f1ede4] px-5 py-5 text-inherit no-underline transition-colors hover:bg-[#fafaf6] sm:px-7"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-[13px] font-bold"
        style={{
          background: project.status === "archived" ? "#f1ede4" : "#0a0a0a",
          color: project.status === "archived" ? "var(--kb-ink-500)" : "#fff",
          fontFamily: "var(--kb-font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        {project.prefix}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold text-[var(--kb-ink-900)]">
            {project.name}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: meta.bg, color: meta.fg }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
            {getProjectStatusLabel(project.status)}
          </span>
          {project.isMember && (
            <span className="rounded-full border border-[#e8e8e4] bg-[#fafaf6] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-700)]">
              {project.myRoleLabel}
            </span>
          )}
        </div>

        <p className="m-0 line-clamp-2 text-[14.5px] leading-6 text-[var(--kb-ink-500)]">
          {project.summary ?? project.description ?? "프로젝트 설명이 없습니다."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--kb-ink-400)]">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            멤버 {project.memberCount}명
          </span>
          {project.lead && <span>리드 {project.lead.displayName}</span>}
          <span>{formatRelativeDate(project.updatedAt)}</span>
          <span>{project.visibility === "public" ? "공개" : "비공개"}</span>
        </div>

        {project.progress !== null && (
          <div className="mt-3 flex max-w-[320px] items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1ede4]">
              <div
                className="h-full rounded-full bg-[var(--kb-navy-800)]"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="w-9 text-right text-[12px] font-semibold text-[var(--kb-ink-700)]">
              {project.progress}%
            </span>
          </div>
        )}
      </div>

      <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-[var(--kb-ink-300)]" />
    </Link>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyword = search.trim().toLocaleLowerCase("ko-KR");
  const filtered = useMemo(
    () =>
      (filterProjects(projects, activeFilter) as ProjectSummary[]).filter((project) =>
        matchesSearch(project, keyword),
      ),
    [activeFilter, keyword, projects],
  );
  const activeCount = useMemo(
    () => projects.filter((project) => project.status === "active").length,
    [projects],
  );
  const myProjectCount = useMemo(
    () => projects.filter((project) => project.isMember).length,
    [projects],
  );

  async function refresh() {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setProjects(await listProjects(user.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              Projects
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              프로젝트
              <span className="ml-3 text-[17px] font-normal text-[var(--kb-ink-500)]">
                진행중 {activeCount}건 / 참여 {myProjectCount}건
              </span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>

        <section style={{ ...CONTAINER_STYLE, overflow: "hidden" }}>
          <div className="flex flex-col gap-3 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="프로젝트 검색"
                className="w-full rounded-md border border-[#e8e8e4] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors"
                    style={{
                      borderColor: active ? "#0a0a0a" : "#ebe8e0",
                      background: active ? "#0a0a0a" : "#fff",
                      color: active ? "#fff" : "var(--kb-ink-700)",
                    }}
                  >
                    {filter.key === "archived" && <Archive className="h-3.5 w-3.5" />}
                    {filter.label}
                    <span className="text-[12px]" style={{ opacity: active ? 0.8 : 0.55 }}>
                      {filterCount(projects, filter.key)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-[14px] text-red-700 sm:px-7">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-[15px] text-[var(--kb-ink-500)]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              프로젝트를 불러오는 중입니다.
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-[15px] text-[var(--kb-ink-500)]">
              <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
              실제 DB에 표시할 프로젝트가 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f1ede4] px-5 py-3 text-[13px] text-[var(--kb-ink-500)] sm:px-7">
            <span>
              {filtered.length} / {projects.length}건
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" />
              실제 프로젝트 테이블 기준
            </span>
          </div>
        </section>

        <div className="flex items-center gap-2 rounded-md bg-[#f8f9fc] px-4 py-3 text-[14px] text-[var(--kb-ink-500)]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--kb-navy-800)]" />
          프로젝트 생성과 태스크 관리는 별도 데이터 모델이 붙을 때 활성화됩니다.
        </div>
      </div>
    </div>
  );
}
