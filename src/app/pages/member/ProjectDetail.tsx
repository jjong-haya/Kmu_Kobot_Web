import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Flag,
  FolderKanban,
  Github,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  UserPlus,
  Users,
} from "lucide-react";
import {
  deleteProject,
  getProjectBySlug,
  getCurrentUserGithubReadiness,
  requestProjectJoin,
  type ProjectDetail as ProjectDetailData,
  type GithubIdentityStatus,
  type ProjectMember,
} from "../../api/projects";
import { getProjectRoleLabel, getProjectStatusLabel } from "../../api/project-policy.js";
import {
  createProjectTask,
  listProjectTasks,
  updateProjectTaskAssignee,
  updateProjectTaskStatus,
  type ProjectTask,
  type ProjectTaskPriority,
  type ProjectTaskStatus,
} from "../../api/project-tasks";
import { useAuth } from "../../auth/useAuth";
import { ProjectFormModal } from "../../components/member/ProjectFormModal";
import { sanitizeUserError } from "../../utils/sanitize-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { safeImageUrl } from "../../utils/safe-image-url";

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

const TASK_COLUMNS: Array<{
  key: ProjectTaskStatus;
  title: string;
  tone: string;
}> = [
  { key: "todo", title: "할 일", tone: "#6b7280" },
  { key: "in_progress", title: "진행 중", tone: "#2563eb" },
  { key: "review", title: "검토", tone: "#d97706" },
  { key: "done", title: "완료", tone: "#15803d" },
];

const PRIORITY_META: Record<
  ProjectTaskPriority,
  { label: string; barColor: string }
> = {
  low: {
    label: "낮음",
    barColor: "#22c55e",
  },
  medium: {
    label: "보통",
    barColor: "#eab308",
  },
  high: {
    label: "높음",
    barColor: "#ef4444",
  },
};

function projectListPath() {
  return "/member/projects";
}

function githubProfilePath(nextPath: string) {
  return `/member/profile?focus=github&next=${encodeURIComponent(nextPath)}`;
}

function studyBoardPath(slug: string) {
  return `/member/study-log/${encodeURIComponent(slug)}`;
}

function canRequestJoin(project: ProjectDetailData | null) {
  return Boolean(
    project &&
      !project.isMember &&
      project.visibility === "public" &&
      project.recruitmentStatus === "open" &&
      (project.status === "active" || project.status === "recruiting"),
  );
}

function initialsFor(name: string) {
  const normalized = name.trim();
  if (!normalized) return "KB";
  return normalized.slice(0, 2).toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectDeleteControl({
  project,
  onError,
  className,
}: {
  project: ProjectDetailData;
  onError: (message: string | null) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const confirmed = deleteConfirmText.trim() === project.name;

  async function handleDeleteProject(event: FormEvent) {
    event.preventDefault();

    if (deleteConfirmText.trim() !== project.name) {
      onError("삭제하려면 프로젝트 이름을 입력해 주세요.");
      return;
    }

    try {
      setDeleting(true);
      onError(null);
      await deleteProject(project.id);
      setOpen(false);
      navigate(projectListPath(), { replace: true });
    } catch (requestError) {
      onError(sanitizeUserError(requestError, "프로젝트를 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  function closeDialog() {
    if (deleting) return;
    setOpen(false);
    setDeleteConfirmText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onError(null);
          setOpen(true);
        }}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-red-700 hover:border-red-300 hover:bg-red-50"
        }
      >
        <Trash2 className="h-4 w-4" />
        휴지통으로 이동
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
          } else {
            closeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>프로젝트를 휴지통으로 이동</DialogTitle>
          </DialogHeader>

          <form id="project-delete-form" onSubmit={handleDeleteProject} className="grid gap-4">
            <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[13.5px] leading-6 text-red-700">
              프로젝트 목록과 상세 화면에서 숨겨집니다. 휴지통에서 복구할 수 있으며, 완전삭제 전까지 연결된 기록은 보존됩니다.
            </div>

            <label className="grid gap-2">
              <span className="text-[13px] font-semibold text-[var(--kb-ink-700)]">
                삭제하려면 프로젝트 이름을 입력해 주세요.
              </span>
              <span className="rounded-md bg-[#f6f5ef] px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-800)]">
                {project.name}
              </span>
              <input
                autoFocus
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                disabled={deleting}
                className="h-10 rounded-md border border-[#e8e8e4] bg-white px-3 text-[14px] outline-none focus:border-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </form>

          <DialogFooter>
            <button
              type="button"
              disabled={deleting}
              onClick={closeDialog}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#e8e8e4] bg-white px-4 text-[14px] font-semibold text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              form="project-delete-form"
              disabled={deleting || !confirmed}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-[14px] font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              휴지통으로 이동
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function previousStatus(status: ProjectTaskStatus): ProjectTaskStatus | null {
  const index = TASK_COLUMNS.findIndex((column) => column.key === status);
  return index > 0 ? TASK_COLUMNS[index - 1].key : null;
}

function nextStatus(status: ProjectTaskStatus): ProjectTaskStatus | null {
  const index = TASK_COLUMNS.findIndex((column) => column.key === status);
  return index >= 0 && index < TASK_COLUMNS.length - 1 ? TASK_COLUMNS[index + 1].key : null;
}

function MemberAvatar({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[11px] font-semibold text-white">
        {initialsFor(member.displayName)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-[var(--kb-ink-900)]">
          {member.displayName}
        </div>
        <div className="truncate text-[12px] text-[var(--kb-ink-400)]">
          {member.roleLabel}
        </div>
      </div>
    </div>
  );
}

function AssigneeAvatar({
  member,
  size = 32,
}: {
  member: ProjectMember | null;
  size?: number;
}) {
  const image = safeImageUrl(member?.avatarUrl ?? null);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e1dfd6] bg-[#f6f5ef] text-[10px] font-extrabold text-[var(--kb-ink-600)]"
      style={{ width: size, height: size }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : member ? (
        initialsFor(member.displayName)
      ) : (
        <UserRound className="h-[55%] w-[55%] text-[var(--kb-ink-400)]" />
      )}
    </span>
  );
}

function AssigneePicker({
  task,
  members,
  assignee,
  onChange,
}: {
  task: ProjectTask;
  members: ProjectMember[];
  assignee: ProjectMember | null;
  onChange: (task: ProjectTask, assigneeUserId: string | null) => void;
}) {
  const tooltipLabel = assignee ? `담당자: ${assignee.displayName}` : "담당자 없음";

  return (
    <DropdownMenu>
      <div className="group/assignee relative inline-flex">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={tooltipLabel}
            title={tooltipLabel}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-[#111111]/20"
          >
            <AssigneeAvatar member={assignee} size={32} />
          </button>
        </DropdownMenuTrigger>
        <span className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-30 max-w-[210px] translate-y-1 whitespace-nowrap rounded-md border border-[#dedbd1] bg-[#111111]/90 px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover/assignee:translate-y-0 group-hover/assignee:opacity-100">
          {tooltipLabel}
        </span>
      </div>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[160] w-60 border-[#e8e8e4] bg-white p-1"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[12px] text-[var(--kb-ink-500)]">
          담당자
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => onChange(task, null)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px]"
        >
          <AssigneeAvatar member={null} size={28} />
          <span className="font-medium text-[var(--kb-ink-700)]">담당자 없음</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {members.map((member) => (
          <DropdownMenuItem
            key={member.userId}
            onSelect={() => onChange(task, member.userId)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px]"
          >
            <AssigneeAvatar member={member} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-[var(--kb-ink-900)]">
                {member.displayName}
              </span>
              <span className="block truncate text-[11.5px] text-[var(--kb-ink-400)]">
                {member.roleLabel}
              </span>
            </span>
            {task.assigneeUserId === member.userId ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskCard({
  task,
  project,
  assignee,
  members,
  onMove,
  onAssigneeChange,
}: {
  task: ProjectTask;
  project: ProjectDetailData;
  assignee: ProjectMember | null;
  members: ProjectMember[];
  onMove: (task: ProjectTask, status: ProjectTaskStatus) => void;
  onAssigneeChange: (task: ProjectTask, assigneeUserId: string | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const priority = PRIORITY_META[task.priority];
  const prev = previousStatus(task.status);
  const next = nextStatus(task.status);

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="group relative overflow-hidden rounded-md border border-[#e8e8e4] bg-white p-3 pb-9 shadow-sm transition-shadow hover:shadow-md"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.72 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 30 : undefined,
      }}
    >
      {prev || next ? (
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
          {prev ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMove(task, prev);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e8e4]/80 bg-white/70 text-[var(--kb-ink-500)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] backdrop-blur-[2px] transition hover:bg-white hover:text-[var(--kb-ink-900)]"
              aria-label="이전 단계로 이동"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}

          {next ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMove(task, next);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e8e4]/80 bg-white/70 text-[var(--kb-ink-500)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] backdrop-blur-[2px] transition hover:bg-white hover:text-[var(--kb-ink-900)]"
              aria-label="다음 단계로 이동"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="kb-mono text-[14px] font-extrabold leading-5 text-[var(--kb-ink-500)]">
            {project.prefix}-{task.taskNumber}
          </div>
          <h3 className="m-0 mt-1 line-clamp-2 text-[14.5px] font-semibold leading-6 text-[var(--kb-ink-900)]">
            {task.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <AssigneePicker
            task={task}
            members={members}
            assignee={assignee}
            onChange={onAssigneeChange}
          />
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--kb-ink-400)] hover:bg-[#f1ede4] hover:text-[var(--kb-ink-900)]"
            aria-label={collapsed ? "작업 카드 펼치기" : "작업 카드 접기"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden transition-[max-height,opacity,margin] duration-200"
        style={{
          maxHeight: collapsed ? 0 : 170,
          opacity: collapsed ? 0 : 1,
          marginTop: collapsed ? 0 : 10,
        }}
      >
        {task.description ? (
          <p className="m-0 line-clamp-3 text-[12.5px] leading-5 text-[var(--kb-ink-500)]">
            {task.description}
          </p>
        ) : (
          <p className="m-0 text-[12.5px] leading-5 text-[var(--kb-ink-400)]">
            설명 없음
          </p>
        )}

        {task.dueAt ? (
          <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--kb-ink-500)]">
            <CalendarDays className="h-3 w-3" />
            {formatDate(task.dueAt)}
          </div>
        ) : null}
      </div>

      <div
        aria-label={`우선순위 ${priority.label}`}
        className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-md"
        style={{ background: priority.barColor }}
      />
    </article>
  );
}

function TaskColumn({
  column,
  children,
}: {
  column: (typeof TASK_COLUMNS)[number];
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.key });

  return (
    <section
      ref={setNodeRef}
      className="min-h-[430px] rounded-md border border-[#e8e8e4] bg-[#fbfbf8] transition-[border-color,background-color]"
      style={{
        borderColor: isOver ? column.tone : "#e8e8e4",
        background: isOver ? "#f4f7ff" : "#fbfbf8",
      }}
    >
      {children}
    </section>
  );
}

function ProjectWorkspace({
  project,
  userId,
  canEditProject,
  canDeleteProject,
  onUpdated,
}: {
  project: ProjectDetailData;
  userId: string;
  canEditProject: boolean;
  canDeleteProject: boolean;
  onUpdated: () => Promise<void>;
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ProjectTaskPriority>("medium");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const keywordValue = keyword.trim().toLocaleLowerCase("ko-KR");
  const membersById = useMemo(
    () => new Map(project.members.map((member) => [member.userId, member])),
    [project.members],
  );
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!keywordValue) return true;
        const assignee = task.assigneeUserId ? membersById.get(task.assigneeUserId) : null;
        return [task.title, task.description, `${project.prefix}-${task.taskNumber}`, assignee?.displayName]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keywordValue));
      }),
    [keywordValue, membersById, project.prefix, tasks],
  );
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  async function refreshTasks() {
    setLoading(true);
    setError(null);

    try {
      setTasks(await listProjectTasks(project.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 작업을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTasks();
  }, [project.id]);

  async function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("작업 제목을 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await createProjectTask({
        projectTeamId: project.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });
      setTasks((current) => [...current, created]);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTaskDialogOpen(false);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "작업을 만들지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  async function changeTaskAssignee(task: ProjectTask, assigneeUserId: string | null) {
    if (task.assigneeUserId === assigneeUserId) return;

    const previous = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, assigneeUserId } : item,
      ),
    );

    try {
      const updated = await updateProjectTaskAssignee(task.id, assigneeUserId);
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
    } catch (requestError) {
      setTasks(previous);
      setError(sanitizeUserError(requestError, "담당자를 바꾸지 못했습니다."));
    }
  }

  async function moveTask(task: ProjectTask, status: ProjectTaskStatus) {
    if (task.status === status) return;

    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );

    try {
      const updated = await updateProjectTaskStatus(task.id, status);
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
    } catch (requestError) {
      setTasks(previous);
      setError(sanitizeUserError(requestError, "작업 상태를 바꾸지 못했습니다."));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const status = event.over?.id as ProjectTaskStatus | undefined;
    const task = tasks.find((item) => item.id === event.active.id);
    if (task && status) void moveTask(task, status);
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#0a0a0a] text-[14px] font-bold text-white"
            style={{ fontFamily: "var(--kb-font-mono)", letterSpacing: "0.04em" }}
          >
            {project.prefix}
          </div>
          <div className="min-w-0">
            <div
              className="kb-mono mb-1 truncate text-[12.5px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              {project.slug}
            </div>
            <h1
              className="kb-display m-0 truncate text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--kb-ink-500)]">
              <span className="font-semibold text-[var(--kb-navy-800)]">
                {getProjectStatusLabel(project.status)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {project.memberCount}명
              </span>
              <span>{getProjectRoleLabel(project.myRole)}</span>
              <span>작업 {tasks.length}개</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditProject ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-800)] no-underline hover:border-[var(--kb-ink-300)]"
            >
              <Settings className="h-4 w-4" />
              프로젝트 설정
            </button>
          ) : null}
          {canDeleteProject ? (
            <ProjectDeleteControl project={project} onError={setError} />
          ) : null}
          <button
            type="button"
            onClick={() => setTaskDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#202020]"
          >
            <Plus className="h-4 w-4" />
            작업 만들기
          </button>
          <Link
            to={studyBoardPath(project.slug)}
            className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-800)] no-underline hover:border-[var(--kb-ink-300)]"
          >
            <Clock className="h-4 w-4" />
            스터디 기록
          </Link>
          <button
            type="button"
            onClick={() => void refreshTasks()}
            className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </header>

      <Dialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          if (!saving) setTaskDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>작업 만들기</DialogTitle>
          </DialogHeader>

          <form id="project-task-create-form" onSubmit={handleCreateTask} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-[13px] font-semibold text-[var(--kb-ink-700)]">
                작업 제목
              </span>
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: PID 제어 파라미터 튜닝"
                className="h-10 rounded-md border border-[#e8e8e4] bg-white px-3 text-[14px] outline-none focus:border-[#111111]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[13px] font-semibold text-[var(--kb-ink-700)]">
                설명
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="작업 범위, 참고 사항, 완료 기준을 적어 주세요."
                rows={5}
                className="min-h-[132px] resize-y rounded-md border border-[#e8e8e4] bg-white px-3 py-2.5 text-[14px] leading-6 outline-none focus:border-[#111111]"
              />
            </label>

            <label className="grid gap-2 sm:max-w-[220px]">
              <span className="text-[13px] font-semibold text-[var(--kb-ink-700)]">
                우선순위
              </span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as ProjectTaskPriority)}
                className="h-10 rounded-md border border-[#e8e8e4] bg-white px-3 text-[13px] outline-none"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </label>
          </form>

          <DialogFooter>
            <button
              type="button"
              disabled={saving}
              onClick={() => setTaskDialogOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#e8e8e4] bg-white px-4 text-[14px] font-semibold text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              form="project-task-create-form"
              disabled={saving || !title.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0a0a0a] px-4 text-[14px] font-semibold text-white hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              만들기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {settingsOpen ? (
        <ProjectFormModal
          mode="settings"
          userId={userId}
          project={project}
          onClose={() => setSettingsOpen(false)}
          onSaved={async () => {
            setSettingsOpen(false);
            setError(null);
            await onUpdated();
          }}
          onError={setError}
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section style={{ ...PANEL_STYLE, padding: 20 }}>
        <div>
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-semibold text-[var(--kb-ink-700)]">진행률</span>
            <span className="font-semibold text-[var(--kb-ink-900)]">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f1ede4]">
            <div
              className="h-full rounded-full bg-[var(--kb-navy-800)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-[12.5px] text-[var(--kb-ink-500)]">
            완료 {doneCount}개 / 전체 {tasks.length}개
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="작업 검색"
            className="w-full rounded-md border border-[#e8e8e4] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          작업공간을 불러오는 중입니다.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
          <DndContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4 lg:grid-cols-4">
            {TASK_COLUMNS.map((column) => {
              const columnTasks = visibleTasks.filter((task) => task.status === column.key);
              return (
                <TaskColumn key={column.key} column={column}>
                  <div className="flex items-center justify-between border-b border-[#f1ede4] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: column.tone }} />
                      <h2 className="m-0 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                        {column.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-[var(--kb-ink-500)]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="grid gap-3 p-3">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-md border border-dashed border-[#dedbd1] px-3 py-8 text-center text-[13px] text-[var(--kb-ink-400)]">
                        작업 없음
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          assignee={task.assigneeUserId ? membersById.get(task.assigneeUserId) ?? null : null}
                          members={project.members}
                          onMove={moveTask}
                          onAssigneeChange={changeTaskAssignee}
                        />
                      ))
                    )}
                  </div>
                </TaskColumn>
              );
            })}
          </div>
          </DndContext>

          <aside className="grid h-fit gap-4">
            <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
              <div className="flex items-center gap-2 border-b border-[#f1ede4] px-4 py-3">
                <Users className="h-4 w-4 text-[var(--kb-navy-800)]" />
                <h2 className="m-0 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                  멤버
                </h2>
              </div>
              <div className="grid gap-3 px-4 py-4">
                {project.members.map((member) => (
                  <MemberAvatar key={member.userId} member={member} />
                ))}
              </div>
            </section>

            <section style={{ ...PANEL_STYLE, padding: 16 }}>
              <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                <Flag className="h-4 w-4 text-[var(--kb-navy-800)]" />
                프로젝트 정보
              </div>
              <div className="grid gap-2 text-[13px] text-[var(--kb-ink-600)]">
                <div className="flex justify-between gap-3">
                  <span>상태</span>
                  <strong className="text-[var(--kb-ink-900)]">{getProjectStatusLabel(project.status)}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>리드</span>
                  <strong className="text-right text-[var(--kb-ink-900)]">
                    {project.lead?.displayName ?? "없음"}
                  </strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>공개</span>
                  <strong className="text-[var(--kb-ink-900)]">
                    {project.visibility === "public" ? "공개" : "비공개"}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

function ProjectOverview({
  project,
  onJoined,
  canDeleteProject = false,
}: {
  project: ProjectDetailData;
  onJoined: () => void;
  canDeleteProject?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<GithubIdentityStatus | null>(null);
  const joinable = canRequestJoin(project);
  const currentPath = `${location.pathname}${location.search}`;
  const githubChecking = joinable && githubStatus === null;
  const githubMissing = joinable && githubStatus?.hasGithubIdentity === false;

  useEffect(() => {
    let active = true;

    async function loadGithubStatus() {
      if (!user?.id || !joinable) {
        setGithubStatus(null);
        return;
      }

      try {
        const status = await getCurrentUserGithubReadiness(user.id);
        if (active) setGithubStatus(status);
      } catch {
        if (active) {
          setGithubStatus({
            githubUrl: null,
            githubLogin: null,
            connectionStatus: null,
            hasGithubIdentity: false,
          });
        }
      }
    }

    void loadGithubStatus();

    return () => {
      active = false;
    };
  }, [joinable, user?.id]);

  function goToGithubProfile() {
    setMessage("프로젝트 참여 신청 전에 프로필에 GitHub URL을 등록해야 합니다.");
    navigate(githubProfilePath(currentPath));
  }

  async function ensureGithubReady() {
    if (!user?.id) return false;

    let status = githubStatus;
    if (!status) {
      try {
        status = await getCurrentUserGithubReadiness(user.id);
        setGithubStatus(status);
      } catch {
        status = {
          githubUrl: null,
          githubLogin: null,
          connectionStatus: null,
          hasGithubIdentity: false,
        };
        setGithubStatus(status);
      }
    }

    if (!status.hasGithubIdentity) {
      goToGithubProfile();
      return false;
    }

    return true;
  }

  async function handleJoin() {
    setMessage(null);
    if (!(await ensureGithubReady())) return;

    try {
      setJoining(true);
      await requestProjectJoin(project.id, null);
      setMessage("참여 신청을 보냈습니다.");
      onJoined();
    } catch (requestError) {
      setMessage(sanitizeUserError(requestError, "참여 신청을 보내지 못했습니다."));
    } finally {
      setJoining(false);
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-md bg-[#0a0a0a] text-[14px] font-bold text-white"
            style={{ fontFamily: "var(--kb-font-mono)", letterSpacing: "0.04em" }}
          >
            {project.prefix}
          </div>
          <div>
            <div
              className="kb-mono mb-1 text-[12.5px] uppercase text-[var(--kb-ink-500)]"
              style={{ letterSpacing: "0.14em" }}
            >
              {project.slug}
            </div>
            <h1
              className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
              style={{ letterSpacing: 0 }}
            >
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--kb-ink-500)]">
              <span className="font-semibold text-[var(--kb-navy-800)]">
                {getProjectStatusLabel(project.status)}
              </span>
              <span>멤버 {project.memberCount}명</span>
              {project.isRecruiting ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#183b80]">
                  <Sparkles className="h-3.5 w-3.5" />
                  모집 중
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canDeleteProject ? (
            <ProjectDeleteControl project={project} onError={setMessage} />
          ) : null}
          {joinable ? (
            <button
              type="button"
              onClick={() => {
                if (githubMissing) {
                  goToGithubProfile();
                  return;
                }

                void handleJoin();
              }}
              disabled={joining || githubChecking}
              className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining || githubChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : githubMissing ? (
                <Github className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {githubChecking
                ? "GitHub 확인 중"
                : githubMissing
                  ? "프로필에서 GitHub URL 입력"
                  : "참여 신청"}
            </button>
          ) : null}
        </div>
      </header>

      {githubMissing ? (
        <div className="rounded-md border border-[#f4d7aa] bg-[#fff9ec] px-4 py-3 text-[13.5px] leading-6 text-[#7c4a03]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong className="font-semibold">GitHub URL 입력 전에는 참여 신청이 잠겨 있습니다.</strong>
              <span className="ml-1">
                프로필에 GitHub URL을 저장해야 신청을 보낼 수 있고, 승인 후 저장소 초대에 이 주소가 사용됩니다.
              </span>
              <Link
                to={githubProfilePath(currentPath)}
                className="ml-2 inline-flex font-semibold text-[#103078] no-underline hover:underline"
              >
                프로필에서 입력
              </Link>
            </div>
          </div>
        </div>
      ) : joinable && githubStatus?.hasGithubIdentity ? (
        <div className="rounded-md border border-[#d8eadf] bg-[#f4fbf6] px-4 py-3 text-[13.5px] font-semibold text-[#146136]">
          GitHub @{githubStatus.githubLogin} 계정으로 승인 후 저장소 초대가 진행됩니다.
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-[#e8e8e4] bg-[#fafaf6] px-4 py-3 text-[14px] font-semibold text-[var(--kb-ink-700)]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section style={{ ...PANEL_STYLE, padding: 24 }}>
          <div className="mb-3 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[var(--kb-navy-800)]" />
            <h2 className="m-0 text-[17px] font-semibold text-[var(--kb-ink-900)]">
              프로젝트 설명
            </h2>
          </div>
          <p className="m-0 whitespace-pre-wrap text-[15px] leading-7 text-[var(--kb-ink-700)]">
            {project.description ?? project.summary ?? "프로젝트 설명이 없습니다."}
          </p>
        </section>

        <aside className="grid h-fit gap-5">
          <section style={{ ...PANEL_STYLE, padding: 18 }}>
            <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
              <Circle className="h-4 w-4 text-[var(--kb-navy-800)]" />
              상태
            </div>
            <div className="grid gap-2 text-[13px] text-[var(--kb-ink-600)]">
              <div className="flex justify-between gap-3">
                <span>진행</span>
                <strong className="text-[var(--kb-ink-900)]">{getProjectStatusLabel(project.status)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>공개</span>
                <strong className="text-[var(--kb-ink-900)]">
                  {project.visibility === "public" ? "공개" : "비공개"}
                </strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>모집</span>
                <strong className="text-[var(--kb-ink-900)]">
                  {project.recruitmentStatus === "open" ? "모집 중" : "마감"}
                </strong>
              </div>
            </div>
          </section>

          {project.githubLink || project.status === "active" || project.status === "recruiting" ? (
            <section style={{ ...PANEL_STYLE, padding: 18 }}>
              <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                <Github className="h-4 w-4 text-[var(--kb-navy-800)]" />
                GitHub
              </div>
              {project.githubLink ? (
                <div className="grid gap-2 text-[13px] text-[var(--kb-ink-600)]">
                  <div className="flex justify-between gap-3">
                    <span>저장소</span>
                    {project.githubLink.htmlUrl ? (
                      <a
                        href={project.githubLink.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#103078] no-underline hover:underline"
                      >
                        {project.githubLink.repoName}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <strong className="text-[var(--kb-ink-900)]">{project.githubLink.repoName}</strong>
                    )}
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>권한</span>
                    <strong className="text-[var(--kb-ink-900)]">
                      {project.githubLink.permissionState === "read_only" ? "읽기 전용" : "프로젝트 권한"}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>동기화</span>
                    <strong className="text-[var(--kb-ink-900)]">
                      {project.githubLink.syncStatus === "synced"
                        ? "완료"
                        : project.githubLink.syncStatus === "read_only"
                          ? "읽기 전용"
                          : project.githubLink.syncStatus === "failed"
                            ? "확인 필요"
                            : "대기 중"}
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="m-0 text-[13px] leading-6 text-[var(--kb-ink-500)]">
                  프로젝트 승인 후 Kookmin-Kobot 조직에 private 저장소가 자동 생성됩니다.
                </p>
              )}
            </section>
          ) : null}

          <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
            <div className="flex items-center gap-2 border-b border-[#f1ede4] px-4 py-3">
              <Users className="h-4 w-4 text-[var(--kb-navy-800)]" />
              <h2 className="m-0 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                멤버
              </h2>
            </div>
            <div className="grid gap-3 px-4 py-4">
              {project.members.slice(0, 8).map((member) => (
                <MemberAvatar key={member.userId} member={member} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function RejectedProjectNotice({
  project,
  userId,
  onUpdated,
  canManageProject = false,
  canDeleteProject = false,
}: {
  project: ProjectDetailData;
  userId: string;
  onUpdated: () => Promise<void>;
  canManageProject?: boolean;
  canDeleteProject?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = canManageProject || project.isLead || project.owner?.id === userId;
  const reviewedAt = formatDateTime(project.lastReviewedAt);

  return (
    <>
      <section
        style={{ ...PANEL_STYLE, padding: 40 }}
        className="mx-auto flex w-full max-w-[920px] flex-col items-center text-center"
      >
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <div
          className="kb-mono mb-2 text-[12px] uppercase text-[var(--kb-ink-400)]"
          style={{ letterSpacing: "0.16em" }}
        >
          404 · PROJECT REJECTED
        </div>
        <h1 className="kb-display m-0 text-[30px] font-semibold text-[var(--kb-ink-900)]">
          프로젝트가 반려되었습니다.
        </h1>
        <p className="m-0 mt-3 max-w-[620px] text-[15px] leading-7 text-[var(--kb-ink-500)]">
          이 프로젝트는 아직 작업공간으로 열리지 않습니다. 반려 사유를 확인한 뒤 내용을 수정해서 재심사를 요청할 수 있습니다.
        </p>

        <div className="mt-7 w-full max-w-[720px] rounded-md border border-[#f1d6d6] bg-[#fffafa] p-5 text-left">
          <div className="mb-2 text-[13px] font-semibold text-red-700">반려 사유</div>
          <p className="m-0 whitespace-pre-wrap text-[15px] leading-7 text-[var(--kb-ink-800)]">
            {project.lastReviewReason ?? "반려 사유가 기록되지 않았습니다."}
          </p>
          {reviewedAt ? (
            <div className="mt-3 text-[12.5px] text-[var(--kb-ink-400)]">
              검토 시각 {reviewedAt}
            </div>
          ) : null}
        </div>

        {message ? (
          <div className="mt-4 rounded-md border border-[#e8e8e4] bg-[#fafaf6] px-4 py-3 text-[14px] font-semibold text-[var(--kb-ink-700)]">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#202020]"
            >
              <Pencil className="h-4 w-4" />
              수정하기
            </button>
          ) : null}
          {canDeleteProject ? (
            <ProjectDeleteControl project={project} onError={setMessage} />
          ) : null}
          <Link
            to={projectListPath()}
            className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-800)] no-underline hover:border-[var(--kb-ink-300)]"
          >
            프로젝트 목록
          </Link>
        </div>
      </section>

      {editOpen ? (
        <ProjectFormModal
          mode="edit"
          userId={userId}
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            setEditOpen(false);
            setMessage("재심사 요청을 보냈습니다.");
            await onUpdated();
          }}
          onError={setMessage}
        />
      ) : null}
    </>
  );
}

export default function ProjectDetail() {
  const { slug = "" } = useParams();
  const { user, hasPermission, authData } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPresident =
    authData.account.isBootstrapAdmin ||
    authData.orgPositions.some((position) => position.slug === "president");
  const canDeleteCurrentProject = Boolean(
    project &&
      user &&
      (isPresident || project.myRole === "lead" || project.lead?.id === user.id),
  );
  const canManageCurrentProject = Boolean(
    project &&
      (project.isLead || hasPermission("admin.access", "members.manage", "projects.manage")),
  );

  async function refresh() {
    if (!user || !slug) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setProject(await getProjectBySlug(slug, user.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug, user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
        <Link
          to={projectListPath()}
          className="inline-flex w-fit items-center gap-1.5 text-[13.5px] text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          프로젝트
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            프로젝트를 불러오는 중입니다.
          </div>
        ) : error ? (
          <section style={{ ...PANEL_STYLE, padding: 32 }}>
            <div className="text-[15px] font-semibold text-red-700">{error}</div>
          </section>
        ) : !project ? (
          <section style={{ ...PANEL_STYLE, padding: 56 }} className="text-center">
            <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              프로젝트를 찾을 수 없습니다.
            </div>
          </section>
        ) : project.status === "rejected" && user ? (
          <RejectedProjectNotice
            project={project}
            userId={user.id}
            onUpdated={refresh}
            canManageProject={canManageCurrentProject}
            canDeleteProject={canDeleteCurrentProject}
          />
        ) : project.isMember && user && (project.status === "active" || project.status === "recruiting") ? (
          <ProjectWorkspace
            project={project}
            userId={user.id}
            canEditProject={canManageCurrentProject}
            canDeleteProject={canDeleteCurrentProject}
            onUpdated={refresh}
          />
        ) : (
          <ProjectOverview
            project={project}
            onJoined={() => void refresh()}
            canDeleteProject={canDeleteCurrentProject}
          />
        )}
      </div>
    </div>
  );
}
