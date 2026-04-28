import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return browserClient;
}

export function getSupabaseAuthCallbackUrl(nextPath?: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const callbackUrl = new URL("/auth/callback", window.location.origin);

  if (nextPath && nextPath.startsWith("/")) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  return callbackUrl.toString();
}

