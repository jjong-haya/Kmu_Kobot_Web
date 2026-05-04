import { useEffect, useState } from "react";
import {
  COURSE_MEMBER_DEFAULT_PATHS,
  fetchCourseMemberAllowedPaths,
} from "../api/nav-config";

const CACHE_KEY = "kobot.navConfig.courseMember.v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedSnapshot = {
  fetchedAt: number;
  paths: string[];
};

function readCache(): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSnapshot;
    if (
      typeof parsed.fetchedAt !== "number" ||
      !Array.isArray(parsed.paths) ||
      Date.now() - parsed.fetchedAt > CACHE_TTL_MS
    ) {
      return null;
    }
    return new Set(parsed.paths.filter((p): p is string => typeof p === "string"));
  } catch {
    return null;
  }
}

function writeCache(paths: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const snapshot: CachedSnapshot = {
      fetchedAt: Date.now(),
      paths: [...paths],
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota errors */
  }
}

const NAV_VISIBILITY_CHANGED_EVENT = "kobot:nav-visibility-changed";

/**
 * Hook returning the current set of paths visible to course_member users
 * on the sidebar. Falls back to hardcoded defaults if the DB fetch fails.
 *
 * Caches in localStorage for 5 min so the sidebar renders instantly on
 * subsequent loads. The /member/nav-config page calls dispatchNavVisibilityChanged()
 * after editing so all open tabs refresh.
 */
export function useCourseMemberNavPaths(): Set<string> {
  const [paths, setPaths] = useState<Set<string>>(
    () => readCache() ?? new Set(COURSE_MEMBER_DEFAULT_PATHS),
  );

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const next = await fetchCourseMemberAllowedPaths();
      if (cancelled) return;
      setPaths(next);
      writeCache(next);
    }
    refresh();
    function handleChange() {
      void refresh();
    }
    if (typeof window !== "undefined") {
      window.addEventListener(NAV_VISIBILITY_CHANGED_EVENT, handleChange);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener(NAV_VISIBILITY_CHANGED_EVENT, handleChange);
      }
    };
  }, []);

  return paths;
}

export function dispatchNavVisibilityChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAV_VISIBILITY_CHANGED_EVENT));
}
