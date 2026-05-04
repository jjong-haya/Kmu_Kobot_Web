/**
 * Build-time version metadata injected by Vite (vite.config.ts `define`).
 *
 * Updates automatically every commit because the SHA changes per commit.
 * Display format: v1.0.{count} ({date} · {sha})
 */
declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;
declare const __APP_COMMIT_COUNT__: string;

export const APP_VERSION_SHA = __APP_VERSION__;
export const APP_BUILD_DATE = __APP_BUILD_DATE__;
export const APP_COMMIT_COUNT = __APP_COMMIT_COUNT__;

/**
 * Human-friendly version string for footer display.
 * Example: "v1.0.137 · 2026-05-05 · 74909b6"
 */
export const APP_VERSION_LABEL = `v1.0.${APP_COMMIT_COUNT} · ${APP_BUILD_DATE} · ${APP_VERSION_SHA}`;
