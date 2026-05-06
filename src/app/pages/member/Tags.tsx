import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { Check, Edit3, Loader2, Plus, ShieldAlert, Tag as TagIcon, Trash2, X } from "lucide-react";
import {
  createTag,
  deleteTag,
  getTagBySlug,
  listTagsWithCounts,
  setTagNav,
  setTagPermissions,
  updateTag,
} from "../../api/tags";
import type { MemberTagWithCounts, TagDetail } from "../../api/tags";
import { NAV_CATALOG, PERMISSION_CATALOG } from "../../config/nav-catalog";
import {
  getSensitivePermissions,
  isSensitivePermission,
  SENSITIVE_PERMISSION_MESSAGE,
} from "../../config/tag-policy";
import { TagChip } from "../../components/TagChip";
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

export default function Tags() {
  const [tags, setTags] = useState<MemberTagWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; tag: MemberTagWithCounts } | null
  >(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setTags(await listTagsWithCounts());
    } catch (err) {
      setError(sanitizeUserError(err, "태그 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(tag: MemberTagWithCounts) {
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
              태그는 동아리·역할·그룹·권한·사이드바를 묶는 기준입니다. 태그 모양은 공통
              TagChip으로, 권한과 메뉴는 같은 팝업 안에서 같이 수정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            style={primaryButtonStyle}
          >
            <Plus style={{ width: 16, height: 16 }} />
            새 태그
          </button>
        </div>

        {error ? (
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
        ) : null}

        <section style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 1.15fr) minmax(150px, 0.75fr) 70px 70px 70px 96px",
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
            <div>멤버 표시</div>
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
                  gridTemplateColumns: "minmax(220px, 1.15fr) minmax(150px, 0.75fr) 70px 70px 70px 96px",
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
                    <span style={{ display: "block", fontWeight: 700, color: "var(--kb-ink-900)" }}>
                      {tag.label}
                    </span>
                    <span
                      className="kb-mono"
                      style={{ display: "block", fontSize: 11.5, color: "var(--kb-ink-400)" }}
                    >
                      {tag.slug}
                      {tag.isClub ? " · 동아리" : ""}
                    </span>
                    {tag.description ? (
                      <span style={{ display: "block", fontSize: 12, color: "var(--kb-ink-500)", marginTop: 2 }}>
                        {tag.description}
                      </span>
                    ) : null}
                  </span>
                </Link>

                <div style={{ display: "flex", alignItems: "center", minHeight: 44, overflow: "visible" }}>
                  <TagChip tag={tag} size="md" />
                </div>
                <CountChip count={tag.permissionCount} unit="개" />
                <CountChip count={tag.navCount} unit="개" />
                <CountChip count={tag.memberCount} unit="명" />
                <div style={{ display: "inline-flex", justifyContent: "flex-end", gap: 6 }}>
                  <IconButton label="수정" color="var(--kb-ink-700)" onClick={() => setModal({ mode: "edit", tag })}>
                    <Edit3 style={{ width: 14, height: 14 }} />
                  </IconButton>
                  <IconButton label="삭제" color="#dc2626" onClick={() => handleDelete(tag)}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {modal ? (
        <TagEditModal
          mode={modal.mode}
          tag={modal.mode === "edit" ? modal.tag : null}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await load();
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function TagEditModal({
  mode,
  tag,
  onClose,
  onSaved,
  onError,
}: {
  mode: "create" | "edit";
  tag: MemberTagWithCounts | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<"basic" | "permissions" | "nav">("basic");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [slug, setSlug] = useState(tag?.slug ?? "");
  const [label, setLabel] = useState(tag?.label ?? "");
  const [color, setColor] = useState(tag?.color ?? "#0ea5e9");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [isClub, setIsClub] = useState(tag?.isClub ?? false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [navHrefs, setNavHrefs] = useState<Set<string>>(new Set());

  const permsByGroup = useMemo(() => groupBy(PERMISSION_CATALOG), []);
  const navByGroup = useMemo(() => groupBy(NAV_CATALOG), []);
  const sensitivePermissions = useMemo(() => getSensitivePermissions(permissions), [permissions]);

  function handleIsClubChange(next: boolean) {
    setIsClub(next);
    if (!next) return;
    const safePermissions = [...permissions].filter((permission) => !isSensitivePermission(permission));
    if (safePermissions.length !== permissions.size) {
      setPermissions(new Set(safePermissions));
      setLocalError(SENSITIVE_PERMISSION_MESSAGE);
    }
  }

  useEffect(() => {
    if (mode !== "edit" || !tag) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const detail = await getTagBySlug(tag.slug);
        if (!detail || cancelled) return;
        hydrateFromDetail(detail);
      } catch (err) {
        if (!cancelled) setLocalError(sanitizeUserError(err, "태그 상세 정보를 불러오지 못했습니다."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tag?.slug]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function hydrateFromDetail(detail: TagDetail) {
    setSlug(detail.slug);
    setLabel(detail.label);
    setColor(detail.color);
    setDescription(detail.description ?? "");
    setIsClub(detail.isClub);
    setPermissions(new Set(detail.permissions));
    setNavHrefs(new Set(detail.navHrefs));
  }

  function validateBasic() {
    if (!label.trim()) {
      setLocalError("라벨을 입력해 주세요.");
      return false;
    }
    if (mode === "create" && !SLUG_PATTERN.test(slug.trim())) {
      setLocalError("slug는 영어 소문자/숫자/하이픈(-)/언더스코어(_)로 2~31자입니다.");
      return false;
    }
    setLocalError(null);
    return true;
  }

  function goNext() {
    if (activeTab === "basic" && !validateBasic()) return;
    if (activeTab === "basic") setActiveTab("permissions");
    else if (activeTab === "permissions") setActiveTab("nav");
  }

  async function save() {
    if (!validateBasic()) return;
    if (isClub && sensitivePermissions.length > 0) {
      setLocalError(SENSITIVE_PERMISSION_MESSAGE);
      setActiveTab("permissions");
      return;
    }
    try {
      setSaving(true);
      setLocalError(null);
      onError(null);

      if (mode === "create") {
        const created = await createTag({
          slug: slug.trim(),
          label: label.trim(),
          color,
          description: description.trim() || null,
          isClub,
        });
        await Promise.all([
          setTagPermissions(created.id, [...permissions]),
          setTagNav(created.id, [...navHrefs]),
        ]);
      } else if (tag) {
        if (isClub) {
          await setTagPermissions(tag.id, [...permissions]);
        }
        await updateTag(tag.id, {
          label: label.trim(),
          color,
          description: description.trim() || null,
          isClub,
        });
        await Promise.all([
          isClub ? Promise.resolve() : setTagPermissions(tag.id, [...permissions]),
          setTagNav(tag.id, [...navHrefs]),
        ]);
      }

      await onSaved();
    } catch (err) {
      setLocalError(sanitizeUserError(err, mode === "create" ? "태그를 생성하지 못했습니다." : "태그를 수정하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "create" ? "새 태그" : "태그 수정";
  const preview = { slug: slug || "preview", label: label || "라벨", color, isClub };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(0,0,0,0.52)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px",
        overflowY: "auto",
      }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 780,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 22px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 22px",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--kb-ink-900)" }}>
              {title}
            </h2>
            <div style={{ marginTop: 10, minHeight: 36, display: "flex", alignItems: "center", overflow: "visible" }}>
              <TagChip tag={preview} size="md" />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={ghostIconButtonStyle}>
            <X style={{ width: 17, height: 17 }} />
          </button>
        </header>

        <div
          role="tablist"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            background: "#fafaf9",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          {([
            ["basic", "기본 정보"],
            ["permissions", `권한 ${permissions.size}`],
            ["nav", `사이드바 ${navHrefs.size}`],
          ] as const).map(([key, text]) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key !== "basic" && !validateBasic()) return;
                  setActiveTab(key);
                }}
                style={{
                  padding: "12px 10px",
                  background: active ? "#fff" : "transparent",
                  border: "none",
                  borderBottom: active ? "3px solid #0a0a0a" : "3px solid transparent",
                  color: active ? "var(--kb-ink-900)" : "var(--kb-ink-500)",
                  fontWeight: active ? 800 : 650,
                  cursor: "pointer",
                }}
              >
                {text}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 22, minHeight: 320 }}>
          {localError ? (
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid #fecaca",
                borderRadius: 8,
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: 13,
                fontWeight: 650,
                marginBottom: 14,
              }}
            >
              {localError}
            </div>
          ) : null}

          {loading ? (
            <div style={{ padding: 70, textAlign: "center", color: "var(--kb-ink-400)" }}>
              <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
            </div>
          ) : activeTab === "basic" ? (
            <BasicFields
              mode={mode}
              slug={slug}
              label={label}
              color={color}
              description={description}
              isClub={isClub}
              onSlug={setSlug}
              onLabel={setLabel}
              onColor={setColor}
              onDescription={setDescription}
              onIsClub={handleIsClubChange}
            />
          ) : activeTab === "permissions" ? (
            <>
              {isClub ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    fontSize: 12.5,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  동아리 태그에는 운영/관리 권한을 붙일 수 없습니다. 읽기 권한과 사이드바
                  노출은 설정할 수 있습니다.
                </div>
              ) : null}
              <CheckboxGroups
                groups={permsByGroup}
                valueOf={(item) => item.permission}
                checkedSet={permissions}
                onToggle={(value, next) => setPermissions(toggleSet(permissions, value, next))}
                isDisabled={(item) => isClub && isSensitivePermission(item.permission)}
                disabledReason="동아리 태그에는 위험 권한을 붙일 수 없습니다."
              />
            </>
          ) : (
            <CheckboxGroups
              groups={navByGroup}
              valueOf={(item) => item.href}
              checkedSet={navHrefs}
              onToggle={(value, next) => setNavHrefs(toggleSet(navHrefs, value, next))}
            />
          )}
        </div>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            borderTop: "1px solid #f1ede4",
            background: "#fafaf9",
          }}
        >
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            취소
          </button>
          <div style={{ display: "inline-flex", gap: 8 }}>
            {activeTab !== "basic" ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "nav" ? "permissions" : "basic")}
                style={secondaryButtonStyle}
              >
                이전
              </button>
            ) : null}
            {mode === "create" && activeTab !== "nav" ? (
              <button type="button" onClick={goNext} style={primaryButtonStyle}>
                다음
              </button>
            ) : (
              <button type="button" disabled={saving || loading} onClick={() => void save()} style={primaryButtonStyle}>
                {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : null}
                {mode === "create" ? "만들기" : "저장"}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

function BasicFields({
  mode,
  slug,
  label,
  color,
  description,
  isClub,
  onSlug,
  onLabel,
  onColor,
  onDescription,
  onIsClub,
}: {
  mode: "create" | "edit";
  slug: string;
  label: string;
  color: string;
  description: string;
  isClub: boolean;
  onSlug: (value: string) => void;
  onLabel: (value: string) => void;
  onColor: (value: string) => void;
  onDescription: (value: string) => void;
  onIsClub: (value: boolean) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <label style={fieldStyle}>
        <span style={fieldLabel}>slug</span>
        <input
          value={slug}
          disabled={mode === "edit"}
          onChange={(event) => onSlug(event.target.value.toLowerCase())}
          placeholder="kobot"
          style={{ ...inputStyle, background: mode === "edit" ? "#f7f7f5" : "#fff" }}
        />
      </label>
      <label style={fieldStyle}>
        <span style={fieldLabel}>라벨</span>
        <input value={label} onChange={(event) => onLabel(event.target.value)} placeholder="KOBOT" style={inputStyle} />
      </label>
      <label style={fieldStyle}>
        <span style={fieldLabel}>색상</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={color}
            onChange={(event) => onColor(event.target.value)}
            style={{ width: 42, height: 36, border: 0, padding: 0, cursor: "pointer" }}
          />
          <input value={color} onChange={(event) => onColor(event.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
        </div>
      </label>
      <label style={fieldStyle}>
        <span style={fieldLabel}>설명</span>
        <input
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          placeholder="태그 설명"
          style={inputStyle}
        />
      </label>
      <label
        style={{
          gridColumn: "1 / -1",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "var(--kb-ink-700)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isClub}
          onChange={(event) => onIsClub(event.target.checked)}
          style={{ width: 15, height: 15, accentColor: "#0a0a0a" }}
        />
        동아리 태그
      </label>
    </div>
  );
}

type CatalogItem = {
  group: string;
  label: string;
  description?: string;
};

function CheckboxGroups<T extends CatalogItem>({
  groups,
  valueOf,
  checkedSet,
  onToggle,
  isDisabled,
  disabledReason,
}: {
  groups: Map<string, T[]>;
  valueOf: (item: T) => string;
  checkedSet: Set<string>;
  onToggle: (value: string, next: boolean) => void;
  isDisabled?: (item: T) => boolean;
  disabledReason?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[...groups.entries()].map(([groupName, items]) => (
        <div key={groupName}>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>{groupName}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 7 }}>
            {items.map((item) => {
              const value = valueOf(item);
              const checked = checkedSet.has(value);
              const disabled = isDisabled?.(item) ?? false;
              return (
                <label
                  key={value}
                  title={disabled ? disabledReason : value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: checked ? "1px solid #0a0a0a" : "1px solid #e8e8e4",
                    background: disabled ? "#f3f0ea" : checked ? "#fafaf9" : "#fff",
                    fontSize: 13,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.58 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onToggle(value, event.target.checked)}
                    style={{ accentColor: "#0a0a0a" }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", color: "var(--kb-ink-900)", fontWeight: 650 }}>
                      {item.label}
                    </span>
                    <span className="kb-mono" style={{ fontSize: 10.5, color: "var(--kb-ink-400)" }}>
                      {value}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
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

function IconButton({
  label,
  color,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  color: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        border: "1px solid #e8e8e4",
        borderRadius: 8,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        padding: 0,
      }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function groupBy<T extends { group: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const arr = map.get(item.group) ?? [];
    arr.push(item);
    map.set(item.group, arr);
  }
  return map;
}

function toggleSet(current: Set<string>, value: string, next: boolean) {
  const copy = new Set(current);
  if (next) copy.add(value);
  else copy.delete(value);
  return copy;
}

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "10px 16px",
  borderRadius: 10,
  background: "#0a0a0a",
  color: "#fff",
  border: "none",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 15px",
  borderRadius: 9,
  background: "#fff",
  color: "var(--kb-ink-700)",
  border: "1px solid #e8e8e4",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const ghostIconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "var(--kb-ink-500)",
  cursor: "pointer",
};

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
