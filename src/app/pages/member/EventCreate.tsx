import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Settings2,
  Trophy,
} from "lucide-react";
import {
  createEvent,
  EVENT_FEATURE_OPTIONS,
  EVENT_IMAGE_TONE_OPTIONS,
  getEventDetailPath,
  type EventFeatureKey,
  type EventFeatureSettings,
  type EventImageTone,
} from "../../api/events";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const FEATURE_ICON: Record<EventFeatureKey, typeof ClipboardList> = {
  externalForm: ExternalLink,
  participantSurvey: ClipboardList,
  attendanceCheck: CheckCircle2,
  teamFormation: Trophy,
};

function localDateTimeValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toIsoFromLocal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFeatures({
  attendanceExpected,
  attendanceMethod,
  externalDeadline,
  externalFields,
  externalTitle,
  externalUrl,
  featureEnabled,
  surveyDescription,
  surveyQuestions,
  surveyTitle,
  teamDescription,
  teamSize,
}: {
  attendanceExpected: string;
  attendanceMethod: "manual" | "qr";
  externalDeadline: string;
  externalFields: string;
  externalTitle: string;
  externalUrl: string;
  featureEnabled: Record<EventFeatureKey, boolean>;
  surveyDescription: string;
  surveyQuestions: string;
  surveyTitle: string;
  teamDescription: string;
  teamSize: string;
}): EventFeatureSettings {
  return {
    externalForm: {
      enabled: featureEnabled.externalForm,
      provider: "google_forms",
      title: externalTitle.trim() || "행사 참가 신청",
      url: externalUrl.trim(),
      deadline: externalDeadline ? toIsoFromLocal(externalDeadline) : undefined,
      requiredFields: splitLines(externalFields),
    },
    participantSurvey: {
      enabled: featureEnabled.participantSurvey,
      title: surveyTitle.trim() || "참여자 사전 조사",
      description: surveyDescription.trim(),
      questions: splitLines(surveyQuestions).map((label, index) => ({
        id: `question-${index + 1}`,
        label,
        type: "short_text",
        required: true,
      })),
    },
    attendanceCheck: {
      enabled: featureEnabled.attendanceCheck,
      expectedCount: Math.max(0, Number.parseInt(attendanceExpected, 10) || 0),
      checkedInCount: 0,
      method: attendanceMethod,
    },
    teamFormation: {
      enabled: featureEnabled.teamFormation,
      teamSize: Math.max(1, Number.parseInt(teamSize, 10) || 1),
      description: teamDescription.trim(),
    },
  };
}

export default function EventCreate() {
  const navigate = useNavigate();
  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(14, 0, 0, 0);
    return localDateTimeValue(date);
  }, []);
  const defaultEnd = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(17, 0, 0, 0);
    return localDateTimeValue(date);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("KOBOT 운영팀");
  const [capacityLabel, setCapacityLabel] = useState("자유 참여");
  const [imageTone, setImageTone] = useState<EventImageTone>("navy");
  const [scheduleText, setScheduleText] = useState("14:00 오리엔테이션\n15:00 본 행사\n16:30 정리");
  const [featureEnabled, setFeatureEnabled] = useState<Record<EventFeatureKey, boolean>>({
    externalForm: false,
    participantSurvey: false,
    attendanceCheck: false,
    teamFormation: false,
  });
  const [externalTitle, setExternalTitle] = useState("행사 참가 신청");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalDeadline, setExternalDeadline] = useState("");
  const [externalFields, setExternalFields] = useState("이름, 연락처");
  const [surveyTitle, setSurveyTitle] = useState("참여자 사전 조사");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState("장비 보유 여부\n희망 팀원\n운영팀에 전달할 내용");
  const [attendanceExpected, setAttendanceExpected] = useState("0");
  const [attendanceMethod, setAttendanceMethod] = useState<"manual" | "qr">("manual");
  const [teamSize, setTeamSize] = useState("3");
  const [teamDescription, setTeamDescription] = useState("팀 단위로 참가할 수 있습니다.");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFeature(key: EventFeatureKey) {
    setFeatureEnabled((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("행사 제목을 입력해 주세요.");
      return;
    }
    if (!description.trim()) {
      setError("행사 설명을 입력해 주세요.");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("행사 시작/종료 시간을 입력해 주세요.");
      return;
    }
    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      setError("종료 시간은 시작 시간 이후여야 합니다.");
      return;
    }
    if (!location.trim()) {
      setError("행사 장소를 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const saved = await createEvent({
        title: title.trim(),
        description: description.trim(),
        startsAt: toIsoFromLocal(startsAt),
        endsAt: toIsoFromLocal(endsAt),
        location: location.trim(),
        organizer: organizer.trim() || "KOBOT 운영팀",
        capacityLabel: capacityLabel.trim() || "자유 참여",
        imageTone,
        imageTones: Array.from(
          new Set<EventImageTone>([imageTone, "navy", "green", "amber"]),
        ).slice(0, 3),
        schedule: splitLines(scheduleText).map((line) => {
          const [time, ...rest] = line.split(" ");
          return {
            time: time || "시간 미정",
            title: rest.join(" ").trim() || line,
          };
        }),
        features: buildFeatures({
          attendanceExpected,
          attendanceMethod,
          externalDeadline,
          externalFields,
          externalTitle,
          externalUrl,
          featureEnabled,
          surveyDescription,
          surveyQuestions,
          surveyTitle,
          teamDescription,
          teamSize,
        }),
      });

      navigate(getEventDetailPath(saved.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "행사를 저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1080px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/member/events"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-bold text-[#312f2c] no-underline transition-colors hover:border-[#cfcac0]"
          >
            <ArrowLeft className="h-4 w-4" />
            행사 목록
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Settings2 className="h-4 w-4" />
            {submitting ? "저장 중" : "행사 만들기"}
          </button>
        </div>

        <header>
          <div
            className="kb-mono mb-2 text-[13px] uppercase text-[#6f6a62]"
            style={{ letterSpacing: "0.14em" }}
          >
            New Event
          </div>
          <h1 className="kb-display m-0 text-[32px] font-black tracking-normal text-[#0a0a0a]">
            행사 만들기
          </h1>
        </header>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex flex-col gap-5">
            <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
              <h2 className="m-0 text-[20px] font-black text-[#111111]">기본 정보</h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    placeholder="예: KOBOT 게임 로봇 대회"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">설명</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-[140px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[15px] leading-7 outline-none focus:border-[#103078]"
                    placeholder="행사 상세 페이지에 표시될 설명"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">시작</span>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">종료</span>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(event) => setEndsAt(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">장소</span>
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                      placeholder="공학관 로봇실"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">주관</span>
                    <input
                      value={organizer}
                      onChange={(event) => setOrganizer(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">참여 규모</span>
                    <input
                      value={capacityLabel}
                      onChange={(event) => setCapacityLabel(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                      placeholder="최대 24명"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[13px] font-bold text-[#6f6a62]">이미지 톤</span>
                    <select
                      value={imageTone}
                      onChange={(event) => setImageTone(event.target.value as EventImageTone)}
                      className="h-11 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    >
                      {EVENT_IMAGE_TONE_OPTIONS.map((tone) => (
                        <option key={tone.key} value={tone.key}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">일정</span>
                  <textarea
                    value={scheduleText}
                    onChange={(event) => setScheduleText(event.target.value)}
                    className="min-h-[110px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[14px] leading-7 outline-none focus:border-[#103078]"
                  />
                </label>
              </div>
            </div>

            {featureEnabled.externalForm ? (
              <div className="rounded-[10px] border border-[#d9e7ff] bg-[#f7fbff] p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                  <ExternalLink className="h-5 w-5 text-[#103078]" />
                  신청 폼
                </h2>
                <div className="mt-4 grid gap-4">
                  <input
                    value={externalTitle}
                    onChange={(event) => setExternalTitle(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#cfe1ff] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    placeholder="신청 폼 제목"
                  />
                  <input
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#cfe1ff] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    placeholder="https://forms.gle/..."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="datetime-local"
                      value={externalDeadline}
                      onChange={(event) => setExternalDeadline(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#cfe1ff] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                    />
                    <input
                      value={externalFields}
                      onChange={(event) => setExternalFields(event.target.value)}
                      className="h-11 rounded-[8px] border border-[#cfe1ff] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                      placeholder="이름, 연락처, 학번"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {featureEnabled.participantSurvey ? (
              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                  <ClipboardList className="h-5 w-5 text-[#103078]" />
                  참여자 조사
                </h2>
                <div className="mt-4 grid gap-4">
                  <input
                    value={surveyTitle}
                    onChange={(event) => setSurveyTitle(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                  />
                  <textarea
                    value={surveyDescription}
                    onChange={(event) => setSurveyDescription(event.target.value)}
                    className="min-h-[90px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[14px] leading-7 outline-none focus:border-[#103078]"
                    placeholder="조사 목적"
                  />
                  <textarea
                    value={surveyQuestions}
                    onChange={(event) => setSurveyQuestions(event.target.value)}
                    className="min-h-[120px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[14px] leading-7 outline-none focus:border-[#103078]"
                  />
                </div>
              </div>
            ) : null}

            {featureEnabled.teamFormation ? (
              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                  <Trophy className="h-5 w-5 text-[#103078]" />
                  팀 편성
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
                  <input
                    type="number"
                    min={1}
                    value={teamSize}
                    onChange={(event) => setTeamSize(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                  />
                  <input
                    value={teamDescription}
                    onChange={(event) => setTeamDescription(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <aside className="flex flex-col gap-5">
            <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
              <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                <Settings2 className="h-5 w-5 text-[#103078]" />
                기능 선택
              </h2>
              <div className="mt-4 grid gap-3">
                {EVENT_FEATURE_OPTIONS.map((option) => {
                  const Icon = FEATURE_ICON[option.key];
                  const checked = featureEnabled[option.key];

                  return (
                    <label
                      key={option.key}
                      className="flex cursor-pointer gap-3 rounded-[8px] border px-3.5 py-3 transition-colors"
                      style={{
                        borderColor: checked ? "#cfe1ff" : "#eeeae2",
                        background: checked ? "#f6f9ff" : "#fbfaf7",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(option.key)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[#103078]" />
                          <span className="text-[14px] font-black text-[#171717]">
                            {option.label}
                          </span>
                        </div>
                        <p className="mb-0 mt-1 text-[12px] leading-5 text-[#6f6a62]">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {featureEnabled.attendanceCheck ? (
              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                  <CheckCircle2 className="h-5 w-5 text-[#103078]" />
                  참석 체크
                </h2>
                <div className="mt-4 grid gap-3">
                  <input
                    type="number"
                    min={0}
                    value={attendanceExpected}
                    onChange={(event) => setAttendanceExpected(event.target.value)}
                    className="h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                    placeholder="예상 인원"
                  />
                  <select
                    value={attendanceMethod}
                    onChange={(event) => setAttendanceMethod(event.target.value as "manual" | "qr")}
                    className="h-11 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[15px] font-semibold outline-none focus:border-[#103078]"
                  >
                    <option value="manual">수동 체크</option>
                    <option value="qr">QR 체크</option>
                  </select>
                </div>
              </div>
            ) : null}

            <div className="rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-5">
              <div className="inline-flex items-center gap-2 text-[13px] font-black text-[#6f6a62]">
                <CalendarDays className="h-4 w-4" />
                저장 위치
              </div>
              <p className="mb-0 mt-2 text-[13px] leading-6 text-[#6f6a62]">
                현재 행사 초안은 이 브라우저에 저장됩니다. 배포용 DB 저장은 행사 테이블을 붙이면 같은 필드로 이어갈 수 있습니다.
              </p>
            </div>
          </aside>
        </main>
      </form>
    </div>
  );
}
