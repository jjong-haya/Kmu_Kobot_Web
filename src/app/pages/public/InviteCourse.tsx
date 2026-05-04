import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useSearchParams, Navigate, Link } from "react-router";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";

const COURSE_INVITE_KEY = "kobot:course-invite-code";

const wrapperStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #fafaf9 0%, #f4f4f2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  fontFamily: "var(--kb-font-body, system-ui)",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  border: "1px solid #e8e8e4",
  borderRadius: 20,
  boxShadow: "0 12px 36px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)",
  overflow: "hidden",
};

export default function InviteCourse() {
  const [params] = useSearchParams();
  const inviteCode = params.get("code") ?? "";
  const { signInWithGoogle, isInitializing, session, isConfigured } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store invite code so AuthCallback can pick it up after OAuth round-trip
  useEffect(() => {
    if (inviteCode) {
      try {
        window.localStorage.setItem(COURSE_INVITE_KEY, inviteCode);
      } catch {
        /* localStorage may be unavailable */
      }
    }
  }, [inviteCode]);

  if (session && !isInitializing) {
    return <Navigate to="/member" replace />;
  }

  async function handleSignup() {
    if (!isConfigured) {
      setError("서비스 설정이 아직 완료되지 않았습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle("/auth/callback?course=1");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google 로그인을 시작하지 못했습니다.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="kb-root" style={wrapperStyle}>
      <div style={cardStyle}>
        {/* hero */}
        <div
          style={{
            padding: "32px 28px 24px",
            background: "#0a0a0a",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <GraduationCap style={{ width: 28, height: 28 }} />
          </div>
          <div
            className="kb-mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            COURSE INVITE
          </div>
          <h1
            className="kb-display"
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            KOSS로 가입
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              margin: "10px 0 0",
              lineHeight: 1.55,
            }}
          >
            초대 코드로 들어온 KOSS 참여자용 가입 링크입니다.
          </p>
        </div>

        {/* body */}
        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* info: scope */}
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--kb-ink-400)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              KOSS 회원이 사용할 수 있는 메뉴
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                "대시보드 — 활동 요약 보기",
                "알림 — 운영진/공지 알림 수신",
                "공지사항 — 동아리 공지 열람",
                "연락 요청 — 부원에게 안전한 연락 요청",
                "멤버 — 동아리 멤버 디렉토리 보기",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 14,
                    color: "var(--kb-ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  <CheckCircle2
                    style={{
                      width: 16,
                      height: 16,
                      color: "#15803d",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* invite code badge */}
          {inviteCode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "#f8f9fc",
                border: "1px solid #dde3f0",
                borderRadius: 10,
                fontSize: 13.5,
              }}
            >
              <span style={{ color: "var(--kb-ink-500)" }}>초대 코드</span>
              <code
                className="kb-mono"
                style={{
                  fontWeight: 700,
                  color: "var(--kb-navy-800)",
                  fontSize: 13,
                }}
              >
                {inviteCode}
              </code>
            </div>
          )}

          {!inviteCode && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                fontSize: 13.5,
                color: "#92400e",
                lineHeight: 1.5,
              }}
            >
              <AlertCircle
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  marginTop: 2,
                  color: "#d97706",
                }}
              />
              초대 코드가 URL에 포함되어 있지 않습니다. 운영진에게 받은 정확한
              링크로 다시 접속해 주세요.
            </div>
          )}

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

          {/* Google sign-up CTA */}
          <button
            type="button"
            onClick={handleSignup}
            disabled={submitting || !isConfigured || isInitializing || !inviteCode}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "14px 20px",
              background:
                submitting || !inviteCode ? "#6a6a6a" : "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor:
                submitting || !inviteCode ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitting ? "Google로 이동 중..." : "Google로 계속하기"}
            {!submitting && (
              <ArrowRight style={{ width: 16, height: 16 }} />
            )}
          </button>

          <div
            style={{
              fontSize: 12.5,
              color: "var(--kb-ink-400)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            로그인 후 자동으로 KOSS 권한이 적용됩니다.
            <br />
            정규 부원으로 가입하려면{" "}
            <Link
              to="/login"
              style={{
                color: "var(--kb-navy-800)",
                textDecoration: "underline",
              }}
            >
              일반 로그인
            </Link>
            을 이용하세요.
          </div>
        </div>
      </div>
    </div>
  );
}

export { COURSE_INVITE_KEY };
