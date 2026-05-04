import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams, Navigate } from "react-router";
import wordLogo from "@/assets/wordLogo.png";
import { findNoticeBySlug } from "./Notice";
import { useAuth } from "../../auth/useAuth";

type Comment = {
  id: string;
  author: string;
  body: string;
  date: string;
};

const wrapperStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle 600px at 100% -100px, rgba(16, 48, 120, 0.07), transparent 60%), " +
    "radial-gradient(rgba(16, 48, 120, 0.12) 1px, transparent 1px) 0 0 / 24px 24px, " +
    "var(--kb-paper)",
};

export default function NoticeDetail() {
  const { slug } = useParams();
  const notice = findNoticeBySlug(slug);
  const { authData, session } = useAuth();
  const isLoggedIn = Boolean(session);
  const userName =
    authData.profile.nicknameDisplay ??
    authData.profile.fullName ??
    authData.profile.displayName ??
    "익명";

  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!notice) {
    return <Navigate to="/notice" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    // TODO: connect to DB — see HANDOFF.md
    const now = new Date();
    const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: userName,
        body: draft.trim(),
        date,
      },
    ]);
    setDraft("");
    setSubmitting(false);
  }

  return (
    <div className="kb-root" style={wrapperStyle}>
      {/* sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--kb-paper)",
          borderBottom: "1px solid var(--kb-hairline)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <img src={wordLogo} alt="Kobot" style={{ height: 18 }} />
        </Link>
        <Link
          to="/notice"
          className="kb-mono"
          style={{
            fontSize: 11,
            color: "var(--kb-ink-700)",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          ← /notice
        </Link>
      </header>

      <article
        style={{
          margin: "0 auto",
          maxWidth: 720,
          padding: "32px 20px 56px",
        }}
      >
        {/* prompt */}
        <div
          className="kb-mono"
          style={{
            fontSize: 10.5,
            color: "var(--kb-ink-500)",
            marginBottom: 20,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: "var(--kb-navy-800)" }}>~/kobot</span>
          <span style={{ margin: "0 6px" }}>$</span>
          <span>cat notice/{notice.slug}.md</span>
        </div>

        {/* meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {notice.pinned && (
            <span
              className="kb-mono"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--kb-navy-800)",
                background: "var(--kb-navy-50)",
                padding: "3px 9px",
                letterSpacing: "0.06em",
              }}
            >
              ★ PINNED
            </span>
          )}
          <span
            className="kb-mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            [{notice.category}]
          </span>
          <span
            className="kb-mono"
            style={{
              fontSize: 11,
              color: "var(--kb-ink-500)",
              marginLeft: "auto",
            }}
          >
            {notice.date}
          </span>
        </div>

        {/* title */}
        <h1
          className="kb-display"
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--kb-ink-900)",
            lineHeight: 1.3,
          }}
        >
          {notice.title}
        </h1>

        {/* author line */}
        <div
          style={{
            marginTop: 12,
            paddingBottom: 20,
            borderBottom: "1px solid var(--kb-hairline)",
            fontSize: 13,
            color: "var(--kb-ink-500)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--kb-navy-800)",
              color: "#fff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {notice.author.charAt(0)}
          </span>
          <span style={{ fontWeight: 600, color: "var(--kb-ink-700)" }}>
            {notice.author}
          </span>
        </div>

        {/* body */}
        <div
          style={{
            marginTop: 24,
            fontSize: 15,
            lineHeight: 1.85,
            color: "var(--kb-ink-700)",
            whiteSpace: "pre-wrap",
            fontWeight: 500,
          }}
        >
          {notice.body}
        </div>

        {/* comments section */}
        <section style={{ marginTop: 56 }}>
          <div
            className="kb-mono"
            style={{
              fontSize: 10.5,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.16em",
              marginBottom: 14,
              borderTop: "1px dashed var(--kb-ink-300)",
              paddingTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              <span style={{ color: "var(--kb-navy-800)" }}>// </span>COMMENTS
            </span>
            <span>{comments.length} 개</span>
          </div>

          {/* comment list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {comments.length === 0 ? (
              <div
                className="kb-mono"
                style={{
                  padding: "28px 16px",
                  fontSize: 12,
                  color: "var(--kb-ink-500)",
                  textAlign: "center",
                  border: "1px dashed var(--kb-ink-300)",
                }}
              >
                아직 댓글이 없습니다.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid var(--kb-hairline)",
                    background: "var(--kb-paper)",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--kb-navy-800)",
                        color: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {c.author.charAt(0)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--kb-ink-900)",
                      }}
                    >
                      {c.author}
                    </span>
                    <span
                      className="kb-mono"
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "var(--kb-ink-500)",
                      }}
                    >
                      {c.date}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--kb-ink-700)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {c.body}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* comment composer */}
          {isLoggedIn ? (
            <form
              onSubmit={handleSubmit}
              style={{
                border: "1px solid var(--kb-hairline)",
                background: "var(--kb-paper)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--kb-ink-500)",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                <strong style={{ color: "var(--kb-ink-900)" }}>{userName}</strong>{" "}
                으로 댓글 작성
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  border: "1px solid var(--kb-hairline)",
                  outline: "none",
                  fontFamily: "inherit",
                  color: "var(--kb-ink-900)",
                  background: "var(--kb-paper)",
                  resize: "vertical",
                  lineHeight: 1.55,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  type="submit"
                  disabled={submitting || !draft.trim()}
                  className="kb-mono"
                  style={{
                    padding: "10px 18px",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    background:
                      submitting || !draft.trim() ? "#6a6a6a" : "var(--kb-ink-900)",
                    color: "var(--kb-paper)",
                    border: 0,
                    cursor: submitting || !draft.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  $ post
                </button>
              </div>
            </form>
          ) : (
            <div
              style={{
                padding: "20px 16px",
                border: "1px dashed var(--kb-ink-300)",
                textAlign: "center",
                fontSize: 13.5,
                color: "var(--kb-ink-500)",
                lineHeight: 1.55,
              }}
            >
              댓글을 작성하려면{" "}
              <Link
                to="/login"
                style={{
                  color: "var(--kb-ink-900)",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                로그인
              </Link>
              이 필요합니다.
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
