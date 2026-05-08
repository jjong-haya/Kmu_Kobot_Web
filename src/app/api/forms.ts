export type ClubFormStatus = "draft" | "active" | "closed";

export type FormQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "linear_scale"
  | "date"
  | "time";

export type FormQuestionOption = {
  id: string;
  label: string;
};

export type FormQuestion = {
  id: string;
  title: string;
  description?: string;
  type: FormQuestionType;
  required: boolean;
  options?: FormQuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export type FormAnswerValue = string | string[] | number | null;

export type FormResponse = {
  id: string;
  respondentName: string;
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
  questions: FormQuestion[];
  responses: FormResponse[];
  comments: FormComment[];
  tournament: TournamentSettings;
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
  | "questions"
  | "tournament"
> & {
  id?: string;
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
  draft: "작성중",
  active: "응답 받는 중",
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
  { key: "date", label: "날짜" },
  { key: "time", label: "시간" },
] satisfies { key: FormQuestionType; label: string }[];

const OPTION_TYPES = new Set<FormQuestionType>([
  "single_choice",
  "multiple_choice",
  "dropdown",
]);

const LOCAL_FORMS_STORAGE_KEY = "kobot:forms:local-v1";

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

export function questionTypeNeedsOptions(type: FormQuestionType) {
  return OPTION_TYPES.has(type);
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
  };
}

function option(label: string): FormQuestionOption {
  return { id: makeId("option"), label };
}

export function createGameTournamentTemplate(): CreateClubFormInput {
  return {
    id: "kobot-game-cup-2026-registration",
    title: "KOBOT 게임대회 참가 신청",
    description:
      "게임대회 참가자 조사, 팀 등록, 장비 보유 여부, 리그전 운영 정보를 한 번에 받습니다.",
    category: "event_registration",
    status: "active",
    acceptsResponses: true,
    requiresLogin: true,
    commentsEnabled: true,
    questions: [
      {
        id: "participant-name",
        title: "이름",
        type: "short_text",
        required: true,
      },
      {
        id: "student-id",
        title: "학번",
        type: "short_text",
        required: true,
      },
      {
        id: "contact",
        title: "연락 가능한 연락처",
        description: "전화번호, 카카오톡, 이메일 중 편한 것을 적어주세요.",
        type: "short_text",
        required: true,
      },
      {
        id: "participation-type",
        title: "참가 방식",
        type: "single_choice",
        required: true,
        options: [option("개인 참가"), option("팀 참가"), option("팀원을 찾는 중")],
      },
      {
        id: "team-name",
        title: "팀 이름",
        description: "아직 팀이 없으면 비워도 됩니다.",
        type: "short_text",
        required: false,
      },
      {
        id: "preferred-role",
        title: "주로 맡을 수 있는 역할",
        type: "multiple_choice",
        required: true,
        options: [
          option("로봇 조립"),
          option("제어 코드"),
          option("센서/비전"),
          option("전략 설계"),
          option("기록/발표"),
        ],
      },
      {
        id: "equipment",
        title: "개인 장비 보유 여부",
        type: "dropdown",
        required: true,
        options: [
          option("노트북 있음"),
          option("로봇 키트 있음"),
          option("둘 다 있음"),
          option("장비 대여 필요"),
        ],
      },
      {
        id: "experience",
        title: "로봇/프로그래밍 경험",
        type: "linear_scale",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: "처음",
        scaleMaxLabel: "많음",
      },
      {
        id: "available-time",
        title: "참가 가능한 시간대",
        type: "multiple_choice",
        required: true,
        options: [option("예선 전체"), option("본선 전체"), option("오후만 가능"), option("시간 조율 필요")],
      },
      {
        id: "notes",
        title: "운영진에게 전달할 내용",
        type: "long_text",
        required: false,
      },
    ],
    tournament: {
      enabled: true,
      title: "KOBOT 게임대회 리그전",
      maxTeamSize: 3,
      leagueType: "round_robin",
      teams: [
        { id: "team-alpha", name: "알파", members: ["데모 참가자 1", "데모 참가자 2"], seed: 1 },
        { id: "team-beta", name: "베타", members: ["데모 참가자 3", "데모 참가자 4"], seed: 2 },
        { id: "team-gamma", name: "감마", members: ["데모 참가자 5"], seed: 3 },
      ],
      matches: [],
    },
  };
}

function createSeedForms(): ClubForm[] {
  const now = "2026-05-06T09:00:00+09:00";
  const game = createFormRecord(createGameTournamentTemplate(), now);
  return [
    {
      ...game,
      tournament: {
        ...game.tournament,
        matches: syncLeagueMatches(game.tournament.teams, []),
      },
      responses: [
        {
          id: "response-demo-1",
          respondentName: "데모 참가자",
          submittedAt: "2026-05-06T10:10:00+09:00",
          answers: {
            "participant-name": "데모 참가자",
            "student-id": "20261234",
            contact: "demo@kookmin.ac.kr",
            "participation-type": "팀 참가",
            "team-name": "알파",
            "preferred-role": ["제어 코드", "전략 설계"],
            equipment: "노트북 있음",
            experience: 3,
            "available-time": ["예선 전체", "본선 전체"],
            notes: "처음 참가합니다.",
          },
        },
      ],
      comments: [
        {
          id: "comment-demo-1",
          authorName: "운영진",
          body: "팀 이름은 행사 전날까지 수정 가능하게 운영하면 좋겠습니다.",
          createdAt: "2026-05-06T10:30:00+09:00",
        },
      ],
    },
    createFormRecord(
      {
        title: "데모데이 참여자 조사",
        description: "데모데이 참석 여부와 발표 희망 여부를 확인합니다.",
        category: "participant_survey",
        status: "active",
        acceptsResponses: true,
        requiresLogin: true,
        commentsEnabled: true,
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
    questions: normalizeQuestions(input.questions),
    responses: [],
    comments: [],
    tournament,
  };
}

function normalizeQuestions(questions: FormQuestion[]) {
  return questions.map((question, index) => {
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
    }

    return normalized;
  });
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

    return parsed.filter((form): form is ClubForm => {
      return (
        form &&
        typeof form === "object" &&
        typeof form.id === "string" &&
        typeof form.title === "string" &&
        Array.isArray(form.questions) &&
        Array.isArray(form.responses) &&
        Array.isArray(form.comments)
      );
    });
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

export function validateFormResponse(form: Pick<ClubForm, "questions">, answers: Record<string, FormAnswerValue>) {
  const missing = form.questions.filter((question) => {
    if (!question.required) return false;
    const value = answers[question.id];
    if (Array.isArray(value)) return value.length === 0;
    if (value === null || value === undefined) return true;
    return String(value).trim() === "";
  });

  return missing.map((question) => question.title);
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, FormAnswerValue>,
  respondentName = "익명",
) {
  const forms = readForms();
  const form = forms.find((item) => item.id === formId);
  if (!form) throw new Error("form_not_found");
  if (!form.acceptsResponses || form.status !== "active") throw new Error("form_closed");

  const missing = validateFormResponse(form, answers);
  if (missing.length > 0) throw new Error(`required:${missing.join(", ")}`);

  const response: FormResponse = {
    id: makeId("response"),
    respondentName: respondentName.trim() || "익명",
    submittedAt: new Date().toISOString(),
    answers,
  };

  const nextForm: ClubForm = {
    ...form,
    responses: [response, ...form.responses],
    updatedAt: new Date().toISOString(),
  };
  persistForms([nextForm, ...forms.filter((item) => item.id !== formId)]);
  return response;
}

export async function addFormComment(formId: string, authorName: string, body: string) {
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
) {
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
) {
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
