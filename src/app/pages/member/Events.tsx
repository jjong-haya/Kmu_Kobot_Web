import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import {
  countEventsByStatus,
  EVENT_FEATURE_OPTIONS,
  EVENT_STATUS_FILTERS,
  EVENT_STATUS_LABELS,
  filterEvents,
  getEnabledEventFeatureKeys,
  getEventDetailPath,
  getEventStatus,
  listEvents,
  type ClubEvent,
  type EventStatus,
} from "../../api/events";
import { EVENT_CREATE_PERMISSIONS } from "../../api/event-policy.js";
import { useAuth } from "../../auth/useAuth";
import { buildEventImage } from "../../utils/event-visuals";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const STATUS_META: Record<EventStatus, { bg: string; fg: string; border: string; dot: string }> = {
  scheduled: {
    bg: "#eef5ff",
    fg: "#183b80",
    border: "#cfe1ff",
    dot: "#2563eb",
  },
  ongoing: {
    bg: "#ebf8ef",
    fg: "#17633a",
    border: "#c7ead2",
    dot: "#22a35a",
  },
  closed: {
    bg: "#f1f1ef",
    fg: "#55514c",
    border: "#dedbd1",
    dot: "#8b8780",
  },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function isSameDay(a: string, b: string) {
  const start = new Date(a);
  const end = new Date(b);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  return (
    start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) ===
    end.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatEventRange(event: ClubEvent) {
  if (isSameDay(event.startsAt, event.endsAt)) {
    return `${formatDate(event.startsAt)} - ${formatTime(event.endsAt)}`;
  }

  return `${formatDate(event.startsAt)} - ${formatDate(event.endsAt)}`;
}

function EventCard({ event }: { event: ClubEvent }) {
  const status = getEventStatus(event);
  const meta = STATUS_META[status];
  const enabledFeatureKeys = getEnabledEventFeatureKeys(event);

  return (
    <Link
      to={getEventDetailPath(event.id)}
      className="group block w-full rounded-[8px] border border-[#e8e6df] bg-white p-3 text-left no-underline shadow-[0_1px_4px_rgba(15,23,42,0.05)] outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#d5d1c6] hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)] focus-visible:border-[#103078] focus-visible:ring-2 focus-visible:ring-[#103078]/20"
    >
      <div className="relative aspect-square overflow-hidden rounded-[6px] border border-[#eeebe3] bg-[#f3f2ee]">
        <img
          src={buildEventImage(event)}
          alt={`${event.title} 대표 이미지`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
          draggable={false}
        />
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold backdrop-blur"
          style={{
            background: `${meta.bg}ee`,
            borderColor: meta.border,
            color: meta.fg,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
          {EVENT_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="px-1 pb-1 pt-3">
        <h2 className="m-0 line-clamp-1 text-[18px] font-black tracking-normal text-[#111111]">
          {event.title}
        </h2>

        <div className="mt-3 grid gap-2 border-t border-[#f0eee8] pt-3 text-[13px] text-[#6f6a62]">
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#103078]" />
            <span className="truncate">{formatEventRange(event)}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#103078]" />
            <span className="truncate">{event.location}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <UsersRound className="h-3.5 w-3.5 shrink-0 text-[#103078]" />
            <span className="truncate">{event.capacityLabel}</span>
          </span>
        </div>

        {enabledFeatureKeys.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {enabledFeatureKeys.slice(0, 2).map((key) => {
              const option = EVENT_FEATURE_OPTIONS.find((item) => item.key === key);
              if (!option) return null;
              return (
                <span
                  key={key}
                  className="rounded-full border border-[#e8e2d6] bg-[#fbfaf7] px-2 py-1 text-[11px] font-bold text-[#5f574c]"
                >
                  {option.label}
                </span>
              );
            })}
            {enabledFeatureKeys.length > 2 ? (
              <span className="rounded-full border border-[#e8e2d6] bg-[#fbfaf7] px-2 py-1 text-[11px] font-bold text-[#5f574c]">
                +{enabledFeatureKeys.length - 2}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function Events() {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeStatus, setActiveStatus] = useState<EventStatus>("scheduled");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => countEventsByStatus(events), [events]);
  const canCreateEvent = hasPermission(...EVENT_CREATE_PERMISSIONS);
  const filteredEvents = useMemo(
    () => filterEvents(events, activeStatus, search),
    [activeStatus, events, search],
  );

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      setEvents(await listEvents());
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "행사를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[#6f6a62]"
              style={{ letterSpacing: "0.14em" }}
            >
              Events
            </div>
            <h1 className="kb-display m-0 text-[32px] font-black tracking-normal text-[#0a0a0a]">
              행사
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {canCreateEvent ? (
              <Link
                to="/member/events/new"
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-3.5 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
              >
                <Plus className="h-4 w-4" />
                행사 만들기
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-semibold text-[#312f2c] transition-colors hover:border-[#cfcac0]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#efede7] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-grid grid-cols-3 gap-1 rounded-[8px] border border-[#e8e6df] bg-[#f7f6f2] p-1">
            {EVENT_STATUS_FILTERS.map((filter) => {
              const active = activeStatus === filter.key;
              const meta = STATUS_META[filter.key];

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveStatus(filter.key)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] px-3 text-[14px] font-bold transition-[background,color,box-shadow]"
                  style={{
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#0a0a0a" : "#6f6a62",
                    boxShadow: active ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
                  {filter.label}
                  <span className="text-[12px] font-semibold text-[#8d877e]">
                    {counts[filter.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877e]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="행사 검색"
              className="h-10 w-full rounded-[8px] border border-[#e8e6df] bg-white pl-9 pr-3 text-[14px] font-medium text-[#0a0a0a] outline-none transition-colors placeholder:text-[#aaa49a] focus:border-[#103078]"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-2 text-[15px] font-medium text-[#6f6a62]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            행사를 불러오는 중입니다.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[#dedbd1] bg-[#fbfaf7] px-6 text-center">
            <Clock3 className="mb-3 h-8 w-8 text-[#aaa49a]" />
            <p className="m-0 text-[16px] font-bold text-[#312f2c]">
              표시할 행사가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
