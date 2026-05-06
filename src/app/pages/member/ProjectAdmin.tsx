import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  Check,
  ClipboardList,
  FolderKanban,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  listProjects,
  reviewProjectTeam,
  restoreRejectedProject,
  setProjectRecruitment,
  setProjectRunStatus,
  type ProjectStatus,
  type ProjectSummary,
} from "../../api/projects";
import { getProjectDetailPath, getProjectStatusLabel } from "../../api/project-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const STATUS_STYLE: Record<ProjectStatus, { bg: string; fg: string }> = {
  recruiting: { bg: "#f0f6ff", fg: "#183b80" },
  active: { bg: "#e7efff", fg: "#183b80" },
  pending: { bg: "#fff3d8", fg: "#855600" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
  archived: { bg: "#eeeeec", fg: "#55514c" },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 없음";

  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matches(project: ProjectSummary, keyword: string) {
  if (!keyword) return true;

  return [project.name, project.slug, project.summary, project.description, project.lead?.displayName]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

export default function ProjectAdmin() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
  const visibleProjects = useMemo(
    () => projects.filter((project) => matches(project, normalizedKeyword)),
    [normalizedKeyword, projects],
  );
  const pendingProjects = visibleProjects.filter((project) => project.status === "pending");
  const recruitingProjects = visibleProjects.filter((project) => project.status === "recruiting");
  const activeProjects = visibleProjects.filter((project) => project.status === "active");
  const rejectedProjects = visibleProjects.filter((project) => project.status === "rejected");
  const archivedProjects = visibleProjects.filter((project) => project.status === "archived");

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
      setError(sanitizeUserError(requestError, "프로젝트 생성 요청을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  async function review(project: ProjectSummary, decision: "approve" | "reject") {
    if (!user) return;
    const reason = decision === "reject" ? rejectReason.trim() : null;
    if (decision === "reject" && !reason) {
      setError("반려 사유를 입력해 주세요.");
      return;
    }

    try {
      setWorkingId(project.id);
      setError(null);
      const updated = await reviewProjectTeam(project.id, decision, reason, user.id);
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, ...updated } : item)),
      );
      setRejectingId(null);
      setRejectReason("");
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 검토를 처리하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleRecruitment(project: ProjectSummary) {
    if (!user) return;
    const nextStatus = project.recruitmentStatus === "open" ? "closed" : "open";

    try {
      setWorkingId(project.id);
      setError(null);
      const updated = await setProjectRecruitment(
        project.id,
        nextStatus,
        project.recruitmentNote,
        user.id,
      );
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, ...updated } : item)),
      );
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 모집 상태를 변경하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  async function startProject(project: ProjectSummary) {
    if (!user) return;

    try {
      setWorkingId(project.id);
      setError(null);
      const updated = await setProjectRunStatus(project.id, "active", user.id);
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, ...updated } : item)),
      );
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 진행 상태를 변경하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  async function restore(project: ProjectSummary) {
    if (!user) return;

    try {
      setWorkingId(project.id);
      setError(null);
      const updated = await restoreRejectedProject(project.id, "관리자 복구", user.id);
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, ...updated } : item)),
      );
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "반려 프로젝트를 복구하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  function renderProject(project: ProjectSummary) {
    const statusStyle = STATUS_STYLE[project.status];
    const isRejecting = rejectingId === project.id;

    return (
      <article key={project.id} className="border-t border-[#f1ede4] px-5 py-4 first:border-t-0 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Link
                to={getProjectDetailPath(project.slug)}
                className="truncate text-[16px] font-semibold text-[var(--kb-ink-900)] no-underline hover:underline"
              >
                {project.name}
              </Link>
              <span
                className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: statusStyle.bg, color: statusStyle.fg }}
              >
                {getProjectStatusLabel(project.status)}
              </span>
              {project.isRecruiting && project.status !== "recruiting" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#bfd7ff] bg-[#f0f6ff] px-2.5 py-1 text-[12px] font-semibold text-[#183b80]">
                  <Sparkles className="h-3 w-3" />
                  모집중
                </span>
              ) : null}
              {project.status === "pending" && project.reviewRequestedAt ? (
                <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[12px] font-semibold text-[#92400e]">
                  재심사 요청
                </span>
              ) : null}
              {project.status === "pending" && project.lastRestoredAt ? (
                <span className="rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-2.5 py-1 text-[12px] font-semibold text-[#3730a3]">
                  복구됨
                </span>
              ) : null}
            </div>
            <p className="m-0 line-clamp-2 text-[14px] leading-6 text-[var(--kb-ink-500)]">
              {project.summary ?? project.description ?? "프로젝트 설명이 없습니다."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--kb-ink-400)]">
              <span>{project.slug}</span>
              <span>생성 {formatDate(project.createdAt)}</span>
              {project.lead ? <span>리드 {project.lead.displayName}</span> : null}
              <span>{project.visibility === "public" ? "공개" : "비공개"}</span>
              {project.reviewRequestedAt ? <span>재심사 {formatDate(project.reviewRequestedAt)}</span> : null}
              {project.lastRestoredAt ? <span>복구 {formatDate(project.lastRestoredAt)}</span> : null}
            </div>
          </div>

          {project.status === "pending" ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => {
                  setRejectingId(project.id);
                  setRejectReason("");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#f3d4d4] bg-white px-3 py-2 text-[13px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-3.5 w-3.5" />
                반려
              </button>
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void review(project, "approve")}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === project.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                승인
              </button>
            </div>
          ) : project.status === "recruiting" ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void startProject(project)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === project.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                진행 시작
              </button>
            </div>
          ) : project.status === "active" ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void toggleRecruitment(project)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#ebe8e0] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === project.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {project.recruitmentStatus === "open" ? "모집 마감" : "모집 시작"}
              </button>
            </div>
          ) : project.status === "rejected" ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void restore(project)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#ebe8e0] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === project.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                복구하기
              </button>
            </div>
          ) : null}
        </div>

        {project.status === "rejected" && project.lastReviewReason ? (
          <div className="mt-3 rounded-md border border-[#f1d6d6] bg-[#fffafa] px-3 py-2 text-[13px] leading-5 text-red-800">
            <span className="font-semibold">반려 사유</span>
            <span className="ml-2 whitespace-pre-wrap">{project.lastReviewReason}</span>
          </div>
        ) : null}

        {isRejecting ? (
          <div className="mt-4 grid gap-2 rounded-md border border-[#f1ede4] bg-[#fbfbf8] p-3">
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              placeholder="반려 사유"
              className="w-full rounded-md border border-[#e8e8e4] bg-white p-3 text-[14px] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => setRejectingId(null)}
                className="rounded-md border border-[#e8e8e4] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-700)]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={workingId !== null || !rejectReason.trim()}
                onClick={() => void review(project, "reject")}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === project.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                반려 확정
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  function renderSection(title: string, items: ProjectSummary[]) {
    return (
      <section style={{ ...CARD_STYLE, overflow: "hidden" }}>
        <div className="flex items-center justify-between border-b border-[#f1ede4] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[var(--kb-navy-800)]" />
            <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">{title}</h2>
          </div>
          <span className="text-[13px] text-[var(--kb-ink-500)]">{items.length}건</span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-[14px] text-[var(--kb-ink-500)]">
            표시할 프로젝트가 없습니다.
          </div>
        ) : (
          <div>{items.map(renderProject)}</div>
        )}
      </section>
    );
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              Admin · Projects
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              프로젝트 생성 관리
              <span className="ml-3 text-[17px] font-normal text-[var(--kb-ink-500)]">
                대기 {pendingProjects.length}건
              </span>
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

        <section style={{ ...CARD_STYLE, padding: 16 }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="프로젝트 이름, slug, 리드 검색"
              className="w-full rounded-md border border-[#e8e8e4] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none"
            />
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <section style={{ ...CARD_STYLE, padding: 48 }} className="text-center text-[15px] text-[var(--kb-ink-500)]">
            <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin" />
            프로젝트 생성 요청을 불러오는 중입니다.
          </section>
        ) : (
          <>
            {renderSection("검토 대기", pendingProjects)}
            {renderSection("모집중", recruitingProjects)}
            {renderSection("진행중", activeProjects)}
            {renderSection("반려", rejectedProjects)}
            {archivedProjects.length > 0 ? renderSection("종료", archivedProjects) : null}
          </>
        )}

        <div className="flex items-center gap-2 rounded-md bg-[#f8f9fc] px-4 py-3 text-[14px] text-[var(--kb-ink-500)]">
          <ClipboardList className="h-4 w-4 shrink-0 text-[var(--kb-navy-800)]" />
          이 페이지는 프로젝트 생성 요청을 여러 건 모아서 검토하는 운영 화면입니다.
        </div>
      </div>
    </div>
  );
}
