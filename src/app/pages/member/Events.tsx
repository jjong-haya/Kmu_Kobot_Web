import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  Edit3,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  Plus,
  RefreshCw,
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
import {
  EmptyState,
  ErrorFallback,
  FilterBar,
  ListGrid,
  ListSkeleton,
  PageHeader,
  StatusPill,
  ViewToggle,
  type ViewToggleOption,
} from "../../components/primitives";
import type { StatusTone } from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

type EventViewMode = "card" | "list";

const VIEW_MODE_OPTIONS: ViewToggleOption<EventViewMode>[] = [
  { value: "card", label: "카드", icon: LayoutGrid },
  { value: "list", label: "목록", icon: List },
];

const STATUS_TONE: Record<EventStatus, StatusTone> = {
  scheduled: "info",
  ongoing: "success",
  closed: "neutral",
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--kb-ink-500)] shadow-[var(--kb-shadow-md)] backdrop-blur transition-colors hover:bg-white hover:text-[var(--kb-navy-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
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
              <Edit3 className="h-4 w-4" aria-hidden />
              수정
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EventMetaRow({ event }: { event: ClubEvent }) {
  return (
    <div className="grid gap-1.5 text-[13px] text-[var(--kb-ink-500)]">
      <span className="inline-flex min-w-0 items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
        <span className="truncate">{formatEventRange(event)}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
        <span className="truncate">{event.location}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-2">
        <UsersRound className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
        <span className="truncate">{event.capacityLabel}</span>
      </span>
    </div>
  );
}

function FeatureChips({ keys, max = 2 }: { keys: string[]; max?: number }) {
  if (keys.length === 0) return null;
  const visible = keys.slice(0, max);
  const overflow = keys.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((key) => {
        const option = EVENT_FEATURE_OPTIONS.find((item) => item.key === key);
        if (!option) return null;
        return (
          <span
            key={key}
            className="rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--kb-ink-700)]"
          >
            {option.label}
          </span>
        );
      })}
      {overflow > 0 ? (
        <span className="rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--kb-ink-500)]">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function ParticipationButton({
  participation,
  className,
}: {
  participation: ReturnType<typeof getEventParticipation>;
  className?: string;
}) {
  if (!participation) return null;
  const baseClasses =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]";
  const cls = className ? `${baseClasses} ${className}` : baseClasses;
  if (participation.external) {
    return (
      <a href={participation.href} target="_blank" rel="noreferrer" className={cls}>
        참여하기
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  }
  return (
    <Link to={participation.href} className={cls}>
      참여하기
    </Link>
  );
}

function EventCard({ event, canEdit }: { event: ClubEvent; canEdit: boolean }) {
  const navigate = useNavigate();
  const status = getEventStatus(event);
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
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] text-left shadow-[var(--kb-shadow-sm)] transition-[border-color,box-shadow,transform] duration-[var(--kb-duration-normal)] ease-[var(--kb-ease-standard)] hover:-translate-y-0.5 hover:border-[var(--kb-navy-100)] hover:shadow-[var(--kb-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
    >
      <div className="relative aspect-video overflow-hidden border-b border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)]">
        <img
          src={buildEventImage(event)}
          alt={`${event.title} 대표 이미지`}
          className={`h-full w-full transition-transform duration-[var(--kb-duration-slow)] group-hover:scale-[1.025] ${
            eventImageUploaded ? "object-cover" : "object-contain p-8"
          }`}
          draggable={false}
        />
        <div className="absolute left-3 top-3">
          <StatusPill tone={STATUS_TONE[status]} dot>
            {EVENT_STATUS_LABELS[status]}
          </StatusPill>
        </div>
        <div className="absolute right-3 top-3">
          <EventActionsMenu event={event} canEdit={canEdit} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="kb-display m-0 line-clamp-1 text-[17px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)]">
          {event.title}
        </h2>
        <EventMetaRow event={event} />
        <FeatureChips keys={enabledFeatureKeys} max={2} />

        <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--kb-border-subtle)] pt-3">
          <ParticipationButton participation={participation} className="flex-1" />
          <Link
            to={getEventDetailPath(event.id)}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
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
      className="group grid cursor-pointer gap-4 px-4 py-4 text-left transition-colors duration-[var(--kb-duration-normal)] hover:bg-[var(--kb-paper-2)] focus-visible:outline-none focus-visible:bg-[var(--kb-paper-2)] sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="relative aspect-video overflow-hidden rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)] sm:aspect-[4/3]">
        <img
          src={buildEventImage(event)}
          alt={`${event.title} 대표 이미지`}
          className={`h-full w-full transition-transform duration-[var(--kb-duration-slow)] group-hover:scale-[1.025] ${
            eventImageUploaded ? "object-cover" : "object-contain p-5"
          }`}
          draggable={false}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={STATUS_TONE[status]} dot>
              {EVENT_STATUS_LABELS[status]}
            </StatusPill>
            <FeatureChips keys={enabledFeatureKeys} max={3} />
          </div>
          <div className="sm:hidden">
            <EventActionsMenu event={event} canEdit={canEdit} />
          </div>
        </div>

        <h2 className="kb-display m-0 mt-2 truncate text-[17px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)]">
          {event.title}
        </h2>
        {event.description ? (
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
            {event.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-[var(--kb-ink-500)]">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
            <span className="truncate">{formatEventRange(event)}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
            <span className="truncate">{event.location}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
            <span className="truncate">{event.capacityLabel}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:gap-1.5">
        <ParticipationButton participation={participation} className="sm:w-32" />
        <Link
          to={getEventDetailPath(event.id)}
          className="inline-flex h-9 items-center justify-center rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] sm:w-32"
        >
          자세히 보기
        </Link>
        <div className="hidden sm:flex sm:justify-end">
          <EventActionsMenu event={event} canEdit={canEdit} />
        </div>
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
  }, [
    eventsQuery.data,
    eventsQuery.error,
    eventsQuery.isError,
    eventsQuery.isFetching,
    eventsQuery.isLoading,
  ]);

  const headerActions = (
    <>
      {canCreateEvent ? (
        <Link
          to="/member/events/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13.5px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          행사 만들기
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => void eventsQuery.refetch()}
        aria-label="새로고침"
        disabled={eventsQuery.isFetching}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13.5px] font-medium text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] disabled:opacity-60"
      >
        <RefreshCw
          className={`h-4 w-4 transition-transform ${eventsQuery.isFetching ? "animate-spin" : ""}`}
          aria-hidden
        />
        <span className="hidden sm:inline">새로고침</span>
      </button>
    </>
  );

  const statusDotClass: Record<EventStatus, string> = {
    scheduled: "bg-[var(--kb-info-500)]",
    ongoing: "bg-[var(--kb-success-500)]",
    closed: "bg-[var(--kb-ink-400)]",
  };

  const statusFilters = (
    <div
      role="radiogroup"
      aria-label="행사 상태 필터"
      className="inline-flex flex-wrap items-center gap-1 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-2)] p-0.5"
    >
      {EVENT_STATUS_FILTERS.map((filter) => {
        const active = activeStatus === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setActiveStatus(filter.key)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[calc(var(--kb-radius-sm)-2px)] px-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] ${
              active
                ? "bg-[var(--kb-surface-raised)] text-[var(--kb-ink-900)] shadow-[var(--kb-shadow-sm)]"
                : "text-[var(--kb-ink-500)] hover:bg-[var(--kb-paper-3)] hover:text-[var(--kb-ink-900)]"
            }`}
          >
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${statusDotClass[filter.key]}`} />
            <span>{filter.label}</span>
            <span className="text-[11.5px] font-semibold text-[var(--kb-ink-400)]">
              {counts[filter.key]}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderBody = () => {
    if (error) {
      return <ErrorFallback error={new Error(error)} onReset={() => void eventsQuery.refetch()} />;
    }
    if (loading && events.length === 0) {
      return <ListSkeleton variant={viewMode} count={viewMode === "card" ? 6 : 5} />;
    }
    if (filteredEvents.length === 0) {
      return (
        <EmptyState
          icon={Clock3}
          title={search ? "검색 결과가 없습니다" : "표시할 행사가 없습니다"}
          description={
            search
              ? "검색어를 다른 키워드로 바꿔보거나 상태 필터를 조정해 보세요."
              : canCreateEvent
                ? "이 상태에는 아직 행사가 없습니다. 새 행사를 만들어 보세요."
                : "이 상태에는 아직 행사가 없습니다."
          }
          action={
            canCreateEvent && !search ? (
              <Link
                to="/member/events/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                새 행사 만들기
              </Link>
            ) : null
          }
        />
      );
    }
    return (
      <ListGrid viewMode={viewMode} aria-label="행사 목록" cardColumns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {viewMode === "card"
          ? filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} canEdit={canEditEvent(event)} />
            ))
          : filteredEvents.map((event) => (
              <EventListItem key={event.id} event={event} canEdit={canEditEvent(event)} />
            ))}
      </ListGrid>
    );
  };

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <PageHeader
          eyebrow="Events"
          title="행사"
          description="동아리에서 진행 중이거나 예정된 행사를 카드 또는 목록 보기로 살펴보세요."
          actions={headerActions}
        />

        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "행사 제목·설명·장소로 검색",
            "aria-label": "행사 검색",
          }}
          start={statusFilters}
          end={
            <ViewToggle<EventViewMode>
              value={viewMode}
              onChange={(next) => setViewMode(next)}
              options={VIEW_MODE_OPTIONS}
              aria-label="행사 보기 방식"
            />
          }
        />

        <div className="kb-fade-up">{renderBody()}</div>
      </div>
    </div>
  );
}
