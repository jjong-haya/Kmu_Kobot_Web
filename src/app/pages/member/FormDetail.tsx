import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  RefreshCw,
  Send,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  FORM_CATEGORY_LABELS,
  FORM_QUESTION_TYPE_OPTIONS,
  FORM_STATUS_LABELS,
  addFormComment,
  addTournamentTeam,
  getForm,
  getTournamentStandings,
  recordTournamentMatchScore,
  submitFormResponse,
  type ClubForm,
  type FormAnswerValue,
  type FormQuestion,
  type TournamentMatch,
} from "../../api/forms";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

type PanelKey = "answer" | "responses" | "comments" | "tournament";

function formatDateTime(value: string) {
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

function questionTypeLabel(type: FormQuestion["type"]) {
  return FORM_QUESTION_TYPE_OPTIONS.find((option) => option.key === type)?.label ?? type;
}

function formatAnswer(value: FormAnswerValue) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function splitMembers(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function QuestionInput({
  onChange,
  question,
  value,
}: {
  onChange: (value: FormAnswerValue) => void;
  question: FormQuestion;
  value: FormAnswerValue;
}) {
  const inputClass =
    "h-11 rounded-[8px] border border-[#e8e6df] px-3 text-[15px] font-semibold outline-none focus:border-[#103078]";

  if (question.type === "long_text") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[120px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[15px] leading-7 outline-none focus:border-[#103078]"
        placeholder="답변"
      />
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="grid gap-2">
        {(question.options ?? []).map((option) => (
          <label
            key={option.id}
            className="flex min-h-10 items-center gap-2 rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] px-3 text-[14px] font-semibold text-[#312f2c]"
          >
            <input
              type="radio"
              name={question.id}
              checked={value === option.label}
              onChange={() => onChange(option.label)}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const current = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2">
        {(question.options ?? []).map((option) => (
          <label
            key={option.id}
            className="flex min-h-10 items-center gap-2 rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] px-3 text-[14px] font-semibold text-[#312f2c]"
          >
            <input
              type="checkbox"
              checked={current.includes(option.label)}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...current, option.label]);
                } else {
                  onChange(current.filter((item) => item !== option.label));
                }
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">선택</option>
        {(question.options ?? []).map((option) => (
          <option key={option.id} value={option.label}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "linear_scale") {
    const min = question.scaleMin ?? 1;
    const max = question.scaleMax ?? 5;
    const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {values.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className="h-10 min-w-10 rounded-[8px] border px-3 text-[14px] font-black transition-colors"
              style={{
                background: value === item ? "#103078" : "#ffffff",
                borderColor: value === item ? "#103078" : "#e8e6df",
                color: value === item ? "#ffffff" : "#312f2c",
              }}
            >
              {item}
            </button>
          ))}
        </div>
        {(question.scaleMinLabel || question.scaleMaxLabel) ? (
          <div className="flex justify-between text-[12px] font-bold text-[#8d877e]">
            <span>{question.scaleMinLabel}</span>
            <span>{question.scaleMaxLabel}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (question.type === "date" || question.type === "time") {
    return (
      <input
        type={question.type === "date" ? "date" : "time"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }

  return (
    <input
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
      placeholder="답변"
    />
  );
}

function FormNotFound() {
  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex min-h-[420px] max-w-[720px] flex-col items-center justify-center text-center">
        <ClipboardList className="mb-4 h-12 w-12 text-[#8d877e]" />
        <h1 className="m-0 text-[28px] font-black tracking-normal text-[#111111]">
          폼을 찾을 수 없습니다.
        </h1>
        <Link
          to="/member/forms"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-4 text-[14px] font-bold text-[#312f2c] no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          폼 목록
        </Link>
      </div>
    </div>
  );
}

function TeamName({ form, teamId }: { form: ClubForm; teamId: string }) {
  return <>{form.tournament.teams.find((team) => team.id === teamId)?.name ?? "팀 미정"}</>;
}

export default function FormDetail() {
  const { formId } = useParams();
  const { authData, hasPermission } = useAuth();
  const [form, setForm] = useState<ClubForm | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey>("answer");
  const [answers, setAnswers] = useState<Record<string, FormAnswerValue>>({});
  const [respondentName, setRespondentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [teamContact, setTeamContact] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageForms = hasPermission("forms.manage");
  const defaultName =
    authData.profile.nicknameDisplay ??
    authData.profile.displayName ??
    authData.profile.fullName ??
    authData.profile.email ??
    "익명";

  async function load() {
    if (!formId) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await getForm(formId);
      setForm(loaded);
      if (loaded) {
        setRespondentName((current) => current || defaultName);
        setScoreDrafts(
          Object.fromEntries(
            loaded.tournament.matches.map((match) => [
              match.id,
              {
                home: match.homeScore === undefined ? "" : String(match.homeScore),
                away: match.awayScore === undefined ? "" : String(match.awayScore),
              },
            ]),
          ),
        );
      }
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [formId]);

  const standings = useMemo(
    () => (form?.tournament.enabled ? getTournamentStandings(form.tournament) : []),
    [form],
  );

  if (loading) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="flex min-h-[420px] items-center justify-center gap-2 text-[15px] font-semibold text-[#6f6a62]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          폼을 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!form) return <FormNotFound />;

  async function handleSubmitResponse(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setMessage(null);

    try {
      await submitFormResponse(form.id, answers, respondentName || defaultName);
      setAnswers({});
      setMessage("응답이 제출되었습니다.");
      await load();
    } catch (requestError) {
      const raw = requestError instanceof Error ? requestError.message : "";
      if (raw.startsWith("required:")) {
        setError(`필수 질문을 확인해주세요: ${raw.replace("required:", "")}`);
      } else if (raw === "form_closed") {
        setError("이 폼은 현재 응답을 받지 않습니다.");
      } else {
        setError(sanitizeUserError(requestError, "응답을 제출하지 못했습니다."));
      }
    }
  }

  async function handleAddComment(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setMessage(null);

    try {
      await addFormComment(form.id, defaultName, commentBody);
      setCommentBody("");
      setMessage("댓글이 등록되었습니다.");
      await load();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "댓글을 등록하지 못했습니다."));
    }
  }

  async function handleAddTeam(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setMessage(null);

    try {
      await addTournamentTeam(form.id, {
        name: teamName,
        members: splitMembers(teamMembers),
        contact: teamContact,
      });
      setTeamName("");
      setTeamMembers("");
      setTeamContact("");
      setMessage("팀이 등록되었습니다.");
      await load();
    } catch (requestError) {
      const raw = requestError instanceof Error ? requestError.message : "";
      if (raw === "team_too_large") {
        setError(`팀 인원은 최대 ${form.tournament.maxTeamSize}명까지 가능합니다.`);
      } else {
        setError(sanitizeUserError(requestError, "팀을 등록하지 못했습니다."));
      }
    }
  }

  async function handleRecordScore(match: TournamentMatch) {
    if (!form) return;
    const draft = scoreDrafts[match.id] ?? { home: "", away: "" };
    const home = Number.parseInt(draft.home, 10);
    const away = Number.parseInt(draft.away, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
      setError("점수를 숫자로 입력해주세요.");
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await recordTournamentMatchScore(form.id, match.id, home, away);
      setMessage("경기 결과가 저장되었습니다.");
      await load();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "경기 결과를 저장하지 못했습니다."));
    }
  }

  const panels = [
    { key: "answer", label: "응답 작성", count: form.questions.length },
    { key: "responses", label: "응답", count: form.responses.length },
    { key: "comments", label: "댓글", count: form.comments.length },
    { key: "tournament", label: "팀 / 리그전", count: form.tournament.teams.length },
  ] satisfies { key: PanelKey; label: string; count: number }[];

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/member/forms"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-bold text-[#312f2c] no-underline transition-colors hover:border-[#cfcac0]"
          >
            <ArrowLeft className="h-4 w-4" />
            폼 목록
          </Link>
          {canManageForms ? (
            <Link
              to="/member/forms/new"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
            >
              새 폼
            </Link>
          ) : null}
        </div>

        <header className="rounded-[10px] border border-[#e8e6df] bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#d8e2f7] bg-[#f6f9ff] px-2.5 py-1 text-[12px] font-bold text-[#183b80]">
              {FORM_CATEGORY_LABELS[form.category]}
            </span>
            <span className="rounded-full border border-[#e8e2d6] bg-[#fbfaf7] px-2.5 py-1 text-[12px] font-bold text-[#5f574c]">
              {FORM_STATUS_LABELS[form.status]}
            </span>
          </div>
          <h1 className="mb-0 mt-4 text-[34px] font-black leading-tight tracking-normal text-[#0a0a0a]">
            {form.title}
          </h1>
          <p className="mb-0 mt-3 max-w-[760px] text-[15px] leading-7 text-[#6f6a62]">
            {form.description}
          </p>
        </header>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[8px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-[10px] border border-[#eeeae2] bg-white p-2">
          {panels.map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setActivePanel(panel.key)}
              className="h-10 rounded-[8px] px-3 text-[13px] font-bold transition-colors"
              style={{
                background: activePanel === panel.key ? "#111111" : "transparent",
                color: activePanel === panel.key ? "#ffffff" : "#5f574c",
              }}
            >
              {panel.label} {panel.count}
            </button>
          ))}
        </div>

        {activePanel === "answer" ? (
          <form onSubmit={handleSubmitResponse} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex flex-col gap-4">
              {form.questions.map((question) => (
                <div key={question.id} className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="text-[17px] font-black text-[#111111]">{question.title}</div>
                    {question.required ? (
                      <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] font-bold text-[#991b1b]">
                        필수
                      </span>
                    ) : null}
                    <span className="ml-auto rounded-full bg-[#fbfaf7] px-2 py-0.5 text-[11px] font-bold text-[#8d877e]">
                      {questionTypeLabel(question.type)}
                    </span>
                  </div>
                  {question.description ? (
                    <p className="mt-2 text-[13px] leading-5 text-[#6f6a62]">{question.description}</p>
                  ) : null}
                  <div className="mt-4 grid">
                    <QuestionInput
                      question={question}
                      value={answers[question.id] ?? (question.type === "multiple_choice" ? [] : "")}
                      onChange={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </section>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                  <Send className="h-5 w-5 text-[#103078]" />
                  제출
                </h2>
                <label className="mt-4 grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">응답자 이름</span>
                  <input
                    value={respondentName}
                    onChange={(event) => setRespondentName(event.target.value)}
                    className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!form.acceptsResponses || form.status !== "active"}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  응답 제출
                </button>
              </div>
            </aside>
          </form>
        ) : null}

        {activePanel === "responses" ? (
          <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-5">
              <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                <ClipboardList className="h-5 w-5 text-[#103078]" />
                응답 현황
              </h2>
              <div className="mt-4 text-[42px] font-black leading-none text-[#111111]">
                {form.responses.length}
              </div>
              <div className="mt-2 text-[13px] font-bold text-[#6f6a62]">
                질문 {form.questions.length}개
              </div>
            </aside>
            <div className="grid gap-3">
              {form.responses.length > 0 ? (
                form.responses.map((response) => (
                  <article key={response.id} className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-[#111111]">{response.respondentName}</span>
                      <span className="text-[12px] font-bold text-[#8d877e]">
                        {formatDateTime(response.submittedAt)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {form.questions.map((question) => (
                        <div key={question.id} className="grid gap-1 rounded-[8px] bg-[#fbfaf7] px-3 py-2">
                          <span className="text-[12px] font-bold text-[#8d877e]">{question.title}</span>
                          <span className="text-[14px] font-semibold text-[#312f2c]">
                            {formatAnswer(response.answers[question.id])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#ddd8ce] bg-[#fbfaf7] p-8 text-center text-[15px] font-semibold text-[#6f6a62]">
                  아직 응답이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activePanel === "comments" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3">
              {form.comments.length > 0 ? (
                form.comments.map((comment) => (
                  <article key={comment.id} className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-[#111111]">{comment.authorName}</span>
                      <span className="text-[12px] font-bold text-[#8d877e]">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mb-0 mt-3 whitespace-pre-wrap text-[14px] leading-7 text-[#514d47]">
                      {comment.body}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#ddd8ce] bg-[#fbfaf7] p-8 text-center text-[15px] font-semibold text-[#6f6a62]">
                  아직 댓글이 없습니다.
                </div>
              )}
            </div>
            <form onSubmit={handleAddComment} className="rounded-[10px] border border-[#eeeae2] bg-white p-5 lg:sticky lg:top-6">
              <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                <MessageSquareText className="h-5 w-5 text-[#103078]" />
                댓글
              </h2>
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                className="mt-4 min-h-[140px] w-full resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[14px] leading-6 outline-none focus:border-[#103078]"
                placeholder="댓글"
              />
              <button
                type="submit"
                disabled={!form.commentsEnabled}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send className="h-4 w-4" />
                등록
              </button>
            </form>
          </section>
        ) : null}

        {activePanel === "tournament" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-4">
              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                  <Trophy className="h-5 w-5 text-[#103078]" />
                  {form.tournament.title || "리그전"}
                </h2>
                {form.tournament.enabled ? (
                  <div className="mt-4 grid gap-3">
                    {form.tournament.matches.length > 0 ? (
                      form.tournament.matches.map((match) => (
                        <div
                          key={match.id}
                          className="grid gap-3 rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] p-3 sm:grid-cols-[80px_1fr_auto]"
                        >
                          <div className="text-[13px] font-black text-[#103078]">
                            {match.round}경기
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[14px] font-black text-[#312f2c]">
                            <TeamName form={form} teamId={match.homeTeamId} />
                            <span className="text-[#aaa49a]">vs</span>
                            <TeamName form={form} teamId={match.awayTeamId} />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              value={scoreDrafts[match.id]?.home ?? ""}
                              onChange={(event) =>
                                setScoreDrafts((current) => ({
                                  ...current,
                                  [match.id]: {
                                    home: event.target.value,
                                    away: current[match.id]?.away ?? "",
                                  },
                                }))
                              }
                              className="h-9 w-14 rounded-[8px] border border-[#e8e6df] px-2 text-center text-[13px] font-black outline-none focus:border-[#103078]"
                              placeholder="0"
                            />
                            <span className="font-black text-[#8d877e]">:</span>
                            <input
                              value={scoreDrafts[match.id]?.away ?? ""}
                              onChange={(event) =>
                                setScoreDrafts((current) => ({
                                  ...current,
                                  [match.id]: {
                                    home: current[match.id]?.home ?? "",
                                    away: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 w-14 rounded-[8px] border border-[#e8e6df] px-2 text-center text-[13px] font-black outline-none focus:border-[#103078]"
                              placeholder="0"
                            />
                            {canManageForms ? (
                              <button
                                type="button"
                                onClick={() => void handleRecordScore(match)}
                                className="h-9 rounded-[8px] bg-[#0a0a0a] px-3 text-[12px] font-bold text-white"
                              >
                                저장
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[8px] border border-dashed border-[#ddd8ce] bg-[#fbfaf7] p-6 text-center text-[14px] font-semibold text-[#6f6a62]">
                        팀이 2개 이상 등록되면 리그전 대진표가 만들어집니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mb-0 mt-3 text-[14px] text-[#6f6a62]">이 폼은 리그전을 사용하지 않습니다.</p>
                )}
              </div>

              <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                  <UsersRound className="h-5 w-5 text-[#103078]" />
                  팀 목록
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {form.tournament.teams.map((team) => (
                    <article key={team.id} className="rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] p-3">
                      <div className="text-[15px] font-black text-[#111111]">{team.name}</div>
                      <div className="mt-2 text-[13px] leading-6 text-[#6f6a62]">
                        {team.members.length > 0 ? team.members.join(", ") : "팀원 미정"}
                      </div>
                      {team.contact ? (
                        <div className="mt-2 text-[12px] font-bold text-[#8d877e]">{team.contact}</div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <form onSubmit={handleAddTeam} className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                <h2 className="m-0 text-[18px] font-black text-[#111111]">팀 등록</h2>
                <label className="mt-4 grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">팀 이름</span>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                  />
                </label>
                <label className="mt-3 grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">
                    팀원 이름, 쉼표 또는 줄바꿈
                  </span>
                  <textarea
                    value={teamMembers}
                    onChange={(event) => setTeamMembers(event.target.value)}
                    className="min-h-[100px] resize-y rounded-[8px] border border-[#e8e6df] px-3 py-3 text-[14px] leading-6 outline-none focus:border-[#103078]"
                  />
                </label>
                <label className="mt-3 grid gap-2">
                  <span className="text-[13px] font-bold text-[#6f6a62]">연락처</span>
                  <input
                    value={teamContact}
                    onChange={(event) => setTeamContact(event.target.value)}
                    className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!form.tournament.enabled}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  팀 추가
                </button>
              </form>

              <div className="rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-5">
                <h2 className="m-0 text-[18px] font-black text-[#111111]">순위표</h2>
                <div className="mt-4 grid gap-2">
                  {standings.map((standing, index) => (
                    <div
                      key={standing.team.id}
                      className="grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-[8px] bg-white px-3 py-2 text-[13px] font-bold text-[#312f2c]"
                    >
                      <span className="text-[#103078]">{index + 1}</span>
                      <span>{standing.team.name}</span>
                      <span>{standing.points}점</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        <div className="grid gap-3 rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-4 text-[13px] font-bold text-[#6f6a62] sm:grid-cols-3">
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#103078]" />
            생성 {formatDateTime(form.createdAt)}
          </div>
          <div className="inline-flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#103078]" />
            질문 {form.questions.length}개
          </div>
          <div className="inline-flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#103078]" />
            팀 {form.tournament.teams.length}개
          </div>
        </div>
      </div>
    </div>
  );
}
