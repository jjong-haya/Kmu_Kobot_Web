import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, MessageCircle, Send, Trash2 } from "lucide-react";
import {
  createNoticeComment,
  deleteNoticeComment,
  getNotice,
  listNoticeComments,
  type NoticeCommentRow,
  type NoticeRow,
} from "../../api/notices";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function initialsFor(name: string | null | undefined) {
  const source = name?.trim() || "K";
  return source.slice(0, 2).toLocaleUpperCase("ko-KR");
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

  async function handleDeleteComment(comment: NoticeCommentRow) {
    try {
      await deleteNoticeComment(comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
    } catch (err) {
      setError(sanitizeUserError(err, "댓글 삭제에 실패했습니다."));
    }
  }

  if (loading && !notice) {
    return (
      <div style={{ padding: 32, color: "var(--kb-ink-500)" }}>
        공지를 불러오는 중...
      </div>
    );
  }

  if (!loading && !notice) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 16px" }}>
        <Link to="/member/announcements" style={{ color: "var(--kb-ink-700)", textDecoration: "none", fontWeight: 700 }}>
          ← 공지 목록
        </Link>
        <div style={{ marginTop: 28, padding: 28, border: "1px dashed #d7d2c7", borderRadius: 12, color: "var(--kb-ink-500)" }}>
          공지를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="kb-root" style={{ minHeight: "calc(100vh - 4rem)", margin: -32, padding: 32, background: "#fff" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <button
          type="button"
          onClick={() => navigate("/member/announcements")}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid #ebe8e0",
            borderRadius: 8,
            background: "#fff",
            padding: "9px 13px",
            cursor: "pointer",
            color: "var(--kb-ink-700)",
            fontFamily: "inherit",
            fontWeight: 650,
          }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          목록
        </button>

        {error ? (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "#fef2f2", color: "#991b1b", fontSize: 14 }}>
            {error}
          </div>
        ) : null}

        {notice ? (
          <article style={{ borderBottom: "1px solid #e8e8e4", paddingBottom: 26 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {canManage && notice.status === "draft" ? (
                <span style={{ padding: "3px 8px", borderRadius: 999, background: "#f3f3f1", color: "#666", fontSize: 12, fontWeight: 750 }}>
                  초안
                </span>
              ) : null}
              <span style={{ color: "var(--kb-ink-500)", fontSize: 13 }}>
                {notice.author?.displayName ?? "운영진"} · {formatDateTime(notice.created_at)}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.25, color: "var(--kb-ink-900)", fontWeight: 760 }}>
              {notice.title}
            </h1>
            <div
              style={{
                marginTop: 26,
                whiteSpace: "pre-wrap",
                fontSize: 15.5,
                lineHeight: 1.85,
                color: "var(--kb-ink-700)",
              }}
            >
              {notice.body}
            </div>
          </article>
        ) : null}

        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 18, fontWeight: 740 }}>
              <MessageCircle style={{ width: 18, height: 18 }} />
              댓글
            </h2>
            <span style={{ color: "var(--kb-ink-500)", fontSize: 13 }}>{comments.length}개</span>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 ? (
              <div style={{ padding: 28, border: "1px dashed #d7d2c7", borderRadius: 10, textAlign: "center", color: "var(--kb-ink-500)", fontSize: 14 }}>
                아직 댓글이 없습니다.
              </div>
            ) : (
              comments.map((comment) => {
                const authorName = comment.author?.displayName ?? "부원";
                const canDelete = canManage || comment.author_id === userId;
                return (
                  <div key={comment.id} style={{ border: "1px solid #e8e8e4", borderRadius: 10, padding: "13px 14px", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          background: "#0a0a0a",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 750,
                        }}
                      >
                        {initialsFor(authorName)}
                      </span>
                      <strong style={{ fontSize: 13.5 }}>{authorName}</strong>
                      <span style={{ marginLeft: "auto", color: "var(--kb-ink-500)", fontSize: 12 }}>
                        {formatDateTime(comment.created_at)}
                      </span>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(comment)}
                          aria-label="댓글 삭제"
                          style={{
                            width: 28,
                            height: 28,
                            border: "1px solid #fecaca",
                            borderRadius: 7,
                            background: "#fff",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      ) : null}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: "var(--kb-ink-700)", fontSize: 14, lineHeight: 1.65 }}>
                      {comment.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleCommentSubmit} style={{ border: "1px solid #e8e8e4", borderRadius: 10, padding: 14, background: "#fafaf9" }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: "var(--kb-ink-500)" }}>
              <strong style={{ color: "var(--kb-ink-900)" }}>{currentUserName}</strong>으로 댓글 작성
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="댓글을 입력하세요."
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #e8e8e4",
                borderRadius: 9,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: 1.55,
                background: "#fff",
              }}
            />
            <div style={{ marginTop: 9, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submitting || !draft.trim()}
                style={primaryButtonStyle(submitting || !draft.trim())}
              >
                <Send style={{ width: 14, height: 14 }} />
                등록
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 17px",
    border: 0,
    borderRadius: 8,
    background: disabled ? "#777" : "#0a0a0a",
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontWeight: 750,
  };
}
