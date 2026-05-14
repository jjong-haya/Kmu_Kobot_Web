const RESERVED_GITHUB_PATHS = new Set([
  "about",
  "apps",
  "blog",
  "collections",
  "contact",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "github",
  "login",
  "marketplace",
  "new",
  "notifications",
  "orgs",
  "organizations",
  "pricing",
  "pulls",
  "search",
  "settings",
  "sponsors",
  "topics",
  "users",
]);

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractGithubLoginFromUrl(value: string | null | undefined) {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const match = normalized.match(/^https:\/\/github\.com\/([^/?#]+)(?:[/?#].*)?$/i);
  if (!match?.[1]) return null;

  const login = match[1].toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$/.test(login)) {
    return null;
  }

  if (RESERVED_GITHUB_PATHS.has(login)) {
    return null;
  }

  return login;
}
