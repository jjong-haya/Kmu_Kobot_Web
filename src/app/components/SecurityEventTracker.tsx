import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { recordSecurityEvent } from "../api/security-events";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function eventTypeForPath(pathname: string) {
  if (/^\/member\/study-log\/[^/]+\/posts\/[^/]+\/edit$/.test(pathname)) {
    return "study.record.edit.view";
  }
  if (/^\/member\/study-log\/[^/]+\/posts\/[^/]+$/.test(pathname)) {
    return "study.record.view";
  }
  if (/^\/member\/study-log\/[^/]+\/write$/.test(pathname)) {
    return "study.record.write.view";
  }
  if (/^\/member\/study-log\/[^/]+$/.test(pathname)) {
    return "study.board.view";
  }
  if (/^\/member\/projects\/[^/]+$/.test(pathname)) {
    return "project.workspace.view";
  }
  if (
    pathname.startsWith("/member/member-admin") ||
    pathname.startsWith("/member/invite-codes") ||
    pathname.startsWith("/member/permissions") ||
    pathname.startsWith("/member/tags")
  ) {
    return "admin.page.view";
  }
  return "member.page.view";
}

function entityForPath(pathname: string) {
  const match = pathname.match(/^\/member\/study-log\/[^/]+\/posts\/([^/]+)/);
  const recordId = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (recordId && UUID_PATTERN.test(recordId)) {
    return { entityTable: "study_records", entityId: recordId };
  }

  return { entityTable: null, entityId: null };
}

export function SecurityEventTracker() {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = `${location.pathname}${location.search}`;
    const previousPath = previousPathRef.current;
    previousPathRef.current = currentPath;
    const entity = entityForPath(location.pathname);

    void recordSecurityEvent({
      eventType: eventTypeForPath(location.pathname),
      path: currentPath,
      entityTable: entity.entityTable,
      entityId: entity.entityId,
      metadata: {
        hash: location.hash || null,
        previousPath,
        referrer: document.referrer || null,
        title: document.title || null,
        language: navigator.language || null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    }).catch(() => {
      // Security logging must never block navigation.
    });
  }, [location.hash, location.pathname, location.search]);

  return null;
}
