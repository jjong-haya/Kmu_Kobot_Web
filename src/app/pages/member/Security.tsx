import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Eye, EyeOff, IdCard, KeyRound, ShieldCheck } from "lucide-react";
import {
  AccountTabs,
  AccountResponsiveStyles,
  ACCOUNT_PAGE_WRAPPER,
  ACCOUNT_CARD,
} from "../../components/member/AccountTabs";
import { useAuth } from "../../auth/useAuth";
import { getSupabaseBrowserClient } from "../../auth/supabase";
import { sanitizeUserError } from "../../utils/sanitize-error";

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

const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 32,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: "var(--kb-ink-400)",
          cursor: "pointer",
          borderRadius: 6,
        }}
      >
        {show ? (
          <EyeOff style={{ width: 16, height: 16 }} />
        ) : (
          <Eye style={{ width: 16, height: 16 }} />
        )}
      </button>
    </div>
  );
}

export default function Security() {
  const {
    authData,
    checkLoginIdAvailability,
    refreshAuthData,
    saveProfileSettings,
  } = useAuth();
  const profile = authData.profile;
  const hasLoginPassword = authData.account.hasLoginPassword;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginIdDraft, setLoginIdDraft] = useState(profile.loginId ?? "");
  const [firstPassword, setFirstPassword] = useState("");
  const [firstPasswordConfirm, setFirstPasswordConfirm] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSaved, setCreateSaved] = useState(false);
  const [creatingIdLogin, setCreatingIdLogin] = useState(false);

  useEffect(() => {
    setLoginIdDraft(profile.loginId ?? "");
  }, [profile.loginId]);

  async function handleCreateIdLogin(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSaved(false);

    const normalizedLoginId = loginIdDraft.trim().toLowerCase();
    const missingProfileField = [
      [profile.fullName, "실명"],
      [profile.studentId, "학번"],
      [profile.phone, "전화번호"],
      [profile.college, "단과대"],
      [profile.department, "학과"],
    ].find(([value]) => !String(value ?? "").trim());

    if (!normalizedLoginId) return setCreateError("사용할 로그인 ID를 입력해 주세요.");
    if (!LOGIN_ID_PATTERN.test(normalizedLoginId)) {
      return setCreateError("ID는 4~20자의 영어 소문자와 숫자로 입력해 주세요.");
    }
    if (profile.loginId && normalizedLoginId !== profile.loginId) {
      return setCreateError("이미 등록된 ID와 다른 값입니다. 운영진에게 변경을 요청해 주세요.");
    }
    if (!firstPassword.trim()) return setCreateError("비밀번호를 입력해 주세요.");
    if (firstPassword.trim().length < 8) {
      return setCreateError("비밀번호는 8자 이상이어야 합니다.");
    }
    if (firstPassword !== firstPasswordConfirm) {
      return setCreateError("비밀번호가 일치하지 않습니다.");
    }
    if (missingProfileField) {
      return setCreateError(`${missingProfileField[1]} 정보가 비어 있어 먼저 프로필을 저장해 주세요.`);
    }

    setCreatingIdLogin(true);
    try {
      const available = await checkLoginIdAvailability(normalizedLoginId);
      if (!available) {
        setCreateError("이미 사용 중인 ID입니다.");
        return;
      }

      await saveProfileSettings({
        nicknameDisplay: profile.nicknameDisplay ?? profile.displayName ?? normalizedLoginId,
        fullName: profile.fullName ?? "",
        studentId: profile.studentId ?? "",
        phone: profile.phone ?? "",
        college: profile.college ?? "",
        department: profile.department ?? "",
        clubAffiliation: profile.clubAffiliation ?? null,
        publicCreditNameMode: profile.publicCreditNameMode,
        loginId: normalizedLoginId,
        password: firstPassword,
      });
      await refreshAuthData();

      setCreateSaved(true);
      setFirstPassword("");
      setFirstPasswordConfirm("");
      setTimeout(() => setCreateSaved(false), 2500);
    } catch (err) {
      setCreateError(sanitizeUserError(err, "ID 로그인을 생성하지 못했습니다."));
    } finally {
      setCreatingIdLogin(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!current) return setError("현재 비밀번호를 입력해 주세요.");
    if (next.length < 8) return setError("새 비밀번호는 8자 이상이어야 합니다.");
    if (next !== confirm) return setError("새 비밀번호가 일치하지 않습니다.");
    if (next === current)
      return setError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
    if (!profile.email)
      return setError("이메일이 등록되어 있지 않아 변경할 수 없습니다.");

    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      // 1) verify current password by re-signing in
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: current,
      });
      if (verifyErr) {
        setError("현재 비밀번호가 일치하지 않습니다.");
        return;
      }

      // 2) update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        setError(sanitizeUserError(updateErr, "비밀번호 변경에 실패했습니다."));
        return;
      }

      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(sanitizeUserError(err, "오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
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
            Account · Security
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
            계정 보안
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--kb-ink-500)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            로그인 보안과 비밀번호를 관리합니다.
          </p>
        </div>

        <AccountTabs />

        {/* connected accounts info */}
        <div
          style={{
            ...ACCOUNT_CARD,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "#f8f9fc",
            border: "1px solid #dde3f0",
          }}
        >
          <ShieldCheck
            style={{
              width: 22,
              height: 22,
              color: "var(--kb-navy-800)",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: "var(--kb-ink-900)",
                marginBottom: 2,
              }}
            >
              로그인 ID:{" "}
              <span className="kb-mono" style={{ fontWeight: 600 }}>
                {profile.loginId ?? "미설정"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--kb-ink-500)" }}>
              {hasLoginPassword
                ? "ID와 비밀번호로도 로그인할 수 있습니다."
                : "현재는 Google 로그인만 사용할 수 있습니다. 아래에서 ID 로그인을 추가할 수 있습니다."}
              {" · "}연결된 이메일: {profile.email ?? "—"}
            </div>
          </div>
        </div>

        {!hasLoginPassword ? (
          <form
            onSubmit={handleCreateIdLogin}
            style={{
              ...ACCOUNT_CARD,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 28px 16px",
                borderBottom: "1px solid #f1ede4",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IdCard
                style={{ width: 16, height: 16, color: "var(--kb-ink-700)" }}
              />
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--kb-ink-900)",
                }}
              >
                ID 로그인 생성
              </h2>
            </div>

            <div
              style={{
                padding: "22px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div
                style={{
                  border: "1px solid #d8eadf",
                  background: "#f4fbf6",
                  color: "#146136",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                가입 때 ID 만들기를 넘겼어도 여기서 한 번만 만들 수 있습니다. 생성 후에는 운영진 요청 없이는
                ID를 직접 바꿀 수 없습니다.
              </div>

              <div>
                <label htmlFor="create-login-id" style={labelStyle}>
                  로그인 ID
                </label>
                <input
                  id="create-login-id"
                  type="text"
                  value={loginIdDraft}
                  disabled={Boolean(profile.loginId) || creatingIdLogin}
                  onChange={(event) => setLoginIdDraft(event.target.value.toLowerCase())}
                  placeholder="영어 소문자/숫자 4~20자"
                  style={{
                    ...inputStyle,
                    background: profile.loginId ? "#f5f5f2" : "#fff",
                    cursor: profile.loginId ? "not-allowed" : undefined,
                  }}
                />
              </div>

              <div>
                <label htmlFor="create-password" style={labelStyle}>
                  비밀번호
                </label>
                <PasswordInput
                  id="create-password"
                  value={firstPassword}
                  onChange={setFirstPassword}
                  placeholder="8자 이상"
                />
              </div>

              <div>
                <label htmlFor="create-password-confirm" style={labelStyle}>
                  비밀번호 확인
                </label>
                <PasswordInput
                  id="create-password-confirm"
                  value={firstPasswordConfirm}
                  onChange={setFirstPasswordConfirm}
                  placeholder="한 번 더 입력"
                />
              </div>

              {createError && (
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
                  {createError}
                </div>
              )}
            </div>

            <div
              className="kb-acct-form-footer"
              style={{
                padding: "14px 28px",
                borderTop: "1px solid #f1ede4",
                background: "#fafaf9",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
              }}
            >
              {createSaved && (
                <span
                  style={{
                    fontSize: 13,
                    color: "#15803d",
                    fontWeight: 600,
                  }}
                >
                  ✓ ID 로그인이 생성되었습니다
                </span>
              )}
              <button
                type="submit"
                disabled={creatingIdLogin}
                style={{
                  padding: "10px 22px",
                  background: creatingIdLogin ? "#6a6a6a" : "#0a0a0a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: creatingIdLogin ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {creatingIdLogin ? "생성 중..." : "ID 로그인 생성"}
              </button>
            </div>
          </form>
        ) : null}

        {/* password change form */}
        {hasLoginPassword ? (
          <form
          onSubmit={handleSubmit}
          style={{
            ...ACCOUNT_CARD,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 28px 16px",
              borderBottom: "1px solid #f1ede4",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <KeyRound
              style={{ width: 16, height: 16, color: "var(--kb-ink-700)" }}
            />
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: "var(--kb-ink-900)",
              }}
            >
              비밀번호 변경
            </h2>
          </div>

          <div
            style={{
              padding: "22px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <label htmlFor="s-current" style={labelStyle}>
                현재 비밀번호
              </label>
              <PasswordInput
                id="s-current"
                value={current}
                onChange={setCurrent}
                placeholder="본인 확인을 위해 현재 비밀번호 입력"
              />
            </div>

            <div>
              <label htmlFor="s-new" style={labelStyle}>
                새 비밀번호
              </label>
              <PasswordInput
                id="s-new"
                value={next}
                onChange={setNext}
                placeholder="8자 이상"
              />
            </div>

            <div>
              <label htmlFor="s-confirm" style={labelStyle}>
                새 비밀번호 확인
              </label>
              <PasswordInput
                id="s-confirm"
                value={confirm}
                onChange={setConfirm}
                placeholder="한 번 더 입력"
              />
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
          </div>

          <div
            className="kb-acct-form-footer"
            style={{
              padding: "14px 28px",
              borderTop: "1px solid #f1ede4",
              background: "#fafaf9",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 10,
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
                ✓ 비밀번호가 변경되었습니다
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 22px",
                background: saving ? "#6a6a6a" : "#0a0a0a",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
