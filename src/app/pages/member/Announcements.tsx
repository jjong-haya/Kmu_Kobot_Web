import { useState } from "react";
import type { CSSProperties } from "react";
import {
  Calendar,
  ChevronRight,
  Eye,
  Megaphone,
  Pin,
  Plus,
} from "lucide-react";

/* ───── types & data ───── */

type AnnouncementCategory = "일반" | "프로젝트" | "시설" | "행사";

type Announcement = {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
  views: number;
  pinned: boolean;
  scheduled: boolean;
  category: AnnouncementCategory;
};

const CATEGORY_BAR: Record<AnnouncementCategory, string> = {
  "일반": "#6a6a6a",
  "프로젝트": "#2a52a3",
  "시설": "#b45309",
  "행사": "#15803d",
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: "2026 봄학기 활동 시작 안내",
    content:
      "새 학기가 시작되었습니다. 프로젝트 팀 구성과 정기 세미나 일정을 확인해 주세요.",
    author: "운영진",
    date: "2026-04-28",
    views: 45,
    pinned: true,
    scheduled: false,
    category: "일반",
  },
  {
    id: 2,
    title: "프로젝트 제출 가이드라인 변경",
    content:
      "문서 작성 기준과 코드 리뷰 절차가 업데이트되었습니다. 제출 전 반드시 확인하세요.",
    author: "운영진",
    date: "2026-04-27",
    views: 32,
    pinned: true,
    scheduled: false,
    category: "프로젝트",
  },
  {
    id: 3,
    title: "장비실 운영 시간 변경",
    content:
      "4월 30일 시설 점검으로 장비실이 하루 동안 폐쇄됩니다. 대여 일정을 미리 조정해 주세요.",
    author: "운영진",
    date: "2026-04-25",
    views: 28,
    pinned: false,
    scheduled: false,
    category: "시설",
  },
  {
    id: 4,
    title: "외부 연사 초청 세미나 — AI와 로보틱스의 미래",
    content:
      "업계 전문가가 로보틱스 분야 AI 활용 사례를 공유합니다. 일정을 확인하고 참여 신청해 주세요.",
    author: "운영진",
    date: "2026-05-10",
    views: 0,
    pinned: false,
    scheduled: true,
    category: "행사",
  },
  {
    id: 5,
    title: "SLAM 스터디 2기 모집",
    content:
      "Visual SLAM 기초부터 실습까지 진행하는 스터디 2기 모집이 시작되었습니다. 5월 15일까지 신청해 주세요.",
    author: "스터디장",
    date: "2026-04-24",
    views: 61,
    pinned: false,
    scheduled: false,
    category: "프로젝트",
  },
];

/* ───── filter ───── */

type FilterKey = "all" | "pinned" | "일반" | "프로젝트" | "시설" | "행사";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pinned", label: "고정" },
  { key: "일반", label: "일반" },
  { key: "프로젝트", label: "프로젝트" },
  { key: "시설", label: "시설" },
  { key: "행사", label: "행사" },
];

function filterAnnouncements(items: Announcement[], key: FilterKey) {
  if (key === "all") return items;
  if (key === "pinned") return items.filter((a) => a.pinned);
  return items.filter((a) => a.category === key);
}

/* ───── shared container ───── */

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

/* ───── announcement row ───── */

function AnnouncementRow({ a }: { a: Announcement }) {
  const barColor = CATEGORY_BAR[a.category];

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #f1ede4",
        cursor: "pointer",
        transition: "background 120ms",
        position: "relative",
      }}
      className="hover:bg-[#fafaf6]"
    >
      {/* left category color bar */}
      <div
        style={{
          width: 3,
          flexShrink: 0,
          background: barColor,
          borderRadius: "0 2px 2px 0",
        }}
      />

      <div
        style={{
          flex: 1,
          padding: "20px 28px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* top line: pin + category + scheduled badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          {a.pinned && (
            <Pin
              style={{
                width: 13,
                height: 13,
                color: "var(--kb-navy-800)",
                transform: "rotate(-30deg)",
              }}
            />
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: barColor,
              letterSpacing: "0.01em",
            }}
          >
            {a.category}
          </span>
          {a.scheduled && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#e3ecfb",
                color: "#163b86",
              }}
            >
              예정
            </span>
          )}
        </div>

        {/* title */}
        <div
          style={{
            fontSize: 17,
            fontWeight: a.pinned ? 700 : 600,
            color: "var(--kb-ink-900)",
            lineHeight: 1.4,
          }}
        >
          {a.title}
        </div>

        {/* content preview */}
        <div
          style={{
            fontSize: 14.5,
            color: "var(--kb-ink-500)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.content}
        </div>

        {/* meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 13,
            color: "var(--kb-ink-400)",
            marginTop: 4,
          }}
        >
          <span>{a.author}</span>
          <span style={{ color: "#ddd" }}>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar style={{ width: 12, height: 12 }} />
            {a.date}
          </span>
          <span style={{ color: "#ddd" }}>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Eye style={{ width: 12, height: 12 }} />
            {a.views}
          </span>
        </div>
      </div>

      {/* chevron */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: 24,
          color: "var(--kb-ink-300)",
        }}
      >
        <ChevronRight style={{ width: 18, height: 18 }} />
      </div>
    </div>
  );
}

/* ───── page ───── */

export default function Announcements() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const sorted = [...ANNOUNCEMENTS].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const filtered = filterAnnouncements(sorted, activeFilter);
  const pinnedCount = ANNOUNCEMENTS.filter((a) => a.pinned).length;

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
              Announcements
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
              공지사항
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · {ANNOUNCEMENTS.length}건
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
            <Plus style={{ width: 15, height: 15 }} />
            공지 작성
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
                  ? sorted.length
                  : f.key === "pinned"
                    ? pinnedCount
                    : sorted.filter((a) => a.category === f.key).length;
              const isActive = activeFilter === f.key;

              /* category dot color for non-special filters */
              const dotColor =
                f.key !== "all" && f.key !== "pinned"
                  ? CATEGORY_BAR[f.key as AnnouncementCategory]
                  : undefined;

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
                  {/* category color dot */}
                  {dotColor && !isActive && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: dotColor,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {f.key === "pinned" && !isActive && (
                    <Pin
                      style={{
                        width: 12,
                        height: 12,
                        transform: "rotate(-30deg)",
                      }}
                    />
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
              <Megaphone
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 12px",
                  color: "var(--kb-ink-300)",
                }}
              />
              해당 필터에 공지가 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((a) => (
                <AnnouncementRow key={a.id} a={a} />
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
              {filtered.length} / {ANNOUNCEMENTS.length} 건
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Pin
                style={{
                  width: 12,
                  height: 12,
                  transform: "rotate(-30deg)",
                }}
              />
              고정 공지 {pinnedCount}건
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
