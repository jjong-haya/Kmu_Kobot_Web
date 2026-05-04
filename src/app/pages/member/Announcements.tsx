import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Edit3,
  Megaphone,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  createNotice,
  deleteNotice,
  listNotices,
  updateNotice,
  type NoticeRow,
  type NoticeStatus,
} from "../../api/notices";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const CONTAINER: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
};

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export default function Announcements() {
  const { authData } = useAuth();
  const userId = authData.profile.id;

  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | NoticeStatus>("all");
  const [editing, setEditing] = useState<NoticeRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listNotices());
    } catch (err) {
      setError(sanitizeUserError(err, "공지를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  async function handleDelete(row: NoticeRow) {
    if (!window.confirm(`"${row.title}" 공지를 삭제할까요?`)) return;
    try {
      await deleteNotice(row.id);
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "삭제에 실패했습니다."));
    }
  }

  async function handleToggleStatus(row: NoticeRow) {
    try {
      await updateNotice(row.id, {
        status: row.status === "published" ? "draft" : "published",
      });
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "상태 변경에 실패했습니다."));
    }
  }

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "calc(100vh - 4rem)",
        margin: -32,
        padding: 32,
        background: "#fff",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: 1100,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              className="kb-mono"
              style={{
                fontSize: 13,
                color: "var(--kb-ink-500)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Notices
            </div>
            <h1
              className="kb-display"
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
                color: "#0a0a0a",
              }}
            >
              공지사항
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · 전체 {rows.length} · 게시 {rows.filter((r) => r.status === "published").length}
              </span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />새 공지 작성
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              color: "#991b1b",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "전체" },
            { key: "published", label: "게시됨" },
            { key: "draft", label: "초안" },
          ].map((f) => {
            const sel = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key as typeof filter)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: sel ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                  background: sel ? "#0a0a0a" : "#fff",
                  color: sel ? "#fff" : "var(--kb-ink-700)",
                  fontSize: 14.5,
                  fontWeight: sel ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* list */}
        <div style={{ ...CONTAINER, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#fafaf9" }}>
                {["제목", "상태", "작성일", "수정일", ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "var(--kb-ink-500)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: i === 4 ? "right" : "left",
                      borderBottom: "1px solid #f1ede4",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "56px 28px", textAlign: "center", color: "var(--kb-ink-500)" }}>
                    불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "56px 28px", textAlign: "center", color: "var(--kb-ink-500)" }}>
                    <Megaphone style={{ width: 28, height: 28, margin: "0 auto 10px", color: "var(--kb-ink-300)" }} />
                    <div>공지가 없습니다.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1ede4" }}>
                    <td style={{ padding: "14px 16px", color: "var(--kb-ink-900)", fontWeight: 600 }}>
                      {row.title}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(row)}
                        title="클릭하여 상태 토글"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: row.status === "published" ? "#dff4e2" : "#f3f3f1",
                          color: row.status === "published" ? "#15602e" : "#6a6a6a",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {row.status === "published" ? "게시됨" : "초안"}
                      </button>
                    </td>
                    <td className="kb-mono" style={{ padding: "14px 16px", fontSize: 12.5, color: "var(--kb-ink-500)" }}>
                      {fmt(row.created_at)}
                    </td>
                    <td className="kb-mono" style={{ padding: "14px 16px", fontSize: 12.5, color: "var(--kb-ink-500)" }}>
                      {fmt(row.updated_at)}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          title="수정"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 12px",
                            fontSize: 12.5,
                            fontWeight: 600,
                            border: "1px solid #ebe8e0",
                            background: "#fff",
                            borderRadius: 6,
                            cursor: "pointer",
                            color: "var(--kb-ink-700)",
                            fontFamily: "inherit",
                          }}
                        >
                          <Edit3 style={{ width: 12, height: 12 }} />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          title="삭제"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 12px",
                            fontSize: 12.5,
                            fontWeight: 600,
                            border: "1px solid #fecaca",
                            background: "#fff",
                            borderRadius: 6,
                            cursor: "pointer",
                            color: "#dc2626",
                            fontFamily: "inherit",
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <NoticeModal
          row={editing}
          authorId={userId ?? ""}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function NoticeModal({
  row,
  authorId,
  onClose,
  onSaved,
}: {
  row: NoticeRow | null;
  authorId: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = !!row;
  const [title, setTitle] = useState(row?.title ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [status, setStatus] = useState<NoticeStatus>(row?.status ?? "published");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력해 주세요.");
    if (!authorId && !isEdit) return setError("작성자 정보를 확인할 수 없습니다.");
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && row) {
        await updateNotice(row.id, { title: title.trim(), body: body.trim(), status });
      } else {
        await createNotice({
          title: title.trim(),
          body: body.trim(),
          status,
          authorId,
        });
      }
      await onSaved();
    } catch (err) {
      setError(sanitizeUserError(err, "저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: 14,
    border: "1px solid #e8e8e4",
    borderRadius: 10,
    outline: "none",
    fontFamily: "inherit",
    color: "var(--kb-ink-900)",
    background: "#fff",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        overflowY: "auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          <h3 className="kb-display" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {isEdit ? "공지 수정" : "새 공지 작성"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 30,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--kb-ink-500)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              htmlFor="n-title"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              제목
            </label>
            <input
              id="n-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              maxLength={100}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="n-body"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              본문
            </label>
            <textarea
              id="n-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="줄바꿈은 그대로 표시됩니다.&#10;&#10;■ 섹션 1&#10;- 항목&#10;&#10;■ 섹션 2"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              상태
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["published", "draft"] as NoticeStatus[]).map((s) => {
                const sel = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: sel ? "2px solid #0a0a0a" : "1px solid #ebe8e0",
                      background: sel ? "#fafaf6" : "#fff",
                      color: "var(--kb-ink-900)",
                      fontSize: 13,
                      fontWeight: sel ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {s === "published" ? "즉시 게시 (랜딩에 노출)" : "초안 (비공개 저장)"}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            padding: "14px 24px",
            borderTop: "1px solid #f1ede4",
            background: "#fafaf9",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #ebe8e0",
              background: "#fff",
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              color: "var(--kb-ink-700)",
              fontFamily: "inherit",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              background: submitting ? "#6a6a6a" : "#0a0a0a",
              color: "#fff",
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            <Send style={{ width: 13, height: 13 }} />
            {submitting ? "저장 중..." : isEdit ? "수정 저장" : "공지 게시"}
          </button>
        </div>
      </form>
    </div>
  );
}
