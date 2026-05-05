import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Loader2, ShieldAlert, Trash2, Tag as TagIcon } from "lucide-react";
import { createTag, deleteTag, listTagsWithCounts } from "../../api/tags";
import type { MemberTagWithCounts } from "../../api/tags";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#fafaf9",
};

const CARD_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,30}$/;

const AUTO_LABEL: Record<string, string> = {
  active: "정규 부원에게 자동 부여",
  course_member: "KOSS 수강생에게 자동 부여",
};

export default function Tags() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<MemberTagWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [draftSlug, setDraftSlug] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftColor, setDraftColor] = useState("#0ea5e9");
  const [draftDescription, setDraftDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const rows = await listTagsWithCounts();
      setTags(rows);
    } catch (err) {
      setError(sanitizeUserError(err, "태그 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!SLUG_PATTERN.test(draftSlug.trim())) {
      setError("slug는 영어 소문자/숫자/하이픈(-)/언더스코어(_)로 2~31자.");
      return;
    }
    if (!draftLabel.trim()) {
      setError("라벨을 입력해 주세요.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const newTag = await createTag({
        slug: draftSlug.trim(),
        label: draftLabel.trim(),
        color: draftColor,
        description: draftDescription || null,
      });
      setCreating(false);
      setDraftSlug("");
      setDraftLabel("");
      setDraftColor("#0ea5e9");
      setDraftDescription("");
      // 만든 직후 detail 페이지로 자동 이동 → 사이드바 메뉴/권한 즉시 선택
      navigate(`/member/tags/${newTag.slug}`);
    } catch (err) {
      setError(sanitizeUserError(err, "태그를 생성하지 못했습니다."));
      setSubmitting(false);
    }
  }

  async function handleDelete(tag: MemberTagWithCounts) {
    if (tag.isSystem) return;
    const confirmed = window.confirm(
      `'${tag.label}' 태그를 삭제하면 부여된 모든 부원에게서 즉시 회수됩니다. 정말 삭제할까요?`,
    );
    if (!confirmed) return;
    try {
      await deleteTag(tag.id);
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "태그를 삭제하지 못했습니다."));
    }
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 22,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "var(--kb-ink-400)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              MEMBER TAGS · 회장 전용
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                margin: 0,
                color: "var(--kb-ink-900)",
                letterSpacing: "-0.02em",
              }}
            >
              태그 관리
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                color: "var(--kb-ink-500)",
                lineHeight: 1.6,
                maxWidth: 640,
              }}
            >
              태그는 권한과 사이드바 메뉴를 묶어 부원에게 부여합니다.
              KOBOT/KOSS는 동아리 식별용 시스템 태그라 삭제는 잠겨 있지만,
              어떤 메뉴와 권한을 줄지는 자유롭게 편집할 수 있습니다.
              새 태그를 만들면 다음 화면에서 사이드바 메뉴와 권한을 즉시
              선택할 수 있고, 좌측에 가상 사이드바 미리보기가 함께 보입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 10,
              background: creating ? "#f4f4f2" : "#0a0a0a",
              color: creating ? "var(--kb-ink-700)" : "#fff",
              border: creating ? "1px solid #e8e8e4" : "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            {creating ? "취소" : "새 태그"}
          </button>
        </div>

        {error && (
          <div
            style={{
              ...CARD_STYLE,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 16,
              fontSize: 14,
              marginBottom: 16,
              display: "flex",
              gap: 10,
            }}
          >
            <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {creating && (
          <form onSubmit={handleCreate} style={{ ...CARD_STYLE, marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={fieldStyle}>
                <div style={fieldLabel}>slug (영어, 식별자)</div>
                <input
                  value={draftSlug}
                  onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
                  placeholder="newbie"
                  style={inputStyle}
                  required
                />
              </label>
              <label style={fieldStyle}>
                <div style={fieldLabel}>라벨 (화면 표시명)</div>
                <input
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="신입 부원"
                  style={inputStyle}
                  required
                />
              </label>
              <label style={fieldStyle}>
                <div style={fieldLabel}>색상</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(e) => setDraftColor(e.target.value)}
                    style={{ width: 40, height: 32, border: "none", padding: 0, cursor: "pointer" }}
                  />
                  <input
                    value={draftColor}
                    onChange={(e) => setDraftColor(e.target.value)}
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                  />
                </div>
              </label>
              <label style={fieldStyle}>
                <div style={fieldLabel}>설명 (선택)</div>
                <input
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="이번 학기 신입 부원 그룹"
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#0a0a0a",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {submitting ? (
                  <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                ) : null}
                만들고 사이드바 설정으로
              </button>
            </div>
          </form>
        )}

        <section style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 90px 90px 80px",
              padding: "12px 18px",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--kb-ink-400)",
              borderBottom: "1px solid #ececeb",
              fontWeight: 700,
              gap: 12,
            }}
          >
            <div>태그</div>
            <div>권한</div>
            <div>메뉴</div>
            <div>부원</div>
            <div></div>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--kb-ink-400)" }}>
              <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
            </div>
          ) : tags.length === 0 ? (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                color: "var(--kb-ink-400)",
                fontSize: 13,
              }}
            >
              <TagIcon style={{ width: 24, height: 24, marginBottom: 8, color: "#cbd5e1" }} />
              <br />
              아직 태그가 없습니다. 우상단에서 새로 만들어 주세요.
            </div>
          ) : (
            tags.map((tag, index) => (
              <div
                key={tag.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 90px 90px 80px",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderTop: index === 0 ? "none" : "1px solid #f3f3f0",
                  fontSize: 14,
                  gap: 12,
                }}
              >
                <Link
                  to={`/member/tags/${tag.slug}`}
                  style={{
                    minWidth: 0,
                    color: "inherit",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: tag.color,
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 700,
                        color: "var(--kb-ink-900)",
                      }}
                    >
                      {tag.label}
                      {tag.isSystem ? (
                        <span
                          style={{
                            marginLeft: 6,
                            padding: "1px 6px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            background: "#fef3c7",
                            color: "#92400e",
                            verticalAlign: "middle",
                          }}
                        >
                          동아리 식별
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="kb-mono"
                      style={{
                        display: "block",
                        fontSize: 11.5,
                        color: "var(--kb-ink-400)",
                      }}
                    >
                      {tag.slug}
                      {tag.autoStatus
                        ? ` · ${AUTO_LABEL[tag.autoStatus] ?? tag.autoStatus}`
                        : ""}
                    </span>
                    {tag.description ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "var(--kb-ink-500)",
                          marginTop: 2,
                        }}
                      >
                        {tag.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <CountChip count={tag.permissionCount} unit="개" />
                <CountChip count={tag.navCount} unit="개" />
                <CountChip count={tag.memberCount} unit="명" />
                <div style={{ textAlign: "right" }}>
                  {tag.isSystem ? (
                    <span style={{ fontSize: 11, color: "var(--kb-ink-400)" }}>잠김</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(tag)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      aria-label="삭제"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function CountChip({ count, unit }: { count: number; unit: string }) {
  const empty = count === 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 2,
        fontSize: 13.5,
        color: empty ? "var(--kb-ink-400)" : "var(--kb-ink-900)",
        fontWeight: empty ? 400 : 700,
      }}
    >
      {count}
      <span style={{ fontSize: 11, color: "var(--kb-ink-400)", fontWeight: 400 }}>{unit}</span>
    </span>
  );
}

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--kb-ink-700)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e8e8e4",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};
