import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSafeInternalPath } from "./redirects";

let browserClient: SupabaseClient | null = null;

function getSupabaseEnv() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });

  return browserClient;
}

export type SupabaseAuthCallbackOptions = {
  callbackParams?: Record<string, string | null | undefined>;
};

export function getSupabaseAuthCallbackUrl(
  nextPath?: string,
  options: SupabaseAuthCallbackOptions = {},
) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const callbackUrl = new URL("/auth/callback", window.location.origin);

  for (const [key, value] of Object.entries(options.callbackParams ?? {})) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key) || !value) continue;
    callbackUrl.searchParams.set(key, value);
  }

  const safeNextPath = getSafeInternalPath(nextPath);

  if (safeNextPath) {
    callbackUrl.searchParams.set("next", safeNextPath);
  }

  return callbackUrl.toString();
}
