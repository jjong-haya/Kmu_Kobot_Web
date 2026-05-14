export const DEFAULT_PROJECT_GITHUB_ORG = "Kookmin-Kobot";

export const PROJECT_GITHUB_REPO_NAME_MAX = 90;

export function normalizeProjectGithubRepoName(value: string | null | undefined) {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, PROJECT_GITHUB_REPO_NAME_MAX)
    .replace(/[._-]+$/g, "");

  return normalized || null;
}

export function projectGithubRepoNameFromSlug(project: {
  id: string;
  slug: string;
  githubRepoName?: string | null;
}) {
  return (
    normalizeProjectGithubRepoName(project.githubRepoName) ??
    normalizeProjectGithubRepoName(project.slug) ??
    `project-${project.id.slice(0, 8)}`
  );
}

export function projectGithubRepoNameFromTitle(title: string) {
  return normalizeProjectGithubRepoName(title) ?? "";
}

export function getProjectGithubRepoNameError(value: string | null | undefined) {
  const normalized = normalizeProjectGithubRepoName(value);

  if (!normalized) {
    return "GitHub 저장소 이름을 입력해 주세요.";
  }

  if (normalized.length < 2) {
    return "GitHub 저장소 이름은 2자 이상으로 입력해 주세요.";
  }

  if (normalized !== value?.trim().toLowerCase()) {
    return "GitHub 저장소 이름은 영문 소문자, 숫자, 점(.), 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.";
  }

  return null;
}
