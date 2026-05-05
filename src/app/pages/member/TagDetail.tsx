import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Tag as TagIcon,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  assignTagToUser,
  getTagBySlug,
  removeTagFromUser,
  setTagNav,
  setTagPermissions,
  updateTag,
} from "../../api/tags";
import type { TagDetail as TagDetailModel, TagMember } from "../../api/tags";
import { listMemberDirectory } from "../../api/member-directory";
import type { MemberDirectoryProfile } from "../../api/member-directory";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";
import { NAV_CATALOG, PERMISSION_CATALOG } from "../../config/nav-catalog";
import type { NavCatalogEntry } from "../../config/nav-catalog";

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

const fieldLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--kb-ink-700)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 6,
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

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: "var(--kb-ink-900)",
};

export default function TagDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, refreshTags } = useAuth();

  const [tag, setTag] = useState<TagDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [savingNav, setSavingNav] = useState(false);
  const [savedFlag, setSavedFlag] = useState<string | null>(null);

  // Editable copies
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [navHrefs, setNavHrefs] = useState<Set<string>>(new Set());

  // Members add UI
  const [allMembers, setAllMembers] = useState<MemberDirectoryProfile[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);

  async function load() {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const fetched = await getTagBySlug(slug);
      if (!fetched) {
        setError("태그를 찾을 수 없습니다.");
        return;
      }
      setTag(fetched);
      setLabel(fetched.label);
      setColor(fetched.color);
      setDescription(fetched.description ?? "");
      setPermissions(new Set(fetched.permissions));
      setNavHrefs(new Set(fetched.navHrefs));
    } catch (err) {
      setError(sanitizeUserError(err, "태그 정보를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    listMemberDirectory(user.id)
      .then((data) => {
        if (!cancelled) setAllMembers(data.members);
      })
      .catch(() => {
        if (!cancelled) setAllMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function flash(label: string) {
    setSavedFlag(label);
    window.setTimeout(() => {
      setSavedFlag((current) => (current === label ? null : current));
    }, 1600);
  }

  async function handleSaveMeta() {
    if (!tag) return;
    try {
      setSavingMeta(true);
      setError(null);
      await updateTag(tag.id, { label, color, description: description || null });
      flash("meta");
      await refreshTags();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "기본 정보를 저장하지 못했습니다."));
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleSavePerms() {
    if (!tag) return;
    try {
      setSavingPerms(true);
      setError(null);
      await setTagPermissions(tag.id, [...permissions]);
      flash("perms");
      await refreshTags();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "권한 설정을 저장하지 못했습니다."));
    } finally {
      setSavingPerms(false);
    }
  }

  async function handleSaveNav() {
    if (!tag) return;
    try {
      setSavingNav(true);
      setError(null);
      await setTagNav(tag.id, [...navHrefs]);
      flash("nav");
      await refreshTags();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "사이드바 설정을 저장하지 못했습니다."));
    } finally {
      setSavingNav(false);
    }
  }

  async function handleAssign(userId: string) {
    if (!tag) return;
    try {
      setAssigning(userId);
      await assignTagToUser(tag.id, userId);
      await refreshTags();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "태그 부여에 실패했습니다."));
    } finally {
      setAssigning(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!tag) return;
    if (tag.isSystem && tag.autoStatus) {
      const okay = window.confirm(
        "시스템 태그(KOBOT/KOSS)는 부원 상태가 바뀌면 자동으로 다시 부여됩니다. 그래도 회수할까요?",
      );
      if (!okay) return;
    }
    try {
      setAssigning(userId);
      await removeTagFromUser(tag.id, userId);
      await refreshTags();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "태그 회수에 실패했습니다."));
    } finally {
      setAssigning(null);
    }
  }

  const memberIds = useMemo(
    () => new Set(tag?.members.map((member) => member.userId) ?? []),
    [tag],
  );
  const candidateMembers = useMemo(() => {
    const query = memberQuery.trim().toLocaleLowerCase("ko-KR");
    return allMembers
      .filter((member) => !memberIds.has(member.id))
      .filter((member) => {
        if (!query) return true;
        const haystack = [
          member.displayName,
          member.fullName ?? "",
          member.email ?? "",
          member.loginId ?? "",
        ]
          .join("|")
          .toLocaleLowerCase("ko-KR");
        return haystack.includes(query);
      })
      .slice(0, 12);
  }, [allMembers, memberIds, memberQuery]);

  const navByGroup = useMemo(() => {
    const map = new Map<string, typeof NAV_CATALOG>();
    for (const item of NAV_CATALOG) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return map;
  }, []);

  const permsByGroup = useMemo(() => {
    const map = new Map<string, typeof PERMISSION_CATALOG>();
    for (const item of PERMISSION_CATALOG) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return map;
  }, []);

  if (loading) {
    return (
      <div style={PAGE_STYLE}>
        <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center", padding: 60 }}>
          <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div style={PAGE_STYLE}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
          <button
            onClick={() => navigate("/member/tags")}
            style={backLinkStyle}
            type="button"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> 태그 목록
          </button>
          <div
            style={{
              ...CARD_STYLE,
              marginTop: 18,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            }}
          >
            {error ?? "존재하지 않는 태그입니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link to="/member/tags" style={backLinkStyle}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> 태그 목록
        </Link>

        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "12px 0 20px",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: color,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
          >
            <TagIcon style={{ width: 22, height: 22, color: "#fff" }} />
          </span>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                color: "var(--kb-ink-400)",
                textTransform: "uppercase",
              }}
            >
              MEMBER TAG · {tag.slug}
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {label || tag.label}
              {tag.isSystem ? (
                <span
                  style={{
                    marginLeft: 10,
                    padding: "3px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#fef3c7",
                    color: "#92400e",
                    verticalAlign: "middle",
                  }}
                >
                  동아리 식별
                </span>
              ) : null}
            </h1>
          </div>
        </header>

        <SidebarPreview
          label={label || tag.label}
          color={color}
          navHrefs={navHrefs}
          permissions={permissions}
        />

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

        {/* META */}
        <section style={{ ...CARD_STYLE, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={sectionTitle}>기본 정보</h2>
            <SaveButton
              label="저장"
              loading={savingMeta}
              done={savedFlag === "meta"}
              onClick={handleSaveMeta}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>
              <div style={fieldLabel}>라벨</div>
              <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
            </label>
            <label>
              <div style={fieldLabel}>색상</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 40, height: 32, border: "none", padding: 0, cursor: "pointer" }}
                />
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                />
              </div>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <div style={fieldLabel}>설명</div>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 태그는 무엇인가요?"
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        {/* PERMISSIONS */}
        <section style={{ ...CARD_STYLE, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={sectionTitle}>권한</h2>
              <div style={{ fontSize: 12.5, color: "var(--kb-ink-400)", marginTop: 2 }}>
                이 태그를 가진 부원이 사용할 수 있는 기능
              </div>
            </div>
            <SaveButton
              label="저장"
              loading={savingPerms}
              done={savedFlag === "perms"}
              onClick={handleSavePerms}
            />
          </div>
          <CheckboxGrid
            groups={permsByGroup}
            valueOf={(item) => item.permission}
            checkedSet={permissions}
            onToggle={(value, next) => {
              setPermissions((prev) => {
                const copy = new Set(prev);
                if (next) copy.add(value);
                else copy.delete(value);
                return copy;
              });
            }}
          />
        </section>

        {/* NAV */}
        <section style={{ ...CARD_STYLE, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 style={sectionTitle}>사이드바 메뉴</h2>
              <div style={{ fontSize: 12.5, color: "var(--kb-ink-400)", marginTop: 2 }}>
                태그를 가진 부원의 사이드바에 노출할 메뉴
              </div>
            </div>
            <SaveButton
              label="저장"
              loading={savingNav}
              done={savedFlag === "nav"}
              onClick={handleSaveNav}
            />
          </div>
          <CheckboxGrid
            groups={navByGroup}
            valueOf={(item) => item.href}
            checkedSet={navHrefs}
            onToggle={(value, next) => {
              setNavHrefs((prev) => {
                const copy = new Set(prev);
                if (next) copy.add(value);
                else copy.delete(value);
                return copy;
              });
            }}
          />
        </section>

        {/* MEMBERS */}
        <section style={CARD_STYLE}>
          <h2 style={{ ...sectionTitle, marginBottom: 14 }}>
            태그를 가진 부원 ({tag.members.length})
          </h2>
          {tag.members.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--kb-ink-400)", padding: "8px 0" }}>
              아직 부여된 부원이 없습니다.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
              {tag.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  busy={assigning === member.userId}
                  onRemove={() => handleRemove(member.userId)}
                />
              ))}
            </ul>
          )}

          <div style={{ borderTop: "1px solid #f3f3f0", paddingTop: 14 }}>
            <div style={{ ...fieldLabel, marginBottom: 8 }}>부원 추가</div>
            <input
              type="search"
              placeholder="이름·로그인ID·이메일로 검색"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              style={inputStyle}
            />
            <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
              {candidateMembers.length === 0 ? (
                <li style={{ fontSize: 13, color: "var(--kb-ink-400)", padding: 8 }}>
                  검색 결과가 없습니다.
                </li>
              ) : (
                candidateMembers.map((member) => (
                  <li
                    key={member.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #ececeb",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--kb-ink-900)" }}>
                        {member.displayName}
                        {member.fullName && member.fullName !== member.displayName ? (
                          <span style={{ color: "var(--kb-ink-400)", fontWeight: 400, marginLeft: 6 }}>
                            ({member.fullName})
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--kb-ink-400)" }}>
                        {member.email ?? "—"} · {member.status ?? "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssign(member.id)}
                      disabled={assigning === member.id}
                      style={smallButtonStyle}
                    >
                      {assigning === member.id ? (
                        <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <UserPlus style={{ width: 13, height: 13 }} />
                      )}
                      부여
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--kb-ink-500)",
  textDecoration: "none",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

const smallButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12.5,
  padding: "6px 12px",
  borderRadius: 8,
  background: "#0a0a0a",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

function SaveButton({
  loading,
  done,
  onClick,
  label,
}: {
  loading: boolean;
  done: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: done ? "#16a34a" : "#0a0a0a",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "background 0.18s",
      }}
    >
      {loading ? (
        <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
      ) : done ? (
        <Check style={{ width: 13, height: 13 }} />
      ) : null}
      {done ? "저장됨" : label}
    </button>
  );
}

type GroupItem = {
  group: string;
  label: string;
  description?: string;
};

function CheckboxGrid<T extends GroupItem>({
  groups,
  valueOf,
  checkedSet,
  onToggle,
}: {
  groups: Map<string, T[]>;
  valueOf: (item: T) => string;
  checkedSet: Set<string>;
  onToggle: (value: string, next: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[...groups.entries()].map(([groupName, items]) => (
        <div key={groupName}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {groupName}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 6,
            }}
          >
            {items.map((item) => {
              const value = valueOf(item);
              const checked = checkedSet.has(value);
              return (
                <label
                  key={value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: checked ? "1px solid #0a0a0a" : "1px solid #e8e8e4",
                    background: checked ? "#fafaf9" : "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "border-color 0.12s, background 0.12s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onToggle(value, e.target.checked)}
                    style={{ accentColor: "#0a0a0a", cursor: "pointer" }}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", color: "var(--kb-ink-900)" }}>
                      {item.label}
                    </span>
                    <span
                      className="kb-mono"
                      style={{ fontSize: 10.5, color: "var(--kb-ink-400)" }}
                    >
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

function SidebarPreview({
  label,
  color,
  navHrefs,
  permissions,
}: {
  label: string;
  color: string;
  navHrefs: Set<string>;
  permissions: Set<string>;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, NavCatalogEntry[]>();
    for (const entry of NAV_CATALOG) {
      if (!navHrefs.has(entry.href)) continue;
      const arr = map.get(entry.group) ?? [];
      arr.push(entry);
      map.set(entry.group, arr);
    }
    return [...map.entries()];
  }, [navHrefs]);

  return (
    <section
      style={{
        ...CARD_STYLE,
        padding: 0,
        overflow: "hidden",
        marginBottom: 18,
        background: "#fff",
        border: "1px solid #e8e8e4",
      }}
    >
      <div
        style={{
          padding: "14px 18px 8px",
          borderBottom: "1px solid #f3f3f0",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--kb-ink-400)",
            textTransform: "uppercase",
          }}
        >
          LIVE PREVIEW
        </div>
        <h2 style={sectionTitle}>이 태그만 가진 가상 회원의 사이드바</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--kb-ink-500)" }}>
          오른쪽 사이드바 메뉴 체크박스를 토글하면 즉시 반영됩니다. 권한·메뉴는
          저장 버튼을 눌러야 실제 부원에게 적용됩니다.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 320px) 1fr",
          gap: 0,
          background: "#fafaf9",
        }}
      >
        {/* mock sidebar */}
        <div
          style={{
            background: "#0a0a0a",
            color: "#fff",
            padding: "16px 0",
            minHeight: 360,
          }}
        >
          <div style={{ padding: "0 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#fff",
                  color: "#0a0a0a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                가
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>가상 회원</div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 3,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: color,
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
                  }}
                >
                  <TagIcon style={{ width: 9, height: 9 }} />
                  {label || "(라벨 없음)"}
                </div>
              </div>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div
              style={{
                padding: 20,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              체크된 메뉴가 없습니다.
              <br />
              우측 "사이드바 메뉴"에서 보여줄 항목을 선택하세요.
            </div>
          ) : (
            grouped.map(([groupName, items]) => (
              <div key={groupName} style={{ padding: "12px 0 4px" }}>
                <div
                  style={{
                    padding: "0 18px 6px",
                    fontSize: 10.5,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 700,
                  }}
                >
                  {groupName}
                </div>
                {items.map((item) => (
                  <div
                    key={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 18px",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      style={{
                        width: 12,
                        height: 12,
                        color: "rgba(255,255,255,0.25)",
                      }}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* notes */}
        <div style={{ padding: 18, fontSize: 13, color: "var(--kb-ink-700)" }}>
          <div style={{ ...fieldLabel, color: "var(--kb-ink-400)", marginBottom: 8 }}>
            요약
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              부여된 권한 <strong>{permissions.size}개</strong>
            </li>
            <li>
              표시될 사이드바 메뉴 <strong>{navHrefs.size}개</strong>
            </li>
            <li>
              실제 부원의 사이드바는 <strong>그 부원이 가진 모든 태그의 합집합</strong>
              입니다. 예) 부원이 KOBOT + "신입" 태그를 가지면 두 태그 메뉴를 모두
              볼 수 있습니다.
            </li>
            <li style={{ color: "var(--kb-ink-400)", fontSize: 12 }}>
              위 미리보기는 부원 섹션만 시뮬레이션합니다. 공식팀장/부회장/회장
              섹션은 권한 게이트가 별도라 부여 권한에 따라 추가로 노출됩니다.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function MemberRow({
  member,
  busy,
  onRemove,
}: {
  member: TagMember;
  busy: boolean;
  onRemove: () => void;
}) {
  return (
    <li
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ececeb",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "var(--kb-ink-900)" }}>
          {member.displayName}
        </div>
        <div style={{ fontSize: 12, color: "var(--kb-ink-400)" }}>
          {member.email ?? "—"} · {member.status ?? "—"}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        style={{
          ...smallButtonStyle,
          background: "transparent",
          border: "1px solid #e8e8e4",
          color: "#dc2626",
        }}
      >
        {busy ? (
          <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
        ) : (
          <UserMinus style={{ width: 13, height: 13 }} />
        )}
        회수
      </button>
    </li>
  );
}
