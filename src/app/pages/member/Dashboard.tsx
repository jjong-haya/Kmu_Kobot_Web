import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Inbox,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  loadDashboardData,
  type DashboardData,
  type DashboardSection,
} from "../../api/dashboard";
import { getNoticeDetailPath } from "../../api/announcement-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

type EventKind = "booking" | "deadline";
type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: EventKind;
  meta: string;
};

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const KIND_COLOR: Record<EventKind, string> = {
  booking: "var(--kb-navy-800)",
  deadline: "#dc2626",
};

const KIND_LABEL: Record<EventKind, string> = {
  booking: "예약",
  deadline: "마감",
};

const KIND_CHIP: Record<EventKind, { bg: string; fg: string; dot: string }> = {
  booking: { bg: "#e3ecfb", fg: "#163b86", dot: "var(--kb-navy-800)" },
  deadline: { bg: "#fde8e6", fg: "#9b1c1c", dot: "#dc2626" },
};

const TAG_BAR: Record<string, string> = {
  공지: "#2a52a3",
  알림: "#15803d",
};

const SECTION_LABEL: Record<DashboardSection, string> = {
  notifications: "알림",
  notices: "공지",
  bookings: "공간 예약",
  contactRequests: "연락 요청",
};

const DASHBOARD_CALENDAR_MY_ONLY_KEY = "kobot.dashboard.calendar.myOnly";

function readDashboardCalendarMyOnlyPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DASHBOARD_CALENDAR_MY_ONLY_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDashboardCalendarMyOnlyPreference(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DASHBOARD_CALENDAR_MY_ONLY_KEY, value ? "true" : "false");
  } catch {
    // Preference persistence is a convenience; the checkbox still works in memory.
  }
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...CARD_STYLE, ...style }}>{children}</div>;
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

function MoreLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      aria-label="더 보기"
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
      className="hover:bg-[#f5f3ee]"
    >
      <ArrowRight style={{ width: 16, height: 16 }} />
    </Link>
  );
}

function EmptyBlock({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        padding: "42px 28px",
        textAlign: "center",
        color: "var(--kb-ink-500)",
        fontSize: 14.5,
        borderTop: "1px solid #f1ede4",
      }}
    >
      {icon}
      <div>{children}</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <EmptyBlock
      icon={
        <Loader2
          style={{
            width: 24,
            height: 24,
            margin: "0 auto 10px",
            color: "var(--kb-ink-300)",
          }}
          className="animate-spin"
        />
      }
    >
      불러오는 중...
    </EmptyBlock>
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthDay(value: string | Date) {
  const date = typeof value === "string" ? parseDateKey(value) : value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function bookingTypeLabel(type: string) {
  switch (type) {
    case "meeting":
      return "회의";
    case "study":
      return "스터디";
    case "personal":
      return "개인";
    default:
      return "예약";
  }
}

function buildCalendarEvents(data: DashboardData, options: { onlyMine?: boolean } = {}): CalendarEvent[] {
  const bookingEvents = data.bookings
    .filter((booking) => !options.onlyMine || booking.isMine)
    .map((booking) => ({
      id: `booking-${booking.id}`,
      date: booking.date,
      title: booking.title,
      kind: "booking" as const,
      meta: `${booking.start}-${booking.end} · ${bookingTypeLabel(booking.type)}`,
    }));

  const contactEvents = data.contactRequests.map((request) => ({
    id: `contact-${request.id}`,
    date: toDateKey(new Date(request.expiresAt)),
    title: "연락 요청 응답 마감",
    kind: "deadline" as const,
    meta: formatDateTime(request.expiresAt),
  }));

  return [...bookingEvents, ...contactEvents].sort((a, b) =>
    a.date === b.date ? a.title.localeCompare(b.title, "ko") : a.date.localeCompare(b.date),
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

function CalendarPanel({
  events,
  myOnly,
  onMyOnlyChange,
}: {
  events: CalendarEvent[];
  myOnly: boolean;
  onMyOnlyChange: (next: boolean) => void;
}) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const current = map.get(event.date) ?? [];
      current.push(event);
      map.set(event.date, current);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const todayKey = toDateKey(today);
    return events.filter((event) => event.date >= todayKey).slice(0, 5);
  }, [events, today]);

  const cells: Array<Date | null> = [];
  if (selected) {
    const weekStart = startOfWeek(selected);
    for (let i = 0; i < 7; i += 1) cells.push(addDays(weekStart, i));
  } else {
    const monthStart = startOfMonth(cursor);
    const startWeekday = monthStart.getDay();
    const dim = daysInMonth(cursor);
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let i = 1; i <= dim; i += 1) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    }
    while (cells.length % 7 !== 0) cells.push(null);
  }

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  const selectedKey = selected ? toDateKey(selected) : null;
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) ?? [] : [];
  const cellMin = selected ? 90 : 64;

  return (
    <Card
      style={{
        padding: 0,
        position: "sticky",
        top: 80,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "20px 24px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
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
            캘린더 {selected ? "· 주간" : ""}
          </div>
          <h2
            className="kb-display"
            style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}
          >
            {monthLabel}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 28,
              padding: "0 8px",
              border: "1px solid #ebe8e0",
              borderRadius: 6,
              background: myOnly ? "#f5f8ff" : "#fff",
              color: myOnly ? "var(--kb-navy-800)" : "var(--kb-ink-700)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={myOnly}
              onChange={(event) => onMyOnlyChange(event.target.checked)}
              style={{ width: 14, height: 14, accentColor: "var(--kb-navy-800)", margin: 0 }}
            />
            내 일정만 보기
          </label>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ ...navBtn, width: "auto", padding: "0 10px", fontSize: 11 }}
            >
              월간
            </button>
          ) : (
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

      <div
        className="kb-mono"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 16px",
          fontSize: 12,
          color: "var(--kb-ink-500)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {dayLabels.map((day, index) => (
          <div
            key={day}
            style={{
              textAlign: "center",
              padding: "8px 0 4px",
              color: index === 0 ? "#dc2626" : index === 6 ? "var(--kb-navy-800)" : "var(--kb-ink-500)",
              fontWeight: 600,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 16px 16px",
          gap: 0,
        }}
      >
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} style={{ minHeight: cellMin }} />;

          const key = toDateKey(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = sameDate(date, today);
          const isSelected = selected ? sameDate(date, selected) : false;
          const dow = date.getDay();
          const dimColor =
            dow === 0 ? "#dc2626" : dow === 6 ? "var(--kb-navy-800)" : "var(--kb-ink-700)";
          const visibleSlots = selected ? 3 : 2;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(isSelected ? null : date)}
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
                    background: isSelected ? "#0a0a0a" : "transparent",
                    border: isToday && !isSelected ? "1px solid var(--kb-navy-800)" : "1px solid transparent",
                    color: isSelected ? "#fff" : isToday ? "var(--kb-navy-800)" : dimColor,
                    fontSize: 13,
                    fontWeight: isToday || isSelected ? 700 : 500,
                  }}
                >
                  {date.getDate()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayEvents.slice(0, visibleSlots).map((event) => {
                  const chip = KIND_CHIP[event.kind];
                  return (
                    <span
                      key={event.id}
                      style={{
                        fontSize: 11,
                        lineHeight: 1.45,
                        padding: "3px 6px 3px 8px",
                        borderLeft: `3px solid ${chip.dot}`,
                        background: chip.bg,
                        color: chip.fg,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 500,
                        minHeight: 16,
                      }}
                    >
                      {event.title}
                    </span>
                  );
                })}
                {dayEvents.length > visibleSlots && (
                  <span style={{ fontSize: 10, color: "var(--kb-ink-500)", paddingLeft: 7 }}>
                    +{dayEvents.length - visibleSlots}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

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
        {(Object.keys(KIND_LABEL) as EventKind[]).map((kind) => (
          <span key={kind} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: KIND_COLOR[kind] }} />
            {KIND_LABEL[kind]}
          </span>
        ))}
      </div>

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
          {selected ? "Selected" : "다가오는"}
        </div>
        {(selected ? selectedEvents : upcoming).length === 0 ? (
          <div style={{ padding: "12px 24px 18px", fontSize: 13.5, color: "var(--kb-ink-500)" }}>
            일정이 없습니다.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: "0 0 12px" }}>
            {(selected ? selectedEvents : upcoming).map((event) => {
              const chip = KIND_CHIP[event.kind];
              return (
                <li
                  key={`${event.date}-${event.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "54px 1fr",
                    padding: "10px 24px",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    className="kb-mono"
                    style={{
                      fontSize: 13,
                      color: chip.fg,
                      fontWeight: 700,
                    }}
                  >
                    {formatMonthDay(event.date)}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14.5,
                        color: "var(--kb-ink-900)",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--kb-ink-500)" }}>
                      {event.meta}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function DashboardNoticePanel({
  loading,
  data,
}: {
  loading: boolean;
  data: DashboardData | null;
}) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <CardHeader eyebrow="공지" action={<MoreLink to="/member/announcements" />} />
      {loading && !data ? (
        <LoadingBlock />
      ) : !data || data.notices.length === 0 ? (
        <EmptyBlock
          icon={
            <Inbox
              style={{
                width: 26,
                height: 26,
                margin: "0 auto 10px",
                color: "var(--kb-ink-300)",
              }}
            />
          }
        >
          게시된 공지가 없습니다.
        </EmptyBlock>
      ) : (
        <div>
          {data.notices.map((notice) => (
            <Link
              key={notice.id}
              to={getNoticeDetailPath(notice.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "16px 28px",
                borderTop: "1px solid #f1ede4",
                textDecoration: "none",
                color: "var(--kb-ink-900)",
              }}
              className="hover:bg-[#fafaf6]"
            >
              <span
                style={{
                  width: 3,
                  alignSelf: "stretch",
                  borderRadius: 2,
                  background: TAG_BAR["공지"],
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
                공지
              </span>
              <span
                style={{
                  fontSize: 16.5,
                  fontWeight: 500,
                  color: "var(--kb-ink-900)",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {notice.title}
              </span>
              <span style={{ fontSize: 14, color: "var(--kb-ink-500)", flexShrink: 0 }}>
                {formatDateTime(notice.createdAt).split(" ")[0]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 10,
        color: "#991b1b",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 10px",
          borderRadius: 7,
          border: "1px solid #fecaca",
          background: "#fff",
          color: "#991b1b",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        <RefreshCcw style={{ width: 13, height: 13 }} />
        다시
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { authData } = useAuth();
  const userId = authData.profile.id ?? "";
  const displayName = useMemo(
    () =>
      authData.profile.displayName ??
      authData.profile.fullName ??
      authData.profile.email?.split("@")[0] ??
      "Member",
    [authData],
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarMyOnly, setCalendarMyOnly] = useState(readDashboardCalendarMyOnlyPreference);

  async function load() {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const nextData = await loadDashboardData(userId);
      setData(nextData);
      if (nextData.failedSections.length > 0) {
        setError(
          `일부 데이터를 불러오지 못했습니다: ${nextData.failedSections
            .map((section) => SECTION_LABEL[section])
            .join(", ")}`,
        );
      }
    } catch (err) {
      setError(sanitizeUserError(err, "대시보드 데이터를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  function handleCalendarMyOnlyChange(next: boolean) {
    setCalendarMyOnly(next);
    writeDashboardCalendarMyOnlyPreference(next);
  }

  const calendarEvents = useMemo(
    () => (data ? buildCalendarEvents(data, { onlyMine: calendarMyOnly }) : []),
    [calendarMyOnly, data],
  );
  const summary = data
    ? `읽지 않은 알림 ${data.unreadNotificationCount}건`
    : "실제 데이터를 불러오는 중";

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
              Member Home
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
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · {summary}
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

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <style>{`
          @media (min-width: 1100px) {
            .kb-dash-grid {
              grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr) !important;
              align-items: start;
            }
          }
        `}</style>
        <div className="kb-dash-grid grid gap-4 items-stretch" style={{ gridTemplateColumns: "1fr" }}>
          <DashboardNoticePanel loading={loading} data={data} />
          <CalendarPanel
            events={calendarEvents}
            myOnly={calendarMyOnly}
            onMyOnlyChange={handleCalendarMyOnlyChange}
          />
        </div>
      </div>
    </div>
  );
}
