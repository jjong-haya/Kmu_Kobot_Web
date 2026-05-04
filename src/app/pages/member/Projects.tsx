import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  Archive,
  ChevronRight,
  CircleDot,
  FolderKanban,
  Plus,
  Star,
} from "lucide-react";

/* ───── types & data ───── */

type ProjectStatus = "active" | "review" | "archived";

type ProjectSummary = {
  id: string;
  slug: string;
  prefix: string;
  name: string;
  description: string;
  role: string;
  status: ProjectStatus;
  members: number;
  progress: number;
  updatedAt: string;
  starred: boolean;
};

const STATUS_META: Record<
  ProjectStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  active: {
    label: "진행중",
    bg: "#e3ecfb",
    fg: "#163b86",
    dot: "var(--kb-navy-800)",
  },
  review: {
    label: "리뷰중",
    bg: "#fef3c7",
    fg: "#92400e",
    dot: "#d97706",
  },
  archived: {
    label: "종료",
    bg: "#f3f3f1",
    fg: "#6a6a6a",
    dot: "#9a9a98",
  },
};

const PROJECTS: ProjectSummary[] = [
  {
    id: "1",
    slug: "auto-driving-robot",
    prefix: "ADR",
    name: "자율주행 로봇 개발",
    description:
      "ROS2 기반 SLAM·Costmap 통합 자율주행 플랫폼. 학기 내 야외 주행 데모 목표.",
    role: "리더",
    status: "active",
    members: 5,
    progress: 65,
    updatedAt: "2시간 전",
    starred: true,
  },
  {
    id: "2",
    slug: "deep-learning-vision",
    prefix: "DLV",
    name: "딥러닝 비전 인식",
    description:
      "OpenCV + PyTorch로 객체 인식·세그멘테이션 모델 학습 및 배포 파이프라인 구성.",
    role: "팀원",
    status: "active",
    members: 4,
    progress: 42,
    updatedAt: "어제",
    starred: false,
  },
  {
    id: "3",
    slug: "robot-arm-pickplace",
    prefix: "RAP",
    name: "로봇 팔 픽 앤 플레이스",
    description: "6축 로봇 팔과 비전 시스템을 결합한 자동 분류 데모.",
    role: "팀원",
    status: "review",
    members: 3,
    progress: 88,
    updatedAt: "3일 전",
    starred: true,
  },
  {
    id: "4",
    slug: "drone-swarm",
    prefix: "DSW",
    name: "드론 군집 비행",
    description: "다중 드론 동기화 및 군집 알고리즘 시뮬레이션 — 졸업 프로젝트.",
    role: "옵저버",
    status: "archived",
    members: 6,
    progress: 100,
    updatedAt: "2주 전",
    starred: false,
  },
];

/* ───── filter ───── */

type FilterKey = "all" | "active" | "review" | "archived" | "starred";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "starred", label: "즐겨찾기" },
  { key: "active", label: "진행중" },
  { key: "review", label: "리뷰중" },
  { key: "archived", label: "종료" },
];

function filterProjects(items: ProjectSummary[], key: FilterKey) {
  if (key === "all") return items;
  if (key === "starred") return items.filter((p) => p.starred);
  return items.filter((p) => p.status === key);
}

/* ───── shared container ───── */

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

/* ───── project row ───── */

function ProjectRow({ p }: { p: ProjectSummary }) {
  const meta = STATUS_META[p.status];

  return (
    <Link
      to={`/member/projects/${p.slug}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 28px",
        borderTop: "1px solid #f1ede4",
        textDecoration: "none",
        color: "inherit",
        transition: "background 120ms",
        position: "relative",
      }}
      className="hover:bg-[#fafaf6]"
    >
      {/* prefix badge */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          background: p.status === "archived" ? "#f1ede4" : "#0a0a0a",
          color: p.status === "archived" ? "var(--kb-ink-500)" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.04em",
          flexShrink: 0,
          fontFamily: "var(--kb-font-mono)",
        }}
      >
        {p.prefix}
      </div>

      {/* main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--kb-ink-900)",
            }}
          >
            {p.name}
          </span>
          {p.starred && (
            <Star
              style={{
                width: 14,
                height: 14,
                color: "#f59e0b",
                fill: "#f59e0b",
              }}
            />
          )}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 4,
              background: meta.bg,
              color: meta.fg,
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              padding: "2px 10px",
              borderRadius: 4,
              background: "#f7f5f0",
              color: "var(--kb-ink-700)",
              border: "1px solid #ebe8e0",
            }}
          >
            {p.role}
          </span>
        </div>

        {/* description */}
        <div
          style={{
            fontSize: 14.5,
            color: "var(--kb-ink-500)",
            lineHeight: 1.5,
            marginBottom: 8,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.description}
        </div>

        {/* meta + progress bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 13,
            color: "var(--kb-ink-400)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <CircleDot style={{ width: 12, height: 12 }} />팀원 {p.members}명
          </span>
          <span style={{ color: "#ddd" }}>·</span>
          <span>{p.updatedAt}</span>
          <span style={{ color: "#ddd" }}>·</span>
          {/* inline progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 240 }}>
            <div
              style={{
                flex: 1,
                height: 5,
                background: "#f1ede4",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p.progress}%`,
                  height: "100%",
                  background:
                    p.status === "archived"
                      ? "var(--kb-ink-400)"
                      : "var(--kb-navy-800)",
                  transition: "width 200ms",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                minWidth: 32,
                textAlign: "right",
              }}
            >
              {p.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* chevron */}
      <ChevronRight
        style={{
          width: 18,
          height: 18,
          color: "var(--kb-ink-300)",
          flexShrink: 0,
        }}
      />
    </Link>
  );
}

/* ───── page ───── */

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const filtered = filterProjects(PROJECTS, activeFilter);

  const activeCount = PROJECTS.filter((p) => p.status === "active").length;
  const myProjectCount = PROJECTS.filter((p) => p.role !== "옵저버").length;

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
          maxWidth: 1100,
        }}
      >
        {/* ─── page header ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            paddingBottom: 4,
          }}
        >
          <div>
            <div
              className="kb-mono"
              style={{
                fontSize: 13,
                color: "var(--kb-ink-500)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Projects
            </div>
            <h1
              className="kb-display"
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
                color: "#0a0a0a",
              }}
            >
              내 프로젝트
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · 진행중 {activeCount}건 / 참여 {myProjectCount}건
              </span>
            </h1>
          </div>

          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />새 프로젝트
          </button>
        </div>

        {/* ─── list container ─── */}
        <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
          {/* filter pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "18px 28px",
              borderBottom: "1px solid #f1ede4",
              flexWrap: "wrap",
            }}
          >
            {FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? PROJECTS.length
                  : f.key === "starred"
                    ? PROJECTS.filter((p) => p.starred).length
                    : PROJECTS.filter((p) => p.status === f.key).length;
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: isActive
                      ? "1px solid #0a0a0a"
                      : "1px solid #ebe8e0",
                    background: isActive ? "#0a0a0a" : "#fff",
                    color: isActive ? "#fff" : "var(--kb-ink-700)",
                    fontSize: 14.5,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 150ms",
                  }}
                  className={isActive ? "" : "hover:border-[var(--kb-ink-300)]"}
                >
                  {f.key === "starred" && !isActive && (
                    <Star style={{ width: 12, height: 12 }} />
                  )}
                  {f.key === "archived" && !isActive && (
                    <Archive style={{ width: 12, height: 12 }} />
                  )}
                  {f.label}
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      opacity: isActive ? 0.8 : 0.5,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* rows */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "56px 28px",
                textAlign: "center",
                color: "var(--kb-ink-500)",
                fontSize: 15.5,
              }}
            >
              <FolderKanban
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 12px",
                  color: "var(--kb-ink-300)",
                }}
              />
              해당 필터에 프로젝트가 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </div>
          )}

          {/* footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 28px",
              borderTop: "1px solid #f1ede4",
              fontSize: 13.5,
              color: "var(--kb-ink-500)",
            }}
          >
            <span>
              {filtered.length} / {PROJECTS.length} 건
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FolderKanban style={{ width: 13, height: 13 }} />
              프로젝트를 선택하면 태스크·문서·멤버 관리에 접근합니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
