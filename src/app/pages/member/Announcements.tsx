import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useNavigate } from "react-router";
import { Edit3, MessageCircle, Megaphone, Plus, Send, Trash2, X } from "lucide-react";
import {
  createNotice,
  deleteNotice,
  listNotices,
  updateNotice,
  type NoticeAudienceMode,
  type NoticeRow,
  type NoticeStatus,
} from "../../api/notices";
import { listTags, type MemberTag } from "../../api/tags";
import { getNoticeDetailPath } from "../../api/announcement-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PANEL: CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e4",
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function noticePreview(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function statusText(status: NoticeStatus) {
  return status === "published" ? "게시됨" : "초안";
}

function visibilityText(row: NoticeRow) {
  if (row.audienceMode === "public") return "전체 공개";
  if (row.audienceTags.length === 0) return "태그 한정";
  if (row.audienceTags.length <= 2) return row.audienceTags.map((tag) => tag.label).join(", ");
  return `${row.audienceTags[0]?.label ?? "태그"} 외 ${row.audienceTags.length - 1}`;
}

export default function Announcements() {
  const navigate = useNavigate();
  const { authData, hasPermission } = useAuth();
  const userId = authData.profile.id;
  const canManage = hasPermission("announcements.manage");

  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | NoticeStatus>("all");
  const [editing, setEditing] = useState<NoticeRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [tagsCatalog, setTagsCatalog] = useState<MemberTag[]>([]);

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

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    (async () => {
      try {
        const tags = await listTags();
        if (!cancelled) setTagsCatalog(tags);
      } catch (err) {
        if (!cancelled) setError(sanitizeUserError(err, "태그 목록을 불러오지 못했습니다."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const filtered = useMemo(() => {
    if (!canManage) return rows.filter((row) => row.status === "published");
    return filter === "all" ? rows : rows.filter((row) => row.status === filter);
  }, [canManage, filter, rows]);

  async function handleDelete(row: NoticeRow) {
    if (!window.confirm(`"${row.title}" 공지를 삭제할까요?`)) return;

    try {
      await deleteNotice(row.id);
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "공지 삭제에 실패했습니다."));
    }
  }

  return (
    <div className="kb-root" style={{ minHeight: "calc(100vh - 4rem)", margin: -32, padding: 32, background: "#fff" }}>
      <div style={{ margin: "0 auto", maxWidth: 1040, display: "flex", flexDirection: "column", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p
              className="kb-mono"
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                color: "var(--kb-ink-500)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Announcements
            </p>
            <h1 className="kb-display" style={{ margin: 0, fontSize: 31, fontWeight: 650, color: "#0a0a0a" }}>
              공지
            </h1>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 18px",
                border: 0,
                borderRadius: 9,
                background: "#0a0a0a",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              새 공지
            </button>
          ) : null}
        </header>

        {error ? (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "#fef2f2", color: "#991b1b", fontSize: 14 }}>
            {error}
          </div>
        ) : null}

        {canManage ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "전체" },
              { key: "published", label: "게시됨" },
              { key: "draft", label: "초안" },
            ].map((item) => {
              const selected = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as typeof filter)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 8,
                    border: selected ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                    background: selected ? "#0a0a0a" : "#fff",
                    color: selected ? "#fff" : "var(--kb-ink-700)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 650,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <section style={{ ...PANEL, overflow: "hidden" }}>
          {loading && rows.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--kb-ink-500)" }}>불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: "center", color: "var(--kb-ink-500)" }}>
              <Megaphone style={{ width: 30, height: 30, margin: "0 auto 10px", color: "var(--kb-ink-300)" }} />
              표시할 공지가 없습니다.
            </div>
          ) : (
            filtered.map((row, index) => (
              <article
                key={row.id}
                onClick={() => navigate(getNoticeDetailPath(row.id))}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  padding: "18px 20px",
                  borderBottom: index < filtered.length - 1 ? "1px solid #f1ede4" : 0,
                  cursor: "pointer",
                  background: row.status === "draft" ? "#fafaf9" : "#fff",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: row.status === "published" ? "#dff7ef" : "#f3f3f1",
                        color: row.status === "published" ? "#1e6b5b" : "#666",
                        fontSize: 11,
                        fontWeight: 750,
                      }}
                    >
                      {statusText(row.status)}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: row.audienceMode === "public" ? "#eef2ff" : "#fff7ed",
                        color: row.audienceMode === "public" ? "#3730a3" : "#9a3412",
                        fontSize: 11,
                        fontWeight: 750,
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={row.audienceTags.map((tag) => tag.label).join(", ")}
                    >
                      {visibilityText(row)}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--kb-ink-500)" }}>
                      {row.author?.displayName ?? "운영진"} · {formatDate(row.created_at)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "#666" }}>
                      <MessageCircle style={{ width: 13, height: 13 }} />
                      {row.commentCount}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--kb-ink-900)" }}>{row.title}</h2>
                  <p style={{ margin: "7px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--kb-ink-500)" }}>
                    {noticePreview(row.body)}
                  </p>
                </div>

                {canManage ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      title="수정"
                      style={iconButtonStyle("#fff", "var(--kb-ink-700)", "#ebe8e0")}
                    >
                      <Edit3 style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      title="삭제"
                      style={iconButtonStyle("#fff", "#dc2626", "#fecaca")}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>

      {(creating || editing) && canManage ? (
        <NoticeModal
          row={editing}
          authorId={userId ?? ""}
          tags={tagsCatalog}
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
      ) : null}
    </div>
  );
}

function iconButtonStyle(background: string, color: string, border: string): CSSProperties {
  return {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: `1px solid ${border}`,
    background,
    color,
    cursor: "pointer",
  };
}

function NoticeModal({
  authorId,
  onClose,
  onSaved,
  row,
  tags,
}: {
  authorId: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  row: NoticeRow | null;
  tags: MemberTag[];
}) {
  const isEdit = Boolean(row);
  const [title, setTitle] = useState(row?.title ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [status, setStatus] = useState<NoticeStatus>(row?.status ?? "published");
  const [audienceMode, setAudienceMode] = useState<NoticeAudienceMode>(row?.audienceMode ?? "public");
  const [audienceTagIds, setAudienceTagIds] = useState<Set<string>>(
    new Set(row?.audienceTags.map((tag) => tag.id) ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextBody = body.trim();

    if (!nextTitle) return setError("제목을 입력해주세요.");
    if (!nextBody) return setError("본문을 입력해주세요.");
    if (!authorId && !isEdit) return setError("작성자 정보를 확인할 수 없습니다.");

    if (audienceMode === "tag_in" && audienceTagIds.size === 0) {
      return setError("태그 한정 공개를 선택한 경우 최소 1개 이상의 태그를 선택해주세요.");
    }

    setSubmitting(true);
    setError(null);

    try {
      if (row) {
        await updateNotice(row.id, {
          title: nextTitle,
          body: nextBody,
          status,
          audienceMode,
          audienceTagIds: audienceMode === "tag_in" ? [...audienceTagIds] : [],
        });
      } else {
        await createNotice({
          title: nextTitle,
          body: nextBody,
          status,
          audienceMode,
          audienceTagIds: audienceMode === "tag_in" ? [...audienceTagIds] : [],
          authorId,
        });
      }

      await onSaved();
    } catch (err) {
      setError(sanitizeUserError(err, "공지 저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "6vh 16px",
        background: "rgba(0,0,0,0.55)",
        overflowY: "auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #f1ede4" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 750 }}>{isEdit ? "공지 수정" : "새 공지 작성"}</h3>
          <button type="button" onClick={onClose} aria-label="닫기" style={iconButtonStyle("#fff", "var(--kb-ink-500)", "transparent")}>
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 15 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--kb-ink-700)" }}>
            제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              autoFocus
              style={fieldStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 650, color: "var(--kb-ink-700)" }}>
            본문
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.65 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            {(["published", "draft"] as NoticeStatus[]).map((nextStatus) => {
              const selected = status === nextStatus;
              return (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => setStatus(nextStatus)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: selected ? "2px solid #0a0a0a" : "1px solid #ebe8e0",
                    background: selected ? "#fafaf9" : "#fff",
                    color: "var(--kb-ink-900)",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    fontWeight: selected ? 750 : 600,
                  }}
                >
                  {statusText(nextStatus)}
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 650, color: "var(--kb-ink-700)" }}>공개 범위</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "public", label: "전체 공개" },
                { key: "tag_in", label: "태그 한정" },
              ].map((item) => {
                const selected = audienceMode === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAudienceMode(item.key as NoticeAudienceMode)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 9,
                      border: selected ? "2px solid #0a0a0a" : "1px solid #ebe8e0",
                      background: selected ? "#fafaf9" : "#fff",
                      color: "var(--kb-ink-900)",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      fontWeight: selected ? 750 : 600,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {audienceMode === "tag_in" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.length === 0 ? (
                  <div style={{ color: "var(--kb-ink-500)", fontSize: 13 }}>선택 가능한 태그가 없습니다.</div>
                ) : (
                  tags.map((tag) => {
                    const checked = audienceTagIds.has(tag.id);
                    return (
                      <label
                        key={tag.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 9px",
                          borderRadius: 999,
                          border: checked ? `1px solid ${tag.color}` : "1px solid #e8e8e4",
                          background: checked ? `${tag.color}15` : "#fff",
                          color: "var(--kb-ink-800)",
                          fontSize: 12,
                          fontWeight: 650,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = new Set(audienceTagIds);
                            if (event.target.checked) next.add(tag.id);
                            else next.delete(tag.id);
                            setAudienceTagIds(next);
                          }}
                          style={{ margin: 0 }}
                        />
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color }} />
                        {tag.label}
                      </label>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          {error ? <div style={{ padding: 11, borderRadius: 8, background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>{error}</div> : null}
        </div>

        <footer style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 22px", borderTop: "1px solid #f1ede4", background: "#fafaf9" }}>
          <button type="button" onClick={onClose} disabled={submitting} style={secondaryButtonStyle}>
            취소
          </button>
          <button type="submit" disabled={submitting} style={primaryButtonStyle(submitting)}>
            <Send style={{ width: 14, height: 14 }} />
            {submitting ? "저장 중..." : "저장"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #e8e8e4",
  borderRadius: 9,
  outline: "none",
  color: "var(--kb-ink-900)",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #ebe8e0",
  borderRadius: 8,
  background: "#fff",
  color: "var(--kb-ink-700)",
  fontFamily: "inherit",
  fontWeight: 650,
  cursor: "pointer",
};

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 18px",
    border: 0,
    borderRadius: 8,
    background: disabled ? "#777" : "#0a0a0a",
    color: "#fff",
    fontFamily: "inherit",
    fontWeight: 750,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
