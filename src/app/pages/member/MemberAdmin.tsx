import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Check,
  Crown,
  Edit3,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  Tag as TagIcon,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import {
  adminDeleteMember,
  adminSetMemberStatus,
  adminUpdateMemberProfile,
  listAdminMembers,
  type AdminMemberRow,
  type AdminMemberStatus,
} from "../../api/member-admin";
import {
  assignTagToUser,
  listTags,
  removeTagFromUser,
  type MemberTag,
} from "../../api/tags";
import { useAuth } from "../../auth/useAuth";
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

const STATUS_FILTERS: Array<{ key: "all" | AdminMemberStatus; label: string }> = [
  { key: "all", label: "전체" },
  { key: "pending", label: "승인 대기" },
  { key: "active", label: "정규 부원" },
  { key: "course_member", label: "KOSS" },
  { key: "rejected", label: "보류" },
  { key: "withdrawn", label: "탈퇴" },
];

const STATUS_LABEL: Record<AdminMemberStatus, string> = {
  pending: "승인 대기",
  active: "정규 부원",
  course_member: "KOSS",
  project_only: "프로젝트만",
  rejected: "보류",
  withdrawn: "탈퇴",
};

const STATUS_COLOR: Record<AdminMemberStatus, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  active: { bg: "#dcfce7", fg: "#15803d" },
  course_member: { bg: "#ede9fe", fg: "#5b21b6" },
  project_only: { bg: "#dbeafe", fg: "#1e3a8a" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
  withdrawn: { bg: "#f3f4f6", fg: "#374151" },
};

export default function MemberAdmin() {
  const { user: viewer } = useAuth();
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [tagsCatalog, setTagsCatalog] = useState<MemberTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AdminMemberStatus>("all");
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState<AdminMemberRow | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [memberList, tagList] = await Promise.all([listAdminMembers(), listTags()]);
      setMembers(memberList);
      setTagsCatalog(tagList);
    } catch (err) {
      setError(sanitizeUserError(err, "부원 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ko-KR");
    return members.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        member.displayName,
        member.fullName ?? "",
        member.email ?? "",
        member.loginId ?? "",
        member.studentId ?? "",
        member.college ?? "",
        member.department ?? "",
        member.tags.map((t) => t.label).join(" "),
      ]
        .join("|")
        .toLocaleLowerCase("ko-KR");
      return haystack.includes(q);
    });
  }, [members, statusFilter, query]);

  async function withBusy<T>(userId: string, fn: () => Promise<T>) {
    setBusyUserId(userId);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(sanitizeUserError(err, "처리에 실패했습니다."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleApprove(member: AdminMemberRow) {
    await withBusy(member.id, () => adminSetMemberStatus(member.id, "active"));
  }

  async function handleSetStatus(member: AdminMemberRow, next: AdminMemberStatus) {
    await withBusy(member.id, () => adminSetMemberStatus(member.id, next));
  }

  async function handleDelete(member: AdminMemberRow) {
    if (member.id === viewer?.id) {
      setError("본인 계정은 이 화면에서 삭제할 수 없습니다.");
      return;
    }
    const confirmed = window.confirm(
      `'${member.displayName}' 계정을 영구 삭제할까요?\n프로필·태그·신청·승인 기록 모두 함께 삭제됩니다.`,
    );
    if (!confirmed) return;
    await withBusy(member.id, () => adminDeleteMember(member.id));
  }

  async function handleAssignTag(member: AdminMemberRow, tagId: string) {
    await withBusy(member.id, () => assignTagToUser(tagId, member.id));
  }

  async function handleRemoveTag(member: AdminMemberRow, tagId: string) {
    await withBusy(member.id, () => removeTagFromUser(tagId, member.id));
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            ADMIN · MEMBERS
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
            멤버 관리
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--kb-ink-500)", lineHeight: 1.6 }}>
            가입 승인 / 보류 · 강제 정보 수정 · 태그 부여 · 탈퇴/삭제 처리.
            모든 액션은 회장(권한 관리) 권한에서만 작동합니다.
          </p>
        </header>

        {error && (
          <div
            style={{
              ...CARD_STYLE,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 14,
              fontSize: 13.5,
              marginBottom: 14,
              display: "flex",
              gap: 10,
            }}
          >
            <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <section style={{ ...CARD_STYLE, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Filter style={{ width: 14, height: 14, color: "var(--kb-ink-400)" }} />
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      border: active ? "1px solid #0a0a0a" : "1px solid #e8e8e4",
                      background: active ? "#0a0a0a" : "#fff",
                      color: active ? "#fff" : "var(--kb-ink-700)",
                      cursor: "pointer",
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 6 }}>
              <Search style={{ width: 14, height: 14, color: "var(--kb-ink-400)" }} />
              <input
                type="search"
                placeholder="이름·로그인ID·이메일·학번·태그로 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #e8e8e4",
                  borderRadius: 8,
                  fontSize: 13.5,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void load()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid #e8e8e4",
                fontSize: 12.5,
                color: "var(--kb-ink-700)",
                cursor: "pointer",
              }}
            >
              새로고침
            </button>
          </div>
        </section>

        <section style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--kb-ink-400)", fontSize: 13.5 }}>
              조건에 맞는 부원이 없습니다.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filtered.map((member, index) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  tagsCatalog={tagsCatalog}
                  busy={busyUserId === member.id}
                  divider={index !== 0}
                  onApprove={() => handleApprove(member)}
                  onSetStatus={(next) => handleSetStatus(member, next)}
                  onDelete={() => handleDelete(member)}
                  onEdit={() => setEditingUser(member)}
                  onAssignTag={(tagId) => handleAssignTag(member, tagId)}
                  onRemoveTag={(tagId) => handleRemoveTag(member, tagId)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {editingUser ? (
        <EditMemberModal
          member={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={async () => {
            setEditingUser(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  tagsCatalog,
  busy,
  divider,
  onApprove,
  onSetStatus,
  onDelete,
  onEdit,
  onAssignTag,
  onRemoveTag,
}: {
  member: AdminMemberRow;
  tagsCatalog: MemberTag[];
  busy: boolean;
  divider: boolean;
  onApprove: () => void;
  onSetStatus: (next: AdminMemberStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  onAssignTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
}) {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const status = member.status;
  const statusColor = status ? STATUS_COLOR[status] : { bg: "#f3f4f6", fg: "#374151" };
  const availableTags = tagsCatalog.filter(
    (tag) => !member.tags.some((assigned) => assigned.id === tag.id),
  );

  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr 1.4fr 0.9fr",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderTop: divider ? "1px solid #f3f3f0" : "none",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {/* identity */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 14.5,
              color: "var(--kb-ink-900)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {member.displayName}
            {member.fullName && member.fullName !== member.displayName ? (
              <span style={{ color: "var(--kb-ink-400)", fontWeight: 500, marginLeft: 6 }}>
                ({member.fullName})
              </span>
            ) : null}
          </span>
          {member.isPresident ? (
            <Crown style={{ width: 14, height: 14, color: "#d4a017", flexShrink: 0 }} />
          ) : null}
        </div>
        <div
          className="kb-mono"
          style={{ fontSize: 11.5, color: "var(--kb-ink-400)", marginTop: 2 }}
        >
          {member.loginId ?? "—"} · {member.email ?? "—"}
        </div>
      </div>

      {/* academic */}
      <div style={{ fontSize: 12.5, color: "var(--kb-ink-700)", lineHeight: 1.5, minWidth: 0 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {member.college ?? "—"}
        </div>
        <div style={{ color: "var(--kb-ink-400)", fontSize: 11.5 }}>
          {member.department ?? "—"} · {member.studentId ?? "학번미상"}
        </div>
      </div>

      {/* status + tags */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
          {status ? (
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: statusColor.bg,
                color: statusColor.fg,
              }}
            >
              {STATUS_LABEL[status]}
            </span>
          ) : (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: "#f3f4f6",
                color: "#374151",
              }}
            >
              상태 없음
            </span>
          )}
          {member.tags.map((tag) => (
            <span
              key={tag.id}
              title={tag.slug}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: hexToTint(tag.color, 0.15),
                color: hexToShade(tag.color, 0.45),
                border: `1px solid ${hexToTint(tag.color, 0.4)}`,
              }}
            >
              {tag.label}
              {tag.isSystem ? null : (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "inherit",
                    opacity: 0.7,
                  }}
                  aria-label={`${tag.label} 회수`}
                >
                  <X style={{ width: 11, height: 11 }} />
                </button>
              )}
            </span>
          ))}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowTagMenu((v) => !v)}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                background: "#fff",
                border: "1px dashed #c4c4c0",
                color: "var(--kb-ink-500)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <TagIcon style={{ width: 10, height: 10 }} /> 태그
            </button>
            {showTagMenu && availableTags.length > 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #e8e8e4",
                  borderRadius: 8,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  padding: 4,
                  minWidth: 160,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      onAssignTag(tag.id);
                      setShowTagMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 12.5,
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: tag.color,
                        flexShrink: 0,
                      }}
                    />
                    {tag.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 6 }}>
        {status === "pending" ? (
          <ActionButton tone="primary" icon={<UserCheck style={{ width: 12, height: 12 }} />} onClick={onApprove}>
            승인
          </ActionButton>
        ) : null}
        <ActionButton icon={<Edit3 style={{ width: 12, height: 12 }} />} onClick={onEdit}>
          수정
        </ActionButton>
        {status === "active" ? (
          <ActionButton
            icon={<UserX style={{ width: 12, height: 12 }} />}
            onClick={() => onSetStatus("withdrawn")}
          >
            탈퇴 처리
          </ActionButton>
        ) : null}
        {status !== "active" && status !== "course_member" ? (
          <ActionButton onClick={() => onSetStatus("rejected")}>보류</ActionButton>
        ) : null}
        <ActionButton tone="danger" icon={<Trash2 style={{ width: 12, height: 12 }} />} onClick={onDelete}>
          삭제
        </ActionButton>
      </div>
    </li>
  );
}

function ActionButton({
  children,
  icon,
  tone = "default",
  onClick,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "danger";
  onClick: () => void;
}) {
  const palette =
    tone === "primary"
      ? { bg: "#0a0a0a", fg: "#fff", border: "transparent" }
      : tone === "danger"
        ? { bg: "transparent", fg: "#dc2626", border: "#fecaca" }
        : { bg: "#fff", fg: "var(--kb-ink-700)", border: "#e8e8e4" };
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 7,
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: AdminMemberRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [fullName, setFullName] = useState(member.fullName ?? "");
  const [studentId, setStudentId] = useState(member.studentId ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [college, setCollege] = useState(member.college ?? "");
  const [department, setDepartment] = useState(member.department ?? "");
  const [clubAffiliation, setClubAffiliation] = useState(member.clubAffiliation ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      setError(null);
      await adminUpdateMemberProfile(member.id, {
        displayName: displayName.trim(),
        nicknameDisplay: displayName.trim(),
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        clubAffiliation: clubAffiliation.trim(),
      });
      await onSaved();
    } catch (err) {
      setError(sanitizeUserError(err, "저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            프로필 강제 수정
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--kb-ink-500)" }}
            aria-label="닫기"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--kb-ink-400)", margin: "0 0 14px" }}>
          {member.email}
        </p>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 10,
              fontSize: 13,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="닉네임 / display_name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="실명 / full_name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="학번">
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="연락처">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="단과대">
            <input value={college} onChange={(e) => setCollege(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="학과">
            <input value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="동아리 소속 (KOSS 등)">
            <input value={clubAffiliation} onChange={(e) => setClubAffiliation(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "#fff",
              border: "1px solid #e8e8e4",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "#0a0a0a",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Check style={{ width: 13, height: 13 }} />}
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--kb-ink-700)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e8e8e4",
  fontSize: 13.5,
  outline: "none",
  fontFamily: "inherit",
};

// --- Color helpers (very small) ---
function clampHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
function parseHex(input: string) {
  const m = input.replace(/^#/, "").match(/^([0-9a-f]{6})$/i);
  if (!m) return { r: 100, g: 100, b: 100 };
  const num = parseInt(m[1], 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clampHex(value).toString(16).padStart(2, "0"))
    .join("")}`;
}
function hexToTint(hex: string, alphaTowardsWhite: number) {
  const { r, g, b } = parseHex(hex);
  const ratio = Math.max(0, Math.min(1, alphaTowardsWhite));
  return rgbToHex(
    r + (255 - r) * (1 - ratio),
    g + (255 - g) * (1 - ratio),
    b + (255 - b) * (1 - ratio),
  );
}
function hexToShade(hex: string, ratio: number) {
  const { r, g, b } = parseHex(hex);
  const c = Math.max(0, Math.min(1, ratio));
  return rgbToHex(r * (1 - c), g * (1 - c), b * (1 - c));
}
