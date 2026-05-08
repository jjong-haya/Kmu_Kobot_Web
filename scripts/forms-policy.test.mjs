import assert from "node:assert/strict";
import test from "node:test";

import {
  FORM_QUESTION_TYPE_OPTIONS,
  createGameTournamentTemplate,
  getTournamentStandings,
  questionTypeNeedsOptions,
  syncLeagueMatches,
  validateFormResponse,
} from "../src/app/api/forms.ts";

test("form builder supports Google-Forms-style question types", () => {
  const typeKeys = FORM_QUESTION_TYPE_OPTIONS.map((option) => option.key);

  assert.ok(typeKeys.includes("short_text"));
  assert.ok(typeKeys.includes("long_text"));
  assert.ok(typeKeys.includes("single_choice"));
  assert.ok(typeKeys.includes("multiple_choice"));
  assert.ok(typeKeys.includes("dropdown"));
  assert.ok(typeKeys.includes("linear_scale"));
  assert.ok(typeKeys.includes("date"));
  assert.ok(typeKeys.includes("time"));
  assert.equal(questionTypeNeedsOptions("single_choice"), true);
  assert.equal(questionTypeNeedsOptions("multiple_choice"), true);
  assert.equal(questionTypeNeedsOptions("dropdown"), true);
  assert.equal(questionTypeNeedsOptions("long_text"), false);
});

test("game tournament template includes participant survey and league settings", () => {
  const template = createGameTournamentTemplate();
  const questionTypes = new Set(template.questions.map((question) => question.type));

  assert.equal(template.id, "kobot-game-cup-2026-registration");
  assert.equal(template.category, "event_registration");
  assert.equal(template.commentsEnabled, true);
  assert.equal(template.tournament.enabled, true);
  assert.equal(template.tournament.leagueType, "round_robin");
  assert.equal(template.tournament.maxTeamSize, 3);
  assert.ok(questionTypes.has("single_choice"));
  assert.ok(questionTypes.has("multiple_choice"));
  assert.ok(questionTypes.has("dropdown"));
  assert.ok(questionTypes.has("linear_scale"));
  assert.ok(questionTypes.has("long_text"));
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

test("required participant survey answers are validated before submission", () => {
  const template = createGameTournamentTemplate();
  const missing = validateFormResponse(
    {
      questions: template.questions,
    },
    {
      "participant-name": "홍길동",
      "student-id": "",
    },
  );

  assert.ok(missing.includes("학번"));
  assert.ok(missing.includes("연락 가능한 연락처"));
  assert.ok(missing.includes("참가 방식"));
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
