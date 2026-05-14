import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  FORM_PERSONAL_INFO_FIELDS,
  FORM_QUESTION_TYPE_OPTIONS,
  filterVisibleFormAnswers,
  getFormResponseAvailability,
  getTournamentStandings,
  getVisibleFormQuestions,
  normalizeMemberAnswerValue,
  questionTypeNeedsOptions,
  redactFormForApplicant,
  syncLeagueMatches,
  validateFormPersonalInfo,
  validateFormResponse,
} from "../src/app/api/forms.ts";

const formCreateSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/FormCreate.tsx"),
  "utf8",
);
const formsPageSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/Forms.tsx"),
  "utf8",
);
const formDetailSource = readFileSync(
  resolve(process.cwd(), "src/app/pages/member/FormDetail.tsx"),
  "utf8",
);
const formsApiSource = readFileSync(resolve(process.cwd(), "src/app/api/forms.ts"), "utf8");
const memberLayoutSource = readFileSync(
  resolve(process.cwd(), "src/app/layouts/MemberLayout.tsx"),
  "utf8",
);
const navCatalogSource = readFileSync(
  resolve(process.cwd(), "src/app/config/nav-catalog.ts"),
  "utf8",
);
const routesSource = readFileSync(resolve(process.cwd(), "src/app/routes.tsx"), "utf8");
const designTokensSource = readFileSync(
  resolve(process.cwd(), "src/styles/design-tokens.css"),
  "utf8",
);
const formsManagementMigrationSource = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260509002000_forms_management_nav_for_vice_president.sql"),
  "utf8",
);

test("form builder supports Google-Forms-style question types", () => {
  const typeKeys = FORM_QUESTION_TYPE_OPTIONS.map((option) => option.key);

  assert.ok(typeKeys.includes("short_text"));
  assert.ok(typeKeys.includes("long_text"));
  assert.ok(typeKeys.includes("single_choice"));
  assert.ok(typeKeys.includes("multiple_choice"));
  assert.ok(typeKeys.includes("dropdown"));
  assert.ok(typeKeys.includes("linear_scale"));
  assert.ok(typeKeys.includes("member_search"));
  assert.ok(typeKeys.includes("date"));
  assert.ok(typeKeys.includes("time"));
  assert.equal(questionTypeNeedsOptions("single_choice"), true);
  assert.equal(questionTypeNeedsOptions("multiple_choice"), true);
  assert.equal(questionTypeNeedsOptions("dropdown"), true);
  assert.equal(questionTypeNeedsOptions("long_text"), false);
  assert.equal(questionTypeNeedsOptions("member_search"), false);
});

test("fixed personal info fields stay out of editable question templates", () => {
  assert.deepEqual(
    FORM_PERSONAL_INFO_FIELDS.map((field) => field.key),
    ["name", "department", "studentId", "phone"],
  );

  const missing = validateFormPersonalInfo({
    name: "홍길동",
    department: "소프트웨어학부",
    studentId: "",
    phone: "010-0000-0000",
  });

  assert.deepEqual(missing, ["학번"]);
});

test("question card multiline text does not submit the builder form on Shift+Enter", () => {
  const lineInputSource = formCreateSource.slice(
    formCreateSource.indexOf("function LineInput"),
    formCreateSource.indexOf("function RailButton"),
  );
  const questionHeaderSource = formCreateSource.slice(
    formCreateSource.indexOf("value={question.title}"),
    formCreateSource.indexOf('<label className="grid gap-2">', formCreateSource.indexOf("value={question.title}")),
  );

  assert.match(lineInputSource, /multiline = false/);
  assert.match(lineInputSource, /<textarea/);
  assert.match(lineInputSource, /rows=\{1\}/);
  assert.match(lineInputSource, /textareaRef\.current\.scrollHeight/);
  assert.match(lineInputSource, /function preventAccidentalSubmit/);
  assert.match(lineInputSource, /event\.key !== "Enter"/);
  assert.match(lineInputSource, /event\.preventDefault\(\)/);
  assert.match(lineInputSource, /onKeyDown=\{preventAccidentalSubmit\}/);
  assert.match(questionHeaderSource, /value=\{question\.title\}[\s\S]*multiline/);
  assert.match(questionHeaderSource, /value=\{question\.description \?\? ""\}[\s\S]*multiline/);
});

test("form builder header is a standalone card with expanding description", () => {
  const builderMainSource = formCreateSource.slice(
    formCreateSource.indexOf('<main className="mx-auto grid max-w-[1240px]'),
    formCreateSource.indexOf("<PersonalInfoPreview />"),
  );
  const descriptionValueIndex = formCreateSource.indexOf("value={draft.description}");
  const descriptionSource = formCreateSource.slice(
    formCreateSource.lastIndexOf("<LineInput", descriptionValueIndex),
    formCreateSource.indexOf("<section className=\"mt-5", descriptionValueIndex),
  );

  assert.match(builderMainSource, /<section className="min-w-0 grid gap-5">/);
  assert.match(builderMainSource, /<section className="overflow-hidden rounded-\[8px\] border border-\[#d8deea\] bg-white/);
  assert.match(builderMainSource, /<div className="grid gap-5 sm:gap-6">/);
  assert.doesNotMatch(builderMainSource, /grid gap-5 border-t border-\[#edf1f6\] bg-\[#f5f6fa\]/);
  assert.match(descriptionSource, /<LineInput/);
  assert.match(descriptionSource, /value=\{draft\.description\}/);
  assert.match(descriptionSource, /multiline/);
  assert.doesNotMatch(descriptionSource, /<textarea/);
});

test("form builder keeps reload recovery in tab-scoped session draft storage", () => {
  const initialDraftSource = formCreateSource.slice(
    formCreateSource.indexOf("function createInitialDraft"),
    formCreateSource.indexOf("function createDraftFromForm"),
  );
  const updateDraftSource = formCreateSource.slice(
    formCreateSource.indexOf("function updateDraft"),
    formCreateSource.indexOf("function getDraftValidationError"),
  );
  const saveCurrentDraftSource = formCreateSource.slice(
    formCreateSource.indexOf("async function saveCurrentDraft"),
    formCreateSource.indexOf("function updateQuestion"),
  );
  const discardNavigationSource = formCreateSource.slice(
    formCreateSource.indexOf("function handleDiscardBlockedNavigation"),
    formCreateSource.indexOf("function handleCancelBlockedNavigation"),
  );

  assert.match(formCreateSource, /SESSION_DRAFT_STORAGE_PREFIX = "kobot:forms:draft-session-v1"/);
  assert.match(formCreateSource, /window\.sessionStorage/);
  assert.doesNotMatch(formCreateSource, /window\.localStorage/);
  assert.match(formCreateSource, /SESSION_DRAFT_TTL_MS/);
  assert.match(formCreateSource, /baseSnapshot/);
  assert.match(initialDraftSource, /id:\s*"initial-attendance-question"/);
  assert.match(initialDraftSource, /id:\s*"initial-attendance-yes"/);
  assert.doesNotMatch(initialDraftSource, /createBlankQuestion/);
  assert.match(formCreateSource, /readSessionDraft\(sessionDraftKey, baseSnapshot\)/);
  assert.match(formCreateSource, /setDraft\(sessionDraft \?\? initialDraft\)/);
  assert.match(formCreateSource, /setDraft\(sessionDraft \?\? nextDraft\)/);
  assert.match(updateDraftSource, /function updateDraft/);
  assert.match(updateDraftSource, /persistDraftEdit\(nextDraft\)/);
  assert.match(formCreateSource, /writeSessionDraft\(sessionDraftKey, draft, initialDraftSnapshotRef\.current\)/);
  assert.match(formCreateSource, /writeSessionDraft\(sessionDraftKey, nextDraft, initialDraftSnapshotRef\.current\)/);
  assert.match(formCreateSource, /onChange=\{\(title\) => updateDraft/);
  assert.match(formCreateSource, /function updateQuestion[\s\S]*updateDraft/);
  assert.match(saveCurrentDraftSource, /clearSessionDraft\(sessionDraftKey\)/);
  assert.match(discardNavigationSource, /clearSessionDraft\(sessionDraftKey\)/);
});

test("form builder does not reserve a linked-question lane before a connection exists", () => {
  const questionListSource = formCreateSource.slice(
    formCreateSource.indexOf("{rootQuestions.map"),
    formCreateSource.indexOf("<button", formCreateSource.indexOf("{rootQuestions.map")),
  );
  const addLinkedQuestionSource = formCreateSource.slice(
    formCreateSource.indexOf("function addLinkedQuestion"),
    formCreateSource.indexOf("function duplicateQuestion"),
  );

  assert.match(formCreateSource, /function QuestionThread/);
  assert.match(formCreateSource, /overflow-x-auto/);
  assert.match(questionListSource, /<QuestionThread[\s\S]*hasLinkedQuestions=\{linkedGroups\.length > 0\}/);
  assert.match(questionListSource, /className="min-w-full shrink-0 snap-start"/);
  assert.doesNotMatch(questionListSource, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(280px,340px\)\]/);
  assert.doesNotMatch(questionListSource, /border-dashed/);
  assert.doesNotMatch(questionListSource, /선택지의 연결 아이콘을 누르면/);
  assert.match(addLinkedQuestionSource, /description:\s*""/);
});

test("form builder linked-question lane uses chevrons and auto-focuses newly added cards", () => {
  assert.match(formCreateSource, /ChevronLeft/);
  assert.match(formCreateSource, /ChevronRight/);
  assert.match(formCreateSource, /pendingLinkedQuestionId/);
  assert.match(formCreateSource, /linkedQuestionFocusVersion/);
  assert.match(formCreateSource, /setLinkedQuestionFocusVersion/);
  assert.match(formCreateSource, /focusLinkedQuestion\(linkedQuestion\.id\)/);
  assert.match(formCreateSource, /existingLinkedQuestion/);
  assert.match(formCreateSource, /focusLinkedQuestion\(existingLinkedQuestion\.id\)/);
  assert.match(formCreateSource, /getThreadCardScrollLeft/);
  assert.match(formCreateSource, /getThreadPageForTarget/);
  assert.match(formCreateSource, /scrollLinkedStackToItem/);
  assert.match(formCreateSource, /getBoundingClientRect/);
  assert.match(formCreateSource, /target instanceof Element/);
  assert.match(formCreateSource, /document\.querySelectorAll\("\[data-thread-item-id\]"\)/);
  assert.match(formCreateSource, /scrollRequestVersion=\{linkedQuestionFocusVersion\}/);
  assert.match(formCreateSource, /scrollToItemId=\{pendingLinkedQuestionId\}/);
  assert.match(formCreateSource, /data-thread-item-id=\{linkedQuestion\.id\}/);
  assert.match(formCreateSource, /연결 질문으로 이동/);
  assert.match(formCreateSource, /aria-label="이전 연결 카드"/);
  assert.match(formCreateSource, /aria-label="다음 연결 카드"/);
  assert.match(formCreateSource, /getActiveThreadCard/);
  assert.match(formCreateSource, /activePageHeight/);
  assert.match(formCreateSource, /style=\{[\s\S]*activePageHeight/);
  assert.match(formCreateSource, /overflow-x-auto overflow-y-hidden/);
  assert.match(formCreateSource, /absolute -left-9 top-1\/2/);
  assert.match(formCreateSource, /absolute -right-9 top-1\/2/);
  assert.doesNotMatch(formCreateSource, /max-w-\[1016px\]/);
  assert.doesNotMatch(formCreateSource, /max-w-\[920px\]/);
  assert.match(formCreateSource, /bg-transparent/);
  assert.doesNotMatch(formCreateSource, /thumbLeft/);
  assert.doesNotMatch(formCreateSource, /thumbWidth/);
  assert.match(designTokensSource, /\.kb-form-thread-scroll/);
  assert.match(designTokensSource, /\.kb-linked-question-stack/);
  assert.match(designTokensSource, /scrollbar-width:\s*none/);
});

test("linked questions use option pages horizontally and question stacks vertically", () => {
  const questionThreadSource = formCreateSource.slice(
    formCreateSource.indexOf("const linkedGroups = options"),
    formCreateSource.indexOf("</QuestionThread>", formCreateSource.indexOf("const linkedGroups = options")),
  );

  assert.match(questionThreadSource, /const linkedGroups = options/);
  assert.match(questionThreadSource, /linkedGroups\.map\(\(\{ accent, linkedQuestions, option \}\)/);
  assert.match(questionThreadSource, /kb-linked-option-page min-w-full shrink-0 snap-start/);
  assert.match(questionThreadSource, /kb-linked-question-stack grid/);
  assert.match(questionThreadSource, /overflow-y-auto/);
  assert.match(questionThreadSource, /data-linked-option-id=\{option\.id\}/);
  assert.match(questionThreadSource, /linkedQuestions\.map\(\(linkedQuestion\)/);
  assert.match(questionThreadSource, /itemCount=\{linkedGroups\.length \+ 1\}/);
  assert.match(questionThreadSource, /className="min-w-full shrink-0 snap-start"/);
  assert.doesNotMatch(questionThreadSource, /itemCount=\{linkedItems\.length \+ 1\}/);
  assert.doesNotMatch(questionThreadSource, /linkedItems\.map/);
});

test("form builder can append additional linked questions below an existing linked card", () => {
  const addLinkedQuestionBelowSource = formCreateSource.slice(
    formCreateSource.indexOf("function addLinkedQuestionBelow"),
    formCreateSource.indexOf("function duplicateQuestion"),
  );

  assert.match(formCreateSource, /function addLinkedQuestionBelow/);
  assert.match(addLinkedQuestionBelowSource, /referenceQuestion\.visibleWhen/);
  assert.match(addLinkedQuestionBelowSource, /visibleWhen:\s*\{[\s\S]*parentQuestionId/);
  assert.match(formCreateSource, /onAddLinkedQuestionBelow=\{\(\) =>\s*addLinkedQuestionBelow\(linkedQuestion\)/);
  assert.match(formCreateSource, /label="아래 연결 질문 추가"/);
});

test("member-search questions store canonical member answers and support tag-limited lookup", () => {
  const question = {
    id: "team-members",
    title: "팀원",
    type: "member_search",
    required: true,
    memberSearchTagIds: ["tag-a"],
    memberSearchMax: 2,
  };
  const normalizedMembers = normalizeMemberAnswerValue([
    "종하",
    {
      userId: "user-1",
      displayName: "함종하",
      loginId: "hu0315",
      department: "소프트웨어학부",
      tags: ["정회원"],
      transientLabel: "ignored",
    },
    {
      userId: "user-1",
      displayName: "중복 선택",
    },
  ]);

  assert.deepEqual(normalizedMembers, [
    {
      userId: "user-1",
      displayName: "함종하",
      loginId: "hu0315",
      department: "소프트웨어학부",
      tags: ["정회원"],
    },
  ]);
  assert.deepEqual(validateFormResponse({ questions: [question] }, { "team-members": ["종하"] }), [
    "팀원",
  ]);
  assert.deepEqual(validateFormResponse({ questions: [question] }, { "team-members": normalizedMembers }), []);
  assert.deepEqual(filterVisibleFormAnswers([question], { "team-members": normalizedMembers }), {
    "team-members": normalizedMembers,
  });
  assert.deepEqual(
    filterVisibleFormAnswers([question], {
      "team-members": [
        { userId: "user-1", displayName: "함종하" },
        { userId: "user-2", displayName: "김코봇" },
        { userId: "user-3", displayName: "이로봇" },
      ],
    }),
    {
      "team-members": [
        { userId: "user-1", displayName: "함종하", loginId: null, department: null, tags: [] },
        { userId: "user-2", displayName: "김코봇", loginId: null, department: null, tags: [] },
      ],
    },
  );
  assert.match(formCreateSource, /listTags/);
  assert.match(formCreateSource, /memberSearchTagIds/);
  assert.match(formCreateSource, /memberSearchMax/);
  assert.match(formDetailSource, /listMemberDirectory/);
  assert.match(formDetailSource, /question\.type === "member_search"/);
  assert.match(formDetailSource, /isMemberInQuestionScope/);
  assert.match(formDetailSource, /normalizeMemberAnswerValue/);
});

test("form management navigation stays aligned with role tags and labels", () => {
  assert.match(memberLayoutSource, /name:\s*"운영관리"[\s\S]*name:\s*"폼 관리"[\s\S]*href:\s*"\/member\/forms"/);
  assert.match(memberLayoutSource, /minimumRole:\s*"vicePresident"/);
  assert.doesNotMatch(memberLayoutSource, /신청\/폼/);
  assert.match(memberLayoutSource, /visibleSectionsBeforeDedup/);
  assert.match(memberLayoutSource, /visibleNavigationHrefs/);
  assert.match(navCatalogSource, /href:\s*"\/member\/forms",\s*label:\s*"폼 관리",\s*group:\s*"운영관리"/);
  assert.match(navCatalogSource, /permission:\s*"forms\.manage",\s*label:\s*"폼 관리"/);
  assert.match(formsManagementMigrationSource, /vice_president/);
  assert.match(formsManagementMigrationSource, /forms\.manage/);
  assert.match(formsManagementMigrationSource, /\/member\/forms/);
});

test("form management cards expose edit delete status flip and applicant open", () => {
  assert.match(formsPageSource, /function FormCard/);
  assert.match(formsPageSource, /MoreVertical/);
  assert.match(formsPageSource, /DropdownMenu/);
  assert.match(formsPageSource, /수정/);
  assert.match(formsPageSource, /삭제/);
  assert.match(formsPageSource, /상태변화/);
  assert.match(formsPageSource, /\[transform:rotateY\(180deg\)\]/);
  assert.match(formsPageSource, /getFormEditPath\(form\.id\)/);
  assert.match(formsPageSource, /getFormDetailPath\(form\.id\)/);
  assert.match(formsPageSource, /updateFormStatus/);
  assert.match(formsPageSource, /deleteForm/);
  assert.match(formsPageSource, />\s*열기\s*</);
  assert.match(formsPageSource, /min-h-\[384px\]/);
  assert.doesNotMatch(formsPageSource, /formatShortDateTime\(form\.updatedAt\)/);
});

test("form edit and applicant access gates share persisted form state", () => {
  assert.match(routesSource, /path:\s*"forms\/:formId\/edit"/);
  assert.match(formCreateSource, /useParams/);
  assert.match(formCreateSource, /createDraftFromForm/);
  assert.match(formCreateSource, /getForm\(formId\)/);
  assert.match(formsApiSource, /export async function updateFormStatus/);
  assert.match(formsApiSource, /export async function deleteForm/);
  assert.match(formsApiSource, /export function getFormEditPath/);
  assert.match(formDetailSource, /function FormAccessBlocked/);
  assert.match(formDetailSource, /!canManageForms && !responseAvailability\.open/);
});

test("applicant form detail read model redacts operator-only response data", () => {
  const form = {
    id: "form-1",
    title: "참가 신청",
    description: "",
    category: "event_registration",
    status: "active",
    createdAt: "2026-05-10T00:00:00+09:00",
    updatedAt: "2026-05-10T00:00:00+09:00",
    acceptsResponses: true,
    requiresLogin: true,
    commentsEnabled: true,
    responseWindow: {},
    questions: [
      {
        id: "q1",
        title: "참가 여부",
        type: "short_text",
        required: true,
      },
    ],
    responses: [
      {
        id: "r1",
        respondentName: "응답자",
        respondentInfo: {
          name: "응답자",
          department: "소프트웨어학부",
          studentId: "20261234",
          phone: "010-0000-0000",
        },
        submittedAt: "2026-05-10T01:00:00+09:00",
        answers: { q1: "네" },
      },
    ],
    comments: [
      {
        id: "c1",
        authorName: "운영진",
        body: "내부 메모",
        createdAt: "2026-05-10T01:00:00+09:00",
      },
    ],
    tournament: {
      enabled: true,
      title: "팀전",
      maxTeamSize: 3,
      leagueType: "round_robin",
      teams: [{ id: "team-1", name: "A", members: ["응답자"], seed: 1 }],
      matches: [
        {
          id: "match-1",
          round: 1,
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          status: "scheduled",
        },
      ],
    },
    responseSheet: {
      spreadsheetId: "secret-sheet",
      range: "Form Responses 1!A:Z",
      sheetName: "Form Responses 1",
    },
  };

  const applicantForm = redactFormForApplicant(form);

  assert.equal(applicantForm.responses.length, 0);
  assert.equal(applicantForm.comments.length, 0);
  assert.equal(applicantForm.responseSheet, undefined);
  assert.equal(applicantForm.tournament.teams.length, 0);
  assert.equal(applicantForm.tournament.matches.length, 0);
  assert.equal(applicantForm.questions.length, 1);
  assert.equal(applicantForm.status, "active");
  assert.match(formsApiSource, /export async function getApplicantForm/);
  assert.match(formDetailSource, /canManageForms \? await getForm\(formId\) : await getApplicantForm\(formId\)/);
  assert.match(formDetailSource, /\.\.\.\(canManageForms/);
  assert.match(formDetailSource, /if \(!canManageForms\) return/);
  assert.doesNotMatch(formDetailSource, /const panels = \[[\s\S]*\{ key: "responses", label/s);
});

test("operator-only form commands require forms.manage at the command boundary", () => {
  const responseSheetCommandSource = formsApiSource.slice(
    formsApiSource.indexOf("export async function updateFormResponseSheet"),
    formsApiSource.indexOf("export function getFormResponseAvailability"),
  );
  const commentCommandSource = formsApiSource.slice(
    formsApiSource.indexOf("export async function addFormComment"),
    formsApiSource.indexOf("export async function addTournamentTeam"),
  );
  const teamCommandSource = formsApiSource.slice(
    formsApiSource.indexOf("export async function addTournamentTeam"),
    formsApiSource.indexOf("export async function recordTournamentMatchScore"),
  );
  const scoreCommandSource = formsApiSource.slice(
    formsApiSource.indexOf("export async function recordTournamentMatchScore"),
    formsApiSource.indexOf("function pairKey"),
  );

  assert.match(responseSheetCommandSource, /actorCanManageForms = false/);
  assert.match(responseSheetCommandSource, /if \(!actorCanManageForms\) throw new Error\("forbidden"\)/);
  assert.match(commentCommandSource, /actorCanManageForms = false/);
  assert.match(commentCommandSource, /if \(!actorCanManageForms\) throw new Error\("forbidden"\)/);
  assert.match(teamCommandSource, /actorCanManageForms = false/);
  assert.match(teamCommandSource, /if \(!actorCanManageForms\) throw new Error\("forbidden"\)/);
  assert.match(scoreCommandSource, /actorCanManageForms = false/);
  assert.match(scoreCommandSource, /if \(!actorCanManageForms\) throw new Error\("forbidden"\)/);
  assert.match(formDetailSource, /addFormComment\(form\.id, defaultName, commentBody, canManageForms\)/);
  assert.match(formDetailSource, /addTournamentTeam\([\s\S]*canManageForms,\s*\)/);
  assert.match(formDetailSource, /updateFormResponseSheet\(form\.id,[\s\S]*canManageForms\)/);
  assert.match(formDetailSource, /recordTournamentMatchScore\(form\.id, match\.id, home, away, canManageForms\)/);
});

test("round-robin league creates every pair once and preserves existing scores", () => {
  const teams = [
    { id: "a", name: "A", members: [], seed: 1 },
    { id: "b", name: "B", members: [], seed: 2 },
    { id: "c", name: "C", members: [], seed: 3 },
    { id: "d", name: "D", members: [], seed: 4 },
  ];
  const matches = syncLeagueMatches(teams, [
    {
      id: "match-a-b",
      round: 1,
      homeTeamId: "a",
      awayTeamId: "b",
      homeScore: 2,
      awayScore: 1,
      status: "completed",
    },
  ]);

  assert.equal(matches.length, 6);
  assert.equal(
    new Set(matches.map((match) => [match.homeTeamId, match.awayTeamId].sort().join(":"))).size,
    6,
  );
  assert.equal(matches.find((match) => match.id === "match-a-b")?.homeScore, 2);
});

test("required custom survey answers are validated separately from personal info", () => {
  const missing = validateFormResponse(
    {
      questions: [
        {
          id: "attendance",
          title: "참석 여부",
          type: "single_choice",
          required: true,
          options: [
            { id: "yes", label: "참석" },
            { id: "no", label: "불참" },
          ],
        },
        {
          id: "memo",
          title: "남길 말",
          type: "long_text",
          required: false,
        },
      ],
    },
    {
      attendance: "",
      memo: "",
    },
  );

  assert.deepEqual(missing, ["참석 여부"]);
});

test("conditional linked questions only validate and persist when their option is selected", () => {
  const parent = {
    id: "game-choice",
    title: "참여할 항목",
    type: "multiple_choice",
    required: true,
    options: [
      { id: "game-a", label: "게임 A" },
      { id: "game-b", label: "게임 B" },
      { id: "game-c", label: "게임 C" },
    ],
  };
  const questions = [
    parent,
    {
      id: "game-a-id",
      title: "게임 A 아이디",
      type: "short_text",
      required: true,
      visibleWhen: {
        parentQuestionId: parent.id,
        optionId: "game-a",
      },
    },
    {
      id: "game-b-id",
      title: "게임 B 아이디",
      type: "short_text",
      required: true,
      visibleWhen: {
        parentQuestionId: parent.id,
        optionId: "game-b",
      },
    },
    {
      id: "game-c-id",
      title: "게임 C 아이디",
      type: "short_text",
      required: true,
      visibleWhen: {
        parentQuestionId: parent.id,
        optionId: "game-c",
      },
    },
  ];
  const answers = {
    "game-choice": ["게임 A", "게임 C"],
    "game-b-id": "stale-hidden-answer",
    "game-c-id": "player-c",
  };

  assert.deepEqual(
    getVisibleFormQuestions(questions, answers).map((question) => question.id),
    ["game-choice", "game-a-id", "game-c-id"],
  );
  assert.deepEqual(validateFormResponse({ questions }, answers), ["게임 A 아이디"]);
  assert.deepEqual(filterVisibleFormAnswers(questions, answers), {
    "game-choice": ["게임 A", "게임 C"],
    "game-c-id": "player-c",
  });
});

test("response window blocks submissions before start and after deadline", () => {
  const base = {
    acceptsResponses: true,
    status: "active",
  };

  assert.equal(
    getFormResponseAvailability({
      acceptsResponses: true,
      status: "draft",
      responseWindow: {},
    }).reason,
    "not_started",
  );

  assert.equal(
    getFormResponseAvailability(
      {
        ...base,
        responseWindow: {
          startsAt: "2026-05-10T00:00:00+09:00",
          endsAt: "2026-05-20T00:00:00+09:00",
        },
      },
      new Date("2026-05-09T12:00:00+09:00"),
    ).reason,
    "not_started",
  );

  assert.equal(
    getFormResponseAvailability(
      {
        ...base,
        responseWindow: {
          startsAt: "2026-05-01T00:00:00+09:00",
          endsAt: "2026-05-08T23:59:00+09:00",
        },
      },
      new Date("2026-05-09T12:00:00+09:00"),
    ).reason,
    "ended",
  );

  assert.equal(
    getFormResponseAvailability(
      {
        ...base,
        responseWindow: {},
      },
      new Date("2026-05-09T12:00:00+09:00"),
    ).open,
    true,
  );
});

test("tournament standings sort by points and score difference", () => {
  const teams = [
    { id: "a", name: "A", members: [], seed: 1 },
    { id: "b", name: "B", members: [], seed: 2 },
    { id: "c", name: "C", members: [], seed: 3 },
  ];
  const standings = getTournamentStandings({
    enabled: true,
    title: "테스트 리그",
    maxTeamSize: 3,
    leagueType: "round_robin",
    teams,
    matches: [
      {
        id: "ab",
        round: 1,
        homeTeamId: "a",
        awayTeamId: "b",
        homeScore: 3,
        awayScore: 1,
        status: "completed",
      },
      {
        id: "bc",
        round: 2,
        homeTeamId: "b",
        awayTeamId: "c",
        homeScore: 0,
        awayScore: 0,
        status: "completed",
      },
    ],
  });

  assert.deepEqual(standings.map((standing) => standing.team.id), ["a", "c", "b"]);
  assert.equal(standings[0].points, 3);
});
