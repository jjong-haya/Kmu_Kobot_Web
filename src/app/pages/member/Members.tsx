import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Crown,
  Edit3,
  Filter,
  FolderKanban,
  Github,
  LayoutGrid,
  Linkedin,
  List,
  Mail,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import {
  listMemberDirectory,
  setMemberFavorite,
  updateOwnDirectoryProfile,
  type DirectoryViewMode,
  type MemberDirectoryData,
  type MemberDirectoryProfile,
} from "../../api/member-directory";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";
import { safeImageUrl } from "../../utils/safe-image-url";

type MemberScopeFilter = "all" | "kobot" | "course";

const MEMBER_SCOPE_FILTERS: Array<{ key: MemberScopeFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "kobot", label: "코봇" },
  { key: "course", label: "코스" },
];

function nameWithReal(member: MemberDirectoryProfile): string {
  const display = member.displayName?.trim();
  const real = member.fullName?.trim();
  if (!display) return real ?? "이름 없음";
  if (!real || real === display) return display;
  return `${display} (${real})`;
}

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #e8e8e4",
  borderRadius: 10,
  background: "#fff",
  color: "var(--kb-ink-900)",
  fontFamily: "inherit",
  fontSize: 14.5,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--kb-ink-500)",
  marginBottom: 6,
};

function initialsFor(name: string) {
  const source = name.trim() || "K";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function statusLabel(status: string | null) {
  switch (status) {
    case "active":
      return "정식 부원";
    case "course_member":
      return "코스 부원";
    case "project_only":
      return "프로젝트";
    case "alumni":
      return "졸업/수료";
    case "pending":
      return "승인 대기";
    default:
      return status ?? "상태 없음";
  }
}

function roleDisplayLabel(label: string | null | undefined) {
  const normalized = label?.trim().toLocaleLowerCase("ko-KR");

  if (!normalized) return null;
  if (normalized === "president") return "회장";
  if (normalized === "vice president") return "부회장";
  if (normalized === "team lead") return "팀장";
  if (normalized === "team member") return "팀원";

  return label?.trim() ?? null;
}

function organizationDisplayLabel(member: MemberDirectoryProfile) {
  const normalizedClub = member.clubAffiliation?.trim();

  if (member.status === "active") return normalizedClub || "KOBOT";
  if (member.status === "course_member") return normalizedClub || "KOSS";
  return normalizedClub ?? null;
}

function normalizeUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function includesText(member: MemberDirectoryProfile, query: string) {
  if (!query) return true;
  const target = [
    member.displayName,
    member.fullName,
    member.email,
    member.publicEmail,
    member.college,
    member.department,
    member.clubAffiliation,
    member.profileBio,
    ...member.positionLabels,
    ...member.officialTeamLabels,
    ...member.projectLabels,
    ...member.roleLabels,
    ...member.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");

  return target.includes(query.toLocaleLowerCase("ko-KR"));
}

function filterMembers({
  members,
  query,
  scopeFilter,
}: {
  members: MemberDirectoryProfile[];
  query: string;
  scopeFilter: MemberScopeFilter;
}) {
  return members.filter((member) => {
    if (scopeFilter === "kobot" && member.status !== "active") return false;
    if (scopeFilter === "course" && member.status !== "course_member") return false;
    return includesText(member, query.trim());
  });
}

function Avatar({ member, size = 52 }: { member: MemberDirectoryProfile; size?: number }) {
  const image = safeImageUrl(member.avatarUrl);
  const crownSize = Math.max(18, Math.round(size * 0.34));

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: member.isSelf ? "var(--kb-navy-800)" : "#0a0a0a",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.max(14, size * 0.32),
          fontWeight: 800,
          overflow: "hidden",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={member.displayName}
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initialsFor(member.displayName)
        )}
      </div>
      {member.isPresident ? (
        <span
          aria-label="회장"
          title="회장"
          style={{
            position: "absolute",
            top: -Math.round(crownSize * 0.7),
            left: "50%",
            transform: "translateX(-50%) rotate(-12deg)",
            width: crownSize,
            height: crownSize,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b45309",
            filter:
              "drop-shadow(0 2px 3px rgba(0,0,0,0.22)) drop-shadow(0 0 1px rgba(0,0,0,0.35))",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Crown
            color="#b45309"
            fill="#facc15"
            strokeWidth={2}
            size={crownSize}
            style={{ display: "block" }}
          />
        </span>
      ) : null}
    </div>
  );
}

function Chip({
  children,
  tone = "neutral",
  onRemove,
}: {
  children: string;
  tone?: "neutral" | "strong" | "muted";
  onRemove?: () => void;
}) {
  const normalized = children.trim().toLocaleLowerCase("ko-KR");
  const isKobotTag = normalized === "kobot" || normalized === "코봇";
  const isKossTag = normalized === "koss" || normalized === "코스";
  const isPresidentTag = normalized === "회장" || normalized === "president";
  const colors = isPresidentTag
    ? { bg: "#fff1c2", fg: "#8a5a00", border: "#f4d36b" }
    : isKobotTag
      ? { bg: "#dff7ef", fg: "#1e6b5b", border: "#aee8d7" }
      : isKossTag
        ? { bg: "#eee7ff", fg: "#5b3f96", border: "#d6c6ff" }
        : tone === "strong"
      ? { bg: "#e9f0ff", fg: "#2f4f9f", border: "#cddafd" }
      : tone === "muted"
        ? { bg: "#f7f5f0", fg: "var(--kb-ink-500)", border: "#ebe8e0" }
        : { bg: "#fff7dc", fg: "#7a5a18", border: "#f4dfa0" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: "100%",
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.fg,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {children}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${children} 필터 해제`}
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
          }}
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      ) : null}
    </span>
  );
}

function ContactButton({
  disabled,
  href,
  icon,
  label,
}: {
  disabled?: boolean;
  href: string | null;
  icon: ReactNode;
  label: string;
}) {
  if (!href || disabled) {
    return (
      <span
        title={`${label} 없음`}
        style={{
          width: 34,
          height: 34,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ebe8e0",
          borderRadius: 8,
          color: "var(--kb-ink-300)",
          background: "#fafaf9",
        }}
      >
        {icon}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      title={label}
      style={{
        width: 34,
        height: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #ebe8e0",
        borderRadius: 8,
        color: "var(--kb-ink-700)",
        background: "#fff",
        textDecoration: "none",
      }}
      className="hover:bg-[#fafaf6]"
    >
      {icon}
    </a>
  );
}

function FavoriteButton({
  disabled,
  isFavorite,
  onClick,
}: {
  disabled?: boolean;
  isFavorite: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      style={{
        width: 34,
        height: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #ebe8e0",
        borderRadius: 8,
        color: isFavorite ? "#d97706" : "var(--kb-ink-400)",
        background: isFavorite ? "#fef3c7" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Star style={{ width: 16, height: 16, fill: isFavorite ? "#d97706" : "transparent" }} />
    </button>
  );
}

function MemberMeta({ member }: { member: MemberDirectoryProfile }) {
  const primaryRole = roleDisplayLabel(member.positionLabels[0]) ?? statusLabel(member.status);
  const organization = organizationDisplayLabel(member);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, color: "var(--kb-ink-500)", fontSize: 13 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <ShieldCheck style={{ width: 13, height: 13 }} />
        {primaryRole}
      </span>
      {organization ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Building2 style={{ width: 13, height: 13 }} />
          {organization}
        </span>
      ) : null}
      {member.projectCount > 0 ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <FolderKanban style={{ width: 13, height: 13 }} />
          프로젝트 {member.projectCount}
        </span>
      ) : null}
    </div>
  );
}

function MemberCard({
  disabledFavorite,
  member,
  onToggleFavorite,
}: {
  disabledFavorite: boolean;
  member: MemberDirectoryProfile;
  onToggleFavorite: (member: MemberDirectoryProfile) => void;
}) {
  const email = member.publicEmail ?? member.email;
  const github = normalizeUrl(member.githubUrl);
  const linkedin = normalizeUrl(member.linkedinUrl);

  return (
    <article
      style={{
        ...CARD_STYLE,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 280,
        borderColor: member.isSelf ? "var(--kb-navy-800)" : "#e8e8e4",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Avatar member={member} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  color: "var(--kb-ink-900)",
                  fontSize: 17,
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nameWithReal(member)}
              </h3>
              {member.isSelf ? <Chip tone="strong">나</Chip> : null}
            </div>
            <div style={{ marginTop: 5 }}>
              <MemberMeta member={member} />
            </div>
          </div>
        </div>
        <FavoriteButton
          disabled={disabledFavorite || member.isSelf}
          isFavorite={member.isFavorite}
          onClick={() => onToggleFavorite(member)}
        />
      </div>

      <p
        style={{
          margin: 0,
          minHeight: 42,
          color: member.profileBio ? "var(--kb-ink-700)" : "var(--kb-ink-400)",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {member.profileBio ?? `${member.department ?? "소속 정보 없음"} · ${formatDate(member.joinedAt)} 합류`}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {member.tags.slice(0, 9).map((tag, index) => (
          <Chip key={`${member.id}-${tag}`} tone={index < 2 ? "strong" : "neutral"}>
            {tag}
          </Chip>
        ))}
        {member.tags.length > 9 ? <Chip tone="muted">+{member.tags.length - 9}</Chip> : null}
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderTop: "1px solid #f1ede4",
          paddingTop: 14,
        }}
      >
        <span style={{ color: "var(--kb-ink-500)", fontSize: 13 }}>
          {member.department ?? member.college ?? "학과 미등록"}
        </span>
        <div style={{ display: "inline-flex", gap: 6 }}>
          <ContactButton
            href={email ? `mailto:${email}` : null}
            label="이메일"
            icon={<Mail style={{ width: 15, height: 15 }} />}
          />
          <ContactButton
            href={github}
            label="GitHub"
            icon={<Github style={{ width: 15, height: 15 }} />}
          />
          <ContactButton
            href={linkedin}
            label="LinkedIn"
            icon={<Linkedin style={{ width: 15, height: 15 }} />}
          />
        </div>
      </div>
    </article>
  );
}

function MemberListRow({
  disabledFavorite,
  member,
  onToggleFavorite,
}: {
  disabledFavorite: boolean;
  member: MemberDirectoryProfile;
  onToggleFavorite: (member: MemberDirectoryProfile) => void;
}) {
  const email = member.publicEmail ?? member.email;
  const github = normalizeUrl(member.githubUrl);
  const linkedin = normalizeUrl(member.linkedinUrl);

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1.2fr) minmax(220px, 1fr) minmax(220px, 1.2fr) auto",
        gap: 18,
        alignItems: "center",
        padding: "16px 20px",
        borderTop: "1px solid #f1ede4",
      }}
      className="kb-member-row hover:bg-[#fafaf6]"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <Avatar member={member} size={44} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15.5,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nameWithReal(member)}
            </h3>
            {member.isSelf ? <Chip tone="strong">나</Chip> : null}
          </div>
          <div style={{ marginTop: 5 }}>
            <MemberMeta member={member} />
          </div>
        </div>
      </div>
      <div style={{ minWidth: 0, color: "var(--kb-ink-600)", fontSize: 13.5, lineHeight: 1.5 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {member.department ?? member.college ?? "학과 미등록"}
        </div>
        <div style={{ color: "var(--kb-ink-400)" }}>합류 {formatDate(member.joinedAt)}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>
        {member.tags.slice(0, 6).map((tag) => (
          <Chip key={`${member.id}-row-${tag}`}>{tag}</Chip>
        ))}
        {member.tags.length > 6 ? <Chip tone="muted">+{member.tags.length - 6}</Chip> : null}
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <FavoriteButton
          disabled={disabledFavorite || member.isSelf}
          isFavorite={member.isFavorite}
          onClick={() => onToggleFavorite(member)}
        />
        <ContactButton href={email ? `mailto:${email}` : null} label="이메일" icon={<Mail style={{ width: 15, height: 15 }} />} />
        <ContactButton href={github} label="GitHub" icon={<Github style={{ width: 15, height: 15 }} />} />
        <ContactButton href={linkedin} label="LinkedIn" icon={<Linkedin style={{ width: 15, height: 15 }} />} />
      </div>
    </article>
  );
}

function ProfileEditor({
  member,
  onSaved,
}: {
  member: MemberDirectoryProfile;
  onSaved: (extensionsSaved: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nicknameDisplay, setNicknameDisplay] = useState(member.displayName);
  const [profileBio, setProfileBio] = useState(member.profileBio ?? "");
  const [publicEmail, setPublicEmail] = useState(member.publicEmail ?? member.email ?? "");
  const [githubUrl, setGithubUrl] = useState(member.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(member.linkedinUrl ?? "");
  const [clubAffiliation, setClubAffiliation] = useState(member.clubAffiliation ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNicknameDisplay(member.displayName);
    setProfileBio(member.profileBio ?? "");
    setPublicEmail(member.publicEmail ?? member.email ?? "");
    setGithubUrl(member.githubUrl ?? "");
    setLinkedinUrl(member.linkedinUrl ?? "");
    setClubAffiliation(member.clubAffiliation ?? "");
  }, [member]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      if (!nicknameDisplay.trim()) {
        throw new Error("닉네임을 입력해 주세요.");
      }

      const result = await updateOwnDirectoryProfile({
        nicknameDisplay,
        profileBio,
        publicEmail,
        githubUrl,
        linkedinUrl,
        clubAffiliation,
      });

      setSaved(true);
      setEditing(false);
      onSaved(result.profileExtensionsSaved);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(sanitizeUserError(err, "프로필을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        ...CARD_STYLE,
        padding: 22,
        borderColor: "var(--kb-navy-800)",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <Avatar member={member} size={64} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--kb-ink-900)" }}>
                {nameWithReal(member)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 13px",
              borderRadius: 8,
              border: "1px solid #ebe8e0",
              background: editing ? "#0a0a0a" : "#fff",
              color: editing ? "#fff" : "var(--kb-ink-700)",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {editing ? <X style={{ width: 14, height: 14 }} /> : <Edit3 style={{ width: 14, height: 14 }} />}
            {editing ? "닫기" : "수정"}
          </button>
        </div>

        {editing ? (
          <div
            className="kb-profile-editor"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
              marginTop: 20,
            }}
          >
            <div>
              <label htmlFor="directory-nickname" style={labelStyle}>
                닉네임
              </label>
              <input
                id="directory-nickname"
                value={nicknameDisplay}
                onChange={(event) => setNicknameDisplay(event.target.value)}
                style={{ ...inputStyle, padding: "11px 13px" }}
              />
            </div>
            <div>
              <label htmlFor="directory-public-email" style={labelStyle}>
                표시 이메일
              </label>
              <input
                id="directory-public-email"
                type="email"
                value={publicEmail}
                onChange={(event) => setPublicEmail(event.target.value)}
                style={{ ...inputStyle, padding: "11px 13px" }}
                placeholder={member.email ?? "name@example.com"}
              />
            </div>
            <div>
              <label htmlFor="directory-github" style={labelStyle}>
                GitHub
              </label>
              <input
                id="directory-github"
                type="url"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                style={{ ...inputStyle, padding: "11px 13px" }}
                placeholder="https://github.com/kobot"
              />
            </div>
            <div>
              <label htmlFor="directory-linkedin" style={labelStyle}>
                LinkedIn
              </label>
              <input
                id="directory-linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                style={{ ...inputStyle, padding: "11px 13px" }}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label htmlFor="directory-club" style={labelStyle}>
                동아리/소속
              </label>
              <input
                id="directory-club"
                value={clubAffiliation}
                onChange={(event) => setClubAffiliation(event.target.value)}
                style={{ ...inputStyle, padding: "11px 13px" }}
                placeholder="KOBOT"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="directory-bio" style={labelStyle}>
                한 줄 소개
              </label>
              <textarea
                id="directory-bio"
                value={profileBio}
                onChange={(event) => setProfileBio(event.target.value)}
                maxLength={160}
                rows={3}
                style={{ ...inputStyle, padding: "11px 13px", resize: "vertical", lineHeight: 1.55 }}
                placeholder="관심 분야, 진행 중인 프로젝트, 연락 받고 싶은 주제"
              />
              <div style={{ textAlign: "right", color: "var(--kb-ink-400)", fontSize: 12, marginTop: 5 }}>
                {profileBio.length} / 160
              </div>
            </div>
            {error ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  color: "#991b1b",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            ) : null}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
              }}
            >
              {saved ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#15803d", fontSize: 13, fontWeight: 700 }}>
                  <Check style={{ width: 14, height: 14 }} />
                  저장되었습니다
                </span>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 18px",
                  borderRadius: 9,
                  border: 0,
                  background: saving ? "#6a6a6a" : "#0a0a0a",
                  color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontWeight: 800,
                }}
              >
                <Save style={{ width: 14, height: 14 }} />
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
            {member.tags.slice(0, 12).map((tag) => (
              <Chip key={`self-${tag}`} tone="strong">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}

export default function Members() {
  const { authData, refreshAuthData } = useAuth();
  const currentUserId = authData.profile.id ?? "";
  const [data, setData] = useState<MemberDirectoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<MemberScopeFilter>("all");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("cards");
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  async function load() {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);

    try {
      setData(await listMemberDirectory(currentUserId));
    } catch (err) {
      setError(sanitizeUserError(err, "멤버 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [currentUserId]);

  const filteredMembers = useMemo(
    () =>
      data
        ? filterMembers({
            members: data.members,
            query,
            scopeFilter,
          })
        : [],
    [data, query, scopeFilter],
  );
  const selfMember = data?.members.find((member) => member.isSelf) ?? null;

  async function handleToggleFavorite(member: MemberDirectoryProfile) {
    if (!data || member.isSelf) return;
    setFavoriteError(null);

    const nextFavorite = !member.isFavorite;
    setData({
      ...data,
      members: data.members.map((item) =>
        item.id === member.id ? { ...item, isFavorite: nextFavorite } : item,
      ),
    });

    try {
      await setMemberFavorite(member.id, nextFavorite);
    } catch (err) {
      setFavoriteError(sanitizeUserError(err, "즐겨찾기를 저장하지 못했습니다."));
      await load();
    }
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <style>{`
        @media (max-width: 1080px) {
          .kb-member-list { overflow-x: auto; }
          .kb-member-row { grid-template-columns: minmax(260px, 1fr) minmax(200px, 0.9fr) minmax(220px, 1fr) auto !important; min-width: 860px; }
        }
        @media (max-width: 820px) {
          .kb-member-toolbar { grid-template-columns: 1fr !important; }
          .kb-member-grid { grid-template-columns: 1fr !important; }
          .kb-profile-editor { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1
              className="kb-display"
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
                color: "#0a0a0a",
              }}
            >
              멤버
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 15px",
              borderRadius: 9,
              border: "1px solid #ebe8e0",
              background: "#fff",
              color: "var(--kb-ink-700)",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            <RefreshCcw style={{ width: 14, height: 14 }} />
            새로고침
          </button>
        </div>

        {selfMember ? (
          <ProfileEditor
            member={selfMember}
            onSaved={async () => {
              await Promise.all([load(), refreshAuthData()]);
            }}
          />
        ) : null}

        {error ? (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle style={{ width: 16, height: 16 }} />
            {error}
          </div>
        ) : null}

        {favoriteError ? (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #fef3c7",
              background: "#fffbeb",
              color: "#92400e",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {favoriteError}
          </div>
        ) : null}

        <section style={{ ...CARD_STYLE, padding: 16 }}>
          <div
            className="kb-member-toolbar"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 1fr) auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 16,
                  height: 16,
                  color: "var(--kb-ink-400)",
                }}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름, 이메일, 동아리, 프로젝트, 지위 검색"
                style={{ ...inputStyle, height: 42, padding: "0 14px 0 40px" }}
              />
            </div>

            <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="카드로 보기"
                title="카드로 보기"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  border: viewMode === "cards" ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                  background: viewMode === "cards" ? "#0a0a0a" : "#fff",
                  color: viewMode === "cards" ? "#fff" : "var(--kb-ink-700)",
                  cursor: "pointer",
                }}
              >
                <LayoutGrid style={{ width: 16, height: 16, margin: "0 auto" }} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="목록으로 보기"
                title="목록으로 보기"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  border: viewMode === "list" ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                  background: viewMode === "list" ? "#0a0a0a" : "#fff",
                  color: viewMode === "list" ? "#fff" : "var(--kb-ink-700)",
                  cursor: "pointer",
                }}
              >
                <List style={{ width: 16, height: 16, margin: "0 auto" }} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--kb-ink-500)", fontSize: 13, fontWeight: 800 }}>
              <Filter style={{ width: 14, height: 14 }} />
              필터
            </span>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value as MemberScopeFilter)}
              style={{ ...inputStyle, width: 136, height: 36, padding: "0 10px", fontWeight: 800 }}
            >
              {MEMBER_SCOPE_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ color: "var(--kb-ink-500)", fontSize: 14, fontWeight: 700 }}>
            {loading ? "불러오는 중..." : `${filteredMembers.length}명 표시`}
          </div>
          {(query || scopeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setScopeFilter("all");
              }}
              style={{
                border: "1px solid #ebe8e0",
                background: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--kb-ink-700)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              필터 초기화
            </button>
          )}
        </div>

        {loading && !data ? (
          <div style={{ ...CARD_STYLE, padding: 60, textAlign: "center", color: "var(--kb-ink-500)" }}>
            멤버를 불러오는 중...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ ...CARD_STYLE, padding: 60, textAlign: "center", color: "var(--kb-ink-500)" }}>
            <UserRound style={{ width: 34, height: 34, margin: "0 auto 12px", color: "var(--kb-ink-300)" }} />
            조건에 맞는 멤버가 없습니다.
          </div>
        ) : viewMode === "cards" ? (
          <div
            className="kb-member-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 16,
            }}
          >
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                disabledFavorite={!data?.favoritesAvailable}
                member={member}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="kb-member-list" style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
            {filteredMembers.map((member) => (
              <MemberListRow
                key={member.id}
                disabledFavorite={!data?.favoritesAvailable}
                member={member}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {data && !data.favoritesAvailable ? (
          <div style={{ color: "var(--kb-ink-400)", fontSize: 12.5 }}>
            즐겨찾기 저장 준비가 아직 완료되지 않아 일시적으로 비활성화되어 있습니다.
          </div>
        ) : null}
      </div>
    </div>
  );
}
