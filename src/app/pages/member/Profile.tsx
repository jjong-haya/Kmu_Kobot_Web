import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { AlertTriangle, Camera, Github, Linkedin, Mail, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import {
  AccountTabs,
  AccountResponsiveStyles,
  ACCOUNT_PAGE_WRAPPER,
  ACCOUNT_CARD,
} from "../../components/member/AccountTabs";
import {
  extractGithubLoginFromProfileUrl,
  getOwnProfileContactFields,
  updateOwnProfileContactFields,
} from "../../api/profile-contact";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";
import { safeImageUrl } from "../../utils/safe-image-url";

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--kb-ink-700)",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 14.5,
  border: "1px solid var(--kb-border-subtle)",
  borderRadius: "var(--kb-radius-md)",
  outline: "none",
  fontFamily: "inherit",
  color: "var(--kb-ink-900)",
  background: "var(--kb-surface-raised)",
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isHttpsUrl(value: string) {
  if (!value.trim()) return true;
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function getSafeInternalPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function Profile() {
  const { authData, saveProfileSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = authData.profile;
  const searchParams = new URLSearchParams(location.search);
  const shouldFocusGithub = searchParams.get("focus") === "github";
  const nextPath = getSafeInternalPath(searchParams.get("next"));

  const [nickname, setNickname] = useState(profile.nicknameDisplay ?? profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loadingContact, setLoadingContact] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const githubFieldRef = useRef<HTMLDivElement>(null);
  const githubInputRef = useRef<HTMLInputElement>(null);

  const initials =
    (profile.fullName ?? profile.displayName ?? "K")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "K";

  useEffect(() => {
    let active = true;

    async function loadContactFields() {
      setLoadingContact(true);
      try {
        const fields = await getOwnProfileContactFields();
        if (!active) return;
        setBio(fields.profileBio ?? "");
        setPublicEmail(fields.publicEmail ?? "");
        setGithubUrl(fields.githubUrl ?? "");
        setLinkedinUrl(fields.linkedinUrl ?? "");
      } catch (err) {
        if (active) {
          setError(sanitizeUserError(err, "프로필 연락처 정보를 불러오지 못했습니다."));
        }
      } finally {
        if (active) setLoadingContact(false);
      }
    }

    void loadContactFields();

    return () => {
      active = false;
    };
  }, [profile.id]);

  useEffect(() => {
    if (!shouldFocusGithub) return;

    const timeoutId = window.setTimeout(() => {
      githubFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      githubInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [loadingContact, shouldFocusGithub]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const normalizedPublicEmail = publicEmail.trim();
    const normalizedGithubUrl = githubUrl.trim();
    const normalizedLinkedinUrl = linkedinUrl.trim();

    if (bio.trim().length > 160) {
      setError("한 줄 소개는 160자 이하로 입력해 주세요.");
      return;
    }

    if (normalizedPublicEmail && !EMAIL_PATTERN.test(normalizedPublicEmail)) {
      setError("공개 이메일 형식을 확인해 주세요.");
      return;
    }

    if (normalizedGithubUrl && !extractGithubLoginFromProfileUrl(normalizedGithubUrl)) {
      setError("GitHub URL은 https://github.com/아이디 형식으로 입력해 주세요.");
      return;
    }

    if (normalizedLinkedinUrl && !isHttpsUrl(normalizedLinkedinUrl)) {
      setError("LinkedIn URL은 https:// 로 시작하는 주소로 입력해 주세요.");
      return;
    }

    setSaving(true);
    try {
      await saveProfileSettings({
        nicknameDisplay: nickname,
        fullName: profile.fullName ?? "",
        studentId: profile.studentId ?? "",
        phone,
        college: profile.college ?? "",
        department: profile.department ?? "",
        clubAffiliation: profile.clubAffiliation ?? null,
        publicCreditNameMode: profile.publicCreditNameMode,
        loginId: profile.loginId ?? null,
        password: "",
      });
      await updateOwnProfileContactFields({
        profileBio: bio,
        publicEmail: normalizedPublicEmail,
        githubUrl: normalizedGithubUrl,
        linkedinUrl: normalizedLinkedinUrl,
      });
      setSaved(true);
      if (shouldFocusGithub && nextPath && normalizedGithubUrl) {
        window.setTimeout(() => navigate(nextPath), 700);
      }
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(sanitizeUserError(err, "저장에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="kb-root kb-acct-page" style={ACCOUNT_PAGE_WRAPPER}>
      <AccountResponsiveStyles />
      <div
        style={{
          margin: "0 auto",
          maxWidth: 900,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <div
            className="kb-mono kb-acct-eyebrow"
            style={{
              fontSize: 13,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Account · Profile
          </div>
          <h1
            className="kb-display kb-acct-title"
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
              color: "var(--kb-ink-900)",
            }}
          >
            프로필
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--kb-ink-500)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            다른 부원에게 보여지는 기본 정보입니다. 자유롭게 수정할 수 있어요.
          </p>
        </div>

        <AccountTabs />

        <form
          onSubmit={handleSubmit}
          className="kb-acct-card-pad"
          style={{
            ...ACCOUNT_CARD,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {shouldFocusGithub ? (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                border: "1px solid #f4d7aa",
                borderRadius: "var(--kb-radius-sm)",
                background: "#fff9ec",
                color: "#7c4a03",
                padding: "12px 14px",
                fontSize: 13.5,
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <span>
                프로젝트 생성/참여 신청 전에 GitHub URL이 필요합니다. 아래 GitHub URL을 저장하면
                승인 후 Kookmin-Kobot 저장소 초대에 사용됩니다.
              </span>
            </div>
          ) : null}

          {/* avatar */}
          <div>
            <div style={labelStyle}>프로필 사진</div>
            <div className="kb-acct-avatar-row" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--kb-navy-800)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {(() => {
                  const avatar = safeImageUrl(profile.avatarUrl);
                  return avatar ? (
                    <img
                      src={avatar}
                      alt={nickname}
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  );
                })()}
              </div>
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  border: "1px solid var(--kb-border-subtle)",
                  background: "var(--kb-surface-raised)",
                  color: "var(--kb-ink-700)",
                  borderRadius: "var(--kb-radius-sm)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Camera style={{ width: 14, height: 14 }} />
                사진 변경
              </button>
            </div>
          </div>

          {/* nickname */}
          <div>
            <label htmlFor="p-nick" style={labelStyle}>
              닉네임
            </label>
            <input
              id="p-nick"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={inputStyle}
              placeholder="2~12자, 한글/영문/숫자/공백"
            />
            <div
              style={{
                fontSize: 12.5,
                color: "var(--kb-ink-400)",
                marginTop: 6,
              }}
            >
              댓글, 글, 알림 등 부원 간 노출되는 이름입니다.
            </div>
          </div>

          {/* phone */}
          <div>
            <label htmlFor="p-phone" style={labelStyle}>
              전화번호
            </label>
            <input
              id="p-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              placeholder="010-1234-5678"
            />
            <div
              style={{
                fontSize: 12.5,
                color: "var(--kb-ink-400)",
                marginTop: 6,
              }}
            >
              연락 요청 수락 시 본인 동의 하에서만 공개됩니다.
            </div>
          </div>

          <div className="kb-acct-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label htmlFor="p-public-email" style={labelStyle}>
                공개 이메일{" "}
                <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(선택)</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    width: 15,
                    height: 15,
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--kb-ink-400)",
                  }}
                />
                <input
                  id="p-public-email"
                  type="email"
                  value={publicEmail}
                  disabled={loadingContact}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div ref={githubFieldRef}>
              <label htmlFor="p-github" style={labelStyle}>
                GitHub URL{" "}
                <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(프로젝트 필수)</span>
              </label>
              <div style={{ position: "relative" }}>
                <Github
                  style={{
                    width: 15,
                    height: 15,
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: shouldFocusGithub ? "var(--kb-navy-800)" : "var(--kb-ink-400)",
                  }}
                />
                <input
                  id="p-github"
                  ref={githubInputRef}
                  type="url"
                  value={githubUrl}
                  disabled={loadingContact}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: 38,
                    borderColor: shouldFocusGithub ? "var(--kb-navy-800)" : "var(--kb-border-subtle)",
                    boxShadow: shouldFocusGithub ? "0 0 0 3px rgba(16, 48, 120, 0.08)" : undefined,
                  }}
                  placeholder="https://github.com/username"
                />
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--kb-ink-400)",
                  marginTop: 6,
                }}
              >
                프로젝트 승인/참여 승인 후 GitHub 조직·저장소 초대에 쓰입니다.
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="p-linkedin" style={labelStyle}>
              LinkedIn URL{" "}
              <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(선택)</span>
            </label>
            <div style={{ position: "relative" }}>
              <Linkedin
                style={{
                  width: 15,
                  height: 15,
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--kb-ink-400)",
                }}
              />
              <input
                id="p-linkedin"
                type="url"
                value={linkedinUrl}
                disabled={loadingContact}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 38 }}
                placeholder="https://www.linkedin.com/in/username"
              />
            </div>
          </div>

          {/* bio */}
          <div>
            <label htmlFor="p-bio" style={labelStyle}>
              한 줄 소개{" "}
              <span style={{ color: "var(--kb-ink-400)", fontWeight: 400 }}>(선택)</span>
            </label>
            <textarea
              id="p-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              disabled={loadingContact}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55 }}
              placeholder="관심 분야, 최근 작업, 연락 받고 싶은 주제 등"
            />
            <div
              style={{
                fontSize: 12.5,
                color: "var(--kb-ink-400)",
                marginTop: 6,
                textAlign: "right",
              }}
            >
              {bio.length} / 160
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: "var(--kb-danger-700)",
                background: "var(--kb-danger-50)",
                border: "1px solid color-mix(in srgb, var(--kb-danger-500) 30%, transparent)",
                borderRadius: "var(--kb-radius-sm)",
                padding: "10px 14px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* footer */}
          <div
            className="kb-acct-form-footer"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
              borderTop: "1px solid var(--kb-border-subtle)",
              paddingTop: 18,
            }}
          >
            {saved && (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--kb-success-700)",
                  fontWeight: 600,
                }}
              >
                ✓ 저장되었습니다
              </span>
            )}
            <button
              type="submit"
              disabled={saving || loadingContact}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "11px 22px",
                background: saving || loadingContact ? "var(--kb-ink-500)" : "var(--kb-ink-900)",
                color: "var(--kb-on-accent)",
                border: "none",
                borderRadius: "var(--kb-radius-sm)",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: saving || loadingContact ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background var(--kb-duration-normal) var(--kb-ease-standard)",
              }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? "저장 중..." : loadingContact ? "불러오는 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
