const INTERNAL_REDIRECT_BASE = "https://kobot.local";

export function isSafeInternalPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return false;
  }

  if (/[\r\n]/.test(value)) {
    return false;
  }

  try {
    const parsed = new URL(value, INTERNAL_REDIRECT_BASE);
    return parsed.origin === INTERNAL_REDIRECT_BASE && parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

export function getSafeInternalPath(value: string | null | undefined) {
  return isSafeInternalPath(value) ? value : null;
}

export function withNextPath(path: string, nextPath: string | null | undefined) {
  const safeNextPath = getSafeInternalPath(nextPath);

  if (!safeNextPath || path === safeNextPath) {
    return path;
  }

  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("next", safeNextPath);
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
