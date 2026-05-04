import test from "node:test";
import assert from "node:assert/strict";

import {
  filterProjects,
  getProjectDetailPath,
  getProjectPrefix,
  getProjectRoleLabel,
  getProjectStatusLabel,
  readProjectProgress,
} from "../src/app/api/project-policy.js";

test("maps database project statuses to Korean labels", () => {
  assert.equal(getProjectStatusLabel("active"), "진행중");
  assert.equal(getProjectStatusLabel("pending"), "검토중");
  assert.equal(getProjectStatusLabel("rejected"), "반려");
  assert.equal(getProjectStatusLabel("archived"), "종료");
});

test("maps project membership roles to Korean labels", () => {
  assert.equal(getProjectRoleLabel("lead"), "리드");
  assert.equal(getProjectRoleLabel("maintainer"), "관리");
  assert.equal(getProjectRoleLabel("delegate"), "위임");
  assert.equal(getProjectRoleLabel("member"), "참여");
  assert.equal(getProjectRoleLabel(null), "미참여");
});

test("filters real project rows by status and membership", () => {
  const projects = [
    { id: "1", status: "active", isMember: true },
    { id: "2", status: "pending", isMember: false },
    { id: "3", status: "archived", isMember: true },
  ];

  assert.deepEqual(filterProjects(projects, "all").map((project) => project.id), ["1", "2", "3"]);
  assert.deepEqual(filterProjects(projects, "mine").map((project) => project.id), ["1", "3"]);
  assert.deepEqual(filterProjects(projects, "active").map((project) => project.id), ["1"]);
});

test("derives stable prefixes, progress, and detail paths from database-shaped values", () => {
  assert.equal(getProjectPrefix("auto-driving-robot", "자율주행 로봇 개발"), "ADR");
  assert.equal(getProjectPrefix("", "딥러닝 비전"), "딥비");
  assert.equal(readProjectProgress({ progress: 64.6 }), 65);
  assert.equal(readProjectProgress({ progressPercent: "101" }), 100);
  assert.equal(readProjectProgress({}), null);
  assert.equal(getProjectDetailPath("auto-driving-robot"), "/member/projects/auto-driving-robot");
});
