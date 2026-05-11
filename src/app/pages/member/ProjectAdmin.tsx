import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  Check,
  Crown,
  FolderKanban,
  Github,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  XCircle,
} from "lucide-react";
import { ConfirmActionDialog } from "../../components/ConfirmActionDialog";
import {
  deleteProject,
  listProjectLeadCandidates,
  listProjects,
  purgeDeletedProject,
  restoreDeletedProject,
  restoreRejectedProject,
  reviewProjectTeam,
  setProjectLead,
  setProjectRecruitment,
  setProjectRunStatus,
  type ProjectLeadCandidate,
  type ProjectStatus,
  type ProjectSummary,
} from "../../api/projects";
import { getProjectDetailPath, getProjectStatusLabel } from "../../api/project-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

type AdminView = "queue" | "running" | "rejected" | "archived" | "trash" | "all";
type ConfirmAction = "trash" | "restoreTrash" | "purge";

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

const STATUS_STYLE: Record<ProjectStatus, { bg: string; fg: string; border: string }> = {
  recruiting: { bg: "#eef5ff", fg: "#173b79", border: "#c9defd" },
  active: { bg: "#e9f7f0", fg: "#16603b", border: "#c8ebd8" },
  pending: { bg: "#fff7df", fg: "#805800", border: "#f6dfa4" },
  rejected: { bg: "#fff1f1", fg: "#9d1c1c", border: "#f4caca" },
  archived: { bg: "#f0f0ee", fg: "#57534e", border: "#dedbd4" },
};

const VIEW_LABELS: Record<AdminView, string> = {
  queue: "검토 대기",
  running: "운영 중",
  rejected: "반려",
  archived: "완료",
  trash: "휴지통",
  all: "전체",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "시간 없음";
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

  return [
    project.name,
    project.slug,
    project.summary,
    project.description,
    project.lead?.displayName,
    project.githubLink?.repoFullName,
  ]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

function projectBucket(project: ProjectSummary): AdminView {
  if (project.isDeleted) return "trash";
  if (project.status === "pending") return "queue";
  if (project.status === "active" || project.status === "recruiting") return "running";
  if (project.status === "rejected") return "rejected";
  if (project.status === "archived") return "archived";
  return "all";
}

function countByView(projects: ProjectSummary[]) {
  return {
    queue: projects.filter((project) => projectBucket(project) === "queue").length,
    running: projects.filter((project) => projectBucket(project) === "running").length,
    rejected: projects.filter((project) => projectBucket(project) === "rejected").length,
    archived: projects.filter((project) => projectBucket(project) === "archived").length,
    trash: projects.filter((project) => projectBucket(project) === "trash").length,
    all: projects.length,
  } satisfies Record<AdminView, number>;
}

function statusPill(project: ProjectSummary) {
  if (project.isDeleted) {
    return {
      label: "휴지통",
      bg: "#fef2f2",
      fg: "#991b1b",
      border: "#fecaca",
    };
  }

  const style = STATUS_STYLE[project.status];
  return { label: getProjectStatusLabel(project.status), ...style };
}

export default function ProjectAdmin() {
  const { user, authData } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeView, setActiveView] = useState<AdminView>("queue");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: ConfirmAction;
    project: ProjectSummary;
  } | null>(null);
  const [leadEditorId, setLeadEditorId] = useState<string | null>(null);
  const [leadLoadingId, setLeadLoadingId] = useState<string | null>(null);
  const [leadCandidatesByProject, setLeadCandidatesByProject] = useState<Record<string, ProjectLeadCandidate[]>>({});
  const [selectedLeadByProject, setSelectedLeadByProject] = useState<Record<string, string>>({});

  const isPresident =
    authData.account.isBootstrapAdmin ||
    authData.orgPositions.some((position) => position.slug === "president");
  const counts = useMemo(() => countByView(projects), [projects]);
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");
  const visibleProjects = useMemo(() => {
    return projects
      .filter((project) => activeView === "all" || projectBucket(project) === activeView)
      .filter((project) => matches(project, normalizedKeyword));
  }, [activeView, normalizedKeyword, projects]);

  async function refresh() {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setProjects(await listProjects(user.id, { includeDeleted: true }));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  function canDelete(project: ProjectSummary) {
    if (!user) return false;
    return isPresident || project.myRole === "lead" || project.lead?.id === user.id;
  }

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
      const updated = await setProjectRecruitment(project.id, nextStatus, project.recruitmentNote, user.id);
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

  async function restoreRejected(project: ProjectSummary) {
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

  async function performConfirmedAction() {
    if (!confirmAction) return;
    const { type, project } = confirmAction;

    try {
      setWorkingId(project.id);
      setError(null);

      if (type === "trash") {
        await deleteProject(project.id);
      } else if (type === "restoreTrash") {
        await restoreDeletedProject(project.id);
      } else {
        await purgeDeletedProject(project.id);
      }

      setConfirmAction(null);
      await refresh();
    } catch (requestError) {
      const fallback =
        type === "trash"
          ? "프로젝트를 휴지통으로 이동하지 못했습니다."
          : type === "restoreTrash"
            ? "프로젝트를 복구하지 못했습니다."
            : "프로젝트를 완전삭제하지 못했습니다.";
      setError(sanitizeUserError(requestError, fallback));
    } finally {
      setWorkingId(null);
    }
  }

  async function openLeadEditor(project: ProjectSummary) {
    if (project.isDeleted) return;

    if (leadEditorId === project.id) {
      setLeadEditorId(null);
      return;
    }

    setLeadEditorId(project.id);
    setSelectedLeadByProject((current) => ({
      ...current,
      [project.id]: project.lead?.id ?? current[project.id] ?? "",
    }));

    if (leadCandidatesByProject[project.id]) return;

    try {
      setLeadLoadingId(project.id);
      setError(null);
      const candidates = await listProjectLeadCandidates(project.id);
      setLeadCandidatesByProject((current) => ({ ...current, [project.id]: candidates }));
      setSelectedLeadByProject((current) => ({
        ...current,
        [project.id]: candidates.some((candidate) => candidate.userId === current[project.id])
          ? current[project.id]
          : project.lead?.id && candidates.some((candidate) => candidate.userId === project.lead?.id)
            ? project.lead.id
            : candidates[0]?.userId || "",
      }));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 리드 후보를 불러오지 못했습니다."));
    } finally {
      setLeadLoadingId(null);
    }
  }

  async function saveLead(project: ProjectSummary) {
    if (!user) return;
    const nextLeadUserId = selectedLeadByProject[project.id];

    if (!nextLeadUserId) {
      setError("새 프로젝트 리드를 선택해 주세요.");
      return;
    }

    try {
      setWorkingId(project.id);
      setError(null);
      const updated = await setProjectLead(project.id, nextLeadUserId, user.id);
      const candidates = await listProjectLeadCandidates(project.id);
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, ...updated } : item)),
      );
      setLeadCandidatesByProject((current) => ({ ...current, [project.id]: candidates }));
      setLeadEditorId(null);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 리드를 변경하지 못했습니다."));
    } finally {
      setWorkingId(null);
    }
  }

  function renderLeadEditor(project: ProjectSummary) {
    const isLeadEditing = leadEditorId === project.id;
    if (!isLeadEditing) return null;

    const leadCandidates = leadCandidatesByProject[project.id] ?? [];
    const selectedLeadId = selectedLeadByProject[project.id] ?? project.lead?.id ?? "";

    return (
      <div className="mt-4 rounded-md border border-[#e8e8e4] bg-[#fbfbf8] px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
            <Crown className="h-4 w-4 text-[#9a6a00]" />
            프로젝트 리드 지정
          </div>
          <span className="text-[12.5px] text-[var(--kb-ink-500)]">활성 부원 중에서 선택</span>
        </div>

        {leadLoadingId === project.id ? (
          <div className="flex items-center gap-2 text-[13px] text-[var(--kb-ink-500)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            후보를 불러오는 중입니다.
          </div>
        ) : leadCandidates.length === 0 ? (
          <div className="text-[13px] leading-5 text-red-700">
            활성 부원이 없어 리드를 지정할 수 없습니다.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedLeadId}
              onChange={(event) =>
                setSelectedLeadByProject((current) => ({
                  ...current,
                  [project.id]: event.target.value,
                }))
              }
              className="min-w-[220px] rounded-md border border-[#e8e8e4] bg-white px-3 py-2 text-[14px] outline-none"
            >
              {leadCandidates.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName} · {member.roleLabel}
                  {member.isProjectMember ? "" : " · 프로젝트에 추가됨"}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={workingId !== null || !selectedLeadId}
              onClick={() => void saveLead(project)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workingId === project.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              저장
            </button>
            <button
              type="button"
              disabled={workingId !== null}
              onClick={() => setLeadEditorId(null)}
              className="rounded-md border border-[#e8e8e4] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-700)]"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderProject(project: ProjectSummary) {
    const pill = statusPill(project);
    const isRejecting = rejectingId === project.id;
    const canDeleteProject = canDelete(project);
    const isWorking = workingId === project.id;

    return (
      <article key={project.id} className="border-t border-[#f1ede4] px-5 py-4 first:border-t-0 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {project.isDeleted ? (
                <span className="truncate text-[16px] font-semibold text-[var(--kb-ink-900)]">
                  {project.name}
                </span>
              ) : (
                <Link
                  to={getProjectDetailPath(project.slug)}
                  className="truncate text-[16px] font-semibold text-[var(--kb-ink-900)] no-underline hover:underline"
                >
                  {project.name}
                </Link>
              )}
              <span
                className="rounded-full border px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: pill.bg, color: pill.fg, borderColor: pill.border }}
              >
                {pill.label}
              </span>
              {project.isRecruiting && !project.isDeleted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#bfd7ff] bg-[#f0f6ff] px-2.5 py-1 text-[12px] font-semibold text-[#183b80]">
                  <Sparkles className="h-3 w-3" />
                  모집중
                </span>
              ) : null}
              {project.githubLink && !project.isDeleted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#d8eadf] bg-[#f4fbf6] px-2.5 py-1 text-[12px] font-semibold text-[#146136]">
                  <Github className="h-3 w-3" />
                  {project.githubLink.permissionState === "read_only" ? "GitHub 읽기 전용" : "GitHub 연결"}
                </span>
              ) : !project.githubLink && !project.isDeleted && (project.status === "active" || project.status === "recruiting") ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[12px] font-semibold text-[#92400e]">
                  <Github className="h-3 w-3" />
                  GitHub 대기
                </span>
              ) : null}
            </div>

            <p className="m-0 line-clamp-2 text-[14px] leading-6 text-[var(--kb-ink-500)]">
              {project.summary ?? project.description ?? "프로젝트 설명이 없습니다."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--kb-ink-400)]">
              <span>{project.slug}</span>
              <span>생성 {formatDate(project.createdAt)}</span>
              {project.deletedAt ? <span>삭제 {formatDate(project.deletedAt)}</span> : null}
              {project.lead ? (
                <span>리드 {project.lead.displayName}</span>
              ) : (
                <span className="font-semibold text-red-700">리드 없음</span>
              )}
              <span>{project.visibility === "public" ? "공개" : "비공개"}</span>
              {project.reviewRequestedAt ? <span>재심사 {formatDate(project.reviewRequestedAt)}</span> : null}
              {project.lastRestoredAt ? <span>복구 {formatDate(project.lastRestoredAt)}</span> : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {!project.isDeleted ? (
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void openLeadEditor(project)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#ebe8e0] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserCog className="h-3.5 w-3.5" />
                리드
              </button>
            ) : null}

            {project.isDeleted ? (
              <>
                <button
                  type="button"
                  disabled={workingId !== null || !canDeleteProject}
                  onClick={() => setConfirmAction({ type: "restoreTrash", project })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#d7e8dc] bg-white px-3 py-2 text-[13px] font-semibold text-[#146136] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  복구
                </button>
                <button
                  type="button"
                  disabled={workingId !== null || !canDeleteProject}
                  onClick={() => setConfirmAction({ type: "purge", project })}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-[13px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  완전삭제
                </button>
              </>
            ) : project.status === "pending" ? (
              <>
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
                  {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  승인
                </button>
              </>
            ) : project.status === "recruiting" ? (
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void startProject(project)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                진행 시작
              </button>
            ) : project.status === "active" ? (
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void toggleRecruitment(project)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#ebe8e0] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {project.recruitmentStatus === "open" ? "모집 마감" : "모집 시작"}
              </button>
            ) : project.status === "rejected" ? (
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => void restoreRejected(project)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#ebe8e0] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                검토로 복구
              </button>
            ) : null}

            {!project.isDeleted && canDeleteProject ? (
              <button
                type="button"
                disabled={workingId !== null}
                onClick={() => setConfirmAction({ type: "trash", project })}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-[13px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                휴지통
              </button>
            ) : null}
          </div>
        </div>

        {renderLeadEditor(project)}

        {project.status === "rejected" && project.lastReviewReason && !project.isDeleted ? (
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
                {isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                반려 확정
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  const confirmTitle =
    confirmAction?.type === "trash"
      ? "프로젝트를 휴지통으로 이동"
      : confirmAction?.type === "restoreTrash"
        ? "프로젝트 복구"
        : "프로젝트 완전삭제";
  const confirmDescription =
    confirmAction?.type === "trash"
      ? `${confirmAction.project.name} 프로젝트가 목록에서 숨겨지고 GitHub 저장소 권한은 읽기 전용으로 전환됩니다.`
      : confirmAction?.type === "restoreTrash"
        ? `${confirmAction.project.name} 프로젝트를 기존 상태로 복구합니다.`
        : `${confirmAction?.project.name ?? "프로젝트"} 데이터를 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.`;

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-1">
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
              프로젝트 운영 큐
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPresident ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#ead8a6] bg-[#fff8e1] px-3 py-2 text-[13px] font-semibold text-[#805800]">
                <ShieldCheck className="h-3.5 w-3.5" />
                회장 권한
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
        </header>

        <section style={{ ...PANEL_STYLE, padding: 14 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(VIEW_LABELS) as AdminView[]).map((view) => {
                const selected = activeView === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-semibold ${
                      selected
                        ? "bg-[#0a0a0a] text-white"
                        : "border border-[#ebe8e0] bg-white text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
                    }`}
                  >
                    {VIEW_LABELS[view]}
                    <span className={selected ? "text-white/70" : "text-[var(--kb-ink-400)]"}>
                      {counts[view]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="프로젝트 이름, slug, 리드, 저장소 검색"
                className="h-10 w-full rounded-md border border-[#e8e8e4] bg-white py-2 pl-9 pr-3 text-[14px] outline-none"
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
          <div className="flex items-center justify-between border-b border-[#f1ede4] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[var(--kb-navy-800)]" />
              <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">
                {VIEW_LABELS[activeView]}
              </h2>
            </div>
            <span className="text-[13px] text-[var(--kb-ink-500)]">{visibleProjects.length}건</span>
          </div>

          {loading ? (
            <div className="px-5 py-14 text-center text-[15px] text-[var(--kb-ink-500)]">
              <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin" />
              프로젝트를 불러오는 중입니다.
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="px-5 py-14 text-center text-[14px] text-[var(--kb-ink-500)]">
              표시할 프로젝트가 없습니다.
            </div>
          ) : (
            <div>{visibleProjects.map(renderProject)}</div>
          )}
        </section>

        <div className="flex items-center gap-2 rounded-md bg-[#f8f9fc] px-4 py-3 text-[14px] text-[var(--kb-ink-500)]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--kb-navy-800)]" />
          휴지통 이동과 복구는 프로젝트 리드 본인 또는 회장만 가능하며, 완전삭제는 휴지통 안에서만 실행됩니다.
        </div>
      </div>

      <ConfirmActionDialog
        open={confirmAction !== null}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={
          confirmAction?.type === "trash"
            ? "휴지통으로 이동"
            : confirmAction?.type === "restoreTrash"
              ? "복구"
              : "완전삭제"
        }
        destructive={confirmAction?.type !== "restoreTrash"}
        busy={Boolean(confirmAction && workingId === confirmAction.project.id)}
        onOpenChange={(open) => {
          if (!open && workingId === null) setConfirmAction(null);
        }}
        onConfirm={performConfirmedAction}
      />
    </div>
  );
}
