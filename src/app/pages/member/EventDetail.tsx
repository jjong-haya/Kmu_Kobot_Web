import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  EVENT_STATUS_LABELS,
  getEnabledEventFeatureKeys,
  getEvent,
  getEventEditPath,
  getEventImageTones,
  getEventParticipation,
  getEventStatus,
  type ClubEvent,
  type EventQuestionType,
  type EventStatus,
} from "../../api/events";
import { useAuth } from "../../auth/useAuth";
import { buildEventImage, hasEventImage } from "../../utils/event-visuals";
import { sanitizeUserError } from "../../utils/sanitize-error";
import {
  EmptyState,
  ErrorFallback,
  StatusPill,
  type StatusTone,
} from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

const STATUS_TONE: Record<EventStatus, StatusTone> = {
  scheduled: "info",
  ongoing: "success",
  closed: "neutral",
};

const QUESTION_TYPE_LABELS: Record<EventQuestionType, string> = {
  short_text: "단답",
  long_text: "장문",
  single_choice: "단일 선택",
  multiple_choice: "복수 선택",
  dropdown: "드롭다운",
  linear_scale: "선형 배율",
  number: "숫자",
  date: "날짜",
  time: "시간",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
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

function MetaLine({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-[13.5px] text-[var(--kb-ink-700)]">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
      <div className="min-w-0">
        <span className="kb-mono mr-2 text-[10.5px] uppercase tracking-[0.12em] text-[var(--kb-ink-400)]">
          {label}
        </span>
        <span className="font-medium">{children}</span>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: typeof CalendarDays;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-5 shadow-[var(--kb-shadow-sm)] ${className ?? ""}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="kb-display m-0 inline-flex items-center gap-2 text-[16px] font-semibold tracking-tight text-[var(--kb-ink-900)]">
          <Icon className="h-4.5 w-4.5 text-[var(--kb-navy-700)]" aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EventNotFound() {
  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto max-w-[760px]">
        <EmptyState
          icon={Search}
          title="행사를 찾을 수 없습니다"
          description="삭제되었거나 잘못된 주소로 접근했어요."
          action={
            <Link
              to="/member/events"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              행사 목록으로
            </Link>
          }
        />
      </div>
    </div>
  );
}

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { hasPermission, user } = useAuth();
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = event ? getEventStatus(event) : "scheduled";
  const tones = useMemo(() => (event ? getEventImageTones(event) : []), [event]);
  const enabledFeatures = useMemo(
    () => (event ? getEnabledEventFeatureKeys(event) : []),
    [event],
  );
  void enabledFeatures;

  async function load() {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      setEvent(await getEvent(eventId));
      setActiveImageIndex(0);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "행사 정보를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="mx-auto flex min-h-[420px] max-w-[760px] items-center justify-center gap-2 text-[14px] font-medium text-[var(--kb-ink-500)]">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
          행사를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="mx-auto max-w-[760px]">
          <ErrorFallback error={new Error(error)} onReset={() => void load()} />
        </div>
      </div>
    );
  }

  if (!event) return <EventNotFound />;

  const currentImageTone = tones[activeImageIndex] ?? event.imageTone;
  const eventImageUploaded = hasEventImage(event);
  const participation = getEventParticipation(event);
  const formFeature = event.features.externalForm;
  const formUrl = participation?.href ?? "";
  const isInternalForm = Boolean(participation && !participation.external);
  const surveyFeature = event.features.participantSurvey;
  const attendanceFeature = event.features.attendanceCheck;
  const teamFeature = event.features.teamFormation;
  const canEditEvent =
    hasPermission("events.manage") ||
    (hasPermission("events.create") && Boolean(event.createdBy && event.createdBy === user?.id));
  const attendanceRate =
    attendanceFeature.expectedCount > 0
      ? Math.min(
          100,
          Math.round((attendanceFeature.checkedInCount / attendanceFeature.expectedCount) * 100),
        )
      : 0;
  const hasSchedule = event.schedule && event.schedule.length > 0;
  const hasMultipleImages = eventImageUploaded && tones.length > 1;
  const showsSidebar = attendanceFeature.enabled || teamFeature.enabled;

  const ParticipationButton = ({ size = "md", full = false }: { size?: "sm" | "md"; full?: boolean }) => {
    if (!participation || !formUrl) return null;
    const sizeClass = size === "sm" ? "h-9 px-3 text-[13px]" : "h-10 px-4 text-[14px]";
    const widthClass = full ? "w-full" : "";
    const cls = `inline-flex items-center justify-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] ${sizeClass} ${widthClass}`;
    if (isInternalForm) {
      return (
        <Link to={formUrl} className={cls}>
          참여하기
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      );
    }
    return (
      <a href={formUrl} target="_blank" rel="noreferrer" className={cls}>
        참여하기
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  };

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="kb-fade-up mx-auto flex max-w-[1180px] flex-col gap-6">
        {/* Top action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/member/events")}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13.5px] font-medium text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            행사 목록
          </button>
          {canEditEvent ? (
            <Link
              to={getEventEditPath(event.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13.5px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
            >
              <Edit3 className="h-4 w-4" aria-hidden />
              수정
            </Link>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-[var(--kb-radius-md)] border border-[color-mix(in_srgb,var(--kb-danger-500)_30%,transparent)] bg-[var(--kb-danger-50)] px-4 py-3 text-[13.5px] font-medium text-[var(--kb-danger-700)]"
          >
            {error}
          </div>
        ) : null}

        {/* Hero — image (compact left) + info + CTA (right) */}
        <section className="overflow-hidden rounded-[var(--kb-radius-lg)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] shadow-[var(--kb-shadow-sm)]">
          <div className="grid gap-0 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* Image side */}
            <div className="flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden bg-[var(--kb-paper-3)] md:aspect-auto md:h-full md:min-h-[220px]">
                <img
                  src={buildEventImage(event, currentImageTone, activeImageIndex)}
                  alt={`${event.title} 이미지 ${activeImageIndex + 1}`}
                  className={`h-full w-full ${eventImageUploaded ? "object-cover" : "object-contain p-6"}`}
                  draggable={false}
                />
                {!eventImageUploaded ? (
                  <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-[var(--kb-radius-full)] bg-[color-mix(in_srgb,var(--kb-ink-900)_55%,transparent)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--kb-on-accent)]">
                    <ImageIcon className="h-3 w-3" aria-hidden />
                    기본 이미지
                  </div>
                ) : null}
              </div>
              {hasMultipleImages ? (
                <div className="grid grid-cols-3 gap-1 border-t border-[var(--kb-border-subtle)] p-2">
                  {tones.map((tone, index) => {
                    const active = index === activeImageIndex;
                    return (
                      <button
                        key={`${tone}-${index}`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`이미지 ${index + 1} 보기`}
                        aria-pressed={active}
                        className={`aspect-square overflow-hidden rounded-[var(--kb-radius-sm)] border transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] ${
                          active
                            ? "border-[var(--kb-navy-500)] opacity-100"
                            : "border-[var(--kb-border-subtle)] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={buildEventImage(event, tone, index)}
                          alt=""
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Info side */}
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={STATUS_TONE[status]} dot>
                  {EVENT_STATUS_LABELS[status]}
                </StatusPill>
                <span className="rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--kb-ink-700)]">
                  {event.organizer}
                </span>
              </div>

              <div>
                <h1 className="kb-display m-0 text-[24px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)] sm:text-[28px]">
                  {event.title}
                </h1>
              </div>

              <div className="grid gap-2 border-t border-[var(--kb-border-subtle)] pt-4">
                <MetaLine icon={CalendarDays} label="일시">
                  {formatEventRange(event)}
                </MetaLine>
                <MetaLine icon={MapPin} label="장소">
                  {event.location}
                </MetaLine>
                <MetaLine icon={UsersRound} label="규모">
                  {event.capacityLabel}
                </MetaLine>
              </div>

              {participation ? (
                <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[var(--kb-border-subtle)] pt-4">
                  <div className="min-w-0 flex-1">
                    <div className="kb-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--kb-navy-700)]">
                      {participation.external ? "외부 신청 폼" : "KOBOT 참여 폼"}
                    </div>
                    <div className="mt-1 truncate text-[13.5px] font-semibold text-[var(--kb-ink-900)]">
                      {participation.title}
                    </div>
                    {formFeature.deadline ? (
                      <div className="mt-0.5 text-[12px] text-[var(--kb-ink-500)]">
                        마감 {formatDate(formFeature.deadline)}
                      </div>
                    ) : null}
                  </div>
                  <ParticipationButton size="md" />
                </div>
              ) : (
                <div className="mt-1 border-t border-[var(--kb-border-subtle)] pt-4 text-[13px] text-[var(--kb-ink-500)]">
                  이 행사는 아직 참여 폼이 연결되지 않았습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notice body — pre-wrapped so 줄바꿈/이모지/긴 본문 자연 표시 */}
        {event.description ? (
          <section className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-6 shadow-[var(--kb-shadow-sm)] sm:p-8">
            <div className="kb-mono mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--kb-ink-500)]">
              안내
            </div>
            <div className="whitespace-pre-wrap text-[14.5px] leading-[1.85] text-[var(--kb-ink-700)]">
              {event.description}
            </div>
          </section>
        ) : null}

        {/* Body — only render sections with content */}
        {(hasSchedule || surveyFeature.enabled || teamFeature.enabled || showsSidebar) ? (
          <div
            className={`grid gap-5 ${
              showsSidebar ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""
            }`}
          >
            <div className="flex flex-col gap-5">
              {hasSchedule ? (
                <SectionCard icon={CalendarDays} title="진행 일정">
                  <ol className="grid gap-2.5">
                    {event.schedule.map((item) => (
                      <li
                        key={`${item.time}-${item.title}`}
                        className="grid grid-cols-[80px_1fr] gap-3 border-b border-[var(--kb-border-subtle)] pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <span className="kb-mono text-[12px] font-semibold text-[var(--kb-navy-700)]">
                          {item.time}
                        </span>
                        <span className="text-[13.5px] text-[var(--kb-ink-900)]">
                          {item.title}
                        </span>
                      </li>
                    ))}
                  </ol>
                </SectionCard>
              ) : null}

              {surveyFeature.enabled ? (
                <SectionCard icon={ClipboardList} title={surveyFeature.title}>
                  {surveyFeature.description ? (
                    <p className="m-0 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
                      {surveyFeature.description}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2">
                    {surveyFeature.questions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-semibold text-[var(--kb-ink-900)]">
                            {question.label}
                          </span>
                          <StatusPill tone="neutral">
                            {QUESTION_TYPE_LABELS[question.type]}
                          </StatusPill>
                          {question.required ? <StatusPill tone="danger">필수</StatusPill> : null}
                        </div>
                        {question.choices && question.choices.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {question.choices.map((choice) => (
                              <span
                                key={choice}
                                className="rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-2 py-0.5 text-[11px] font-medium text-[var(--kb-ink-700)]"
                              >
                                {choice}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              {teamFeature.enabled ? (
                <SectionCard icon={Trophy} title="팀 편성">
                  {teamFeature.description ? (
                    <p className="m-0 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
                      {teamFeature.description}
                    </p>
                  ) : null}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-[var(--kb-radius-sm)] bg-[var(--kb-paper-2)] px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-900)]">
                    <UsersRound className="h-4 w-4 text-[var(--kb-navy-700)]" aria-hidden />
                    팀당 최대 {teamFeature.teamSize}명
                  </div>
                </SectionCard>
              ) : null}
            </div>

            {showsSidebar ? (
              <aside className="flex flex-col gap-5">
                {attendanceFeature.enabled ? (
                  <SectionCard icon={CheckCircle2} title="참석 체크">
                    <div className="flex items-end gap-2">
                      <span className="kb-display text-[32px] font-semibold leading-none text-[var(--kb-ink-900)]">
                        {attendanceFeature.checkedInCount}
                      </span>
                      <span className="pb-1 text-[12.5px] font-medium text-[var(--kb-ink-500)]">
                        / {attendanceFeature.expectedCount}명
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--kb-paper-3)]">
                      <div
                        role="progressbar"
                        aria-valuenow={attendanceRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-full rounded-full bg-[var(--kb-navy-700)] transition-[width] duration-[var(--kb-duration-slow)]"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                    <p className="mb-0 mt-2 text-[11.5px] text-[var(--kb-ink-500)]">
                      {attendanceFeature.method === "qr" ? "QR 체크인" : "수동 체크"} · {attendanceRate}%
                    </p>
                  </SectionCard>
                ) : null}
              </aside>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
