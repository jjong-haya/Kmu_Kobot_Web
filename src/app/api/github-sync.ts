import { getSupabaseBrowserClient } from "../auth/supabase";

export async function triggerGithubSync(limit = 10) {
  const supabase = getSupabaseBrowserClient();

  try {
    await supabase.functions.invoke("github-sync", {
      body: { limit },
    });
  } catch (error) {
    console.warn("GitHub sync trigger failed", error);
  }
}
