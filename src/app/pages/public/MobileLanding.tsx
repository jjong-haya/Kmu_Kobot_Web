import { Link, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { getPostAuthMemberPath } from "../../auth/onboarding";
import wordLogo from "@/assets/wordLogo.png";

/* status / notice / tracks data — same vibe as desktop */
const STATUS_LINES: [string, string | null][] = [
  ["동아리", null],
  ["  활동 부원", "27명"],
  ["  위치", "복지관 B128-1호"],
];

const TRACKS: [string, string, string][] = [
  ["01", "ROS · ROBOTICS", "Navigation, MoveIt, Gazebo"],
  ["02", "EMBEDDED · IOT", "STM32, Arduino, RTOS"],
  ["03", "COMPUTER · VISION", "OpenCV, YOLO, PyTorch"],
  ["04", "WEB · INTEGRATION", "React, FastAPI, ROS Bridge"],
];

const NOTICES: [string, string, string, string][] = [
  ["[NEW]", "공간 예약 시스템 오픈 — 동아리실 일정 캘린더로 관리", "5/04", "space-booking-launch"],
];

export default function MobileLanding() {
  const navigate = useNavigate();
  const { authData, memberStatus, session } = useAuth();
  const isLoggedIn = Boolean(session);
  const memberEntryPath = getPostAuthMemberPath(authData, memberStatus);

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "100vh",
        // subtle dot grid (24px) + soft navy glow at top-right
        background:
          "radial-gradient(circle 600px at 100% -100px, rgba(16, 48, 120, 0.07), transparent 60%), " +
          "radial-gradient(rgba(16, 48, 120, 0.12) 1px, transparent 1px) 0 0 / 24px 24px, " +
          "var(--kb-paper)",
      }}
    >
      {/* compact header — same line as desktop public header but minimal */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--kb-paper)",
          borderBottom: "1px solid var(--kb-hairline)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <img src={wordLogo} alt="Kobot" style={{ height: 18 }} />
        </Link>
        <Link
          to="/login"
          style={{
            fontSize: 13,
            color: "var(--kb-ink-700)",
            textDecoration: "none",
            padding: "7px 14px",
            border: "1px solid var(--kb-hairline)",
            borderRadius: 8,
            background: "var(--kb-paper)",
            fontWeight: 500,
          }}
        >
          로그인
        </Link>
      </header>

      <section style={{ padding: "32px 20px 56px" }}>
        {/* prompt */}
        <div
          className="kb-mono"
          style={{
            fontSize: 10.5,
            color: "var(--kb-ink-500)",
            marginBottom: 28,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: "var(--kb-navy-800)" }}>~/kobot</span>
          <span style={{ margin: "0 6px" }}>$</span>
          <span>cat README.md</span>
          <span style={{ marginLeft: 6, animation: "kb-blink 1s infinite" }}>▊</span>
        </div>

        {/* hero block — same typography as desktop, scaled */}
        <div className="kb-fade-up">
          <span
            className="kb-mono"
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            <span style={{ color: "var(--kb-navy-800)" }}>● </span>
            Kookmin · Robotics · Club
          </span>

          <h1
            className="kb-display"
            style={{ margin: 0, lineHeight: 0.92, fontWeight: 700 }}
          >
            <span
              style={{
                display: "block",
                fontSize: 36,
                fontWeight: 300,
                color: "var(--kb-ink-700)",
                letterSpacing: "-0.035em",
                fontStyle: "italic",
              }}
            >
              Build,
            </span>
            <span
              style={{
                display: "block",
                fontSize: 36,
                fontWeight: 300,
                color: "var(--kb-ink-700)",
                letterSpacing: "-0.035em",
                fontStyle: "italic",
              }}
            >
              Deploy &amp; Run
            </span>
            <span
              style={{
                display: "block",
                fontSize: 64,
                lineHeight: 0.85,
                fontWeight: 800,
                letterSpacing: "-0.07em",
                color: "var(--kb-navy-800)",
                marginLeft: -3,
                marginTop: 4,
              }}
            >
              KOBOT.
            </span>
          </h1>

          <p
            style={{
              fontSize: 14.5,
              color: "var(--kb-ink-700)",
              lineHeight: 1.7,
              marginTop: 24,
              fontWeight: 500,
            }}
          >
            국민대 소프트웨어융합대학 로봇 학술 동아리.
            <br />
            <span className="kb-mono" style={{ fontSize: 12, color: "var(--kb-ink-500)" }}>
              Kookmin Robotics Club
            </span>
            <br />
            <span style={{ color: "var(--kb-ink-500)" }}>
              로봇 · 개발 · 연구 · IoT
            </span>
          </p>

          {/* CTAs — only show member dashboard shortcut when logged in */}
          {isLoggedIn && (
            <div style={{ marginTop: 28 }}>
              <button
                type="button"
                className="kb-mono"
                onClick={() => navigate(memberEntryPath)}
                style={{
                  padding: "14px 18px",
                  background: "var(--kb-ink-900)",
                  color: "var(--kb-paper)",
                  border: 0,
                  fontSize: 11.5,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                $ cd member/dashboard
              </button>
            </div>
          )}
        </div>

        {/* status block — terminal panel */}
        <div
          className="kb-fade-up"
          style={{
            marginTop: 40,
            border: "1px solid var(--kb-ink-900)",
            background: "var(--kb-paper)",
          }}
        >
          <div
            className="kb-mono"
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--kb-ink-900)",
              fontSize: 10.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--kb-ink-900)",
              color: "var(--kb-paper)",
              letterSpacing: "0.04em",
            }}
          >
            <span>status.md</span>
            <span style={{ opacity: 0.6 }}>$ kobot status</span>
          </div>
          <div
            style={{ padding: "14px 16px", fontSize: 14, lineHeight: 1.9 }}
          >
            {STATUS_LINES.map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: v == null ? "var(--kb-navy-800)" : "var(--kb-ink-700)",
                  fontWeight: v == null ? 700 : 500,
                }}
              >
                <span style={{ whiteSpace: "pre" }}>{k}</span>
                {v != null && (
                  <span
                    className="kb-mono"
                    style={{ color: "var(--kb-ink-900)", fontWeight: 600, fontSize: 13 }}
                  >
                    {v}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* tracks list — keep numbered bracket style */}
        <div style={{ marginTop: 40 }}>
          <div
            className="kb-mono"
            style={{
              fontSize: 10.5,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.16em",
              marginBottom: 14,
              borderTop: "1px dashed var(--kb-ink-300)",
              paddingTop: 14,
            }}
          >
            <span style={{ color: "var(--kb-navy-800)" }}>// </span>TRACKS
          </div>
          <div style={{ lineHeight: 1.6 }}>
            {TRACKS.map(([num, name, desc]) => (
              <div
                key={num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: "1px dashed var(--kb-ink-300)",
                  alignItems: "baseline",
                }}
              >
                <span
                  className="kb-mono"
                  style={{
                    color: "var(--kb-navy-800)",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  [{num}]
                </span>
                <div>
                  <div
                    className="kb-mono"
                    style={{
                      color: "var(--kb-ink-900)",
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      color: "var(--kb-ink-500)",
                      fontSize: 12.5,
                      marginTop: 4,
                      fontWeight: 500,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* notice log — terminal log style */}
        <div style={{ marginTop: 40 }}>
          <div
            className="kb-mono"
            style={{
              fontSize: 10.5,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.16em",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              <span style={{ color: "var(--kb-navy-800)" }}>// </span>NOTICE.LOG
            </span>
            <Link
              to="/notice"
              className="kb-mono"
              style={{
                color: "var(--kb-ink-700)",
                textDecoration: "none",
                fontSize: 10.5,
                letterSpacing: "0.16em",
                fontWeight: 500,
              }}
            >
              전체보기 →
            </Link>
          </div>
          <div
            style={{
              border: "1px solid var(--kb-hairline)",
              background: "var(--kb-paper-2)",
              padding: "4px 0",
              lineHeight: 1.7,
            }}
          >
            {NOTICES.map(([tag, title, date, slug]) => (
              <Link
                key={title}
                to={`/notice/${slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 10,
                  alignItems: "baseline",
                  padding: "10px 16px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  className="kb-mono"
                  style={{
                    color:
                      tag === "[NEW]" || tag === "[PINNED]"
                        ? "var(--kb-navy-800)"
                        : "var(--kb-ink-500)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
                <span
                  style={{
                    color: "var(--kb-ink-900)",
                    fontWeight: 600,
                    fontSize: 13.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </span>
                <span
                  className="kb-mono"
                  style={{ color: "var(--kb-ink-500)", fontSize: 11 }}
                >
                  {date}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* footer prompt */}
        <div
          className="kb-mono"
          style={{
            marginTop: 36,
            fontSize: 10.5,
            color: "var(--kb-ink-500)",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          <div>
            <Link
              to="/privacy"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              privacy
            </Link>
            <span style={{ margin: "0 8px" }}>·</span>
            <Link
              to="/terms"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              terms
            </Link>
            <span style={{ margin: "0 8px" }}>·</span>
            <Link
              to="/contact"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              contact
            </Link>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: "var(--kb-navy-800)" }}>$ </span>echo
            "© 2026 KOBOT · Kookmin University"
          </div>
        </div>
      </section>
    </div>
  );
}
