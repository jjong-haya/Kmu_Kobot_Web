import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  ChevronRight,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { listProjects, type ProjectSummary } from "../../api/projects";
import { getProjectStatusLabel } from "../../api/project-policy.js";
import { listStudyRecords, type StudyRecord } from "../../api/studies";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const PANEL_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const ICON_PALETTE = [
  ["#0a0a0a", "#4267b2"],
  ["#14342b", "#4f8f6f"],
  ["#372554", "#efb8a4"],
  ["#183b80", "#8fb8ff"],
  ["#4a2c1a", "#d6a45f"],
  ["#1e3a3a", "#8ccfc1"],
];

function projectStudyPath(slug: string) {
  return `/member/study-log/${encodeURIComponent(slug)}`;
}

function paletteFor(project: ProjectSummary) {
  const source = project.slug || project.name || project.id;
  const sum = [...source].reduce((value, char) => value + char.charCodeAt(0), 0);
  return ICON_PALETTE[sum % ICON_PALETTE.length];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function projectMatches(project: ProjectSummary, keyword: string) {
  if (!keyword) return true;

  return [
    project.name,
    project.slug,
    project.summary,
    project.description,
    project.lead?.displayName,
  ]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

function recordMatches(record: StudyRecord, keyword: string) {
  if (!keyword) return true;

  return [record.title, record.body, record.author?.displayName, record.project?.name]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

function ProjectIcon({ project }: { project: ProjectSummary }) {
  const [from, to] = paletteFor(project);

  if (project.coverImageUrl) {
    return (
      <img
        src={project.coverImageUrl}
        alt=""
        className="h-20 w-20 shrink-0 rounded-[18px] object-cover ring-1 ring-[#e8e8e4] sm:h-24 sm:w-24"
      />
    );
  }

  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] text-[21px] font-black text-white shadow-sm sm:h-24 sm:w-24 sm:text-[24px]"
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontFamily: "var(--kb-font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      {project.prefix}
    </div>
  );
}

function ProjectStudyCard({
  project,
  recordCount,
  latestRecord,
}: {
  project: ProjectSummary;
  recordCount: number;
  latestRecord: StudyRecord | null;
}) {
  return (
    <Link
      to={projectStudyPath(project.slug)}
      className="group flex min-h-[230px] flex-col rounded-lg border border-[#e8e8e4] bg-white p-5 text-inherit no-underline transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-[#0a0a0a] hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]"
    >
      <div className="flex gap-4">
        <ProjectIcon project={project} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f1ede4] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-700)]">
              {getProjectStatusLabel(project.status)}
            </span>
            {project.isMember ? (
              <span className="rounded-full border border-[#e8e8e4] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-600)]">
                {project.myRoleLabel}
              </span>
            ) : null}
          </div>
          <h2 className="m-0 line-clamp-2 text-[19px] font-semibold leading-tight text-[var(--kb-ink-900)]">
            {project.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--kb-ink-500)]">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {project.lead?.displayName ?? "리드 없음"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project.memberCount}명
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 min-h-[44px] text-[14px] leading-[22px] text-[var(--kb-ink-500)]">
        {project.summary ?? project.description ?? "프로젝트 소개가 아직 없습니다."}
      </p>

      <div className="mt-auto border-t border-[#f1ede4] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold uppercase text-[var(--kb-ink-400)]">
              Study posts
            </div>
            <div className="mt-1 truncate text-[14px] font-semibold text-[var(--kb-ink-900)]">
              {recordCount}글
              {latestRecord ? ` · 최근 ${formatDate(latestRecord.createdAt)}` : ""}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--kb-ink-300)] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0a0a0a]" />
        </div>
        {latestRecord ? (
          <div className="mt-2 line-clamp-1 text-[13px] text-[var(--kb-ink-500)]">
            {latestRecord.title}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function StudyLog() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keywordValue = keyword.trim().toLocaleLowerCase("ko-KR");
  const joinedProjects = useMemo(
    () => projects.filter((project) => project.isMember),
    [projects],
  );
  const recordsByProject = useMemo(() => {
    const map = new Map<string, StudyRecord[]>();

    for (const record of records) {
      if (!record.projectTeamId) continue;
      const current = map.get(record.projectTeamId) ?? [];
      current.push(record);
      map.set(record.projectTeamId, current);
    }

    return map;
  }, [records]);

  const visibleProjects = useMemo(
    () =>
      joinedProjects.filter((project) => {
        if (projectMatches(project, keywordValue)) return true;
        return (recordsByProject.get(project.id) ?? []).some((record) =>
          recordMatches(record, keywordValue),
        );
      }),
    [keywordValue, joinedProjects, recordsByProject],
  );

  async function refresh() {
    if (!user) {
      setProjects([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [projectRows, recordRows] = await Promise.all([
        listProjects(user.id),
        listStudyRecords(),
      ]);
      setProjects(projectRows);
      setRecords(recordRows);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "스터디 기록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              Study boards
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              스터디 기록
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
          <div className="flex flex-col gap-3 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="프로젝트, 리드, 스터디 글 검색"
                className="w-full rounded-md border border-[#e8e8e4] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none"
              />
            </div>
          </div>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-[14px] font-semibold text-red-700 sm:px-7">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-[15px] text-[var(--kb-ink-500)]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              스터디 기록을 불러오는 중입니다.
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="px-5 py-16 text-center text-[15px] text-[var(--kb-ink-500)]">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
              표시할 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3 sm:px-7">
              {visibleProjects.map((project) => {
                const projectRecords = recordsByProject.get(project.id) ?? [];
                return (
                  <ProjectStudyCard
                    key={project.id}
                    project={project}
                    recordCount={projectRecords.length}
                    latestRecord={projectRecords[0] ?? null}
                  />
                );
              })}
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
