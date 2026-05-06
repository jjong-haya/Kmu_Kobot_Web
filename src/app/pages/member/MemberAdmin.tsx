import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useLocation } from "react-router";
import {
  Check,
  ChevronDown,
  Crown,
  Edit3,
  Loader2,
  Search,
  ShieldAlert,
  Tag as TagIcon,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { TagChip } from "../../components/TagChip";
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

// 필터 키 형식:
//   "all"               — 전체
//   "submitted"         — 신청 제출 후 승인 대기
//   "draft"             — 신청 미제출 (가입 절차 중간)
//   "status:rejected"   — 보류
//   "status:withdrawn"  — 탈퇴
//   "tag:<uuid>"        — 해당 태그를 가진 부원만 (DB의 member_tags 그대로)
type AdminFilterKey = string;

const FIXED_FILTERS: Array<{ key: AdminFilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "submitted", label: "승인 대기 (신청 제출)" },
  { key: "draft", label: "신청 미제출" },
];

const STATUS_FILTERS: Array<{ key: AdminFilterKey; label: string }> = [
  { key: "status:rejected", label: "보류" },
  { key: "status:withdrawn", label: "탈퇴" },
];

function filterKeyFromSearch(search: string): AdminFilterKey | null {
  const filter = new URLSearchParams(search).get("filter");

  if (!filter) return null;
  if (["all", "submitted", "draft"].includes(filter)) return filter;
  if (filter === "rejected") return "status:rejected";
  if (filter === "withdrawn") return "status:withdrawn";
  if (filter.startsWith("tag:") || filter.startsWith("status:")) return filter;

  return null;
}

const STATUS_LABEL: Record<AdminMemberStatus, string> = {
  pending: "승인 대기",
  active: "활동중",
  rejected: "보류",
  withdrawn: "탈퇴",
};

const STATUS_COLOR: Record<AdminMemberStatus, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  active: { bg: "#dcfce7", fg: "#15803d" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
  withdrawn: { bg: "#f3f4f6", fg: "#374151" },
};

// 태그 칩 / 아이콘은 components/TagChip.tsx 단일 컴포넌트가 그린다.
// 새 슬러그 아이콘 매핑은 거기 SLUG_ICONS 에만 추가.

export default function MemberAdmin() {
  const location = useLocation();
  const { user: viewer } = useAuth();
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [tagsCatalog, setTagsCatalog] = useState<MemberTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminFilterKey>(
    () => filterKeyFromSearch(location.search) ?? "all",
  );
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState<AdminMemberRow | null>(null);
  const [tagModalFor, setTagModalFor] = useState<AdminMemberRow | null>(null);

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

  useEffect(() => {
    const nextFilter = filterKeyFromSearch(location.search);
    if (nextFilter) {
      setStatusFilter(nextFilter);
    }
  }, [location.search]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ko-KR");
    return members.filter((member) => {
      if (statusFilter === "submitted") {
        // 신청 제출됨 AND 아직 승인 전
        if (member.applicationStatus !== "submitted") return false;
        if (member.status === "active") return false;
      } else if (statusFilter === "draft") {
        // 신청 미제출: 가입 폼만 일부 채운 상태
        if (member.applicationStatus === "submitted") return false;
        if (member.status !== "pending" && member.status !== null) return false;
      } else if (statusFilter.startsWith("status:")) {
        const wanted = statusFilter.slice("status:".length);
        if (member.status !== wanted) return false;
      } else if (statusFilter.startsWith("tag:")) {
        const wantedTagId = statusFilter.slice("tag:".length);
        if (!member.tags.some((tag) => tag.id === wantedTagId)) return false;
      } else if (statusFilter !== "all") {
        return false;
      }
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
            <FilterDropdown
              currentKey={statusFilter}
              onChange={setStatusFilter}
              tagsCatalog={tagsCatalog}
            />
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
                  busy={busyUserId === member.id}
                  divider={index !== 0}
                  onApprove={() => handleApprove(member)}
                  onSetStatus={(next) => handleSetStatus(member, next)}
                  onDelete={() => handleDelete(member)}
                  onEdit={() => setEditingUser(member)}
                  onOpenTagMenu={() => setTagModalFor(member)}
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

      {tagModalFor ? (
        <TagAssignModal
          member={
            // 가장 최신 멤버 데이터를 보여주기 위해 현재 members 배열에서 다시 찾는다.
            members.find((row) => row.id === tagModalFor.id) ?? tagModalFor
          }
          tagsCatalog={tagsCatalog}
          busy={busyUserId === tagModalFor.id}
          onClose={() => setTagModalFor(null)}
          onAssign={async (tagId) => {
            await handleAssignTag(tagModalFor, tagId);
          }}
          onRemove={async (tagId) => {
            await handleRemoveTag(tagModalFor, tagId);
          }}
        />
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  busy,
  divider,
  onApprove,
  onSetStatus,
  onDelete,
  onEdit,
  onOpenTagMenu,
  onRemoveTag,
}: {
  member: AdminMemberRow;
  busy: boolean;
  divider: boolean;
  onApprove: () => void;
  onSetStatus: (next: AdminMemberStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpenTagMenu: () => void;
  onRemoveTag: (tagId: string) => void;
}) {
  const status = member.status;

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

      {/* tags only — status는 lifecycle 컬럼이라 행에 노출하지 않는다.
          (docs/product/member-status.md / docs/product/tag-system.md) */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
          {member.tags.length === 0 ? (
            <span style={{ fontSize: 11, color: "var(--kb-ink-400)" }}>
              부여된 태그 없음
            </span>
          ) : null}
          {member.tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={{ slug: tag.slug, label: tag.label, color: tag.color }}
              onRemove={() => onRemoveTag(tag.id)}
            />
          ))}
          <button
            type="button"
            onClick={onOpenTagMenu}
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
        </div>
      </div>

      {/* actions — 회장은 모든 부원에 대해 모든 액션 가능. 표시는 의미가 명확한 것만 가린다. */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 6 }}>
        {status === "pending" && member.applicationStatus !== "submitted" ? (
          <span
            title="가입 폼을 끝까지 입력하고 신청 제출을 해야 정상적인 승인 절차가 가능합니다."
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              background: "#f3f4f6",
              color: "#6b7280",
            }}
          >
            신청 미제출
          </span>
        ) : null}
        {status === "pending" && member.applicationStatus === "submitted" ? (
          <ActionButton
            tone="primary"
            icon={<UserCheck style={{ width: 12, height: 12 }} />}
            onClick={onApprove}
          >
            승인
          </ActionButton>
        ) : null}
        <ActionButton icon={<Edit3 style={{ width: 12, height: 12 }} />} onClick={onEdit}>
          수정
        </ActionButton>
        {status !== "withdrawn" ? (
          <ActionButton
            icon={<UserX style={{ width: 12, height: 12 }} />}
            onClick={() => onSetStatus("withdrawn")}
          >
            탈퇴 처리
          </ActionButton>
        ) : null}
        {status !== "rejected" ? (
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

function TagAssignModal({
  member,
  tagsCatalog,
  busy,
  onClose,
  onAssign,
  onRemove,
}: {
  member: AdminMemberRow;
  tagsCatalog: MemberTag[];
  busy: boolean;
  onClose: () => void;
  onAssign: (tagId: string) => Promise<void> | void;
  onRemove: (tagId: string) => Promise<void> | void;
}) {
  const [search, setSearch] = useState("");

  const assignedIds = new Set(member.tags.map((tag) => tag.id));
  const sorted = [...tagsCatalog].sort((a, b) =>
    a.label.localeCompare(b.label, "ko"),
  );
  const q = search.trim().toLocaleLowerCase("ko-KR");
  const filtered = q
    ? sorted.filter(
        (tag) =>
          tag.label.toLocaleLowerCase("ko-KR").includes(q) ||
          tag.slug.toLowerCase().includes(q),
      )
    : sorted;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
          maxHeight: "84vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                color: "var(--kb-ink-400)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              MANAGE TAGS
            </div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
              {member.displayName} <span style={{ fontWeight: 500, color: "var(--kb-ink-400)" }}>의 태그</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--kb-ink-500)",
              flexShrink: 0,
            }}
            aria-label="닫기"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--kb-ink-500)", margin: "0 0 12px", lineHeight: 1.55 }}>
          체크된 태그를 누르면 회수, 안 체크된 태그를 누르면 부여됩니다.
        </p>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search
            style={{
              width: 13,
              height: 13,
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--kb-ink-400)",
            }}
          />
          <input
            autoFocus
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="태그 검색"
            style={{
              width: "100%",
              padding: "8px 12px 8px 30px",
              border: "1px solid #e8e8e4",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            paddingRight: 2,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 28,
                textAlign: "center",
                color: "var(--kb-ink-400)",
                fontSize: 13,
              }}
            >
              일치하는 태그가 없습니다. 태그 관리 페이지에서 새로 만들 수 있어요.
            </div>
          ) : (
            filtered.map((tag) => {
              const assigned = assignedIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={busy}
                  onClick={() => (assigned ? onRemove(tag.id) : onAssign(tag.id))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 12px",
                    border: assigned ? "1px solid #0a0a0a" : "1px solid #e8e8e4",
                    background: assigned ? "#fafaf9" : "#fff",
                    cursor: busy ? "not-allowed" : "pointer",
                    textAlign: "left",
                    borderRadius: 10,
                  }}
                >
                  <TagChip
                    tag={{ slug: tag.slug, label: tag.label, color: tag.color }}
                    size="md"
                    selected={assigned}
                  />
                  {assigned ? (
                    <Check style={{ width: 14, height: 14, color: "var(--kb-ink-700)" }} />
                  ) : (
                    <span
                      className="kb-mono"
                      style={{ fontSize: 11, color: "var(--kb-ink-400)" }}
                    >
                      {tag.slug}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#fff",
              border: "1px solid #e8e8e4",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            완료
          </button>
        </div>
      </div>
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

function FilterDropdown({
  currentKey,
  onChange,
  tagsCatalog,
}: {
  currentKey: AdminFilterKey;
  onChange: (next: AdminFilterKey) => void;
  tagsCatalog: MemberTag[];
}) {
  const [open, setOpen] = useState(false);

  const currentLabel = (() => {
    const fixed = FIXED_FILTERS.find((entry) => entry.key === currentKey);
    if (fixed) return fixed.label;
    const status = STATUS_FILTERS.find((entry) => entry.key === currentKey);
    if (status) return status.label;
    if (currentKey.startsWith("tag:")) {
      const tagId = currentKey.slice("tag:".length);
      const tag = tagsCatalog.find((entry) => entry.id === tagId);
      return tag ? `태그: ${tag.label}` : "태그";
    }
    return "전체";
  })();

  const sortedTags = [...tagsCatalog].sort((a, b) =>
    a.label.localeCompare(b.label, "ko"),
  );

  return (
    <div style={{ position: "relative", minWidth: 240 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 8,
          background: "#fff",
          border: "1px solid #e8e8e4",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--kb-ink-700)",
          cursor: "pointer",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <TagIcon style={{ width: 13, height: 13, color: "var(--kb-ink-400)" }} />
          {currentLabel}
        </span>
        <ChevronDown style={{ width: 13, height: 13, color: "var(--kb-ink-400)" }} />
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e8e8e4",
            borderRadius: 10,
            boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
            padding: 6,
            zIndex: 20,
            maxHeight: 360,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {FIXED_FILTERS.map((filter) => (
            <FilterRow
              key={filter.key}
              active={currentKey === filter.key}
              onClick={() => {
                onChange(filter.key);
                setOpen(false);
              }}
            >
              {filter.label}
            </FilterRow>
          ))}
          {sortedTags.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--kb-ink-400)",
                  padding: "8px 8px 4px",
                }}
              >
                태그
              </div>
              {sortedTags.map((tag) => (
                <FilterRow
                  key={tag.id}
                  active={currentKey === `tag:${tag.id}`}
                  onClick={() => {
                    onChange(`tag:${tag.id}`);
                    setOpen(false);
                  }}
                >
                  <TagChip
                    tag={{ slug: tag.slug, label: tag.label, color: tag.color }}
                    size="sm"
                    withDot
                  />
                </FilterRow>
              ))}
            </>
          ) : null}
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--kb-ink-400)",
              padding: "8px 8px 4px",
            }}
          >
            상태
          </div>
          {STATUS_FILTERS.map((filter) => (
            <FilterRow
              key={filter.key}
              active={currentKey === filter.key}
              onClick={() => {
                onChange(filter.key);
                setOpen(false);
              }}
            >
              {filter.label}
            </FilterRow>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterRow({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "7px 10px",
        border: "none",
        background: active ? "#0a0a0a" : "transparent",
        color: active ? "#fff" : "var(--kb-ink-700)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 6,
      }}
    >
      {children}
    </button>
  );
}

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
