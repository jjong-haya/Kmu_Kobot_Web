import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  MessageSquareText,
  RefreshCw,
  Save,
  Search,
  Send,
  Trophy,
  Unlink,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  FORM_CATEGORY_LABELS,
  FORM_PERSONAL_INFO_FIELDS,
  FORM_QUESTION_TYPE_OPTIONS,
  FORM_STATUS_LABELS,
  addFormComment,
  createEmptyPersonalInfo,
  addTournamentTeam,
  filterVisibleFormAnswers,
  getApplicantForm,
  getForm,
  getFormResponseAvailability,
  getGoogleSheetUrl,
  getTournamentStandings,
  getVisibleFormQuestions,
  normalizeMemberAnswerValue,
  normalizePersonalInfo,
  recordTournamentMatchScore,
  submitFormResponse,
  updateFormResponseSheet,
  type ClubForm,
  type FormAnswerValue,
  type FormMemberAnswer,
  type FormPersonalInfo,
  type FormQuestion,
  type TournamentMatch,
} from "../../api/forms";
import {
  fetchGoogleSheetValues,
  GoogleSheetValuesError,
  type GoogleSheetValuesResult,
} from "../../api/google-sheets";
import { listMemberDirectory, type MemberDirectoryProfile } from "../../api/member-directory";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";
import { EmptyState } from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
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

function formatResponseWindow(form: ClubForm) {
  const { startsAt, endsAt } = form.responseWindow;
  if (!startsAt && !endsAt) return "응답 기간 제한 없음";
  if (startsAt && endsAt) return `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
  if (startsAt) return `${formatDateTime(startsAt)}부터 응답 가능`;
  return `${formatDateTime(endsAt ?? "")}까지 응답 가능`;
}

function questionTypeLabel(type: FormQuestion["type"]) {
  return FORM_QUESTION_TYPE_OPTIONS.find((option) => option.key === type)?.label ?? type;
}

function formatAnswer(value: FormAnswerValue) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        return item.loginId ? `${item.displayName}(${item.loginId})` : item.displayName;
      })
      .filter(Boolean)
      .join(", ");
  }
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function splitMembers(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSheetTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function buildLocalResponseSheet(form: ClubForm) {
  const headers = [
    "제출 시각",
    ...FORM_PERSONAL_INFO_FIELDS.map((field) => field.label),
    ...form.questions.map((question) => question.title || "질문"),
  ];
  const rows = form.responses
    .slice()
    .reverse()
    .map((response) => [
      formatSheetTimestamp(response.submittedAt),
      ...FORM_PERSONAL_INFO_FIELDS.map((field) =>
        formatAnswer(response.respondentInfo?.[field.key] ?? (field.key === "name" ? response.respondentName : "")),
      ),
      ...form.questions.map((question) => formatAnswer(response.answers[question.id])),
    ]);

  return { headers, rows };
}

function valuesToSheetGrid(values: string[][]) {
  if (values.length === 0) return { headers: [], rows: [] };

  const width = Math.max(...values.map((row) => row.length), 0);
  const headers = values[0].map((cell, index) => cell || `열 ${index + 1}`);
  while (headers.length < width) headers.push(`열 ${headers.length + 1}`);

  const rows = values.slice(1).map((row) =>
    Array.from({ length: headers.length }, (_, index) => row[index] ?? ""),
  );

  return { headers, rows };
}

function spreadsheetIdFromInput(value: string) {
  const match = value.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? value.trim().replace(/[?#].*$/, "");
}

function SheetGrid({
  emptyLabel,
  headers,
  rows,
}: {
  emptyLabel: string;
  headers: string[];
  rows: string[][];
}) {
  if (headers.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[#d8deea] bg-[#fbfcfe] p-8 text-center text-[15px] font-semibold text-[#64748b]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#d8deea] bg-white">
      <div className="max-h-[620px] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-12 border-b border-r border-[#d8deea] bg-[#eef2f8] px-3 py-3 text-center font-black text-[#64748b]">
                #
              </th>
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="sticky top-0 z-10 min-w-[180px] border-b border-r border-[#d8deea] bg-[#eef2f8] px-3 py-3 font-black text-[#334155]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group">
                  <td className="sticky left-0 z-10 border-b border-r border-[#e6ebf3] bg-[#f8fafc] px-3 py-3 text-center font-black text-[#94a3b8] group-hover:bg-[#eef4ff]">
                    {rowIndex + 1}
                  </td>
                  {headers.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="max-w-[320px] whitespace-pre-wrap border-b border-r border-[#e6ebf3] bg-white px-3 py-3 align-top font-semibold leading-6 text-[#334155] group-hover:bg-[#fbfdff]"
                    >
                      {row[cellIndex] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-4 py-10 text-center text-[15px] font-semibold text-[#64748b]"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function memberAnswerFromProfile(member: MemberDirectoryProfile): FormMemberAnswer {
  return {
    userId: member.id,
    displayName: member.displayName,
    loginId: member.loginId,
    department: member.department,
    tags: member.memberTags.map((tag) => tag.label),
  };
}

function memberAnswerLabel(member: FormMemberAnswer) {
  return member.loginId ? `${member.displayName} (${member.loginId})` : member.displayName;
}

function isSearchableMember(member: MemberDirectoryProfile) {
  return member.status === "active" || member.status === "course_member";
}

function isMemberInQuestionScope(member: MemberDirectoryProfile, question: FormQuestion) {
  const allowedTagIds = question.memberSearchTagIds ?? [];
  if (allowedTagIds.length === 0) return true;
  const memberTagIds = new Set(member.memberTags.map((tag) => tag.id));
  return allowedTagIds.some((tagId) => memberTagIds.has(tagId));
}

function memberMatchesQuery(member: MemberDirectoryProfile, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    member.displayName,
    member.fullName,
    member.loginId,
    member.department,
    member.email,
    ...member.tags,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function QuestionInput({
  memberOptions = [],
  memberOptionsLoading = false,
  onChange,
  question,
  value,
}: {
  memberOptions?: MemberDirectoryProfile[];
  memberOptionsLoading?: boolean;
  onChange: (value: FormAnswerValue) => void;
  question: FormQuestion;
  value: FormAnswerValue;
}) {
  const [memberQuery, setMemberQuery] = useState("");
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
    const current = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
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

  if (question.type === "member_search") {
    const selected = normalizeMemberAnswerValue(value);
    const selectedIds = new Set(selected.map((member) => member.userId));
    const maxCount = question.memberSearchMax ?? 5;
    const candidates = memberOptions
      .filter(isSearchableMember)
      .filter((member) => isMemberInQuestionScope(member, question))
      .filter((member) => !selectedIds.has(member.id))
      .filter((member) => memberMatchesQuery(member, memberQuery))
      .slice(0, 8);
    const selectedCountLabel = `${selected.length}/${maxCount}`;

    return (
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 ? (
            selected.map((member) => (
              <span
                key={member.userId}
                className="inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-[#d8deea] bg-[#f8fafc] px-3 text-[13px] font-black text-[#334155]"
              >
                {memberAnswerLabel(member)}
                <button
                  type="button"
                  onClick={() =>
                    onChange(selected.filter((item) => item.userId !== member.userId))
                  }
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#e2e8f0] hover:text-[#111827]"
                  aria-label={`${member.displayName} 선택 해제`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[13px] font-semibold text-[#8d877e]">
              아직 선택된 팀원이 없습니다.
            </span>
          )}
        </div>

        <label className="relative grid">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d877e]" />
          <input
            value={memberQuery}
            onChange={(event) => setMemberQuery(event.target.value)}
            className="h-11 rounded-[8px] border border-[#e8e6df] py-0 pl-9 pr-16 text-[15px] font-semibold outline-none focus:border-[#103078]"
            placeholder="이름, 아이디, 학과로 검색"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-[#64748b]">
            {selectedCountLabel}
          </span>
        </label>

        {candidates.length > 0 && selected.length < maxCount ? (
          <div className="grid gap-2">
            {candidates.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onChange([...selected, memberAnswerFromProfile(member)])}
                className="grid min-h-12 grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] px-3 py-2 text-left transition-colors hover:border-[#103078] hover:bg-white"
              >
                <UserPlus className="h-4 w-4 text-[#103078]" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-black text-[#312f2c]">
                    {member.displayName}
                    {member.loginId ? (
                      <span className="ml-1 text-[12px] font-bold text-[#64748b]">
                        @{member.loginId}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-[12px] font-semibold text-[#8d877e]">
                    {[member.department, ...member.memberTags.map((tag) => tag.label)]
                      .filter(Boolean)
                      .slice(0, 4)
                      .join(" · ") || "소속 정보 없음"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-[#e8e6df] bg-[#fbfaf7] px-3 py-3 text-[13px] font-semibold text-[#8d877e]">
            {memberOptionsLoading
              ? "회원 목록을 불러오는 중입니다."
              : selected.length >= maxCount
                ? "선택 인원 제한에 도달했습니다."
                : "검색 범위에 맞는 회원이 없습니다."}
          </div>
        )}
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
      <div className="mx-auto max-w-[720px]">
        <EmptyState
          icon={ClipboardList}
          title="폼을 찾을 수 없어요"
          description="삭제되었거나 아직 응답을 받지 않는 상태일 수 있어요. 행사 페이지로 돌아가 다시 시도해 주세요."
          action={
            <Link
              to="/member/forms"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              폼 목록
            </Link>
          }
          secondaryAction={
            <Link
              to="/member/events"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-medium text-[var(--kb-ink-500)] no-underline transition-colors hover:text-[var(--kb-navy-700)]"
            >
              행사로
            </Link>
          }
        />
      </div>
    </div>
  );
}

function FormAccessBlocked({ message }: { message: string }) {
  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto max-w-[720px]">
        <EmptyState
          icon={ClipboardList}
          title="아직 열 수 없는 폼입니다"
          description={message}
          action={
            <Link
              to="/member"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              대시보드로
            </Link>
          }
        />
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
  const [personalInfo, setPersonalInfo] = useState<FormPersonalInfo>(() => createEmptyPersonalInfo());
  const [commentBody, setCommentBody] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [teamContact, setTeamContact] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const [memberOptions, setMemberOptions] = useState<MemberDirectoryProfile[]>([]);
  const [memberOptionsLoading, setMemberOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetDraft, setSheetDraft] = useState({
    range: "Form Responses 1!A:Z",
    sheetName: "Form Responses 1",
    spreadsheetId: "",
  });
  const [sheetResult, setSheetResult] = useState<GoogleSheetValuesResult | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const canManageForms = hasPermission("forms.manage");
  const defaultName =
    authData.profile.nicknameDisplay ??
    authData.profile.displayName ??
    authData.profile.fullName ??
    authData.profile.email ??
    "익명";
  const defaultPersonalInfo = normalizePersonalInfo({
    name:
      authData.profile.fullName ??
      authData.profile.displayName ??
      authData.profile.nicknameDisplay ??
      authData.profile.email ??
      "",
    department: authData.profile.department ?? "",
    studentId: authData.profile.studentId ?? "",
    phone: authData.profile.phone ?? "",
  });

  async function load() {
    if (!formId) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = canManageForms ? await getForm(formId) : await getApplicantForm(formId);
      setForm(loaded);
      if (loaded) {
        setSheetDraft({
          range: loaded.responseSheet?.range ?? "Form Responses 1!A:Z",
          sheetName: loaded.responseSheet?.sheetName ?? "Form Responses 1",
          spreadsheetId: loaded.responseSheet?.spreadsheetId ?? "",
        });
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
  }, [canManageForms, formId]);

  useEffect(() => {
    if (!canManageForms && activePanel !== "answer") {
      setActivePanel("answer");
    }
  }, [activePanel, canManageForms]);

  useEffect(() => {
    if (!canManageForms) {
      setSheetResult(null);
      setSheetError(null);
      setScoreDrafts({});
    }
  }, [canManageForms]);

  useEffect(() => {
    if (!form?.questions.some((question) => question.type === "member_search")) {
      setMemberOptions([]);
      return;
    }

    const currentUserId = authData.profile.id;
    if (!currentUserId) return;

    let cancelled = false;
    setMemberOptionsLoading(true);

    listMemberDirectory(currentUserId)
      .then((directory) => {
        if (!cancelled) setMemberOptions(directory.members);
      })
      .catch(() => {
        if (!cancelled) setMemberOptions([]);
      })
      .finally(() => {
        if (!cancelled) setMemberOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authData.profile.id, form]);

  useEffect(() => {
    setPersonalInfo((current) => ({
      name: current.name || defaultPersonalInfo.name,
      department: current.department || defaultPersonalInfo.department,
      studentId: current.studentId || defaultPersonalInfo.studentId,
      phone: current.phone || defaultPersonalInfo.phone,
    }));
  }, [
    defaultPersonalInfo.name,
    defaultPersonalInfo.department,
    defaultPersonalInfo.studentId,
    defaultPersonalInfo.phone,
  ]);

  const standings = useMemo(
    () => (form?.tournament.enabled ? getTournamentStandings(form.tournament) : []),
    [form],
  );
  const visibleQuestions = useMemo(
    () => (form ? getVisibleFormQuestions(form.questions, answers) : []),
    [answers, form],
  );
  const localSheetGrid = useMemo(
    () => (canManageForms && form ? buildLocalResponseSheet(form) : { headers: [], rows: [] }),
    [canManageForms, form],
  );
  const googleSheetGrid = useMemo(
    () => (sheetResult ? valuesToSheetGrid(sheetResult.values) : null),
    [sheetResult],
  );
  const responseSheetGrid = googleSheetGrid ?? localSheetGrid;
  const googleSheetUrl = getGoogleSheetUrl(form?.responseSheet);
  const responseSheetSource = googleSheetGrid
    ? "Google Sheets API"
    : form?.responseSheet?.spreadsheetId
      ? "Google Sheets 연결 대기"
      : "KOBOT 로컬 응답";

  async function loadResponseSheet() {
    if (!canManageForms) return;
    if (!form?.responseSheet?.spreadsheetId) {
      setSheetResult(null);
      setSheetError(null);
      return;
    }

    setSheetLoading(true);
    setSheetError(null);
    try {
      const result = await fetchGoogleSheetValues({
        spreadsheetId: form.responseSheet.spreadsheetId,
        range: form.responseSheet.range,
      });
      setSheetResult(result);
    } catch (requestError) {
      setSheetResult(null);
      if (
        requestError instanceof GoogleSheetValuesError &&
        requestError.code === "missing_api_key"
      ) {
        setSheetError(
          "Google Sheets API 키가 아직 설정되지 않았습니다. 지금은 같은 표 UI로 로컬 응답을 보여줍니다.",
        );
      } else if (
        requestError instanceof GoogleSheetValuesError &&
        requestError.status === 403
      ) {
        setSheetError(
          "이 시트는 API 키만으로 읽을 수 없습니다. 비공개 시트까지 보려면 OAuth 또는 서버 함수 연결이 필요합니다.",
        );
      } else {
        setSheetError("Google Sheets 데이터를 불러오지 못했습니다. 로컬 응답 표로 대신 표시합니다.");
      }
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleSaveResponseSheet(event: FormEvent) {
    event.preventDefault();
    if (!form || !canManageForms) return;

    const spreadsheetId = spreadsheetIdFromInput(sheetDraft.spreadsheetId);
    if (!spreadsheetId) {
      setSheetError("Google Sheet URL 또는 스프레드시트 ID를 입력해주세요.");
      return;
    }

    setError(null);
    setMessage(null);
    setSheetError(null);
    try {
      const updated = await updateFormResponseSheet(form.id, {
        spreadsheetId,
        range: sheetDraft.range || "Form Responses 1!A:Z",
        sheetName: sheetDraft.sheetName || "Form Responses 1",
      }, canManageForms);
      setForm(updated);
      setMessage("응답 시트 연결 정보를 저장했습니다.");
    } catch (requestError) {
      setSheetError(sanitizeUserError(requestError, "응답 시트 연결 정보를 저장하지 못했습니다."));
    }
  }

  async function handleClearResponseSheet() {
    if (!form || !canManageForms) return;

    setSheetError(null);
    setSheetResult(null);
    try {
      const updated = await updateFormResponseSheet(form.id, null, canManageForms);
      setForm(updated);
      setSheetDraft({
        range: "Form Responses 1!A:Z",
        sheetName: "Form Responses 1",
        spreadsheetId: "",
      });
      setMessage("응답 시트 연결을 해제했습니다.");
    } catch (requestError) {
      setSheetError(sanitizeUserError(requestError, "응답 시트 연결을 해제하지 못했습니다."));
    }
  }

  useEffect(() => {
    if (canManageForms && activePanel === "responses" && form?.responseSheet?.spreadsheetId) {
      void loadResponseSheet();
    }
  }, [activePanel, canManageForms, form?.id, form?.responseSheet?.spreadsheetId, form?.responseSheet?.range]);

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

  const responseAvailability = getFormResponseAvailability(form);
  const responseDisabledMessage =
    responseAvailability.reason === "not_started"
      ? "아직 응답 가능 기간이 시작되지 않았습니다."
      : responseAvailability.reason === "ended"
        ? "응답 가능 기간이 종료되었습니다."
        : responseAvailability.reason === "closed"
          ? "이 폼은 현재 응답을 받지 않습니다."
          : null;

  if (!canManageForms && !responseAvailability.open) {
    return <FormAccessBlocked message={responseDisabledMessage ?? "이 폼은 현재 신청자에게 공개되지 않았습니다."} />;
  }

  async function handleSubmitResponse(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setMessage(null);

    try {
      await submitFormResponse(
        form.id,
        filterVisibleFormAnswers(form.questions, answers),
        personalInfo,
      );
      setAnswers({});
      setMessage("응답이 제출되었습니다.");
      await load();
    } catch (requestError) {
      const raw = requestError instanceof Error ? requestError.message : "";
      if (raw.startsWith("required:")) {
        setError(`필수 질문을 확인해주세요: ${raw.replace("required:", "")}`);
      } else if (raw.startsWith("personal_info_required:")) {
        setError(`개인정보 응답 카드를 확인해주세요: ${raw.replace("personal_info_required:", "")}`);
      } else if (raw === "form_not_started") {
        setError("아직 응답 가능 기간이 시작되지 않았습니다.");
      } else if (raw === "form_ended") {
        setError("응답 가능 기간이 종료되었습니다.");
      } else if (raw === "form_closed") {
        setError("이 폼은 현재 응답을 받지 않습니다.");
      } else {
        setError(sanitizeUserError(requestError, "응답을 제출하지 못했습니다."));
      }
    }
  }

  async function handleAddComment(event: FormEvent) {
    event.preventDefault();
    if (!form || !canManageForms) return;
    setError(null);
    setMessage(null);

    try {
      await addFormComment(form.id, defaultName, commentBody, canManageForms);
      setCommentBody("");
      setMessage("댓글이 등록되었습니다.");
      await load();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "댓글을 등록하지 못했습니다."));
    }
  }

  async function handleAddTeam(event: FormEvent) {
    event.preventDefault();
    if (!form || !canManageForms) return;
    setError(null);
    setMessage(null);

    try {
      await addTournamentTeam(
        form.id,
        {
          name: teamName,
          members: splitMembers(teamMembers),
          contact: teamContact,
        },
        canManageForms,
      );
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
    if (!form || !canManageForms) return;
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
      await recordTournamentMatchScore(form.id, match.id, home, away, canManageForms);
      setMessage("경기 결과가 저장되었습니다.");
      await load();
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "경기 결과를 저장하지 못했습니다."));
    }
  }

  const panels = [
    { key: "answer" as const, label: "\uC751\uB2F5 \uC791\uC131", count: form.questions.length },
    ...(canManageForms
      ? [
          { key: "responses" as const, label: "\uC751\uB2F5 \uC2DC\uD2B8", count: form.responses.length },
          { key: "comments" as const, label: "\uB313\uAE00", count: form.comments.length },
          ...(form.tournament.enabled
            ? [{ key: "tournament" as const, label: "\uD300 \uAD00\uB9AC", count: form.tournament.teams.length }]
            : []),
        ]
      : []),
  ] satisfies { key: PanelKey; label: string; count: number }[];

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={canManageForms ? "/member/forms" : "/member"}
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
            <span className="rounded-full border border-[#d8e2f7] bg-[#f6f9ff] px-2.5 py-1 text-[12px] font-bold text-[#183b80]">
              {formatResponseWindow(form)}
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
              <div className="rounded-[10px] border border-[#cfe8da] border-l-[5px] border-l-[#2f7d58] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-black text-[#2f7d58]">자동 입력</div>
                    <h2 className="m-0 mt-1 text-[18px] font-black text-[#111111]">
                      개인정보 응답 카드
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#f0fbf4] px-2.5 py-1 text-[11px] font-black text-[#2f7d58]">
                    수정 가능
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {FORM_PERSONAL_INFO_FIELDS.map((field) => (
                    <label key={field.key} className="grid gap-2">
                      <span className="text-[13px] font-bold text-[#52606f]">{field.label}</span>
                      <input
                        value={personalInfo[field.key]}
                        autoComplete={field.autoComplete}
                        onChange={(event) =>
                          setPersonalInfo((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="h-11 rounded-[8px] border border-[#d8deea] px-3 text-[14px] font-semibold outline-none focus:border-[#2f7d58]"
                        placeholder={field.placeholder}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {visibleQuestions.map((question) => (
                <div key={question.id} className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="text-[17px] font-black text-[#111111]">{question.title}</div>
                    {question.visibleWhen ? (
                      <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[11px] font-bold text-[#7c3aed]">
                        연결 질문
                      </span>
                    ) : null}
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
                      memberOptions={memberOptions}
                      memberOptionsLoading={memberOptionsLoading}
                      question={question}
                      value={
                        answers[question.id] ??
                        (question.type === "multiple_choice" || question.type === "member_search" ? [] : "")
                      }
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
                <div className="mt-4 rounded-[8px] bg-[#fbfaf7] px-3 py-3 text-[13px] font-bold leading-6 text-[#6f6a62]">
                  {formatResponseWindow(form)}
                  {responseDisabledMessage ? (
                    <div className="mt-2 text-[#b45309]">{responseDisabledMessage}</div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={!responseAvailability.open}
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
          <section className="grid gap-4">
            <div className="rounded-[10px] border border-[#d8deea] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 inline-flex items-center gap-2 text-[20px] font-black text-[#111111]">
                    <FileSpreadsheet className="h-5 w-5 text-[#103078]" />
                    응답 시트
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#64748b]">
                    <span>{responseSheetSource}</span>
                    <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                    <span>{responseSheetGrid.rows.length}개 행</span>
                    <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                    <span>{responseSheetGrid.headers.length}개 열</span>
                    {sheetResult ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                        <span>{formatSheetTimestamp(sheetResult.loadedAt)} 동기화</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.responseSheet?.spreadsheetId ? (
                    <button
                      type="button"
                      onClick={() => void loadResponseSheet()}
                      disabled={sheetLoading}
                      className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-bold text-[#334155] transition-colors hover:border-[#103078] hover:text-[#103078] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <RefreshCw className={`h-4 w-4 ${sheetLoading ? "animate-spin" : ""}`} />
                      새로고침
                    </button>
                  ) : null}
                  {googleSheetUrl ? (
                    <a
                      href={googleSheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-3 text-[13px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Google Sheets
                    </a>
                  ) : null}
                </div>
              </div>

              {canManageForms ? (
                <form
                  onSubmit={handleSaveResponseSheet}
                  className="mt-5 grid gap-3 border-t border-[#edf1f6] pt-5 lg:grid-cols-[minmax(220px,1.2fr)_180px_minmax(190px,0.8fr)_auto_auto]"
                >
                  <label className="grid gap-2">
                    <span className="text-[12px] font-black uppercase text-[#64748b]">
                      Google Sheet URL 또는 ID
                    </span>
                    <input
                      value={sheetDraft.spreadsheetId}
                      onChange={(event) =>
                        setSheetDraft((current) => ({
                          ...current,
                          spreadsheetId: event.target.value,
                        }))
                      }
                      className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[13px] font-semibold text-[#334155] outline-none focus:border-[#103078]"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[12px] font-black uppercase text-[#64748b]">범위</span>
                    <input
                      value={sheetDraft.range}
                      onChange={(event) =>
                        setSheetDraft((current) => ({ ...current, range: event.target.value }))
                      }
                      className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[13px] font-semibold text-[#334155] outline-none focus:border-[#103078]"
                      placeholder="Form Responses 1!A:Z"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[12px] font-black uppercase text-[#64748b]">시트 이름</span>
                    <input
                      value={sheetDraft.sheetName}
                      onChange={(event) =>
                        setSheetDraft((current) => ({ ...current, sheetName: event.target.value }))
                      }
                      className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[13px] font-semibold text-[#334155] outline-none focus:border-[#103078]"
                      placeholder="Form Responses 1"
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#103078] px-3 text-[13px] font-bold text-white transition-colors hover:bg-[#0b2560]"
                  >
                    <Save className="h-4 w-4" />
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleClearResponseSheet()}
                    className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-bold text-[#64748b] transition-colors hover:border-red-200 hover:text-red-700"
                  >
                    {form.responseSheet?.spreadsheetId ? (
                      <Unlink className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    해제
                  </button>
                </form>
              ) : null}
            </div>

            {sheetError ? (
              <div className="rounded-[8px] border border-amber-100 bg-amber-50 px-4 py-3 text-[14px] font-semibold text-amber-800">
                {sheetError}
              </div>
            ) : null}

            <SheetGrid
              headers={responseSheetGrid.headers}
              rows={responseSheetGrid.rows}
              emptyLabel="아직 표시할 응답 행이 없습니다."
            />
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
          {canManageForms ? (
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#103078]" />
              {"\uC751\uB2F5 "}{form.responses.length}{"\uAC1C"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
