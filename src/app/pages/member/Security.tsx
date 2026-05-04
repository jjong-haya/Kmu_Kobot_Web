import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
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
  const { authData } = useAuth();
  const profile = authData.profile;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
                {profile.loginId ?? "—"}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--kb-ink-500)" }}>
              연결된 이메일: {profile.email ?? "—"}
            </div>
          </div>
        </div>

        {/* password change form */}
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
      </div>
    </div>
  );
}
