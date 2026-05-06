declare const __APP_VERSION__: string;

const RECOVERY_STORAGE_PREFIX = "kobot:chunk-load-recovery";

function getAppVersion() {
  try {
    return typeof __APP_VERSION__ === "string" && __APP_VERSION__ ? __APP_VERSION__ : "dev";
  } catch {
    return "dev";
  }
}

function stringifyReason(reason: unknown): string {
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return `${reason.name} ${reason.message}`;
  if (reason && typeof reason === "object") {
    const maybeMessage = "message" in reason ? String(reason.message) : "";
    const maybeType = "type" in reason ? String(reason.type) : "";
    return `${maybeType} ${maybeMessage}`.trim();
  }
  return "";
}

export function isStaleChunkAssetUrl(value: unknown) {
  if (typeof value !== "string" || !value) return false;

  try {
    const url = new URL(value, window.location.origin);
    return url.pathname.startsWith("/assets/") && /\.(?:js|mjs)$/i.test(url.pathname);
  } catch {
    return /^\/?assets\/.+\.(?:js|mjs)$/i.test(value);
  }
}

export function isChunkLoadErrorReason(reason: unknown) {
  const message = stringifyReason(reason).toLowerCase();

  if (!message) return false;

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("failed to load module script") ||
    message.includes("expected a javascript-or-wasm module script") ||
    message.includes("strict mime type checking") ||
    message.includes("disallowed mime type")
  );
}

function isModuleAssetTarget(target: EventTarget | null) {
  if (typeof HTMLScriptElement !== "undefined" && target instanceof HTMLScriptElement) {
    return target.type === "module" && isStaleChunkAssetUrl(target.src);
  }

  if (typeof HTMLLinkElement !== "undefined" && target instanceof HTMLLinkElement) {
    return target.rel === "modulepreload" && isStaleChunkAssetUrl(target.href);
  }

  return false;
}

function reloadOnceForCurrentBuild() {
  const storageKey = `${RECOVERY_STORAGE_PREFIX}:${getAppVersion()}`;

  try {
    if (window.sessionStorage.getItem(storageKey) === "1") return;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // If sessionStorage is blocked, still try one reload. The browser will stop loops naturally.
  }

  window.setTimeout(() => {
    window.location.reload();
  }, 50);
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      const errorEvent = event as ErrorEvent;
      if (isModuleAssetTarget(event.target) || isChunkLoadErrorReason(errorEvent.error ?? errorEvent.message)) {
        reloadOnceForCurrentBuild();
      }
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadErrorReason(event.reason)) {
      reloadOnceForCurrentBuild();
    }
  });
}
