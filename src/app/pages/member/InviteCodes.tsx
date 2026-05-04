import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Check,
  Copy,
  Plus,
  ShieldOff,
  Ticket,
  Wand2,
  X,
} from "lucide-react";
import {
  createInviteCode,
  generateInviteCode,
  listInviteCodes,
  setInviteCodeActive,
  type InviteCodeRow,
} from "../../api/invite-codes";
import { sanitizeUserError } from "../../utils/sanitize-error";

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}

export default function InviteCodes() {
  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setCodes(await listInviteCodes());
    } catch (err) {
      setLoadError(sanitizeUserError(err, "초대 코드를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleToggle(row: InviteCodeRow) {
    try {
      await setInviteCodeActive(row.id, !row.is_active);
      await load();
    } catch (err) {
      setLoadError(sanitizeUserError(err, "상태 변경에 실패했습니다."));
    }
  }

  function buildInviteUrl(code: string) {
    // production domain (운영 도메인 고정 — 부원에게 공유될 링크)
    return `https://kobot.kookmin.ac.kr/invite/course?code=${encodeURIComponent(code)}`;
  }

  async function handleCopy(row: InviteCodeRow) {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(row.code));
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setLoadError("클립보드 복사에 실패했습니다.");
    }
  }

  const stats = useMemo(() => {
    const total = codes.length;
    const active = codes.filter((c) => c.is_active).length;
    const totalUses = codes.reduce((s, c) => s + c.uses, 0);
    return { total, active, totalUses };
  }, [codes]);

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "calc(100vh - 4rem)",
        margin: -32,
        padding: 32,
        background: "#ffffff",
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
              Admin · Invite Codes
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
              초대 코드
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · 활성 {stats.active} / 전체 {stats.total} · 사용 {stats.totalUses}
              </span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            <Plus style={{ width: 15, height: 15 }} />
            새 코드 발급
          </button>
        </div>

        {loadError && (
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
            {loadError}
          </div>
        )}

        {/* list — table form */}
        <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13.5,
              minWidth: 920,
            }}
          >
            <thead>
              <tr style={{ background: "#fafaf9" }}>
                {[
                  ["CODE", 120],
                  ["동아리", 90],
                  ["라벨", 0],
                  ["사용", 100],
                  ["만료", 110],
                  ["상태", 80],
                  ["", 220],
                ].map(([label, w], i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "var(--kb-ink-500)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: i === 6 ? "right" : "left",
                      borderBottom: "1px solid #f1ede4",
                      width: w || undefined,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && codes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "56px 28px",
                      textAlign: "center",
                      color: "var(--kb-ink-500)",
                    }}
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "56px 28px",
                      textAlign: "center",
                      color: "var(--kb-ink-500)",
                    }}
                  >
                    <Ticket
                      style={{
                        width: 28,
                        height: 28,
                        margin: "0 auto 10px",
                        color: "var(--kb-ink-300)",
                      }}
                    />
                    <div>발급된 초대 코드가 없습니다.</div>
                  </td>
                </tr>
              ) : (
                codes.map((row) => {
                  const exhausted =
                    row.max_uses != null && row.uses >= row.max_uses;
                  const expired =
                    row.expires_at != null &&
                    new Date(row.expires_at).getTime() < Date.now();
                  const usable = row.is_active && !exhausted && !expired;
                  const usageLabel =
                    row.max_uses == null
                      ? `${row.uses}`
                      : `${row.uses} / ${row.max_uses}`;
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f1ede4" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className="kb-mono"
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--kb-ink-900)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {row.code}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {row.club_affiliation ? (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 4,
                              background: "#e3ecfb",
                              color: "#163b86",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.club_affiliation}
                          </span>
                        ) : (
                          <span style={{ color: "var(--kb-ink-400)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--kb-ink-700)",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.label || "—"}
                      </td>
                      <td
                        className="kb-mono"
                        style={{
                          padding: "14px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: exhausted ? "#dc2626" : "var(--kb-ink-700)",
                        }}
                      >
                        {usageLabel}
                      </td>
                      <td
                        className="kb-mono"
                        style={{
                          padding: "14px 16px",
                          fontSize: 12.5,
                          color: expired ? "#dc2626" : "var(--kb-ink-500)",
                        }}
                      >
                        {formatDate(row.expires_at)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 4,
                            background: usable ? "#dff4e2" : "#f3f3f1",
                            color: usable ? "#15602e" : "#6a6a6a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {usable ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleCopy(row)}
                            title="초대 링크 복사"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 12px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              border: "1px solid #ebe8e0",
                              background: copiedId === row.id ? "#dff4e2" : "#fff",
                              color:
                                copiedId === row.id
                                  ? "#15602e"
                                  : "var(--kb-ink-700)",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {copiedId === row.id ? (
                              <>
                                <Check style={{ width: 12, height: 12 }} /> 복사됨
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 12, height: 12 }} /> 링크
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(row)}
                            title={row.is_active ? "비활성화" : "활성화"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 12px",
                              fontSize: 12.5,
                              fontWeight: 600,
                              border: "1px solid #ebe8e0",
                              background: "#fff",
                              color: row.is_active ? "#dc2626" : "var(--kb-ink-700)",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <ShieldOff style={{ width: 12, height: 12 }} />
                            {row.is_active ? "차단" : "복구"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <CreateModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState(() => generateInviteCode());
  const [label, setLabel] = useState("");
  const [clubAffiliation, setClubAffiliation] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC + scroll lock
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
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createInviteCode({
        code: code.trim().toUpperCase(),
        label: label.trim() || null,
        clubAffiliation: clubAffiliation.trim() || null,
        maxUses: maxUses ? Math.max(1, parseInt(maxUses, 10)) : null,
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T23:59:59`).toISOString()
          : null,
      });
      onCreated();
    } catch (err) {
      setError(sanitizeUserError(err, "코드 발급에 실패했습니다."));
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
          maxWidth: 480,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
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
          <h3
            className="kb-display"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--kb-ink-900)",
            }}
          >
            새 KOSS 초대 코드 발급
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
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              코드
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ ...inputStyle, fontFamily: "var(--kb-font-mono)", fontWeight: 700 }}
                required
              />
              <button
                type="button"
                onClick={() => setCode(generateInviteCode())}
                title="랜덤 생성"
                style={{
                  padding: "0 14px",
                  border: "1px solid #ebe8e0",
                  background: "#fff",
                  borderRadius: 10,
                  cursor: "pointer",
                  color: "var(--kb-ink-700)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <Wand2 style={{ width: 14, height: 14 }} />
                랜덤
              </button>
            </div>
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
              라벨 <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(선택)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 2026 봄 SLAM 코스"
              style={inputStyle}
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
              동아리 / 소속 이름{" "}
              <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(선택)</span>
            </label>
            <input
              type="text"
              value={clubAffiliation}
              onChange={(e) => setClubAffiliation(e.target.value)}
              placeholder="예: KOSS, AI Society, 외부 워크숍"
              style={inputStyle}
              maxLength={40}
            />
            <p
              style={{
                fontSize: 11.5,
                color: "var(--kb-ink-400)",
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              지정하면 이 코드로 가입한 사람의 프로필 소속이 자동으로 이 이름으로 설정됩니다.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                최대 사용 횟수
                <br />
                <span style={{ color: "var(--kb-ink-400)", fontWeight: 400, fontSize: 11.5 }}>
                  비우면 무제한
                </span>
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min={1}
                placeholder="예: 30"
                style={inputStyle}
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
                만료일
                <br />
                <span style={{ color: "var(--kb-ink-400)", fontWeight: 400, fontSize: 11.5 }}>
                  비우면 무기한
                </span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                fontSize: 13,
                color: "#dc2626",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
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
            justifyContent: "flex-end",
            gap: 8,
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
            {submitting ? "발급 중..." : "발급"}
          </button>
        </div>
      </form>
    </div>
  );
}
