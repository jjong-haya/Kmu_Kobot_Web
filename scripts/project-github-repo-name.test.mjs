import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  normalizeProjectGithubRepoName,
  projectGithubRepoNameFromSlug,
} from "../src/app/api/project-github-names.ts";

const formSource = readFileSync("src/app/components/member/ProjectFormModal.tsx", "utf8");
const projectsApiSource = readFileSync("src/app/api/projects.ts", "utf8");
const githubSyncSource = readFileSync("supabase/functions/github-sync/index.ts", "utf8");
const migrationSource = readFileSync(
  "supabase/migrations/20260514110000_project_github_repo_name.sql",
  "utf8",
);

test("normalizes project GitHub repository names consistently", () => {
  assert.equal(normalizeProjectGithubRepoName(" Robot Arm.Control "), "robot-arm.control");
  assert.equal(normalizeProjectGithubRepoName("한글 프로젝트"), null);
  assert.equal(
    projectGithubRepoNameFromSlug({
      id: "12345678-0000-4000-8000-000000000000",
      slug: "demo-project",
      githubRepoName: "custom.repo",
    }),
    "custom.repo",
  );
});

test("project creation form sends the selected GitHub repository name", () => {
  assert.match(formSource, /GitHub 저장소 이름/);
  assert.match(formSource, /projectGithubRepoNameFromTitle/);
  assert.match(formSource, /getProjectGithubRepoNameError\(githubRepoName\)/);
  assert.match(projectsApiSource, /githubRepoName\?: string \| null/);
  assert.match(projectsApiSource, /githubRepoName: normalizeProjectGithubRepoName\(input\.githubRepoName\)/);
});

test("GitHub sync provisions from metadata githubRepoName before slug fallback", () => {
  assert.match(githubSyncSource, /metadata: Record<string, unknown> \| null/);
  assert.match(githubSyncSource, /normalizeRepoName\(project\.metadata\?\.githubRepoName\)/);
  assert.match(githubSyncSource, /\.select\("id, organization_id, slug, name, summary, description, status, metadata"\)/);
});

test("database guards selected GitHub repository names before approval", () => {
  assert.match(migrationSource, /normalize_project_github_repo_name/);
  assert.match(migrationSource, /project_github_repo_name_available/);
  assert.match(migrationSource, /jsonb_build_object\('githubRepoName', v_repo_name\)/);
  assert.match(migrationSource, /이미 사용 중인 GitHub 저장소 이름입니다\./);
});
