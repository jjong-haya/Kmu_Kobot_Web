/**
 * Sanitize an error message before showing it to users.
 *
 * Postgres/Supabase errors leak schema names, function signatures, column names,
 * table names, and other internals (e.g. "Could not find the function
 * public.redeem_course_invite(invite_code) in the schema cache"). Showing those
 * to end users is a low-grade information disclosure.
 *
 * Strategy: keep messages that look user-intent (validation, auth) and replace
 * everything else with a friendly fallback. The original message is not logged
 * from this helper because browser console output is still user-visible.
 */
const DANGEROUS_PATTERNS: RegExp[] = [
  /\bpublic\.[a-z_]+/i,                       // public.table_name / public.fn_name
  /\b[a-z][a-z0-9]*_[a-z0-9_]*\.[a-z][a-z0-9_]*\b/i,
  /\b[a-z][a-z0-9_]*\.[a-z][a-z0-9]*_[a-z0-9_]*\b/i,
  /\b\d{10,14}_[a-z0-9_]+\.sql\b/i,
  /\b(PGRST\d*|[0-9]{5})\b/i,
  /relation .+ does not exist/i,
  /column .+ does not exist/i,
  /function .+ does not exist/i,
  /\b(table|column|relation|function|trigger|policy|migration|schema|rpc)\b/i,
  /Could not find the (function|table|relation)/i,
  /\bschema cache\b/i,
  /\bRLS\b|row[- ]level security/i,
  /search_path/i,
  /\bpg_/i,
  /\bpostgres\b/i,
  /\bsupabase\b/i,
  /\bjwt\b/i,
  /\binvalid_grant\b/i,
  /\bcode verifier\b/i,
  /\binternal server error\b/i,
  /\bquery failed\b/i,
  /\baccess[_ ]token\b/i,
  /\brefresh[_ ]token\b/i,
  /\bservice[_ ]role\b/i,
  /\banon[_ ]key\b/i,
  /운영\s*DB|마이그레이션|스키마|컬럼|테이블|함수|정책|SQL/i,
];

export function sanitizeUserError(err: unknown, fallback: string): string {
  if (err == null) return fallback;
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  if (!raw.trim()) return fallback;

  // SECURITY: do NOT log raw error anywhere accessible to users
  // (browser console is visible via DevTools). Just discard it.
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(raw)) return fallback;
  }

  // Hide overly long technical messages too — usually a stack-trace-ish payload.
  if (raw.length > 240) return fallback;

  return raw;
}
