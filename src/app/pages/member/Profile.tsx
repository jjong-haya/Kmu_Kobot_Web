import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Camera, Save } from "lucide-react";
import {
  AccountTabs,
  AccountResponsiveStyles,
  ACCOUNT_PAGE_WRAPPER,
  ACCOUNT_CARD,
} from "../../components/member/AccountTabs";
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
  border: "1px solid #e8e8e4",
  borderRadius: 10,
  outline: "none",
  fontFamily: "inherit",
  color: "var(--kb-ink-900)",
  background: "#fff",
};

export default function Profile() {
  const { authData, saveProfileSettings } = useAuth();
  const profile = authData.profile;

  const [nickname, setNickname] = useState(profile.nicknameDisplay ?? profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initials =
    (profile.fullName ?? profile.displayName ?? "K")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "K";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
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
      setSaved(true);
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
              color: "#0a0a0a",
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
                  border: "1px solid #ebe8e0",
                  background: "#fff",
                  color: "var(--kb-ink-700)",
                  borderRadius: 8,
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
              maxLength={120}
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
              {bio.length} / 120
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: "#dc2626",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
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
              borderTop: "1px solid #f1ede4",
              paddingTop: 18,
            }}
          >
            {saved && (
              <span
                style={{
                  fontSize: 13,
                  color: "#15803d",
                  fontWeight: 600,
                }}
              >
                ✓ 저장되었습니다
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "11px 22px",
                background: saving ? "#6a6a6a" : "#0a0a0a",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14.5,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
