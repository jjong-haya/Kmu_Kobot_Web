import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Edit3,
  FileText,
  Filter,
  Info,
  KanbanSquare,
  List,
  Plus,
  Settings,
  User,
} from "lucide-react";

/* ───── types & data ───── */

type TaskStatus = "todo" | "doing" | "review" | "done";

type Task = {
  id: string;
  title: string;
  assignee: string;
  assigneeName: string;
  status: TaskStatus;
  due: string;
  priority: "low" | "normal" | "high" | "urgent";
  description?: string;
};

type ProjectMeta = {
  slug: string;
  prefix: string;
  name: string;
  description: string;
  lead: string;
  members: number;
  guide: string;
  idRule: string;
  branchRule: string;
  status: "active" | "review" | "archived";
};

const PROJECT_META: Record<string, ProjectMeta> = {
  "auto-driving-robot": {
    slug: "auto-driving-robot",
    prefix: "ADR",
    name: "자율주행 로봇 개발",
    description:
      "ROS2 기반 SLAM·Costmap 통합 자율주행 플랫폼. 학기 내 야외 주행 데모 목표.",
    lead: "John Doe",
    members: 5,
    guide:
      "기능 단위 브랜치를 만들고 PR 머지 시 코드 리뷰 1회 이상 필수입니다. 정기 스탠드업은 매주 화요일 19시.",
    idRule: "ADR-{번호} (예: ADR-12)",
    branchRule: "feat/ADR-{번호}-짧은설명 (예: feat/ADR-12-slam-tuning)",
    status: "active",
  },
  "deep-learning-vision": {
    slug: "deep-learning-vision",
    prefix: "DLV",
    name: "딥러닝 비전 인식",
    description:
      "OpenCV + PyTorch로 객체 인식·세그멘테이션 모델 학습 및 배포 파이프라인 구성.",
    lead: "Sarah Kim",
    members: 4,
    guide: "데이터셋 변경 시 즉시 공지하세요. 모델 가중치는 W&B에 업로드.",
    idRule: "DLV-{번호}",
    branchRule: "feat/DLV-{번호}-짧은설명",
    status: "active",
  },
};

const TASKS: Task[] = [
  {
    id: "ADR-12",
    title: "SLAM 파라미터 튜닝",
    assignee: "JD",
    assigneeName: "John Doe",
    status: "doing",
    due: "2/20",
    priority: "urgent",
    description: "Cartographer 파라미터 최적화로 매핑 정확도 개선",
  },
  {
    id: "ADR-11",
    title: "ROS bag 데이터 수집",
    assignee: "SK",
    assigneeName: "Sarah Kim",
    status: "doing",
    due: "2/22",
    priority: "high",
  },
  {
    id: "ADR-10",
    title: "Costmap 시각화 디버그 도구",
    assignee: "YJ",
    assigneeName: "Yujin Park",
    status: "review",
    due: "2/19",
    priority: "normal",
  },
  {
    id: "ADR-09",
    title: "센서 융합 알고리즘 — 1차안",
    assignee: "JD",
    assigneeName: "John Doe",
    status: "done",
    due: "2/14",
    priority: "high",
  },
  {
    id: "ADR-08",
    title: "하드웨어 배선 정리",
    assignee: "MH",
    assigneeName: "Minho Lee",
    status: "todo",
    due: "2/25",
    priority: "low",
  },
  {
    id: "ADR-07",
    title: "발표 자료 초안",
    assignee: "SK",
    assigneeName: "Sarah Kim",
    status: "todo",
    due: "3/01",
    priority: "normal",
  },
  {
    id: "ADR-06",
    title: "라이다 캘리브레이션 자동화 스크립트",
    assignee: "YJ",
    assigneeName: "Yujin Park",
    status: "todo",
    due: "3/05",
    priority: "normal",
  },
];

const STATUS_META: Record<
  TaskStatus,
  { label: string; bg: string; fg: string; dot: string; order: number }
> = {
  todo: {
    label: "할 일",
    bg: "#f3f3f1",
    fg: "var(--kb-ink-700)",
    dot: "#9a9a98",
    order: 0,
  },
  doing: {
    label: "진행중",
    bg: "#e3ecfb",
    fg: "#163b86",
    dot: "var(--kb-navy-800)",
    order: 1,
  },
  review: {
    label: "리뷰",
    bg: "#fef3c7",
    fg: "#92400e",
    dot: "#d97706",
    order: 2,
  },
  done: {
    label: "완료",
    bg: "#dff4e2",
    fg: "#15602e",
    dot: "#15803d",
    order: 3,
  },
};

const PRIORITY_META: Record<Task["priority"], { label: string; color: string }> =
  {
    low: { label: "낮음", color: "var(--kb-ink-400)" },
    normal: { label: "보통", color: "var(--kb-ink-500)" },
    high: { label: "높음", color: "#d97706" },
    urgent: { label: "긴급", color: "#dc2626" },
  };

/* ───── shared container ───── */

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

/* ───── tabs ───── */

type TabKey = "overview" | "tasks" | "files" | "members" | "activity" | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "files", label: "Files" },
  { key: "members", label: "Members" },
  { key: "activity", label: "Activity" },
  { key: "settings", label: "Settings" },
];

/* ───── guide section (configurable by lead) ───── */

function ProjectGuide({
  meta,
  isLead,
}: {
  meta: ProjectMeta;
  isLead: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [guide, setGuide] = useState(meta.guide);
  const [idRule, setIdRule] = useState(meta.idRule);
  const [branchRule, setBranchRule] = useState(meta.branchRule);

  return (
    <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #f1ede4",
          background: "#fafaf9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Info
            style={{ width: 16, height: 16, color: "var(--kb-navy-800)" }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--kb-ink-900)",
            }}
          >
            프로젝트 가이드
          </span>
          <span style={{ fontSize: 12.5, color: "var(--kb-ink-400)" }}>
            · 리더가 작성
          </span>
        </div>
        {isLead && (
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid #ebe8e0",
              background: "#fff",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--kb-ink-700)",
              fontFamily: "inherit",
            }}
          >
            <Edit3 style={{ width: 12, height: 12 }} />
            {editing ? "완료" : "수정"}
          </button>
        )}
      </div>

      <div
        style={{
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* usage */}
        <div style={{ gridColumn: "span 2" }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            사용 방법 / 협업 규칙
          </div>
          {editing ? (
            <textarea
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14.5,
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
                color: "var(--kb-ink-900)",
                resize: "vertical",
                lineHeight: 1.55,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 14.5,
                color: "var(--kb-ink-700)",
                lineHeight: 1.6,
              }}
            >
              {guide}
            </div>
          )}
        </div>

        {/* id rule */}
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            태스크 ID 규칙
          </div>
          {editing ? (
            <input
              type="text"
              value={idRule}
              onChange={(e) => setIdRule(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                outline: "none",
                fontFamily: "var(--kb-font-mono)",
                color: "var(--kb-ink-900)",
              }}
            />
          ) : (
            <code
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: "#f7f5f0",
                borderRadius: 6,
                fontSize: 13.5,
                color: "var(--kb-ink-900)",
                fontFamily: "var(--kb-font-mono)",
                border: "1px solid #ebe8e0",
              }}
            >
              {idRule}
            </code>
          )}
        </div>

        {/* branch rule */}
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            브랜치 명명 규칙
          </div>
          {editing ? (
            <input
              type="text"
              value={branchRule}
              onChange={(e) => setBranchRule(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                outline: "none",
                fontFamily: "var(--kb-font-mono)",
                color: "var(--kb-ink-900)",
              }}
            />
          ) : (
            <code
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: "#f7f5f0",
                borderRadius: 6,
                fontSize: 13.5,
                color: "var(--kb-ink-900)",
                fontFamily: "var(--kb-font-mono)",
                border: "1px solid #ebe8e0",
              }}
            >
              {branchRule}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── task list view ───── */

function TaskListView({ tasks }: { tasks: Task[] }) {
  return (
    <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
      {/* header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70px 1fr 100px 110px 80px 70px",
          padding: "12px 24px",
          background: "#fafaf9",
          borderBottom: "1px solid #f1ede4",
          fontSize: 12,
          color: "var(--kb-ink-500)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
          gap: 12,
        }}
      >
        <span>ID</span>
        <span>제목</span>
        <span>담당자</span>
        <span>상태</span>
        <span>마감</span>
        <span>우선순위</span>
      </div>
      {tasks.map((t) => {
        const sm = STATUS_META[t.status];
        const pm = PRIORITY_META[t.priority];
        return (
          <div
            key={t.id}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr 100px 110px 80px 70px",
              padding: "14px 24px",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid #f1ede4",
              cursor: "pointer",
              transition: "background 120ms",
            }}
            className="hover:bg-[#fafaf6]"
          >
            <span
              className="kb-mono"
              style={{
                fontSize: 12.5,
                color: "var(--kb-ink-500)",
                fontWeight: 600,
              }}
            >
              {t.id}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--kb-ink-900)",
              }}
            >
              {t.title}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--kb-navy-800)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {t.assignee}
              </span>
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 4,
                background: sm.bg,
                color: sm.fg,
                width: "fit-content",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: sm.dot,
                }}
              />
              {sm.label}
            </span>
            <span
              className="kb-mono"
              style={{ fontSize: 13, color: "var(--kb-ink-700)" }}
            >
              {t.due}
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: pm.color,
              }}
            >
              {pm.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ───── kanban (status-grouped) view ───── */

function TaskKanbanView({ tasks }: { tasks: Task[] }) {
  const cols: TaskStatus[] = ["todo", "doing", "review", "done"];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        alignItems: "start",
      }}
    >
      {cols.map((col) => {
        const sm = STATUS_META[col];
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div
            key={col}
            style={{
              ...CONTAINER_STYLE,
              padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* column header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #f1ede4",
                background: "#fafaf9",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: sm.dot,
                  }}
                />
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--kb-ink-900)",
                  }}
                >
                  {sm.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--kb-ink-400)",
                  }}
                >
                  {colTasks.length}
                </span>
              </div>
              <button
                type="button"
                style={{
                  width: 22,
                  height: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  color: "var(--kb-ink-400)",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
                className="hover:bg-[#f1ede4]"
              >
                <Plus style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* tickets */}
            <div
              style={{
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 100,
              }}
            >
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: "20px 8px",
                    fontSize: 12.5,
                    color: "var(--kb-ink-400)",
                    textAlign: "center",
                  }}
                >
                  태스크 없음
                </div>
              ) : (
                colTasks.map((t) => {
                  const pm = PRIORITY_META[t.priority];
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #ebe8e0",
                        background: "#fff",
                        cursor: "pointer",
                        transition: "border-color 120ms, box-shadow 120ms",
                      }}
                      className="hover:border-[var(--kb-ink-300)] hover:shadow-sm"
                    >
                      {/* id + priority */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          className="kb-mono"
                          style={{
                            fontSize: 11.5,
                            color: "var(--kb-ink-500)",
                            fontWeight: 600,
                          }}
                        >
                          {t.id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: pm.color,
                          }}
                        >
                          {pm.label}
                        </span>
                      </div>
                      {/* title */}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--kb-ink-900)",
                          lineHeight: 1.4,
                          marginBottom: 8,
                        }}
                      >
                        {t.title}
                      </div>
                      {/* assignee + due */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--kb-navy-800)",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {t.assignee}
                        </span>
                        <span
                          className="kb-mono"
                          style={{
                            fontSize: 11.5,
                            color: "var(--kb-ink-400)",
                          }}
                        >
                          {t.due}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───── tasks tab ───── */

function TasksTab({ isLead, meta }: { isLead: boolean; meta: ProjectMeta }) {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");

  const filtered =
    filterStatus === "all"
      ? TASKS
      : TASKS.filter((t) => t.status === filterStatus);

  // counts
  const counts = {
    todo: TASKS.filter((t) => t.status === "todo").length,
    doing: TASKS.filter((t) => t.status === "doing").length,
    review: TASKS.filter((t) => t.status === "review").length,
    done: TASKS.filter((t) => t.status === "done").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* guide section */}
      <ProjectGuide meta={meta} isLead={isLead} />

      {/* toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* status counts as inline filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border:
                filterStatus === "all"
                  ? "1px solid #0a0a0a"
                  : "1px solid #ebe8e0",
              background: filterStatus === "all" ? "#0a0a0a" : "#fff",
              color: filterStatus === "all" ? "#fff" : "var(--kb-ink-700)",
              fontSize: 13.5,
              fontWeight: filterStatus === "all" ? 600 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            전체
            <span style={{ fontSize: 12, opacity: 0.7 }}>{TASKS.length}</span>
          </button>
          {(["todo", "doing", "review", "done"] as TaskStatus[]).map((s) => {
            const sm = STATUS_META[s];
            const sel = filterStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: sel ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                  background: sel ? "#0a0a0a" : "#fff",
                  color: sel ? "#fff" : "var(--kb-ink-700)",
                  fontSize: 13.5,
                  fontWeight: sel ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: sm.dot,
                  }}
                />
                {sm.label}
                <span style={{ fontSize: 12, opacity: 0.7 }}>{counts[s]}</span>
              </button>
            );
          })}
        </div>

        {/* view toggle + add */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid #ebe8e0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setView("kanban")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                background: view === "kanban" ? "#0a0a0a" : "#fff",
                color: view === "kanban" ? "#fff" : "var(--kb-ink-700)",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <KanbanSquare style={{ width: 14, height: 14 }} />
              칸별
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                background: view === "list" ? "#0a0a0a" : "#fff",
                color: view === "list" ? "#fff" : "var(--kb-ink-700)",
                border: "none",
                borderLeft: "1px solid #ebe8e0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <List style={{ width: 14, height: 14 }} />
              목록
            </button>
          </div>

          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            태스크 추가
          </button>
        </div>
      </div>

      {/* views */}
      {view === "kanban" ? (
        <TaskKanbanView tasks={filtered} />
      ) : (
        <TaskListView tasks={filtered} />
      )}
    </div>
  );
}

/* ───── placeholder tab ───── */

function PlaceholderTab({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div
      style={{
        ...CONTAINER_STYLE,
        padding: "56px 28px",
        textAlign: "center",
        color: "var(--kb-ink-500)",
        fontSize: 15,
      }}
    >
      <Icon
        style={{
          width: 32,
          height: 32,
          margin: "0 auto 12px",
          color: "var(--kb-ink-300)",
        }}
      />
      {label} 탭은 준비 중입니다.
    </div>
  );
}

/* ───── page ───── */

export default function ProjectDetail() {
  const { slug = "auto-driving-robot" } = useParams();
  const meta = PROJECT_META[slug] ?? PROJECT_META["auto-driving-robot"];
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");

  // mock: assume current user is lead of auto-driving-robot
  const isLead = slug === "auto-driving-robot";

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "calc(100vh - 4rem)",
        margin: -32,
        padding: 32,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {/* breadcrumb */}
        <Link
          to="/member/projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13.5,
            color: "var(--kb-ink-500)",
            textDecoration: "none",
            width: "fit-content",
          }}
          className="hover:text-[var(--kb-ink-900)]"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />내 프로젝트로
        </Link>

        {/* project header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "#0a0a0a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.04em",
                fontFamily: "var(--kb-font-mono)",
                flexShrink: 0,
              }}
            >
              {meta.prefix}
            </div>
            <div>
              <div
                className="kb-mono"
                style={{
                  fontSize: 12.5,
                  color: "var(--kb-ink-500)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {meta.slug}
              </div>
              <h1
                className="kb-display"
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.2,
                  color: "#0a0a0a",
                }}
              >
                {meta.name}
              </h1>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 6,
                  fontSize: 13.5,
                  color: "var(--kb-ink-500)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--kb-navy-800)",
                    fontWeight: 600,
                  }}
                >
                  ● 진행중
                </span>
                <span style={{ color: "#ddd" }}>·</span>
                <span>리더 {meta.lead}</span>
                <span style={{ color: "#ddd" }}>·</span>
                <span>팀원 {meta.members}명</span>
              </div>
            </div>
          </div>

          {isLead && (
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                border: "1px solid #ebe8e0",
                background: "#fff",
                color: "var(--kb-ink-700)",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Settings style={{ width: 14, height: 14 }} />
              프로젝트 설정
            </button>
          )}
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid #ebe8e0",
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const sel = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  border: 0,
                  borderBottom:
                    "2px solid " + (sel ? "#0a0a0a" : "transparent"),
                  fontSize: 14.5,
                  fontWeight: sel ? 700 : 500,
                  cursor: "pointer",
                  color: sel ? "#0a0a0a" : "var(--kb-ink-500)",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "color 120ms",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* tab content */}
        {activeTab === "tasks" && <TasksTab isLead={isLead} meta={meta} />}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProjectGuide meta={meta} isLead={isLead} />
            <div
              style={{
                ...CONTAINER_STYLE,
                padding: 24,
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--kb-ink-700)",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--kb-ink-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                프로젝트 설명
              </div>
              {meta.description}
            </div>
          </div>
        )}
        {activeTab === "files" && (
          <PlaceholderTab icon={FileText} label="Files" />
        )}
        {activeTab === "members" && (
          <PlaceholderTab icon={User} label="Members" />
        )}
        {activeTab === "activity" && (
          <PlaceholderTab icon={AlertCircle} label="Activity" />
        )}
        {activeTab === "settings" && (
          <PlaceholderTab icon={Settings} label="Settings" />
        )}
      </div>
    </div>
  );
}
