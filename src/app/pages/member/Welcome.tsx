import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Navigate } from "react-router";
import { ArrowRight, Sparkles, Ticket } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { isJoinRequestComplete } from "../../auth/onboarding";
import { getSupabaseBrowserClient } from "../../auth/supabase";
import { sanitizeUserError } from "../../utils/sanitize-error";

export default function Welcome() {
  const navigate = useNavigate();
  const { authData, memberStatus, refreshAuthData } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // already past this step → redirect away
  if (
    memberStatus === "active" ||
    memberStatus === "course_member" ||
    isJoinRequestComplete(authData)
  ) {
    return <Navigate to="/member" replace />;
  }

  async function handleRedeem(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: rpcErr } = await supabase.rpc(
        "redeem_course_invite",
        { invite_code: code.trim() },
      );
      if (rpcErr) {
        setError(
          sanitizeUserError(rpcErr, "코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요."),
        );
        return;
      }
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        // RPC returns controlled friendly messages — safe to show
        setError(result?.message ?? "유효하지 않은 코드입니다.");
        return;
      }
      // refresh authData so memberStatus updates to course_member
      await refreshAuthData();
      navigate("/member", { replace: true });
    } catch (err) {
      setError(sanitizeUserError(err, "오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    navigate("/member/join", { replace: true });
  }

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle 600px at 100% -100px, rgba(16, 48, 120, 0.07), transparent 60%), " +
          "radial-gradient(rgba(16, 48, 120, 0.12) 1px, transparent 1px) 0 0 / 24px 24px, " +
          "var(--kb-paper)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "8vh 16px 32px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          border: "1px solid #e8e8e4",
          borderRadius: 20,
          boxShadow: "0 12px 36px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* black hero strip (text removed, icon + eyebrow only) */}
        <div
          style={{
            padding: "26px 28px 22px",
            background: "#0a0a0a",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255,255,255,0.1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Sparkles style={{ width: 22, height: 22 }} />
          </div>
          <div
            className="kb-mono"
            style={{
              fontSize: 11.5,
              letterSpacing: "0.18em",
              opacity: 0.6,
            }}
          >
            WELCOME
          </div>
        </div>

        <div
          style={{
            padding: "26px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Ticket
                style={{
                  width: 18,
                  height: 18,
                  color: "var(--kb-navy-800)",
                }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--kb-ink-900)",
                }}
              >
                참여 코드가 있으신가요?
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "var(--kb-ink-500)",
                lineHeight: 1.6,
              }}
            >
              운영진에게 받은 코드가 있다면 입력해 주세요. 없어도 그냥 넘어갈 수
              있어요.
            </p>
          </div>

          <form
            onSubmit={handleRedeem}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: SLAM2026"
              autoFocus
              maxLength={32}
              style={{
                width: "100%",
                padding: "13px 16px",
                fontSize: 15,
                border: "1px solid #e8e8e4",
                borderRadius: 12,
                outline: "none",
                fontFamily: "var(--kb-font-mono)",
                color: "var(--kb-ink-900)",
                letterSpacing: "0.04em",
                fontWeight: 600,
              }}
            />
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

            <button
              type="submit"
              disabled={submitting || !code.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "13px 20px",
                background:
                  submitting || !code.trim() ? "#6a6a6a" : "#0a0a0a",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor:
                  submitting || !code.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "확인 중..." : "코드 입력하고 계속"}
              {!submitting && <ArrowRight style={{ width: 15, height: 15 }} />}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "var(--kb-ink-400)",
              fontWeight: 500,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "#ebe8e0" }} />
            또는
            <span style={{ flex: 1, height: 1, background: "#ebe8e0" }} />
          </div>

          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px 20px",
              background: "#fff",
              color: "var(--kb-ink-700)",
              border: "1px solid #ebe8e0",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            건너뛰고 정식 가입 진행
          </button>

          <p
            style={{
              fontSize: 12,
              color: "var(--kb-ink-400)",
              textAlign: "center",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            건너뛰면 일반 회원 가입 정보 입력 단계로 이동합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
