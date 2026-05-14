import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  createNoticeComment,
  deleteNoticeComment,
  getNotice,
  listNoticeComments,
  type NoticeCommentRow,
  type NoticeRow,
} from "../../api/notices";
import { inferNoticeTopicTags, type NoticeTopicTag } from "../../api/notice-tags";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";
import { ConfirmActionDialog } from "../../components/ConfirmActionDialog";
import {
  EmptyState,
  ErrorFallback,
  StatusPill,
} from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function initialsFor(name: string | null | undefined) {
  const source = name?.trim() || "K";
  return source.slice(0, 2).toLocaleUpperCase("ko-KR");
}

const TOPIC_TAG_TONE: Record<NoticeTopicTag["tone"], string> = {
  blue: "border-[#c9d9ff] bg-[#eef4ff] text-[#1d3f8f]",
  green: "border-[#bde8ce] bg-[#eaf7f0] text-[#16633f]",
  amber: "border-[#f2d28a] bg-[#fff7e6] text-[#8a5a0a]",
  slate: "border-[#d8dde6] bg-[#f3f4f6] text-[#374151]",
};

function NoticeTopicTags({ title, body }: { title: string; body: string }) {
  const tags = inferNoticeTopicTags(title, body);
  if (tags.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.label}
          className={`inline-flex min-h-[22px] items-center rounded-md border px-2 py-0.5 text-[11.5px] font-bold leading-tight ${TOPIC_TAG_TONE[tag.tone]}`}
        >
          #{tag.label}
        </span>
      ))}
    </div>
  );
}

export default function AnnouncementDetail() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const { authData, hasPermission } = useAuth();
  const userId = authData.profile.id;
  const canManage = hasPermission("announcements.manage");

  const [notice, setNotice] = useState<NoticeRow | null>(null);
  const [comments, setComments] = useState<NoticeCommentRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoticeCommentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentUserName =
    authData.profile.nicknameDisplay ??
    authData.profile.displayName ??
    authData.profile.fullName ??
    "부원";

  async function load() {
    if (!noticeId) return;
    setLoading(true);
    setError(null);
    try {
      const [nextNotice, nextComments] = await Promise.all([
        getNotice(noticeId),
        listNoticeComments(noticeId),
      ]);
      setNotice(nextNotice);
      setComments(nextComments);
    } catch (err) {
      setError(sanitizeUserError(err, "공지 상세를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticeId]);

  async function handleCommentSubmit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!noticeId || !userId || !body) return;

    setSubmitting(true);
    setError(null);

    try {
      const saved = await createNoticeComment({ noticeId, authorId: userId, body });
      setComments((prev) => [...prev, saved]);
      setDraft("");
    } catch (err) {
      setError(sanitizeUserError(err, "댓글 저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNoticeComment(deleteTarget.id);
      setComments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(sanitizeUserError(err, "댓글 삭제에 실패했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !notice) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="mx-auto flex min-h-[420px] max-w-[760px] items-center justify-center text-[14px] font-medium text-[var(--kb-ink-500)]">
          공지를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!loading && !notice) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="mx-auto max-w-[760px]">
          <EmptyState
            icon={MessageCircle}
            title="공지를 찾을 수 없어요"
            description="삭제되었거나 잘못된 주소로 접근했습니다."
            action={
              <button
                type="button"
                onClick={() => navigate("/member/announcements")}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                공지 목록
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="kb-fade-up mx-auto flex max-w-[820px] flex-col gap-5">
        <button
          type="button"
          onClick={() => navigate("/member/announcements")}
          className="inline-flex h-9 self-start items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13.5px] font-medium text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          공지 목록
        </button>

        {error ? (
          <div
            role="alert"
            className="rounded-[var(--kb-radius-md)] border border-[color-mix(in_srgb,var(--kb-danger-500)_30%,transparent)] bg-[var(--kb-danger-50)] px-4 py-3 text-[13.5px] font-medium text-[var(--kb-danger-700)]"
          >
            {error}
          </div>
        ) : null}

        {notice ? (
          <article className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-6 shadow-[var(--kb-shadow-sm)] sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {canManage && notice.status === "draft" ? (
                <StatusPill tone="warning" dot>
                  초안
                </StatusPill>
              ) : null}
              <span className="text-[12.5px] text-[var(--kb-ink-500)]">
                {notice.author?.displayName ?? "운영진"} · {formatDateTime(notice.created_at)}
              </span>
            </div>

            <h1 className="kb-display mt-3 text-[26px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)] sm:text-[32px]">
              {notice.title}
            </h1>

            <NoticeTopicTags title={notice.title} body={notice.body} />

            <div className="mt-6 whitespace-pre-wrap text-[15px] leading-[1.85] text-[var(--kb-ink-700)]">
              {notice.body}
            </div>
          </article>
        ) : null}

        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <h2 className="kb-display m-0 inline-flex items-center gap-2 text-[16px] font-semibold tracking-tight text-[var(--kb-ink-900)]">
              <MessageCircle className="h-4 w-4 text-[var(--kb-navy-700)]" aria-hidden />
              댓글
              <span className="text-[12.5px] font-medium text-[var(--kb-ink-500)]">
                {comments.length}
              </span>
            </h2>
          </header>

          <div className="flex flex-col gap-2">
            {comments.length === 0 ? (
              <div className="rounded-[var(--kb-radius-md)] border border-dashed border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] px-4 py-6 text-center text-[13px] text-[var(--kb-ink-500)]">
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
              </div>
            ) : (
              comments.map((comment) => {
                const authorName = comment.author?.displayName ?? "부원";
                const canDelete = canManage || comment.author_id === userId;
                return (
                  <div
                    key={comment.id}
                    className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-3.5 shadow-[var(--kb-shadow-sm)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--kb-ink-900)] text-[10.5px] font-semibold text-[var(--kb-on-accent)]">
                        {initialsFor(authorName)}
                      </span>
                      <strong className="text-[13px] font-semibold text-[var(--kb-ink-900)]">
                        {authorName}
                      </strong>
                      <span className="ml-auto text-[11.5px] text-[var(--kb-ink-500)]">
                        {formatDateTime(comment.created_at)}
                      </span>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(comment)}
                          aria-label="댓글 삭제"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--kb-radius-sm)] border border-[color-mix(in_srgb,var(--kb-danger-500)_30%,transparent)] bg-[var(--kb-surface-raised)] text-[var(--kb-danger-700)] transition-colors hover:bg-[var(--kb-danger-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-danger-500)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-[13.5px] leading-[1.65] text-[var(--kb-ink-700)]">
                      {comment.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-sunken)] p-4"
          >
            <div className="mb-2 text-[12.5px] text-[var(--kb-ink-500)]">
              <strong className="text-[var(--kb-ink-900)]">{currentUserName}</strong>으로 댓글 작성
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="댓글을 입력하세요."
              className="w-full resize-y rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 py-2.5 text-[14px] leading-6 text-[var(--kb-ink-900)] outline-none transition-colors focus-visible:border-[var(--kb-navy-500)] focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-[var(--kb-ink-400)]">
                {draft.length} / 1000
              </span>
              <button
                type="submit"
                disabled={submitting || !draft.trim()}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3.5 text-[13px] font-semibold text-[var(--kb-on-accent)] transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                {submitting ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="댓글을 삭제할까요?"
        description="이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        destructive
        busy={deleting}
        onConfirm={() => void handleDeleteConfirmed()}
      />
    </div>
  );
}

void ErrorFallback;
