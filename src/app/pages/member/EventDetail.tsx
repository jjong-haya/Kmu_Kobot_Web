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
  TriangleAlert,
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

function StatusBadge({ status }: { status: EventStatus }) {
  const meta = STATUS_META[status];

  return (
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
  );
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
    <div className="flex items-start gap-3 rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-[#8d877e]">{label}</div>
        <div className="mt-1 text-[14px] font-semibold leading-5 text-[#312f2c]">{value}</div>
      </div>
    </div>
  );
}

function FeatureStateCard({
  event,
  featureKey,
}: {
  event: ClubEvent;
  featureKey: EventFeatureKey;
}) {
  const option = EVENT_FEATURE_OPTIONS.find((item) => item.key === featureKey);
  const feature = event.features[featureKey];
  if (!option) return null;

  const Icon = FEATURE_ICON[featureKey];

  return (
    <div
      className="rounded-[8px] border px-3.5 py-3"
      style={{
        borderColor: feature.enabled ? "#cfe1ff" : "#eeeae2",
        background: feature.enabled ? "#f6f9ff" : "#fbfaf7",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{ color: feature.enabled ? "#103078" : "#aaa49a" }}
        />
        <div className="text-[14px] font-black text-[#171717]">{option.label}</div>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{
            background: feature.enabled ? "#dbeafe" : "#f1f1ef",
            color: feature.enabled ? "#183b80" : "#77716a",
          }}
        >
          {feature.enabled ? "사용" : "미사용"}
        </span>
      </div>
      <p className="mb-0 mt-2 text-[12px] leading-5 text-[#6f6a62]">{option.description}</p>
    </div>
  );
}

function EventNotFound() {
  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex min-h-[420px] max-w-[760px] flex-col items-center justify-center text-center">
        <TriangleAlert className="mb-4 h-12 w-12 text-[#b45309]" />
        <h1 className="m-0 text-[28px] font-black tracking-normal text-[#111111]">
          행사를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6f6a62]">
          삭제되었거나 잘못된 주소로 접근했습니다.
        </p>
        <Link
          to="/member/events"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-4 text-[14px] font-bold text-[#312f2c] no-underline transition-colors hover:border-[#cfcac0]"
        >
          <ArrowLeft className="h-4 w-4" />
          행사 목록
        </Link>
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
  }, [eventId]);

  if (loading) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="flex min-h-[420px] items-center justify-center gap-2 text-[15px] font-medium text-[#6f6a62]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          행사를 불러오는 중입니다.
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
      ? Math.min(100, Math.round((attendanceFeature.checkedInCount / attendanceFeature.expectedCount) * 100))
      : 0;

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/member/events")}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-bold text-[#312f2c] transition-colors hover:border-[#cfcac0]"
          >
            <ArrowLeft className="h-4 w-4" />
            행사 목록
          </button>
          {canEditEvent ? (
            <Link
              to={getEventEditPath(event.id)}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-3.5 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
            >
              <Edit3 className="h-4 w-4" />
              수정
            </Link>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <main className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-start">
          <section className="lg:sticky lg:top-6">
            <div className="rounded-[10px] border border-[#e8e6df] bg-[#f5f3ee] p-2 shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
              <img
                src={buildEventImage(event, currentImageTone, activeImageIndex)}
                alt={`${event.title} 이미지 ${activeImageIndex + 1}`}
                className={`aspect-video w-full rounded-[8px] ${
                  eventImageUploaded ? "object-cover" : "object-contain p-12"
                }`}
                draggable={false}
              />
            </div>

            {eventImageUploaded && tones.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {tones.map((tone, index) => (
                  <button
                    key={`${tone}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className="aspect-square rounded-[8px] border bg-[#f5f3ee] p-1 transition-[border-color,opacity]"
                    style={{
                      borderColor: index === activeImageIndex ? "#103078" : "#e8e6df",
                      opacity: index === activeImageIndex ? 1 : 0.68,
                    }}
                  >
                    <img
                      src={buildEventImage(event, tone, index)}
                      alt=""
                      className="h-full w-full rounded-[6px] object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span className="rounded-full border border-[#e8e2d6] bg-[#fbfaf7] px-2.5 py-1 text-[12px] font-bold text-[#5f574c]">
                {event.organizer}
              </span>
            </div>

            <h1 className="mt-4 text-[32px] font-black leading-tight tracking-normal text-[#0a0a0a] sm:text-[42px]">
              {event.title}
            </h1>
            <p className="mt-4 max-w-[720px] text-[16px] leading-8 text-[#514d47]">
              {event.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
              <section className="mt-8 rounded-[10px] border border-[#d9e7ff] bg-[#f7fbff] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[13px] font-black text-[#183b80]">
                      <ExternalLink className="h-4 w-4" />
                      {participation.external ? "외부 신청 폼" : "KOBOT 참여 폼"}
                    </div>
                    <h2 className="mb-0 mt-2 text-[22px] font-black text-[#111111]">
                      {participation.title}
                    </h2>
                    {formFeature.deadline ? (
                      <p className="mb-0 mt-2 text-[14px] font-semibold text-[#514d47]">
                        마감: {formatDate(formFeature.deadline)}
                      </p>
                    ) : null}
                  </div>

                  {formUrl ? (
                    isInternalForm ? (
                      <Link
                        to={formUrl}
                        className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#103078] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#061b4c]"
                      >
                        참여하기
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#103078] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#061b4c]"
                      >
                        참여하기
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )
                  ) : null}
                </div>

                {formFeature.requiredFields.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formFeature.requiredFields.map((field) => (
                      <span
                        key={field}
                        className="rounded-full border border-[#cfe1ff] bg-white px-2.5 py-1 text-[12px] font-bold text-[#183b80]"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-5">
                <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                  <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                    <CalendarDays className="h-5 w-5 text-[#103078]" />
                    진행 일정
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {event.schedule.map((item) => (
                      <div
                        key={`${item.time}-${item.title}`}
                        className="grid grid-cols-[92px_1fr] gap-3 border-b border-[#f0eee8] pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-[13px] font-black text-[#103078]">{item.time}</span>
                        <span className="text-[14px] font-semibold text-[#312f2c]">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {surveyFeature.enabled ? (
                  <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                    <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                      <ClipboardList className="h-5 w-5 text-[#103078]" />
                      {surveyFeature.title}
                    </h2>
                    <p className="mt-2 text-[14px] leading-6 text-[#6f6a62]">
                      {surveyFeature.description}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {surveyFeature.questions.map((question) => (
                        <div
                          key={question.id}
                          className="rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] px-3.5 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-black text-[#312f2c]">
                              {question.label}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#6f6a62]">
                              {QUESTION_TYPE_LABELS[question.type]}
                            </span>
                            {question.required ? (
                              <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] font-bold text-[#991b1b]">
                                필수
                              </span>
                            ) : null}
                          </div>
                          {question.choices && question.choices.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {question.choices.map((choice) => (
                                <span
                                  key={choice}
                                  className="rounded-full border border-[#e8e2d6] bg-white px-2 py-0.5 text-[11px] font-bold text-[#5f574c]"
                                >
                                  {choice}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {teamFeature.enabled ? (
                  <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                    <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                      <Trophy className="h-5 w-5 text-[#103078]" />
                      팀 편성
                    </h2>
                    <p className="mb-0 mt-2 text-[14px] leading-6 text-[#6f6a62]">
                      {teamFeature.description}
                    </p>
                    <div className="mt-4 rounded-[8px] bg-[#fbfaf7] px-3.5 py-3 text-[14px] font-bold text-[#312f2c]">
                      팀당 최대 {teamFeature.teamSize}명
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="flex flex-col gap-5">
                {attendanceFeature.enabled ? (
                  <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                    <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                      <CheckCircle2 className="h-5 w-5 text-[#103078]" />
                      참석 체크
                    </h2>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-[34px] font-black leading-none text-[#111111]">
                        {attendanceFeature.checkedInCount}
                      </span>
                      <span className="pb-1 text-[14px] font-bold text-[#6f6a62]">
                        / {attendanceFeature.expectedCount}명
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeae2]">
                      <div
                        className="h-full rounded-full bg-[#103078]"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                    <p className="mb-0 mt-3 text-[12px] font-semibold text-[#6f6a62]">
                      {attendanceFeature.method === "qr" ? "QR 체크인" : "수동 체크"}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                  <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                    <ClipboardList className="h-5 w-5 text-[#103078]" />
                    참여
                  </h2>
                  {participation ? (
                    <>
                      <p className="mt-2 text-[13px] leading-5 text-[#6f6a62]">
                        {participation.title}
                      </p>
                      {participation.external ? (
                        <a
                          href={participation.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#061b4c]"
                        >
                          참여하기
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <Link
                          to={participation.href}
                          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#061b4c]"
                        >
                          참여하기
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="mb-0 mt-2 text-[13px] leading-5 text-[#6f6a62]">
                      이 행사는 아직 참여 폼이 연결되지 않았습니다.
                    </p>
                  )}
                </div>

                <div className="rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-5">
                  <div className="text-[12px] font-black uppercase text-[#8d877e]">
                    날짜
                  </div>
                  <div className="mt-2 text-[16px] font-black text-[#111111]">
                    {formatDateOnly(event.startsAt)}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-[#6f6a62]">
                    {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                  </div>
                </div>
              </aside>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
