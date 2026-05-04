import { Link } from "react-router";
import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAuth } from "../../auth/useAuth";
import { ArrowRight } from "lucide-react";

/* Light, harmonized dashboard with right-side calendar panel.
 * - All cards share the same radius / hairline / shadow / paper.
 * - Uniform grid, no graphs, no dark colors except sidebar (handled by layout). */

type TodayItem = { time: string; title: string; meta: string; urgent: boolean };
type Project = { name: string; role: string; prog: number; members: number };
type EventKind = "deadline" | "event" | "meeting";
type CalendarEvent = { id: string; offset: number; span?: number; title: string; kind: EventKind };
type CellEvent = CalendarEvent & { position: "single" | "start" | "middle" | "end"; isWeekStart: boolean };

const TODAY: TodayItem[] = [
  { time: "마감",  title: "컴퓨터 비전 과제 제출",         meta: "오늘 23:59",   urgent: true  },
  { time: "19:00", title: "ROS 2 Navigation 세미나",     meta: "과기관 310호", urgent: false },
  { time: "마감",  title: "프로젝트 문서 작성",            meta: "내일까지",     urgent: false },
];

const PROJECTS: Project[] = [
  { name: "자율주행 로봇 개발",     role: "리드", prog: 65, members: 5 },
  { name: "딥러닝 기반 물체 인식",   role: "참여", prog: 40, members: 6 },
];

const NOTICES: Array<{ tag: string; title: string; date: string }> = [
  { tag: "모집", title: "2026년 상반기 신입 부원 모집 공고", date: "5/2" },
  { tag: "안내", title: "ROS 2 Navigation 고급 세미나",      date: "5/1" },
  { tag: "행사", title: "국제 로봇 경진대회 참가 안내",       date: "4/30" },
  { tag: "일반", title: "동아리방 이용 규칙 v3 업데이트",     date: "4/28" },
];

/* offsets relative to today so the calendar always shows realistic scatter.
 * `span` makes an event multi-day (visually connected across cells). */
const EVENTS: CalendarEvent[] = [
  { id: "e1",  offset: 0,            title: "컴퓨터 비전 과제 제출",     kind: "deadline" },
  { id: "e2",  offset: 2,            title: "ROS 2 Navigation 세미나",   kind: "event"    },
  { id: "e3",  offset: 3,            title: "프로젝트 문서 작성 마감",   kind: "deadline" },
  { id: "e4",  offset: 4,  span: 3,  title: "팀 워크샵 (3일)",            kind: "event"    },
  { id: "e5",  offset: 9,            title: "정기 총회",                 kind: "meeting"  },
  { id: "e6",  offset: 10, span: 4,  title: "분기 리뷰 위크",             kind: "meeting"  },
  { id: "e7",  offset: 16, span: 2,  title: "데모데이 준비",              kind: "deadline" },
  { id: "e8",  offset: 18,           title: "프로젝트 중간 발표",         kind: "event"    },
  { id: "e9",  offset: 22,           title: "장비 점검",                 kind: "meeting"  },
];

const KIND_COLOR: Record<EventKind, string> = {
  deadline: "#dc2626",
  event:    "var(--kb-navy-800)",
  meeting:  "#15803d",
};

const KIND_LABEL: Record<EventKind, string> = {
  deadline: "마감",
  event:    "행사",
  meeting:  "회의",
};

/* pastel chip palette for event labels inside calendar cells */
const KIND_CHIP: Record<EventKind, { bg: string; fg: string; dot: string }> = {
  deadline: { bg: "#fde8e6", fg: "#9b1c1c", dot: "#dc2626" },
  event:    { bg: "#e3ecfb", fg: "#163b86", dot: "var(--kb-navy-800)" },
  meeting:  { bg: "#dff4e2", fg: "#15602e", dot: "#15803d" },
};

/* ───── shared primitives ───── */

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...CARD_STYLE, ...style }}>{children}</div>;
}

/* left-bar color per notice category */
const TAG_BAR: Record<string, string> = {
  "모집": "#2a52a3",
  "안내": "#15803d",
  "행사": "#b45309",
  "일반": "#6a6a6a",
};

function MoreLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        color: "var(--kb-ink-400)",
        textDecoration: "none",
        transition: "color 0.15s, background 0.15s",
      }}
    >
      <ArrowRight style={{ width: 16, height: 16 }} />
    </Link>
  );
}

function CardHeader({ eyebrow, action }: { eyebrow: string; action?: ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 28px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        className="kb-mono"
        style={{
          fontSize: 14,
          color: "var(--kb-ink-700)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </div>
      {action}
    </div>
  );
}

/* ───── calendar ───── */

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function CalendarPanel() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CellEvent[]>();
    for (const e of EVENTS) {
      const span = e.span ?? 1;
      for (let i = 0; i < span; i += 1) {
        const d = addDays(today, e.offset + i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const position: CellEvent["position"] =
          span === 1 ? "single" : i === 0 ? "start" : i === span - 1 ? "end" : "middle";
        const arr = map.get(key) ?? [];
        arr.push({ ...e, position, isWeekStart: d.getDay() === 0 });
        map.set(key, arr);
      }
    }
    return map;
  }, [today]);

  const upcoming = useMemo(
    () => EVENTS.slice(0, 5).map((e) => ({ ...e, date: addDays(today, e.offset) })),
    [today],
  );

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  // Build month rows OR week row
  const cells: Array<Date | null> = [];
  if (selected) {
    const weekStart = startOfWeek(selected);
    for (let i = 0; i < 7; i += 1) cells.push(addDays(weekStart, i));
  } else {
    const monthStart = startOfMonth(cursor);
    const startWeekday = monthStart.getDay();
    const dim = daysInMonth(cursor);
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let i = 1; i <= dim; i += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (cells.length % 7 !== 0) cells.push(null);
  }

  const cellMin = selected ? 90 : 64;
  const selectedKey = selected
    ? `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`
    : null;
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) ?? [] : [];

  return (
    <Card style={{ padding: 0, position: "sticky", top: 80, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "20px 24px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            className="kb-mono"
            style={{
              fontSize: 12,
              color: "var(--kb-ink-500)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 2,
            }}
          >
            Calendar {selected ? "· week" : ""}
          </div>
          <h2
            className="kb-display"
            style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}
          >
            {monthLabel}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ ...navBtn, width: "auto", padding: "0 10px", fontSize: 11 }}
            >
              월간 ←
            </button>
          )}
          {!selected && (
            <>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                aria-label="이전 달"
                style={navBtn}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setCursor(startOfMonth(today))}
                style={{ ...navBtn, width: "auto", padding: "0 10px", fontSize: 11 }}
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                aria-label="다음 달"
                style={navBtn}
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {/* day labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 16px",
          fontSize: 12,
          color: "var(--kb-ink-500)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
        className="kb-mono"
      >
        {dayLabels.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              padding: "8px 0 4px",
              color: i === 0 ? "#dc2626" : i === 6 ? "var(--kb-navy-800)" : "var(--kb-ink-500)",
              fontWeight: 600,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid — gap 0 so adjacent event chips visually connect */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 16px 16px",
          gap: 0,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} style={{ minHeight: cellMin }} />;
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const evs = eventsByDate.get(key) ?? [];
          const isToday = sameDate(d, today);
          const isSelected = selected ? sameDate(d, selected) : false;
          const dow = d.getDay();
          const dimColor =
            dow === 0 ? "#dc2626" : dow === 6 ? "var(--kb-navy-800)" : "var(--kb-ink-700)";
          const slotsForCell = selected ? 3 : 2;
          // circle indicator color
          const circleBg = isSelected ? "#0a0a0a" : "transparent";
          const circleBorder = isToday && !isSelected ? "1px solid var(--kb-navy-800)" : "1px solid transparent";
          const circleColor = isSelected ? "#fff" : isToday ? "var(--kb-navy-800)" : dimColor;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(isSelected ? null : d)}
              style={{
                minHeight: cellMin,
                background: "transparent",
                color: dimColor,
                border: 0,
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                fontFamily: "inherit",
                overflow: "hidden",
                textAlign: "left",
              }}
              className="hover:bg-[#f5f3ee]"
            >
              <div style={{ padding: "4px 4px 2px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    width: 26,
                    height: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: circleBg,
                    border: circleBorder,
                    color: circleColor,
                    fontSize: 13,
                    fontWeight: isToday || isSelected ? 700 : 500,
                    transition: "background 150ms, border-color 150ms",
                  }}
                >
                  {d.getDate()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {evs.slice(0, slotsForCell).map((e, idx) => {
                  const chip = KIND_CHIP[e.kind];
                  // Show left bar + title only on the FIRST day of an event
                  // (or when an event continues into a new week — Sunday).
                  const isHead = e.position === "single" || e.position === "start" || e.isWeekStart;
                  return (
                    <span
                      key={`${e.id}-${idx}`}
                      style={{
                        fontSize: 11,
                        lineHeight: 1.45,
                        padding: isHead ? "3px 6px 3px 8px" : "3px 6px 3px 5px",
                        borderRadius: 0,
                        borderLeft: isHead ? `3px solid ${chip.dot}` : "0",
                        background: chip.bg,
                        color: chip.fg,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 500,
                        minHeight: 16,
                      }}
                    >
                      {isHead ? e.title : " "}
                    </span>
                  );
                })}
                {evs.length > slotsForCell && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--kb-ink-500)",
                      paddingLeft: 7,
                    }}
                  >
                    +{evs.length - slotsForCell}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "12px 24px",
          borderTop: "1px solid #f1ede4",
          fontSize: 12.5,
          color: "var(--kb-ink-500)",
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(KIND_COLOR) as EventKind[]).map((k) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: KIND_COLOR[k] }} />
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>

      {/* selected day detail OR upcoming list */}
      {selected ? (
        <div style={{ borderTop: "1px solid #f1ede4" }}>
          <div
            style={{
              padding: "16px 24px 6px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <div
                className="kb-mono"
                style={{
                  fontSize: 12,
                  color: "var(--kb-ink-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 2,
                }}
              >
                Selected
              </div>
              <h3
                className="kb-display"
                style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}
              >
                {selected.getMonth() + 1}월 {selected.getDate()}일{" "}
                <span style={{ color: "var(--kb-ink-500)", fontWeight: 400, fontSize: 14.5 }}>
                  ({dayLabels[selected.getDay()]})
                </span>
              </h3>
            </div>
            <span style={{ fontSize: 13, color: "var(--kb-ink-500)" }}>
              {selectedEvents.length}건
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <div
              style={{
                padding: "12px 20px 18px",
                fontSize: 13,
                color: "var(--kb-ink-500)",
              }}
            >
              일정이 없어요.
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: "4px 0 8px" }}>
              {selectedEvents.map((e, i) => {
                const chip = KIND_CHIP[e.kind];
                return (
                  <li
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 18px 10px 14px",
                      background: chip.bg,
                      borderLeft: `3px solid ${chip.dot}`,
                    }}
                  >
                    <span
                      className="kb-mono"
                      style={{
                        fontSize: 12,
                        color: chip.fg,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {KIND_LABEL[e.kind]}
                    </span>
                    <span style={{ fontSize: 14.5, color: chip.fg, fontWeight: 500 }}>{e.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div style={{ borderTop: "1px solid #f1ede4" }}>
          <div
            className="kb-mono"
            style={{
              padding: "14px 24px 4px",
              fontSize: 12,
              color: "var(--kb-ink-500)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            다가오는
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: "0 0 12px" }}>
            {upcoming.map((u, i) => {
              const isToday = sameDate(u.date, today);
              return (
                <li
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto",
                    padding: "10px 24px",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    className="kb-mono"
                    style={{
                      fontSize: 13,
                      color: isToday ? "#dc2626" : "var(--kb-ink-700)",
                      fontWeight: isToday ? 700 : 500,
                    }}
                  >
                    {u.date.getMonth() + 1}/{u.date.getDate()}
                  </span>
                  <span style={{ fontSize: 14.5, color: "var(--kb-ink-900)" }}>{u.title}</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: KIND_COLOR[u.kind],
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}

const navBtn: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #ebe8e0",
  background: "#fff",
  fontSize: 14,
  cursor: "pointer",
  color: "var(--kb-ink-700)",
  fontFamily: "inherit",
};

/* ───── page ───── */

export default function Dashboard() {
  const { authData } = useAuth();
  const displayName = useMemo(
    () =>
      authData.profile.displayName ??
      authData.profile.fullName ??
      authData.profile.email?.split("@")[0] ??
      "Member",
    [authData],
  );
  const today = useMemo(() => {
    const d = new Date();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }, []);

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
      <div style={{ margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Inline page header — small, no card */}
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
              {today} · Dashboard
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
              안녕하세요, {displayName}
              <span style={{ color: "var(--kb-ink-500)", fontWeight: 400, marginLeft: 12, fontSize: 17 }}>
                · 마감 임박 1건 · 일정 3건 · 프로젝트 2개
              </span>
            </h1>
          </div>
          <Link
            to="/member/study-log"
            style={{
              padding: "10px 18px",
              border: "1px solid #0a0a0a",
              background: "#0a0a0a",
              color: "#fff",
              borderRadius: 8,
              fontSize: 14.5,
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + 활동 기록
          </Link>
        </div>

        {/* Two-col layout — stacks on narrow screens, side-by-side on wide */}
        <style>{`
          @media (min-width: 1100px) {
            .kb-dash-grid { grid-template-columns: 1fr minmax(380px, 0.75fr) !important; }
          }
        `}</style>
        <div className="kb-dash-grid grid gap-4 items-stretch" style={{ gridTemplateColumns: "1fr" }}>
          {/* MAIN COLUMN — Today / Projects / Notices stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, minHeight: 0 }}>
            {/* TODAY */}
            <Card>
              <CardHeader
                eyebrow="Today"
                action={<MoreLink to="/member/events" />}
              />
              <div>
                {TODAY.map((it, i) => (
                  <div
                    key={`${it.title}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "72px 1fr auto",
                      alignItems: "center",
                      gap: 18,
                      padding: "16px 28px",
                      borderTop: "1px solid #f1ede4",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: it.urgent ? "#b45309" : "var(--kb-navy-800)",
                      }}
                    >
                      {it.time}
                    </span>
                    <span style={{ fontSize: 16.5, fontWeight: 500, color: "var(--kb-ink-900)" }}>
                      {it.title}
                    </span>
                    <span style={{ fontSize: 14.5, color: "var(--kb-ink-500)" }}>{it.meta}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* PROJECTS */}
            <Card>
              <CardHeader
                eyebrow="Projects"
                action={<MoreLink to="/member/projects" />}
              />
              <div>
                {PROJECTS.map((p) => (
                  <Link
                    key={p.name}
                    to="/member/projects"
                    style={{
                      display: "block",
                      padding: "18px 28px",
                      borderTop: "1px solid #f1ede4",
                      textDecoration: "none",
                      color: "var(--kb-ink-900)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 14, color: "var(--kb-ink-500)" }}>
                        {p.role} · {p.members}명
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#f1ede4",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${p.prog}%`,
                            background: "var(--kb-navy-800)",
                          }}
                        />
                      </div>
                      <span
                        className="kb-mono"
                        style={{
                          fontSize: 14.5,
                          color: "var(--kb-navy-800)",
                          fontWeight: 600,
                          minWidth: 40,
                          textAlign: "right",
                        }}
                      >
                        {p.prog}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* NOTICES */}
            <Card>
              <CardHeader
                eyebrow="Notices"
                action={<MoreLink to="/member/announcements" />}
              />
              <div>
                {NOTICES.map((n) => (
                  <Link
                    key={n.title}
                    to="/member/announcements"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: "16px 28px",
                      borderTop: "1px solid #f1ede4",
                      textDecoration: "none",
                      color: "var(--kb-ink-900)",
                    }}
                  >
                    <span
                      style={{
                        width: 3,
                        alignSelf: "stretch",
                        borderRadius: 2,
                        background: TAG_BAR[n.tag] ?? "#ccc",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 15.5,
                        fontWeight: 800,
                        color: "#0a0a0a",
                        minWidth: 40,
                        flexShrink: 0,
                      }}
                    >
                      {n.tag}
                    </span>
                    <span style={{ fontSize: 16.5, fontWeight: 500, color: "var(--kb-ink-900)", flex: 1 }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--kb-ink-500)", flexShrink: 0 }}>
                      {n.date}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT — calendar */}
          <CalendarPanel />
        </div>

      </div>
    </div>
  );
}
