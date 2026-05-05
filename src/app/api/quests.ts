import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "미션 정보를 처리하지 못했습니다.";

export type QuestAudienceMode = "all" | "tag_in";
export type QuestCompletionStatus = "submitted" | "approved" | "rejected";

export type QuestTagRef = {
  id: string;
  slug: string;
  label: string;
  color: string;
};

export type QuestSummary = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string;
  audienceMode: QuestAudienceMode;
  isActive: boolean;
  audienceTags: QuestTagRef[];
  rewardTags: QuestTagRef[];
  myCompletion: QuestCompletion | null;
  pendingReviewCount: number;
};

export type QuestCompletion = {
  id: string;
  questId: string;
  userId: string;
  status: QuestCompletionStatus;
  evidence: string | null;
  reviewReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
};

type QuestRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string;
  audience_mode: QuestAudienceMode;
  is_active: boolean;
};

type AudienceJoinRow = {
  quest_id: string;
  member_tags: { id: string; slug: string; label: string; color: string } | null;
};

type RewardJoinRow = {
  quest_id: string;
  member_tags: { id: string; slug: string; label: string; color: string } | null;
};

type CompletionRow = {
  id: string;
  quest_id: string;
  user_id: string;
  status: QuestCompletionStatus;
  evidence: string | null;
  review_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

const QUEST_SELECT =
  "id, slug, label, description, color, audience_mode, is_active";

function rowToTagRef(row: { id: string; slug: string; label: string; color: string }): QuestTagRef {
  return { id: row.id, slug: row.slug, label: row.label, color: row.color };
}

function rowToCompletion(row: CompletionRow): QuestCompletion {
  return {
    id: row.id,
    questId: row.quest_id,
    userId: row.user_id,
    status: row.status,
    evidence: row.evidence,
    reviewReason: row.review_reason,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  };
}

export async function listQuests(currentUserId: string | null): Promise<QuestSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const [questsResult, audienceResult, rewardResult, completionsResult] = await Promise.all([
    supabase
      .from("member_quests")
      .select(QUEST_SELECT)
      .order("is_active", { ascending: false })
      .order("label", { ascending: true }),
    supabase
      .from("member_quest_audience_tags")
      .select("quest_id, member_tags(id, slug, label, color)"),
    supabase
      .from("member_quest_reward_tags")
      .select("quest_id, member_tags(id, slug, label, color)"),
    supabase
      .from("member_quest_completions")
      .select(
        "id, quest_id, user_id, status, evidence, review_reason, submitted_at, reviewed_at, reviewed_by",
      ),
  ]);

  if (questsResult.error) throw new Error(sanitizeUserError(questsResult.error, FALLBACK));
  if (audienceResult.error) throw new Error(sanitizeUserError(audienceResult.error, FALLBACK));
  if (rewardResult.error) throw new Error(sanitizeUserError(rewardResult.error, FALLBACK));
  if (completionsResult.error) throw new Error(sanitizeUserError(completionsResult.error, FALLBACK));

  const audienceByQuest = new Map<string, QuestTagRef[]>();
  for (const row of (audienceResult.data ?? []) as AudienceJoinRow[]) {
    if (!row.member_tags) continue;
    const arr = audienceByQuest.get(row.quest_id) ?? [];
    arr.push(rowToTagRef(row.member_tags));
    audienceByQuest.set(row.quest_id, arr);
  }

  const rewardByQuest = new Map<string, QuestTagRef[]>();
  for (const row of (rewardResult.data ?? []) as RewardJoinRow[]) {
    if (!row.member_tags) continue;
    const arr = rewardByQuest.get(row.quest_id) ?? [];
    arr.push(rowToTagRef(row.member_tags));
    rewardByQuest.set(row.quest_id, arr);
  }

  const completionsByQuest = new Map<string, CompletionRow[]>();
  for (const row of (completionsResult.data ?? []) as CompletionRow[]) {
    const arr = completionsByQuest.get(row.quest_id) ?? [];
    arr.push(row);
    completionsByQuest.set(row.quest_id, arr);
  }

  return ((questsResult.data ?? []) as QuestRow[]).map((row) => {
    const completions = completionsByQuest.get(row.id) ?? [];
    const myCompletion = currentUserId
      ? completions.find((completion) => completion.user_id === currentUserId) ?? null
      : null;
    const pendingCount = completions.filter((c) => c.status === "submitted").length;
    return {
      id: row.id,
      slug: row.slug,
      label: row.label,
      description: row.description,
      color: row.color,
      audienceMode: row.audience_mode,
      isActive: row.is_active,
      audienceTags: audienceByQuest.get(row.id) ?? [],
      rewardTags: rewardByQuest.get(row.id) ?? [],
      myCompletion: myCompletion ? rowToCompletion(myCompletion) : null,
      pendingReviewCount: pendingCount,
    };
  });
}

export async function listQuestCompletions(questId: string): Promise<QuestCompletion[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("member_quest_completions")
    .select(
      "id, quest_id, user_id, status, evidence, review_reason, submitted_at, reviewed_at, reviewed_by",
    )
    .eq("quest_id", questId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const rows = (data ?? []) as CompletionRow[];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const profilesResult = await supabase
    .from("profiles")
    .select("id, display_name, nickname_display, full_name, email")
    .in("id", userIds);
  const profileById = new Map<
    string,
    { display_name: string | null; nickname_display: string | null; full_name: string | null; email: string | null }
  >(
    ((profilesResult.data ?? []) as Array<{
      id: string;
      display_name: string | null;
      nickname_display: string | null;
      full_name: string | null;
      email: string | null;
    }>).map((row) => [row.id, row]),
  );

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    const displayName =
      profile?.nickname_display?.trim() ||
      profile?.display_name?.trim() ||
      profile?.full_name?.trim() ||
      profile?.email?.split("@")[0] ||
      "이름 없음";
    return {
      ...rowToCompletion(row),
      userDisplayName: displayName,
      userEmail: profile?.email ?? null,
    };
  });
}

export type CreateQuestInput = {
  slug: string;
  label: string;
  description?: string | null;
  color?: string;
  audienceMode: QuestAudienceMode;
  audienceTagIds?: string[];
  rewardTagIds?: string[];
};

export async function createQuest(input: CreateQuestInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("member_quests")
    .insert({
      slug: input.slug.trim(),
      label: input.label.trim(),
      description: input.description?.trim() || null,
      color: input.color?.trim() || "#0ea5e9",
      audience_mode: input.audienceMode,
    })
    .select("id")
    .single();
  if (error) throw new Error(sanitizeUserError(error, "미션을 생성하지 못했습니다."));
  const questId = (data as { id: string }).id;

  if ((input.audienceTagIds?.length ?? 0) > 0) {
    const audienceErr = await supabase
      .from("member_quest_audience_tags")
      .insert((input.audienceTagIds ?? []).map((tagId) => ({ quest_id: questId, tag_id: tagId })));
    if (audienceErr.error) throw new Error(sanitizeUserError(audienceErr.error, FALLBACK));
  }
  if ((input.rewardTagIds?.length ?? 0) > 0) {
    const rewardErr = await supabase
      .from("member_quest_reward_tags")
      .insert((input.rewardTagIds ?? []).map((tagId) => ({ quest_id: questId, tag_id: tagId })));
    if (rewardErr.error) throw new Error(sanitizeUserError(rewardErr.error, FALLBACK));
  }
  return questId;
}

export async function updateQuest(
  questId: string,
  patch: {
    label?: string;
    description?: string | null;
    color?: string;
    audienceMode?: QuestAudienceMode;
    isActive?: boolean;
  },
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) update.label = patch.label.trim();
  if (patch.description !== undefined) update.description = patch.description?.trim() || null;
  if (patch.color !== undefined) update.color = patch.color.trim();
  if (patch.audienceMode !== undefined) update.audience_mode = patch.audienceMode;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  const { error } = await supabase.from("member_quests").update(update).eq("id", questId);
  if (error) throw new Error(sanitizeUserError(error, "미션을 수정하지 못했습니다."));
}

export async function setQuestAudienceTags(questId: string, tagIds: string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const distinct = Array.from(new Set(tagIds));
  const del = await supabase
    .from("member_quest_audience_tags")
    .delete()
    .eq("quest_id", questId);
  if (del.error) throw new Error(sanitizeUserError(del.error, FALLBACK));
  if (distinct.length === 0) return;
  const { error } = await supabase
    .from("member_quest_audience_tags")
    .insert(distinct.map((tagId) => ({ quest_id: questId, tag_id: tagId })));
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function setQuestRewardTags(questId: string, tagIds: string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const distinct = Array.from(new Set(tagIds));
  const del = await supabase.from("member_quest_reward_tags").delete().eq("quest_id", questId);
  if (del.error) throw new Error(sanitizeUserError(del.error, FALLBACK));
  if (distinct.length === 0) return;
  const { error } = await supabase
    .from("member_quest_reward_tags")
    .insert(distinct.map((tagId) => ({ quest_id: questId, tag_id: tagId })));
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function deleteQuest(questId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("member_quests").delete().eq("id", questId);
  if (error) throw new Error(sanitizeUserError(error, "미션을 삭제하지 못했습니다."));
}

export async function submitQuestCompletion(questId: string, evidence: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("submit_quest_completion", {
    quest_id: questId,
    evidence: evidence.trim(),
  });
  if (error) throw new Error(sanitizeUserError(error, "미션 완료 신청에 실패했습니다."));
}

export async function reviewQuestCompletion(
  completionId: string,
  decision: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("review_quest_completion", {
    completion_id: completionId,
    decision,
    review_reason: reason?.trim() || null,
  });
  if (error) throw new Error(sanitizeUserError(error, "검토 처리에 실패했습니다."));
}
