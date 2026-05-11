import { getSupabaseBrowserClient } from "../auth/supabase";

export type GithubSyncProcessedJob = {
  id: string;
  jobType: string;
  status: "succeeded" | "failed_or_retrying";
  error?: string;
};

export type GithubSyncResult = {
  processed: GithubSyncProcessedJob[];
};

function messageFromFunctionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "GitHub 동기화 함수를 실행하지 못했습니다.";
  }

  const record = error as Record<string, unknown>;
  const context = record.context as Response | undefined;

  if (context?.status) {
    return `GitHub 동기화 함수가 ${context.status} 응답을 반환했습니다.`;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  return "GitHub 동기화 함수를 실행하지 못했습니다.";
}

export async function triggerGithubSync(limit = 10) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("GitHub 동기화를 실행하려면 로그인 세션이 필요합니다.");
  }

  const { data, error } = await supabase.functions.invoke<GithubSyncResult>("github-sync", {
    body: { limit },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(messageFromFunctionError(error));
  }

  return data ?? { processed: [] };
}

export function triggerGithubSyncInBackground(limit = 10) {
  void triggerGithubSync(limit).catch((error) => {
    console.warn("GitHub sync trigger failed", error);
  });
}
