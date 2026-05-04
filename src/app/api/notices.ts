import { getSupabaseBrowserClient } from "../auth/supabase";

export type NoticeStatus = "draft" | "published";

export type NoticeRow = {
  id: string;
  title: string;
  body: string | null;
  status: NoticeStatus;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT = "id, title, body, status, author_id, created_at, updated_at";

export async function listNotices(): Promise<NoticeRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("notices")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as NoticeRow[];
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
      title: input.title,
      body: input.body,
      status: input.status,
      author_id: input.authorId,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("저장 실패");
  return data as NoticeRow;
}

export async function updateNotice(
  id: string,
  patch: Partial<Pick<NoticeRow, "title" | "body" | "status">>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("notices").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteNotice(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
