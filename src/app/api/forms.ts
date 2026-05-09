export type ClubFormStatus = "draft" | "active" | "closed";

export type FormQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "linear_scale"
  | "member_search"
  | "date"
  | "time";

export type FormQuestionOption = {
  id: string;
  label: string;
};

export type FormQuestionVisibilityCondition = {
  parentQuestionId: string;
  optionId: string;
};

export type FormQuestion = {
  id: string;
  title: string;
  description?: string;
  type: FormQuestionType;
  required: boolean;
  visibleWhen?: FormQuestionVisibilityCondition;
  options?: FormQuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  memberSearchTagIds?: string[];
  memberSearchMax?: number;
};

export type FormMemberAnswer = {
  userId: string;
  displayName: string;
  loginId?: string | null;
  department?: string | null;
  tags?: string[];
};

export type FormAnswerValue = string | string[] | number | FormMemberAnswer[] | null;

export type FormPersonalInfo = {
  name: string;
  department: string;
  studentId: string;
  phone: string;
};

export type FormPersonalInfoFieldKey = keyof FormPersonalInfo;

export type FormResponseWindow = {
  startsAt?: string;
  endsAt?: string;
};

export type FormResponse = {
  id: string;
  respondentName: string;
  respondentInfo: FormPersonalInfo;
  submittedAt: string;
  answers: Record<string, FormAnswerValue>;
};

export type FormComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type TournamentTeam = {
  id: string;
  name: string;
  members: string[];
  contact?: string;
  seed: number;
};

export type TournamentMatchStatus = "scheduled" | "completed";

export type TournamentMatch = {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: TournamentMatchStatus;
};

export type TournamentSettings = {
  enabled: boolean;
  title: string;
  maxTeamSize: number;
  leagueType: "round_robin";
  teams: TournamentTeam[];
  matches: TournamentMatch[];
};

export type FormResponseSheetLink = {
  spreadsheetId: string;
  range: string;
  sheetName?: string;
  gid?: string;
  updatedAt?: string;
};

export type ClubForm = {
  id: string;
  title: string;
  description: string;
  category: "participant_survey" | "event_registration" | "operations" | "feedback";
  status: ClubFormStatus;
  createdAt: string;
  updatedAt: string;
  acceptsResponses: boolean;
  requiresLogin: boolean;
  commentsEnabled: boolean;
  responseWindow: FormResponseWindow;
  questions: FormQuestion[];
  responses: FormResponse[];
  comments: FormComment[];
  tournament: TournamentSettings;
  responseSheet?: FormResponseSheetLink;
};

export type CreateClubFormInput = Pick<
  ClubForm,
  | "title"
  | "description"
  | "category"
  | "status"
  | "acceptsResponses"
  | "requiresLogin"
  | "commentsEnabled"
  | "responseWindow"
  | "questions"
  | "tournament"
> & {
  id?: string;
  responseSheet?: FormResponseSheetLink;
};

export type TournamentStanding = {
  team: TournamentTeam;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
};

export const FORM_STATUS_LABELS: Record<ClubFormStatus, string> = {
  draft: "예정",
  active: "진행",
  closed: "마감",
};

export const FORM_CATEGORY_LABELS: Record<ClubForm["category"], string> = {
  participant_survey: "참여자 조사",
  event_registration: "행사 신청",
  operations: "운영",
  feedback: "피드백",
};

export const FORM_QUESTION_TYPE_OPTIONS = [
  { key: "short_text", label: "단답형" },
  { key: "long_text", label: "장문형" },
  { key: "single_choice", label: "객관식" },
  { key: "multiple_choice", label: "체크박스" },
  { key: "dropdown", label: "드롭다운" },
  { key: "linear_scale", label: "선형 배율" },
  { key: "member_search", label: "팀원 검색" },
  { key: "date", label: "날짜" },
  { key: "time", label: "시간" },
] satisfies { key: FormQuestionType; label: string }[];

export const FORM_PERSONAL_INFO_FIELDS = [
  { key: "name", label: "이름", placeholder: "홍길동", autoComplete: "name" },
  { key: "department", label: "학과", placeholder: "소프트웨어학부", autoComplete: "organization-title" },
  { key: "studentId", label: "학번", placeholder: "20261234", autoComplete: "off" },
  { key: "phone", label: "전화번호", placeholder: "010-0000-0000", autoComplete: "tel" },
] satisfies {
  key: FormPersonalInfoFieldKey;
  label: string;
  placeholder: string;
  autoComplete: string;
}[];

const OPTION_TYPES = new Set<FormQuestionType>([
  "single_choice",
  "multiple_choice",
  "dropdown",
]);

const DEFAULT_MEMBER_SEARCH_MAX = 5;
const MEMBER_SEARCH_MAX_LIMIT = 20;

const LOCAL_FORMS_STORAGE_KEY = "kobot:forms:local-v1";
const LEGACY_GAME_FORM_ID = "kobot-game-cup-2026-registration";

function makeId(prefix = "id") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${random}`;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || makeId("form");
}

export function createEmptyPersonalInfo(): FormPersonalInfo {
  return {
    name: "",
    department: "",
    studentId: "",
    phone: "",
  };
}

export function normalizePersonalInfo(input?: Partial<FormPersonalInfo> | null): FormPersonalInfo {
  const empty = createEmptyPersonalInfo();

  return {
    name: input?.name?.trim() ?? empty.name,
    department: input?.department?.trim() ?? empty.department,
    studentId: input?.studentId?.trim() ?? empty.studentId,
    phone: input?.phone?.trim() ?? empty.phone,
  };
}

export function validateFormPersonalInfo(input: Partial<FormPersonalInfo>) {
  const personalInfo = normalizePersonalInfo(input);
  return FORM_PERSONAL_INFO_FIELDS.filter((field) => !personalInfo[field.key]).map(
    (field) => field.label,
  );
}

function normalizeResponseWindow(input?: FormResponseWindow | null): FormResponseWindow {
  return {
    startsAt: input?.startsAt?.trim() || undefined,
    endsAt: input?.endsAt?.trim() || undefined,
  };
}

export function parseGoogleSpreadsheetId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? trimmed.replace(/[?#].*$/, "");
}

function normalizeResponseSheet(input?: FormResponseSheetLink | null): FormResponseSheetLink | undefined {
  if (!input) return undefined;

  const spreadsheetId = parseGoogleSpreadsheetId(input.spreadsheetId);
  if (!spreadsheetId) return undefined;

  return {
    spreadsheetId,
    range: input.range.trim() || "Form Responses 1!A:Z",
    sheetName: input.sheetName?.trim() || undefined,
    gid: input.gid?.trim() || undefined,
    updatedAt: input.updatedAt,
  };
}

export function getGoogleSheetUrl(responseSheet?: FormResponseSheetLink) {
  if (!responseSheet?.spreadsheetId) return null;
  const suffix = responseSheet.gid ? `#gid=${encodeURIComponent(responseSheet.gid)}` : "";
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(responseSheet.spreadsheetId)}/edit${suffix}`;
}

export function questionTypeNeedsOptions(type: FormQuestionType) {
  return OPTION_TYPES.has(type);
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeMemberAnswerItem(value: unknown): FormMemberAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<FormMemberAnswer>;
  const userId = typeof item.userId === "string" ? item.userId.trim() : "";
  const displayName = typeof item.displayName === "string" ? item.displayName.trim() : "";
  if (!userId || !displayName) return null;

  const loginId = typeof item.loginId === "string" ? item.loginId.trim() : "";
  const department = typeof item.department === "string" ? item.department.trim() : "";

  return {
    userId,
    displayName,
    loginId: loginId || null,
    department: department || null,
    tags: normalizeStringArray(item.tags),
  };
}

export function normalizeMemberAnswerValue(value: unknown): FormMemberAnswer[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: FormMemberAnswer[] = [];

  for (const item of value) {
    const member = normalizeMemberAnswerItem(item);
    if (!member || seen.has(member.userId)) continue;
    seen.add(member.userId);
    normalized.push(member);
  }

  return normalized;
}

function normalizeAnswerForQuestion(
  question: FormQuestion,
  value: FormAnswerValue | undefined,
): FormAnswerValue {
  if (question.type === "member_search") {
    return normalizeMemberAnswerValue(value).slice(
      0,
      Math.min(MEMBER_SEARCH_MAX_LIMIT, Math.max(1, question.memberSearchMax ?? DEFAULT_MEMBER_SEARCH_MAX)),
    );
  }

  if (question.type === "multiple_choice") {
    return normalizeStringArray(value);
  }

  if (value === undefined) return null;
  return value;
}

function answerHasValue(question: FormQuestion, value: FormAnswerValue | undefined) {
  const normalizedValue = normalizeAnswerForQuestion(question, value);
  if (Array.isArray(normalizedValue)) return normalizedValue.length > 0;
  if (normalizedValue === null || normalizedValue === undefined) return false;
  return String(normalizedValue).trim() !== "";
}

function answerMatchesOption(value: FormAnswerValue, option: FormQuestionOption) {
  const acceptedValues = new Set([option.id, option.label]);

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === "string" && acceptedValues.has(item));
  }

  if (typeof value === "string") {
    return acceptedValues.has(value);
  }

  return false;
}

export function getVisibleFormQuestions(
  questions: FormQuestion[],
  answers: Record<string, FormAnswerValue>,
) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const visibilityCache = new Map<string, boolean>();
  const visiting = new Set<string>();

  function isVisible(question: FormQuestion): boolean {
    const cached = visibilityCache.get(question.id);
    if (cached !== undefined) return cached;

    if (visiting.has(question.id)) {
      visibilityCache.set(question.id, false);
      return false;
    }

    if (!question.visibleWhen) {
      visibilityCache.set(question.id, true);
      return true;
    }

    visiting.add(question.id);
    const parentQuestion = questionById.get(question.visibleWhen.parentQuestionId);
    const parentOption = parentQuestion?.options?.find(
      (option) => option.id === question.visibleWhen?.optionId,
    );
    const visible =
      Boolean(parentQuestion) &&
      parentQuestion.id !== question.id &&
      Boolean(parentOption) &&
      isVisible(parentQuestion) &&
      answerMatchesOption(answers[parentQuestion.id], parentOption);
    visiting.delete(question.id);
    visibilityCache.set(question.id, visible);
    return visible;
  }

  return questions.filter(isVisible);
}

export function filterVisibleFormAnswers(
  questions: FormQuestion[],
  answers: Record<string, FormAnswerValue>,
) {
  const visibleQuestions = getVisibleFormQuestions(questions, answers);
  const visibleAnswers: Record<string, FormAnswerValue> = {};

  visibleQuestions.forEach((question) => {
    if (!(question.id in answers)) return;
    visibleAnswers[question.id] = normalizeAnswerForQuestion(question, answers[question.id]);
  });

  return visibleAnswers;
}

export function createBlankQuestion(type: FormQuestionType = "short_text"): FormQuestion {
  return {
    id: makeId("question"),
    title: "",
    type,
    required: false,
    options: questionTypeNeedsOptions(type)
      ? [
          { id: makeId("option"), label: "옵션 1" },
          { id: makeId("option"), label: "옵션 2" },
        ]
      : undefined,
    scaleMin: type === "linear_scale" ? 1 : undefined,
    scaleMax: type === "linear_scale" ? 5 : undefined,
    scaleMinLabel: type === "linear_scale" ? "낮음" : undefined,
    scaleMaxLabel: type === "linear_scale" ? "높음" : undefined,
    memberSearchTagIds: type === "member_search" ? [] : undefined,
    memberSearchMax: type === "member_search" ? DEFAULT_MEMBER_SEARCH_MAX : undefined,
  };
}

function option(label: string): FormQuestionOption {
  return { id: makeId("option"), label };
}

function createSeedForms(): ClubForm[] {
  return [
    createFormRecord(
      {
        title: "정기 모임 참가 신청",
        description: "모임 참석 여부와 필요한 준비 사항을 확인합니다.",
        category: "event_registration",
        status: "active",
        acceptsResponses: true,
        requiresLogin: true,
        commentsEnabled: true,
        responseWindow: {
          startsAt: "2026-05-06T09:00:00+09:00",
          endsAt: "2026-05-20T23:59:00+09:00",
        },
        questions: [
          {
            id: "attendance",
            title: "참석 여부",
            type: "single_choice",
            required: true,
            options: [option("참석"), option("불참"), option("미정")],
          },
          {
            id: "needs",
            title: "필요한 지원이나 요청 사항",
            type: "long_text",
            required: false,
          },
        ],
        tournament: createDisabledTournament(),
      },
      "2026-05-06T09:00:00+09:00",
    ),
    {
      ...createFormRecord(
        {
          title: "데모데이 참여자 조사",
          description: "데모데이 참석 여부와 발표 희망 여부를 확인합니다.",
          category: "participant_survey",
          status: "active",
          acceptsResponses: true,
          requiresLogin: true,
          commentsEnabled: true,
          responseWindow: {
            startsAt: "2026-05-05T12:00:00+09:00",
            endsAt: "2026-05-19T23:59:00+09:00",
          },
          questions: [
            {
              id: "attendance",
              title: "참석 여부",
              type: "single_choice",
              required: true,
              options: [option("참석"), option("불참"), option("미정")],
            },
            {
              id: "demo-topic",
              title: "보고 싶은 발표 주제",
              type: "multiple_choice",
              required: false,
              options: [option("자율주행"), option("비전"), option("ROS"), option("기구 설계")],
            },
            {
              id: "comment",
              title: "남길 말",
              type: "long_text",
              required: false,
            },
          ],
          tournament: createDisabledTournament(),
        },
        "2026-05-05T12:00:00+09:00",
      ),
      responses: [
        {
          id: "response-demo-1",
          respondentName: "예시 응답자",
          respondentInfo: {
            name: "예시 응답자",
            department: "소프트웨어학부",
            studentId: "20261234",
            phone: "010-0000-0000",
          },
          submittedAt: "2026-05-06T10:10:00+09:00",
          answers: {
            attendance: "참석",
            "demo-topic": ["자율주행", "비전"],
            comment: "발표 자료가 있으면 미리 공유해주세요.",
          },
        },
      ],
      comments: [
        {
          id: "comment-demo-1",
          authorName: "운영진",
          body: "응답 마감 전에 안내 문구를 한 번 더 공유하면 좋겠습니다.",
          createdAt: "2026-05-06T10:30:00+09:00",
        },
      ],
    },
  ];
}

function createDisabledTournament(): TournamentSettings {
  return {
    enabled: false,
    title: "",
    maxTeamSize: 1,
    leagueType: "round_robin",
    teams: [],
    matches: [],
  };
}

function createFormRecord(input: CreateClubFormInput, timestamp = new Date().toISOString()): ClubForm {
  const id = input.id?.trim() || slugify(input.title);
  const tournament = input.tournament.enabled
    ? {
        ...input.tournament,
        teams: input.tournament.teams.map((team, index) => ({
          ...team,
          seed: team.seed || index + 1,
        })),
        matches: syncLeagueMatches(input.tournament.teams, input.tournament.matches),
      }
    : createDisabledTournament();

  return {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    status: input.status,
    createdAt: timestamp,
    updatedAt: timestamp,
    acceptsResponses: input.acceptsResponses,
    requiresLogin: input.requiresLogin,
    commentsEnabled: input.commentsEnabled,
    responseWindow: normalizeResponseWindow(input.responseWindow),
    questions: normalizeQuestions(input.questions),
    responses: [],
    comments: [],
    tournament,
    responseSheet: normalizeResponseSheet(input.responseSheet),
  };
}

function normalizeQuestions(questions: FormQuestion[]) {
  const normalizedQuestions = questions.map((question, index) => {
    const type = question.type;
    const normalized: FormQuestion = {
      ...question,
      id: question.id || `question-${index + 1}`,
      title: question.title.trim(),
      description: question.description?.trim() || undefined,
      required: Boolean(question.required),
      type,
    };

    if (questionTypeNeedsOptions(type)) {
      normalized.options = (question.options ?? [])
        .map((item) => ({ ...item, label: item.label.trim() }))
        .filter((item) => item.label);
    } else {
      delete normalized.options;
    }

    if (type === "linear_scale") {
      normalized.scaleMin = Math.max(0, question.scaleMin ?? 1);
      normalized.scaleMax = Math.max(normalized.scaleMin + 1, question.scaleMax ?? 5);
      normalized.scaleMinLabel = question.scaleMinLabel?.trim() || undefined;
      normalized.scaleMaxLabel = question.scaleMaxLabel?.trim() || undefined;
    } else {
      delete normalized.scaleMin;
      delete normalized.scaleMax;
      delete normalized.scaleMinLabel;
      delete normalized.scaleMaxLabel;
    }

    if (type === "member_search") {
      normalized.memberSearchTagIds = Array.from(
        new Set(
          (question.memberSearchTagIds ?? [])
            .map((tagId) => (typeof tagId === "string" ? tagId.trim() : ""))
            .filter(Boolean),
        ),
      );
      normalized.memberSearchMax = Math.min(
        MEMBER_SEARCH_MAX_LIMIT,
        Math.max(1, question.memberSearchMax ?? DEFAULT_MEMBER_SEARCH_MAX),
      );
    } else {
      delete normalized.memberSearchTagIds;
      delete normalized.memberSearchMax;
    }

    return normalized;
  });

  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  const optionIdsByQuestion = new Map(
    normalizedQuestions.map((question) => [
      question.id,
      new Set((question.options ?? []).map((option) => option.id)),
    ]),
  );

  return normalizedQuestions.map((question) => {
    const rawCondition = question.visibleWhen;
    const parentQuestionId =
      typeof rawCondition?.parentQuestionId === "string"
        ? rawCondition.parentQuestionId.trim()
        : "";
    const optionId =
      typeof rawCondition?.optionId === "string" ? rawCondition.optionId.trim() : "";
    const hasValidCondition =
      parentQuestionId &&
      optionId &&
      parentQuestionId !== question.id &&
      questionIds.has(parentQuestionId) &&
      optionIdsByQuestion.get(parentQuestionId)?.has(optionId);

    if (hasValidCondition) {
      return {
        ...question,
        visibleWhen: {
          parentQuestionId,
          optionId,
        },
      };
    }

    const { visibleWhen: _visibleWhen, ...rest } = question;
    return rest;
  });
}

function normalizeStoredResponse(response: FormResponse, questions?: FormQuestion[]): FormResponse {
  const respondentInfo = normalizePersonalInfo(
    response.respondentInfo ?? {
      name: response.respondentName,
    },
  );

  return {
    ...response,
    respondentName: respondentInfo.name || response.respondentName || "익명",
    respondentInfo,
    answers: questions ? filterVisibleFormAnswers(questions, response.answers ?? {}) : response.answers ?? {},
  };
}

function normalizeStoredForm(form: ClubForm): ClubForm {
  const questions = normalizeQuestions(form.questions);

  return {
    ...form,
    responseWindow: normalizeResponseWindow(form.responseWindow),
    questions,
    responses: form.responses.map((response) => normalizeStoredResponse(response, questions)),
    tournament: form.tournament?.enabled ? form.tournament : createDisabledTournament(),
    responseSheet: normalizeResponseSheet(form.responseSheet),
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredForms() {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_FORMS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const validForms = parsed.filter((form): form is ClubForm => {
      return (
        form &&
        typeof form === "object" &&
        form.id !== LEGACY_GAME_FORM_ID &&
        typeof form.id === "string" &&
        typeof form.title === "string" &&
        Array.isArray(form.questions) &&
        Array.isArray(form.responses) &&
        Array.isArray(form.comments)
      );
    });
    const forms = validForms.map(normalizeStoredForm);

    if (forms.length !== parsed.length || JSON.stringify(forms) !== JSON.stringify(validForms)) {
      persistForms(forms);
    }
    return forms;
  } catch {
    return null;
  }
}

function persistForms(forms: ClubForm[]) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(LOCAL_FORMS_STORAGE_KEY, JSON.stringify(forms));
}

function readForms() {
  return readStoredForms() ?? createSeedForms();
}

export async function listForms() {
  return readForms().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getForm(formId: string) {
  const decoded = decodeURIComponent(formId);
  return readForms().find((form) => form.id === decoded) ?? null;
}

export function redactFormForApplicant(form: ClubForm): ClubForm {
  return {
    ...form,
    responses: [],
    comments: [],
    responseSheet: undefined,
    tournament: {
      ...form.tournament,
      teams: [],
      matches: [],
    },
  };
}

export async function getApplicantForm(formId: string) {
  const form = await getForm(formId);
  return form ? redactFormForApplicant(form) : null;
}

export async function saveForm(input: CreateClubFormInput) {
  const forms = readForms();
  const timestamp = new Date().toISOString();
  const form = createFormRecord(input, timestamp);
  const existing = forms.find((item) => item.id === form.id);
  const nextForm = existing
    ? {
        ...form,
        createdAt: existing.createdAt,
        responses: existing.responses,
        comments: existing.comments,
        responseSheet: form.responseSheet ?? existing.responseSheet,
      }
    : form;
  const nextForms = [nextForm, ...forms.filter((item) => item.id !== form.id)];
  persistForms(nextForms);
  return nextForm;
}

export function getFormDetailPath(formId: string) {
  return `/member/forms/${encodeURIComponent(formId)}`;
}

export function getFormCreatePath() {
  return "/member/forms/new";
}

export function getFormEditPath(formId: string) {
  return `/member/forms/${encodeURIComponent(formId)}/edit`;
}

export async function updateFormStatus(formId: string, status: ClubFormStatus) {
  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");

  const nextForm: ClubForm = {
    ...form,
    status,
    acceptsResponses: status === "active",
    updatedAt: new Date().toISOString(),
  };

  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return nextForm;
}

export async function deleteForm(formId: string) {
  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");

  persistForms(forms.filter((item) => item.id !== formId));
  return form;
}

export async function updateFormResponseSheet(
  formId: string,
  responseSheet: FormResponseSheetLink | null,
  actorCanManageForms = false,
) {
  if (!actorCanManageForms) throw new Error("forbidden");

  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");

  const nextForm: ClubForm = {
    ...form,
    responseSheet: responseSheet
      ? normalizeResponseSheet({
          ...responseSheet,
          updatedAt: new Date().toISOString(),
        })
      : undefined,
    updatedAt: new Date().toISOString(),
  };

  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return nextForm;
}

export function getFormResponseAvailability(
  form: Pick<ClubForm, "acceptsResponses" | "status" | "responseWindow">,
  now = new Date(),
) {
  if (form.status === "draft") {
    return { open: false, reason: "not_started" as const };
  }

  if (!form.acceptsResponses || form.status !== "active") {
    return { open: false, reason: "closed" as const };
  }

  const responseWindow = normalizeResponseWindow(form.responseWindow);
  const startsAt = responseWindow.startsAt ? new Date(responseWindow.startsAt) : null;
  if (startsAt && !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > now.getTime()) {
    return { open: false, reason: "not_started" as const };
  }

  const endsAt = responseWindow.endsAt ? new Date(responseWindow.endsAt) : null;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() < now.getTime()) {
    return { open: false, reason: "ended" as const };
  }

  return { open: true, reason: null };
}

export function validateFormResponse(form: Pick<ClubForm, "questions">, answers: Record<string, FormAnswerValue>) {
  const missing = getVisibleFormQuestions(form.questions, answers).filter((question) => {
    if (!question.required) return false;
    return !answerHasValue(question, answers[question.id]);
  });

  return missing.map((question) => question.title);
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, FormAnswerValue>,
  personalInfoInput: Partial<FormPersonalInfo> | string = {},
) {
  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");
  const availability = getFormResponseAvailability(form);
  if (!availability.open) throw new Error(`form_${availability.reason}`);

  const personalInfo = normalizePersonalInfo(
    typeof personalInfoInput === "string" ? { name: personalInfoInput } : personalInfoInput,
  );
  const missingPersonalInfo = validateFormPersonalInfo(personalInfo);
  if (missingPersonalInfo.length > 0) {
    throw new Error(`personal_info_required:${missingPersonalInfo.join(", ")}`);
  }

  const missing = validateFormResponse(form, answers);
  if (missing.length > 0) throw new Error(`required:${missing.join(", ")}`);
  const visibleAnswers = filterVisibleFormAnswers(form.questions, answers);

  const response: FormResponse = {
    id: makeId("response"),
    respondentName: personalInfo.name || "익명",
    respondentInfo: personalInfo,
    submittedAt: new Date().toISOString(),
    answers: visibleAnswers,
  };

  const nextForm: ClubForm = {
    ...form,
    responses: [response, ...form.responses],
    updatedAt: new Date().toISOString(),
  };
  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return response;
}

export async function addFormComment(
  formId: string,
  authorName: string,
  body: string,
  actorCanManageForms = false,
) {
  if (!actorCanManageForms) throw new Error("forbidden");

  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");
  if (!form.commentsEnabled) throw new Error("comments_disabled");

  const comment: FormComment = {
    id: makeId("comment"),
    authorName: authorName.trim() || "익명",
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!comment.body) throw new Error("comment_empty");

  const nextForm: ClubForm = {
    ...form,
    comments: [comment, ...form.comments],
    updatedAt: new Date().toISOString(),
  };
  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return comment;
}

export async function addTournamentTeam(
  formId: string,
  input: Pick<TournamentTeam, "name" | "members" | "contact">,
  actorCanManageForms = false,
) {
  if (!actorCanManageForms) throw new Error("forbidden");

  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");
  if (!form.tournament.enabled) throw new Error("tournament_disabled");

  const team: TournamentTeam = {
    id: makeId("team"),
    name: input.name.trim(),
    members: input.members.map((member) => member.trim()).filter(Boolean),
    contact: input.contact?.trim() || undefined,
    seed: form.tournament.teams.length + 1,
  };

  if (!team.name) throw new Error("team_name_required");
  if (team.members.length > form.tournament.maxTeamSize) throw new Error("team_too_large");

  const teams = [...form.tournament.teams, team];
  const tournament = {
    ...form.tournament,
    teams,
    matches: syncLeagueMatches(teams, form.tournament.matches),
  };
  const nextForm: ClubForm = {
    ...form,
    tournament,
    updatedAt: new Date().toISOString(),
  };
  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return team;
}

export async function recordTournamentMatchScore(
  formId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  actorCanManageForms = false,
) {
  if (!actorCanManageForms) throw new Error("forbidden");

  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");

  const matches = form.tournament.matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          homeScore: Math.max(0, homeScore),
          awayScore: Math.max(0, awayScore),
          status: "completed" as const,
        }
      : match,
  );

  const nextForm: ClubForm = {
    ...form,
    tournament: {
      ...form.tournament,
      matches,
    },
    updatedAt: new Date().toISOString(),
  };
  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return nextForm;
}

function pairKey(homeTeamId: string, awayTeamId: string) {
  return [homeTeamId, awayTeamId].sort().join("__");
}

export function syncLeagueMatches(teams: TournamentTeam[], existingMatches: TournamentMatch[]) {
  const existingByPair = new Map(
    existingMatches.map((match) => [pairKey(match.homeTeamId, match.awayTeamId), match]),
  );
  const matches: TournamentMatch[] = [];
  let round = 1;

  for (let homeIndex = 0; homeIndex < teams.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < teams.length; awayIndex += 1) {
      const homeTeam = teams[homeIndex];
      const awayTeam = teams[awayIndex];
      const key = pairKey(homeTeam.id, awayTeam.id);
      const existing = existingByPair.get(key);

      matches.push(
        existing ?? {
          id: `match-${homeTeam.id}-${awayTeam.id}`,
          round,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          status: "scheduled",
        },
      );
      round += 1;
    }
  }

  return matches;
}

export function getTournamentStandings(tournament: TournamentSettings): TournamentStanding[] {
  const standings = new Map<string, TournamentStanding>();

  for (const team of tournament.teams) {
    standings.set(team.id, {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
    });
  }

  for (const match of tournament.matches) {
    if (match.status !== "completed") continue;
    const home = standings.get(match.homeTeamId);
    const away = standings.get(match.awayTeamId);
    if (!home || !away) continue;

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
    home.played += 1;
    away.played += 1;
    home.scoreFor += homeScore;
    home.scoreAgainst += awayScore;
    away.scoreFor += awayScore;
    away.scoreAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeScore < awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...standings.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const bDiff = b.scoreFor - b.scoreAgainst;
    const aDiff = a.scoreFor - a.scoreAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.scoreFor - a.scoreFor;
  });
}
