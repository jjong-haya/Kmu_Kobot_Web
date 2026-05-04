import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Lock,
  MapPin,
  Monitor,
  Plus,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import {
  createBooking,
  listBookingsInRange,
  type SpaceBooking as DbSpaceBooking,
} from "../../api/space-bookings";
import { sanitizeUserError } from "../../utils/sanitize-error";

/* ───── types & data ───── */

type ReservationType = "meeting" | "study" | "personal";
type ReservationScope = "exclusive" | "desk" | "open";

type Reservation = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  organizer: string;
  type: ReservationType;
  attendees: number;
  scope: ReservationScope;
};

const TYPE_META: Record<
  ReservationType,
  { label: string; bg: string; fg: string; bar: string }
> = {
  meeting: {
    label: "회의",
    bg: "#e3ecfb",
    fg: "#163b86",
    bar: "var(--kb-navy-800)",
  },
  study: {
    label: "스터디",
    bg: "#dff4e2",
    fg: "#15602e",
    bar: "#15803d",
  },
  personal: {
    label: "개인",
    bg: "#f3e8ff",
    fg: "#6b21a8",
    bar: "#9333ea",
  },
};

const SCOPE_META: Record<
  ReservationScope,
  { label: string; desc: string; icon: typeof Lock }
> = {
  exclusive: {
    label: "전체 단독 사용",
    desc: "동아리실 전체 점유 · 다른 예약 불가",
    icon: Lock,
  },
  desk: {
    label: "책상만 사용",
    desc: "특정 자리만 사용 · 다른 활동과 공유",
    icon: Monitor,
  },
  open: {
    label: "자유 출입",
    desc: "예약은 잡되 부원 자유 출입 가능",
    icon: DoorOpen,
  },
};

// reservations are now loaded from DB via listBookingsInRange().
// Type is shared with DB API (SpaceBooking type alias = DbSpaceBooking).
function fromDbBooking(b: DbSpaceBooking): Reservation {
  return {
    id: b.id,
    title: b.title,
    date: b.date,
    start: b.start,
    end: b.end,
    organizer: b.organizer,
    type: b.type,
    attendees: b.attendees,
    scope: b.scope,
  };
}

/* ───── shared container ───── */

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

/* ───── helpers ───── */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDate(a: string, b: string) {
  return a === b;
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();

  const cells: { date: Date; iso: string; inMonth: boolean }[] = [];

  // previous month tail
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevLast - i);
    cells.push({ date: d, iso: fmtDate(d), inMonth: false });
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: dt, iso: fmtDate(dt), inMonth: true });
  }
  // pad next month head to fill weeks
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, iso: fmtDate(next), inMonth: false });
  }
  // ensure at least 6 rows
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, iso: fmtDate(next), inMonth: false });
  }
  return cells;
}

function reservationsByDate(items: Reservation[]) {
  const map = new Map<string, Reservation[]>();
  for (const r of items) {
    const arr = map.get(r.date) ?? [];
    arr.push(r);
    map.set(r.date, arr);
  }
  // sort by start time
  for (const arr of map.values()) {
    arr.sort((a, b) => a.start.localeCompare(b.start));
  }
  return map;
}

/* ───── reservation modal ───── */

function ReservationModal({
  defaultDate,
  defaultOrganizer,
  onClose,
  onSave,
}: {
  defaultDate: string;
  defaultOrganizer: string;
  onClose: () => void;
  onSave: (r: Reservation) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");
  const [type, setType] = useState<ReservationType>("meeting");
  const [organizer, setOrganizer] = useState(defaultOrganizer);
  const [attendees, setAttendees] = useState(2);
  const [scope, setScope] = useState<ReservationScope>("desk");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !organizer.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        id: `u-${Date.now()}`,
        title: title.trim(),
        date,
        start,
        end,
        organizer: organizer.trim(),
        type,
        attendees,
        scope,
      });
    } catch (err) {
      setError(sanitizeUserError(err, "저장에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  }

  // close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14.5,
    border: "1px solid #e8e8e4",
    borderRadius: 8,
    outline: "none",
    fontFamily: "inherit",
    color: "var(--kb-ink-900)",
    background: "#fff",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--kb-ink-700)",
    marginBottom: 6,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        overflowY: "auto",
        animation: "kb-fade-in 180ms ease-out",
      }}
    >
      <style>{`
        @keyframes kb-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes kb-pop-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.1)",
          overflow: "hidden",
          fontFamily: "inherit",
          animation: "kb-pop-in 220ms ease-out",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          <h3
            className="kb-display"
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: 0,
              color: "var(--kb-ink-900)",
            }}
          >
            새 예약 만들기
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--kb-ink-500)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* form body */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* title */}
          <div>
            <label htmlFor="r-title" style={labelStyle}>
              제목
            </label>
            <input
              id="r-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: SLAM 스터디 1주차"
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          {/* type */}
          <div>
            <label style={labelStyle}>유형</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {(Object.keys(TYPE_META) as ReservationType[]).map((t) => {
                const tm = TYPE_META[t];
                const sel = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 8,
                      border: sel
                        ? `2px solid ${tm.bar}`
                        : "1px solid #ebe8e0",
                      background: sel ? tm.bg : "#fff",
                      color: sel ? tm.fg : "var(--kb-ink-700)",
                      fontSize: 14,
                      fontWeight: sel ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: tm.bar,
                        flexShrink: 0,
                      }}
                    />
                    {tm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* date */}
          <div>
            <label htmlFor="r-date" style={labelStyle}>
              날짜
            </label>
            <input
              id="r-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* time range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="r-start" style={labelStyle}>
                시작
              </label>
              <input
                id="r-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="r-end" style={labelStyle}>
                종료
              </label>
              <input
                id="r-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* organizer + attendees */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="r-org" style={labelStyle}>
                주최자
              </label>
              <input
                id="r-org"
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="예: 김하린"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="r-att" style={labelStyle}>
                참여 인원
              </label>
              <input
                id="r-att"
                type="number"
                value={attendees}
                onChange={(e) =>
                  setAttendees(Math.max(1, parseInt(e.target.value || "1", 10)))
                }
                min={1}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* scope — usage mode */}
          <div>
            <label style={labelStyle}>사용 범위</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {(Object.keys(SCOPE_META) as ReservationScope[]).map((s) => {
                const sm = SCOPE_META[s];
                const Icon = sm.icon;
                const sel = scope === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      border: sel
                        ? "2px solid #0a0a0a"
                        : "1px solid #ebe8e0",
                      background: sel ? "#fafaf6" : "#fff",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "all 120ms",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: sel ? "#0a0a0a" : "#f1ede4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        style={{
                          width: 18,
                          height: 18,
                          color: sel ? "#fff" : "var(--kb-ink-500)",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--kb-ink-900)",
                          marginBottom: 2,
                        }}
                      >
                        {sm.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--kb-ink-500)",
                        }}
                      >
                        {sm.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              margin: "0 24px 14px",
              padding: "10px 14px",
              fontSize: 13,
              color: "#dc2626",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* footer */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 24px",
            borderTop: "1px solid #f1ede4",
            background: "#fafaf9",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #ebe8e0",
              background: "#fff",
              borderRadius: 8,
              cursor: saving ? "not-allowed" : "pointer",
              color: "var(--kb-ink-700)",
              fontFamily: "inherit",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              background: saving ? "#6a6a6a" : "#0a0a0a",
              color: "#fff",
              borderRadius: 8,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {saving ? "저장 중..." : "예약 추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ───── page ───── */

export default function SpaceBooking() {
  const { authData } = useAuth();
  const currentUserName =
    authData.profile.fullName ??
    authData.profile.displayName ??
    authData.profile.email?.split("@")[0] ??
    "";
  const currentUserId = authData.profile.id;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedIso, setSelectedIso] = useState<string | null>(fmtDate(today));
  const [displayIso, setDisplayIso] = useState<string | null>(fmtDate(today));
  const [modalOpen, setModalOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // fetch reservations for the visible month (with padding for prev/next month days shown in grid)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const fromDate = new Date(viewYear, viewMonth - 1, 25);
        const toDate = new Date(viewYear, viewMonth + 1, 7);
        const data = await listBookingsInRange(
          fmtDate(fromDate),
          fmtDate(toDate),
        );
        if (!cancelled) {
          setReservations(data.map(fromDbBooking));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            sanitizeUserError(err, "예약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth]);

  // keep last selected date for content during close animation
  useEffect(() => {
    if (selectedIso) setDisplayIso(selectedIso);
  }, [selectedIso]);

  // scroll into view on toggle (skip initial render) — wait until animation settles
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (selectedIso) {
        // only scroll if the calendar container is partially out of view
        const rect = calendarRef.current?.getBoundingClientRect();
        if (rect && rect.top < 0) {
          calendarRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        calendarRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 480);
    return () => clearTimeout(t);
  }, [selectedIso]);

  const allReservations = reservations;

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // group cells into 6 weeks of 7 days
  const weeks = useMemo(() => {
    const out: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  // when a date is selected, find which week it belongs to (-1 if not in current view)
  const selectedWeekIdx = selectedIso
    ? weeks.findIndex((w) => w.some((c) => c.iso === selectedIso))
    : -1;
  const byDate = useMemo(
    () => reservationsByDate(allReservations),
    [allReservations],
  );
  const selectedReservations = displayIso ? (byDate.get(displayIso) ?? []) : [];

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const totalThisMonth = allReservations.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return y === viewYear && m === viewMonth + 1;
  }).length;

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  return (
    <div
      className="kb-root sb-page"
      style={{
        minHeight: "calc(100vh - 4rem)",
        background: "#ffffff",
      }}
    >
      <style>{`
        .sb-page {
          margin: -32px;
          padding: 32px;
        }
        @media (max-width: 768px) {
          .sb-page { margin: -32px -16px; padding: 16px 12px; }
          .sb-header { flex-direction: column; align-items: stretch !important; gap: 16px !important; }
          .sb-header-cta { width: 100%; justify-content: center; }
          .sb-toolbar { flex-direction: column; align-items: stretch !important; gap: 12px !important; padding: 14px 16px !important; }
          .sb-toolbar-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .sb-legend { display: none !important; }
          .sb-cell { min-height: 70px !important; padding: 6px 4px 4px !important; }
          .sb-cell-num { font-size: 12px !important; }
          .sb-chip { padding: 1px 4px !important; font-size: 9.5px !important; gap: 2px !important; }
          .sb-chip-title { display: none; }
          .sb-chip-time { font-size: 9px !important; }
          .sb-cell-more { font-size: 9.5px !important; padding: 0 4px !important; }
          .sb-weekday { padding: 8px 4px !important; font-size: 11px !important; }
          .sb-detail-header { flex-direction: column; align-items: flex-start !important; gap: 8px !important; padding: 14px 16px !important; }
          .sb-detail-row { padding: 16px !important; gap: 12px !important; flex-wrap: wrap; }
          .sb-detail-time { width: 64px !important; }
          .sb-detail-time-start { font-size: 14px !important; }
          .sb-detail-actions { width: 100%; }
          .sb-detail-actions button { width: 100%; }
          .sb-card-pad { padding: 14px 16px !important; }
          .sb-month { font-size: 18px !important; }
          .sb-page-title { font-size: 24px !important; }
          .sb-page-sub { display: block; margin-left: 0 !important; margin-top: 4px; font-size: 14px !important; }
        }
        @media (max-width: 480px) {
          .sb-cell { min-height: 70px !important; padding: 5px 4px 5px !important; align-items: stretch !important; }
          .sb-cell-count { display: none !important; }
          .sb-cell-chips {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            width: 100%;
            margin-top: 2px;
          }
          .sb-chip {
            padding: 1px 4px !important;
            font-size: 9.5px !important;
            border-radius: 3px !important;
            gap: 0 !important;
            justify-content: flex-start;
            line-height: 1.2;
          }
          .sb-chip-time {
            font-size: 9.5px !important;
            font-weight: 700 !important;
          }
          .sb-chip-title { display: none; }
          .sb-cell-more { font-size: 9.5px !important; padding: 0 4px !important; }
        }
      `}</style>
      <div
        style={{
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {/* ─── page header ─── */}
        <div
          className="sb-header"
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
              Space Booking
            </div>
            <h1
              className="kb-display sb-page-title"
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
                color: "#0a0a0a",
              }}
            >
              공간 예약
              <span
                className="sb-page-sub"
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · {monthLabel} {loading ? "불러오는 중..." : `${totalThisMonth}건`}
              </span>
            </h1>
            {loadError && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                }}
              >
                {loadError}
              </div>
            )}
          </div>

        </div>

        {/* ─── calendar container ─── */}
        <div ref={calendarRef} style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
          {/* calendar header */}
          <div
            className="sb-toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderBottom: "1px solid #f1ede4",
            }}
          >
            <div className="sb-toolbar-row" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2
                className="kb-display sb-month"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "var(--kb-ink-900)",
                }}
              >
                {monthLabel}
              </h2>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="이전 달"
                  style={{
                    width: 30,
                    height: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ebe8e0",
                    background: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "var(--kb-ink-700)",
                  }}
                >
                  <ChevronLeft style={{ width: 15, height: 15 }} />
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="다음 달"
                  style={{
                    width: 30,
                    height: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ebe8e0",
                    background: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "var(--kb-ink-700)",
                  }}
                >
                  <ChevronRight style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>

            <div className="sb-toolbar-row" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* legend */}
              <div
                className="sb-legend"
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12.5,
                  color: "var(--kb-ink-500)",
                }}
              >
                {(Object.keys(TYPE_META) as ReservationType[]).map((t) => (
                  <span
                    key={t}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: TYPE_META[t].bar,
                      }}
                    />
                    {TYPE_META[t].label}
                  </span>
                ))}
              </div>

            </div>
          </div>

          {/* weekday header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: "1px solid #f1ede4",
              background: "#fafaf9",
            }}
          >
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className="sb-weekday"
                style={{
                  padding: "10px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color:
                    i === 0
                      ? "#dc2626"
                      : i === 6
                        ? "#2563eb"
                        : "var(--kb-ink-500)",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* calendar grid — collapses to selected week when a date is picked */}
          <div>
            {weeks.map((week, weekIdx) => {
              const isSelectedWeek = weekIdx === selectedWeekIdx;
              const isCollapsed = selectedWeekIdx >= 0 && !isSelectedWeek;
              return (
                <div
                  key={weekIdx}
                  style={{
                    display: "grid",
                    gridTemplateRows: isCollapsed ? "0fr" : "1fr",
                    opacity: isCollapsed ? 0 : 1,
                    transition:
                      "grid-template-rows 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                    }}
                  >
                  {week.map((cell, colIdx) => {
                    const idx = weekIdx * 7 + colIdx;
                    const reservations = byDate.get(cell.iso) ?? [];
                    const isToday = cell.iso === fmtDate(today);
                    const isSelected = selectedIso !== null && isSameDate(cell.iso, selectedIso);
                    const weekday = cell.date.getDay();

              return (
                <button
                  key={`${cell.iso}-${idx}`}
                  type="button"
                  onClick={() =>
                    setSelectedIso((prev) => (prev === cell.iso ? null : cell.iso))
                  }
                  className="sb-cell hover:bg-[#fafaf6]"
                  style={{
                    padding: "10px 10px 8px",
                    minHeight: 110,
                    borderRight:
                      (idx + 1) % 7 !== 0 ? "1px solid #f1ede4" : "none",
                    borderBottom:
                      idx < 35 ? "1px solid #f1ede4" : "none",
                    background: isSelected
                      ? "#fafaf6"
                      : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    fontFamily: "inherit",
                    transition: "background 120ms",
                    position: "relative",
                  }}
                >
                  {/* selection indicator */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        border: "2px solid #0a0a0a",
                        borderRadius: 6,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* date number */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      className="sb-cell-num"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: isToday ? 22 : "auto",
                        height: isToday ? 22 : "auto",
                        borderRadius: isToday ? "50%" : 0,
                        background: isToday ? "#0a0a0a" : "transparent",
                        color: isToday
                          ? "#fff"
                          : !cell.inMonth
                            ? "var(--kb-ink-300)"
                            : weekday === 0
                              ? "#dc2626"
                              : weekday === 6
                                ? "#2563eb"
                                : "var(--kb-ink-900)",
                        fontSize: 13,
                        fontWeight: isToday ? 700 : 600,
                        padding: isToday ? 0 : "0 4px",
                      }}
                    >
                      {cell.date.getDate()}
                    </span>
                    {reservations.length > 0 && !isToday && (
                      <span
                        className="sb-cell-count"
                        style={{
                          fontSize: 11,
                          color: "var(--kb-ink-400)",
                          fontWeight: 600,
                        }}
                      >
                        {reservations.length}
                      </span>
                    )}
                  </div>

                  {/* reservation chips */}
                  <div
                    className="sb-cell-chips"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    {reservations.slice(0, 3).map((r) => {
                      const tm = TYPE_META[r.type];
                      return (
                        <div
                          key={r.id}
                          className="sb-chip"
                          style={{
                            ["--chip-bar" as string]: tm.bar,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            background: tm.bg,
                            color: tm.fg,
                            padding: "2px 6px",
                            borderRadius: 3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: 600,
                          }}
                        >
                          <span
                            className="kb-mono sb-chip-time"
                            style={{ fontSize: 10, fontWeight: 700 }}
                          >
                            {r.start}
                          </span>
                          <span
                            className="sb-chip-title"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontWeight: 500,
                            }}
                          >
                            {r.title}
                          </span>
                        </div>
                      );
                    })}
                    {reservations.length > 3 && (
                      <div
                        className="sb-cell-more"
                        style={{
                          fontSize: 10.5,
                          color: "var(--kb-ink-500)",
                          padding: "0 6px",
                          fontWeight: 600,
                        }}
                      >
                        +{reservations.length - 3}건 더
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── selected date detail (animated) ─── */}
        <div
          ref={detailRef}
          style={{
            display: "grid",
            gridTemplateRows: selectedIso ? "1fr" : "0fr",
            opacity: selectedIso ? 1 : 0,
            transition:
              "grid-template-rows 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
        <div style={{ overflow: "hidden" }}>
        <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
          <div
            className="sb-detail-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderBottom: "1px solid #f1ede4",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h3
                className="kb-display"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "var(--kb-ink-900)",
                }}
              >
                {(() => {
                  if (!displayIso) return "";
                  const [y, m, d] = displayIso.split("-").map(Number);
                  const dt = new Date(y, m - 1, d);
                  return `${m}월 ${d}일 (${WEEKDAYS[dt.getDay()]})`;
                })()}
              </h3>
              <span
                style={{
                  fontSize: 13.5,
                  color: "var(--kb-ink-500)",
                }}
              >
                예약 {selectedReservations.length}건
              </span>
            </div>
          </div>

          {selectedReservations.length === 0 ? (
            <div
              style={{
                padding: "56px 28px",
                textAlign: "center",
                color: "var(--kb-ink-500)",
                fontSize: 15,
              }}
            >
              <MapPin
                style={{
                  width: 30,
                  height: 30,
                  margin: "0 auto 12px",
                  color: "var(--kb-ink-300)",
                }}
              />
              이 날 예약된 일정이 없습니다.
            </div>
          ) : (
            <div>
              {selectedReservations.map((r, i) => {
                const tm = TYPE_META[r.type];
                return (
                  <div
                    key={r.id}
                    className="sb-detail-row hover:bg-[#fafaf6]"
                    style={{
                      display: "flex",
                      gap: 18,
                      padding: "20px 28px",
                      borderTop: i === 0 ? "none" : "1px solid #f1ede4",
                      cursor: "pointer",
                      transition: "background 120ms",
                      position: "relative",
                    }}
                  >
                    {/* left color bar */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: tm.bar,
                      }}
                    />

                    {/* time */}
                    <div
                      className="sb-detail-time"
                      style={{
                        flexShrink: 0,
                        width: 90,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div
                        className="kb-mono sb-detail-time-start"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--kb-ink-900)",
                        }}
                      >
                        {r.start}
                      </div>
                      <div
                        className="kb-mono"
                        style={{
                          fontSize: 12.5,
                          color: "var(--kb-ink-400)",
                        }}
                      >
                        ~ {r.end}
                      </div>
                    </div>

                    {/* content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "2px 10px",
                            borderRadius: 4,
                            background: tm.bg,
                            color: tm.fg,
                          }}
                        >
                          {tm.label}
                        </span>
                        <span
                          style={{
                            fontSize: 16.5,
                            fontWeight: 600,
                            color: "var(--kb-ink-900)",
                          }}
                        >
                          {r.title}
                        </span>
                      </div>
                      {r.description && (
                        <div
                          style={{
                            fontSize: 14,
                            color: "var(--kb-ink-500)",
                            lineHeight: 1.55,
                            marginBottom: 8,
                          }}
                        >
                          {r.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          rowGap: 4,
                          fontSize: 13,
                          color: "var(--kb-ink-400)",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <User style={{ width: 12, height: 12 }} />
                          {r.organizer}
                        </span>
                        <span style={{ whiteSpace: "nowrap" }}>참여 {r.attendees}명</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          <Clock style={{ width: 12, height: 12 }} />
                          {(() => {
                            const [sh, sm] = r.start.split(":").map(Number);
                            const [eh, em] = r.end.split(":").map(Number);
                            const mins = eh * 60 + em - (sh * 60 + sm);
                            const h = Math.floor(mins / 60);
                            const m = mins % 60;
                            return `${h > 0 ? `${h}시간 ` : ""}${m > 0 ? `${m}분` : ""}`.trim();
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* detail link */}
                    <div className="sb-detail-actions" style={{ flexShrink: 0, alignSelf: "center" }}>
                      <button
                        type="button"
                        style={{
                          padding: "7px 14px",
                          fontSize: 13,
                          fontWeight: 500,
                          border: "1px solid #ebe8e0",
                          background: "#fff",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "var(--kb-ink-700)",
                          fontFamily: "inherit",
                          height: "fit-content",
                        }}
                      >
                        자세히
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
        </div>

        {/* ─── new reservation button (below) ─── */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            <Plus style={{ width: 15, height: 15 }} />새 예약
          </button>
        </div>

        {modalOpen && (
          <ReservationModal
            defaultDate={selectedIso ?? fmtDate(today)}
            defaultOrganizer={currentUserName}
            onClose={() => setModalOpen(false)}
            onSave={async (r) => {
              if (!currentUserId) {
                throw new Error("로그인 상태를 확인할 수 없습니다.");
              }
              const created = await createBooking({
                title: r.title,
                date: r.date,
                start: r.start,
                end: r.end,
                organizerId: currentUserId,
                organizerName: r.organizer,
                type: r.type,
                scope: r.scope,
                attendees: r.attendees,
              });
              const newReservation = fromDbBooking(created);
              setReservations((prev) => [...prev, newReservation]);
              setModalOpen(false);
              // jump to that date
              const [y, m] = newReservation.date.split("-").map(Number);
              setViewYear(y);
              setViewMonth(m - 1);
              setSelectedIso(newReservation.date);
            }}
          />
        )}
      </div>
    </div>
  );
}
