import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  ExternalLink,
  ListChecks,
  MapPin,
  RefreshCw,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  EVENT_FEATURE_OPTIONS,
  EVENT_STATUS_LABELS,
  getEnabledEventFeatureKeys,
  getEvent,
  getEventEditPath,
  getEventImageTones,
  getEventParticipation,
  getEventStatus,
  type ClubEvent,
  type EventFeatureKey,
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

const FEATURE_ICON: Record<EventFeatureKey, typeof ClipboardList> = {
  externalForm: ExternalLink,
  participantSurvey: ClipboardList,
  attendanceCheck: CheckCircle2,
  teamFormation: Trophy,
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

function formatDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--kb-navy-700)]" aria-hidden />
      <div className="min-w-0">
        <div className="kb-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--kb-ink-500)]">
          {label}
        </div>
        <div className="mt-1 text-[14px] font-semibold leading-5 text-[var(--kb-ink-900)]">
          {value}
        </div>
      </div>
    </div>
  );
}

function FeatureStateChip({ feature, label }: { feature: { enabled: boolean }; label: string }) {
  void feature;
  void label;
  return null;
}
void FeatureStateChip;

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof CalendarDays;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-5 shadow-[var(--kb-shadow-sm)] ${className ?? ""}`}
    >
      <h2 className="kb-display m-0 inline-flex items-center gap-2 text-[18px] font-semibold tracking-tight text-[var(--kb-ink-900)]">
        <Icon className="h-5 w-5 text-[var(--kb-navy-700)]" aria-hidden />
        {title}
      </h2>
      {children}
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

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="kb-fade-up mx-auto flex max-w-[1180px] flex-col gap-6">
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
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13.5px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
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

        <main className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-start">
          <section className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] p-2 shadow-[var(--kb-shadow-sm)]">
              <img
                src={buildEventImage(event, currentImageTone, activeImageIndex)}
                alt={`${event.title} 이미지 ${activeImageIndex + 1}`}
                className={`aspect-video w-full rounded-[var(--kb-radius-sm)] ${
                  eventImageUploaded ? "object-cover" : "object-contain p-12"
                }`}
                draggable={false}
              />
            </div>

            {eventImageUploaded && tones.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {tones.map((tone, index) => {
                  const active = index === activeImageIndex;
                  return (
                    <button
                      key={`${tone}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`이미지 ${index + 1} 보기`}
                      aria-pressed={active}
                      className={`aspect-square rounded-[var(--kb-radius-sm)] border bg-[var(--kb-paper-3)] p-1 transition-[border-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] ${
                        active
                          ? "border-[var(--kb-navy-500)] opacity-100"
                          : "border-[var(--kb-border-subtle)] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={buildEventImage(event, tone, index)}
                        alt=""
                        className="h-full w-full rounded-[calc(var(--kb-radius-sm)-2px)] object-cover"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={STATUS_TONE[status]} dot>
                {EVENT_STATUS_LABELS[status]}
              </StatusPill>
              <span className="rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-3)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--kb-ink-700)]">
                {event.organizer}
              </span>
            </div>

            <h1 className="kb-display mt-4 text-[28px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)] sm:text-[36px]">
              {event.title}
            </h1>
            <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-[var(--kb-ink-700)]">
              {event.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoRow icon={CalendarDays} label="일시" value={formatEventRange(event)} />
              <InfoRow icon={MapPin} label="장소" value={event.location} />
              <InfoRow icon={UsersRound} label="참여 규모" value={event.capacityLabel} />
              <InfoRow
                icon={ListChecks}
                label="참여"
                value={participation ? participation.title : "참여 폼 없음"}
              />
            </div>

            {participation ? (
              <section className="mt-6 rounded-[var(--kb-radius-md)] border border-[color-mix(in_srgb,var(--kb-navy-500)_25%,transparent)] bg-[var(--kb-navy-50)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--kb-navy-700)]">
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {participation.external ? "외부 신청 폼" : "KOBOT 참여 폼"}
                    </div>
                    <h2 className="kb-display mb-0 mt-2 text-[20px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)]">
                      {participation.title}
                    </h2>
                    {formFeature.deadline ? (
                      <p className="mb-0 mt-2 text-[13px] font-medium text-[var(--kb-ink-700)]">
                        마감: {formatDate(formFeature.deadline)}
                      </p>
                    ) : null}
                  </div>

                  {formUrl ? (
                    isInternalForm ? (
                      <Link
                        to={formUrl}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-4 text-[14px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
                      >
                        참여하기
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </Link>
                    ) : (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-4 text-[14px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
                      >
                        참여하기
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    )
                  ) : null}
                </div>

                {formFeature.requiredFields.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {formFeature.requiredFields.map((field) => (
                      <span
                        key={field}
                        className="rounded-[var(--kb-radius-full)] border border-[color-mix(in_srgb,var(--kb-navy-500)_25%,transparent)] bg-[var(--kb-surface-raised)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--kb-navy-700)]"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-5">
                <SectionCard icon={CalendarDays} title="진행 일정">
                  <div className="mt-4 grid gap-3">
                    {event.schedule.map((item) => (
                      <div
                        key={`${item.time}-${item.title}`}
                        className="grid grid-cols-[88px_1fr] gap-3 border-b border-[var(--kb-border-subtle)] pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-[13px] font-semibold text-[var(--kb-navy-700)]">
                          {item.time}
                        </span>
                        <span className="text-[14px] text-[var(--kb-ink-900)]">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {surveyFeature.enabled ? (
                  <SectionCard icon={ClipboardList} title={surveyFeature.title}>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--kb-ink-500)]">
                      {surveyFeature.description}
                    </p>
                    <div className="mt-4 grid gap-2.5">
                      {surveyFeature.questions.map((question) => (
                        <div
                          key={question.id}
                          className="rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] px-3.5 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-[var(--kb-ink-900)]">
                              {question.label}
                            </span>
                            <StatusPill tone="neutral">
                              {QUESTION_TYPE_LABELS[question.type]}
                            </StatusPill>
                            {question.required ? (
                              <StatusPill tone="danger">필수</StatusPill>
                            ) : null}
                          </div>
                          {question.choices && question.choices.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
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
                    <p className="mb-0 mt-2 text-[14px] leading-6 text-[var(--kb-ink-500)]">
                      {teamFeature.description}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-[var(--kb-radius-sm)] bg-[var(--kb-paper-2)] px-3 py-2 text-[13px] font-semibold text-[var(--kb-ink-900)]">
                      <UsersRound className="h-4 w-4 text-[var(--kb-navy-700)]" aria-hidden />
                      팀당 최대 {teamFeature.teamSize}명
                    </div>
                  </SectionCard>
                ) : null}
              </div>

              <aside className="flex flex-col gap-5">
                {attendanceFeature.enabled ? (
                  <SectionCard icon={CheckCircle2} title="참석 체크">
                    <div className="mt-3 flex items-end gap-2">
                      <span className="kb-display text-[34px] font-semibold leading-none text-[var(--kb-ink-900)]">
                        {attendanceFeature.checkedInCount}
                      </span>
                      <span className="pb-1 text-[13px] font-medium text-[var(--kb-ink-500)]">
                        / {attendanceFeature.expectedCount}명
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--kb-paper-3)]">
                      <div
                        role="progressbar"
                        aria-valuenow={attendanceRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-full rounded-full bg-[var(--kb-navy-700)] transition-[width] duration-[var(--kb-duration-slow)]"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                    <p className="mb-0 mt-2 text-[12px] text-[var(--kb-ink-500)]">
                      {attendanceFeature.method === "qr" ? "QR 체크인" : "수동 체크"} · {attendanceRate}%
                    </p>
                  </SectionCard>
                ) : null}

                <SectionCard icon={ClipboardList} title="참여">
                  {participation ? (
                    <>
                      <p className="mt-2 text-[13px] leading-5 text-[var(--kb-ink-500)]">
                        {participation.title}
                      </p>
                      {participation.external ? (
                        <a
                          href={participation.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-4 text-[14px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
                        >
                          참여하기
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <Link
                          to={participation.href}
                          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-4 text-[14px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
                        >
                          참여하기
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="mb-0 mt-2 text-[13px] leading-5 text-[var(--kb-ink-500)]">
                      이 행사는 아직 참여 폼이 연결되지 않았습니다.
                    </p>
                  )}
                </SectionCard>

                <div className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] p-5">
                  <div className="kb-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--kb-ink-500)]">
                    날짜
                  </div>
                  <div className="kb-display mt-2 text-[18px] font-semibold text-[var(--kb-ink-900)]">
                    {formatDateOnly(event.startsAt)}
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-[var(--kb-ink-500)]">
                    {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
