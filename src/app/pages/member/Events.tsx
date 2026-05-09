import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Edit3,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
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
  getEventEditPath,
  getEventParticipation,
  getEventStatus,
  listEvents,
  type ClubEvent,
  type EventStatus,
} from "../../api/events";
import { EVENT_CREATE_PERMISSIONS } from "../../api/event-policy.js";
import { useAuth } from "../../auth/useAuth";
import { buildEventImage, hasEventImage } from "../../utils/event-visuals";
import { sanitizeUserError } from "../../utils/sanitize-error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

type EventViewMode = "card" | "list";

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

function isEventCardControl(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a,button,[role='menuitem']"));
}

function EventActionsMenu({ event, canEdit }: { event: ClubEvent; canEdit: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${event.title} 작업 메뉴`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#64748b] shadow-[0_6px_18px_rgba(15,23,42,0.12)] transition-colors hover:bg-white hover:text-[#103078]"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>행사 작업</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={getEventDetailPath(event.id)} className="cursor-pointer">
            자세히 보기
          </Link>
        </DropdownMenuItem>
        {canEdit ? (
          <DropdownMenuItem asChild>
            <Link to={getEventEditPath(event.id)} className="cursor-pointer">
              <Edit3 className="h-4 w-4" />
              수정
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EventCard({ event, canEdit }: { event: ClubEvent; canEdit: boolean }) {
  const navigate = useNavigate();
  const status = getEventStatus(event);
  const meta = STATUS_META[status];
  const enabledFeatureKeys = getEnabledEventFeatureKeys(event);
  const participation = getEventParticipation(event);
  const eventImageUploaded = hasEventImage(event);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={(clickEvent) => {
        if (isEventCardControl(clickEvent.target)) return;
        navigate(getEventDetailPath(event.id));
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
        if (isEventCardControl(keyEvent.target)) return;
        keyEvent.preventDefault();
        navigate(getEventDetailPath(event.id));
      }}
      className="group flex h-full w-full flex-col rounded-[8px] border border-[#e8e6df] bg-white p-3 text-left shadow-[0_1px_4px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#d5d1c6] hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)]"
    >
      <div className="relative aspect-video overflow-hidden rounded-[6px] border border-[#eeebe3] bg-[#f3f2ee]">
        <img
          src={buildEventImage(event)}
          alt={`${event.title} 대표 이미지`}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.025] ${
            eventImageUploaded ? "object-cover" : "object-contain p-8"
          }`}
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
        <div className="absolute right-3 top-3">
          <EventActionsMenu event={event} canEdit={canEdit} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
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

        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#f0eee8] pt-3">
          {participation ? (
            participation.external ? (
              <a
                href={participation.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-3 text-[13px] font-black text-white no-underline transition-colors hover:bg-[#061b4c]"
              >
                참여하기
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                to={participation.href}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-3 text-[13px] font-black text-white no-underline transition-colors hover:bg-[#061b4c]"
              >
                참여하기
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )
          ) : null}
          <Link
            to={getEventDetailPath(event.id)}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-black text-[#312f2c] no-underline transition-colors hover:border-[#103078] hover:text-[#103078]"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </article>
  );
}

function EventListItem({ event, canEdit }: { event: ClubEvent; canEdit: boolean }) {
  const navigate = useNavigate();
  const status = getEventStatus(event);
  const meta = STATUS_META[status];
  const enabledFeatureKeys = getEnabledEventFeatureKeys(event);
  const participation = getEventParticipation(event);
  const eventImageUploaded = hasEventImage(event);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={(clickEvent) => {
        if (isEventCardControl(clickEvent.target)) return;
        navigate(getEventDetailPath(event.id));
      }}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
        if (isEventCardControl(keyEvent.target)) return;
        keyEvent.preventDefault();
        navigate(getEventDetailPath(event.id));
      }}
      className="group grid gap-4 rounded-[8px] border border-[#e8e6df] bg-white p-3 text-left shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[#d5d1c6] hover:shadow-[0_10px_24px_rgba(15,23,42,0.09)] sm:grid-cols-[132px_minmax(0,1fr)_auto]"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] border border-[#eeebe3] bg-[#f3f2ee] sm:aspect-[4/3]">
        <img
          src={buildEventImage(event)}
          alt={`${event.title} 대표 이미지`}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.025] ${
            eventImageUploaded ? "object-cover" : "object-contain p-5"
          }`}
          draggable={false}
        />
      </div>

      <div className="min-w-0 py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold"
              style={{
                background: meta.bg,
                borderColor: meta.border,
                color: meta.fg,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
              {EVENT_STATUS_LABELS[status]}
            </span>
            {enabledFeatureKeys.slice(0, 3).map((key) => {
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
          </div>
          <EventActionsMenu event={event} canEdit={canEdit} />
        </div>

        <h2 className="m-0 mt-3 truncate text-[19px] font-black tracking-normal text-[#111111]">
          {event.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-6 text-[#5f574c]">
          {event.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-[#6f6a62]">
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
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:w-[112px] sm:flex-col sm:justify-center sm:pr-2">
        {participation ? (
          participation.external ? (
            <a
              href={participation.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-3 text-[13px] font-black text-white no-underline transition-colors hover:bg-[#061b4c]"
            >
              참여하기
            </a>
          ) : (
            <Link
              to={participation.href}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-3 text-[13px] font-black text-white no-underline transition-colors hover:bg-[#061b4c]"
            >
              참여하기
            </Link>
          )
        ) : null}
        <Link
          to={getEventDetailPath(event.id)}
          className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-black text-[#103078] no-underline transition-colors hover:border-[#103078]"
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
}

export default function Events() {
  const { hasPermission, user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeStatus, setActiveStatus] = useState<EventStatus>("scheduled");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<EventViewMode>("card");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const counts = useMemo(() => countEventsByStatus(events), [events]);
  const canCreateEvent = hasPermission(...EVENT_CREATE_PERMISSIONS);
  const canEditEvent = (event: ClubEvent) =>
    hasPermission("events.manage") ||
    (hasPermission("events.create") && Boolean(event.createdBy && event.createdBy === user?.id));
  const filteredEvents = useMemo(
    () => filterEvents(events, activeStatus, search),
    [activeStatus, events, search],
  );

  useEffect(() => {
    if (eventsQuery.data) setEvents(eventsQuery.data);
    setLoading(eventsQuery.isLoading || eventsQuery.isFetching);
    setError(
      eventsQuery.isError
        ? sanitizeUserError(eventsQuery.error, "행사를 불러오지 못했습니다.")
        : null,
    );
  }, [eventsQuery.data, eventsQuery.error, eventsQuery.isError, eventsQuery.isFetching, eventsQuery.isLoading]);

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
              onClick={() => void eventsQuery.refetch()}
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

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="inline-grid grid-cols-2 gap-1 rounded-[8px] border border-[#e8e6df] bg-[#f7f6f2] p-1">
              {[
                { key: "card" as const, label: "카드", icon: LayoutGrid },
                { key: "list" as const, label: "목록", icon: List },
              ].map((option) => {
                const active = viewMode === option.key;
                const Icon = option.icon;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setViewMode(option.key)}
                    aria-pressed={active}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] px-3 text-[13px] font-bold transition-[background,color,box-shadow]"
                    style={{
                      background: active ? "#ffffff" : "transparent",
                      color: active ? "#0a0a0a" : "#6f6a62",
                      boxShadow: active ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877e]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="행사 검색"
                className="h-10 w-full rounded-[8px] border border-[#e8e6df] bg-white pl-9 pr-3 text-[14px] font-medium text-[#0a0a0a] outline-none transition-colors placeholder:text-[#aaa49a] focus:border-[#103078]"
              />
            </div>
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
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} canEdit={canEditEvent(event)} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredEvents.map((event) => (
              <EventListItem key={event.id} event={event} canEdit={canEditEvent(event)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
