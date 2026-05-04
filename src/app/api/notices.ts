import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "공지 처리 중 문제가 발생했습니다.";

export type NoticeStatus = "draft" | "published";

export type NoticeAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type NoticeRow = {
  id: string;
  title: string;
  body: string;
  status: NoticeStatus;
  author_id: string;
  author: NoticeAuthor | null;
  commentCount: number;
  created_at: string;
  updated_at: string;
};

export type NoticeCommentRow = {
  id: string;
  notice_id: string;
  author_id: string;
  author: NoticeAuthor | null;
  body: string;
  created_at: string;
  updated_at: string;
};

type NoticeDbRow = {
  id: string;
  title: string;
  body: string;
  status: NoticeStatus;
  author_id: string;
  created_at: string;
  updated_at: string;
};

type NoticeCommentDbRow = {
  id: string;
  notice_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  nickname_display: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

const NOTICE_SELECT = "id, title, body, status, author_id, created_at, updated_at";
const COMMENT_SELECT = "id, notice_id, author_id, body, created_at, updated_at";
const PROFILE_SELECT = "id, display_name, nickname_display, full_name, avatar_url";

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function displayNameFor(profile: ProfileLite | undefined) {
  return (
    profile?.nickname_display?.trim() ||
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    "알 수 없음"
  );
}

async function fetchProfilesById(ids: string[]) {
  const supabase = getSupabaseBrowserClient();
  if (ids.length === 0) return new Map<string, NoticeAuthor>();

  const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).in("id", ids);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return new Map(
    ((data ?? []) as ProfileLite[]).map((profile) => [
      profile.id,
      {
        id: profile.id,
        displayName: displayNameFor(profile),
        avatarUrl: profile.avatar_url,
      },
    ]),
  );
}

async function fetchCommentCounts(noticeIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  const counts = new Map<string, number>();
  if (noticeIds.length === 0) return counts;

  const { data, error } = await supabase.from("notice_comments").select("notice_id").in("notice_id", noticeIds);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  for (const row of (data ?? []) as Array<{ notice_id: string }>) {
    counts.set(row.notice_id, (counts.get(row.notice_id) ?? 0) + 1);
  }

  return counts;
}

async function attachNoticeMeta(rows: NoticeDbRow[]) {
  const [profiles, counts] = await Promise.all([
    fetchProfilesById(uniqueIds(rows.map((row) => row.author_id))),
    fetchCommentCounts(rows.map((row) => row.id)),
  ]);

  return rows.map((row) => ({
    ...row,
    author: profiles.get(row.author_id) ?? null,
    commentCount: counts.get(row.id) ?? 0,
  }));
}

async function attachCommentAuthors(rows: NoticeCommentDbRow[]) {
  const profiles = await fetchProfilesById(uniqueIds(rows.map((row) => row.author_id)));

  return rows.map((row) => ({
    ...row,
    author: profiles.get(row.author_id) ?? null,
  }));
}

export async function listNotices(): Promise<NoticeRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notices")
    .select(NOTICE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return attachNoticeMeta((data ?? []) as NoticeDbRow[]);
}

export async function getNotice(id: string): Promise<NoticeRow | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("notices").select(NOTICE_SELECT).eq("id", id).maybeSingle();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) return null;

  const [notice] = await attachNoticeMeta([data as NoticeDbRow]);
  return notice ?? null;
}

export type CreateNoticeInput = {
  title: string;
  body: string;
  status: NoticeStatus;
  authorId: string;
};

export async function createNotice(input: CreateNoticeInput): Promise<NoticeRow> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notices")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      status: input.status,
      author_id: input.authorId,
    })
    .select(NOTICE_SELECT)
    .single();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) throw new Error("공지 저장에 실패했습니다.");

  const [notice] = await attachNoticeMeta([data as NoticeDbRow]);
  return notice;
}

export async function updateNotice(
  id: string,
  patch: Partial<Pick<NoticeRow, "title" | "body" | "status">>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const nextPatch = {
    ...patch,
    title: patch.title?.trim(),
    body: patch.body?.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("notices").update(nextPatch).eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function deleteNotice(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}

export async function listNoticeComments(noticeId: string): Promise<NoticeCommentRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notice_comments")
    .select(COMMENT_SELECT)
    .eq("notice_id", noticeId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return attachCommentAuthors((data ?? []) as NoticeCommentDbRow[]);
}

export async function createNoticeComment(input: {
  noticeId: string;
  authorId: string;
  body: string;
}): Promise<NoticeCommentRow> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notice_comments")
    .insert({
      notice_id: input.noticeId,
      author_id: input.authorId,
      body: input.body.trim(),
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) throw new Error("댓글 저장에 실패했습니다.");

  const [comment] = await attachCommentAuthors([data as NoticeCommentDbRow]);
  return comment;
}

export async function deleteNoticeComment(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("notice_comments").delete().eq("id", id);
  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
}
