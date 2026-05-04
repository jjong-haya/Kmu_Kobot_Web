import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { getPostAuthMemberPath } from "../../auth/onboarding";
import { PublicHeader } from "../../components/public/PublicHeader";
import { useIsMobile } from "../../hooks/useIsMobile";
import MobileLanding from "./MobileLanding";

type StatusLine = [string] | [string, string | null] | [string, string | null, "good" | undefined];

type StatusTab = {
  id: string;
  label: string;
  cmd: string;
  lines: StatusLine[];
};

const STATUS_TABS: StatusTab[] = [
  {
    id: "status",
    label: "status.md",
    cmd: "$ kobot status",
    lines: [
      ["CLUB", null],
      ["  members.active", "27"],
      ["  location", "복지관 B128-1호"],
      [""],
      ["TRACKS", null],
      ["  [01] ROS·ROBOTICS", null],
      ["  [02] EMBEDDED·IOT", null],
      ["  [03] COMPUTER·VISION", null],
      ["  [04] WEB·INTEGRATION", null],
    ],
  },
  {
    id: "notice",
    label: "notice.log",
    cmd: "$ tail -n 8 notice.log",
    lines: [
      ["NEW", null],
      ["  ★ 공간 예약 시스템 오픈", "5/04"],
      [""],
      ["→ /notice", null],
    ],
  },
  {
    id: "recruit",
    label: "recruit.json",
    cmd: "$ kobot recruit --status",
    lines: [
      ["RECRUITMENT", null],
      ["  status", "OPEN", "good"],
      ["  deadline", "2026.03.10"],
      ["  spots", "15"],
      ["  applied", "32 / 60"],
      [""],
      ["REQUIREMENTS", null],
      ["  major", "any · 비전공자 환영"],
      ["  year", "1 ~ 4학년"],
      ["  commitment", "주 4시간"],
      [""],
      ["NEXT STEP", null],
      ["  → cd /recruit && submit"],
    ],
  },
];

function StatusStack() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % STATUS_TABS.length), 4500);
    return () => window.clearInterval(id);
  }, [auto]);

  const current = STATUS_TABS[active];

  return (
    <div
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => setAuto(true)}
      style={{
        background: "var(--kb-ink-900)",
        borderRadius: 10,
        fontFamily: "var(--kb-font-mono)",
        boxShadow: "0 30px 60px -20px rgba(8, 32, 88, 0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 460,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          background: "#0a0a0a",
          padding: "10px 14px 0",
          gap: 4,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 6, paddingBottom: 10, marginRight: 10 }}>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: "#ff5f57" }} />
          <span style={{ width: 11, height: 11, borderRadius: 6, background: "#febc2e" }} />
          <span style={{ width: 11, height: 11, borderRadius: 6, background: "#28c840" }} />
        </div>
        {STATUS_TABS.map((tab, i) => {
          const isActive = i === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActive(i);
                setAuto(false);
                window.setTimeout(() => setAuto(true), 8000);
              }}
              style={{
                position: "relative",
                padding: "8px 16px 10px",
                fontFamily: "inherit",
                fontSize: 12,
                background: isActive ? "var(--kb-ink-900)" : "transparent",
                color: isActive ? "#e7e7e3" : "#666",
                border: 0,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 110,
                transition: "color 200ms, background 200ms",
                marginBottom: -1,
                zIndex: isActive ? 2 : 1,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: isActive ? "#7ab8ff" : "#444",
                  transition: "background 200ms",
                }}
              />
              <span>{tab.label}</span>
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    background: "#7ab8ff",
                  }}
                />
              )}
            </button>
          );
        })}
        <span style={{ color: "#444", padding: "8px 10px 10px", fontSize: 14, marginLeft: "auto", paddingRight: 4 }}>
          +
        </span>
      </div>

      <div
        key={current.id}
        style={{
          color: "#e7e7e3",
          padding: 24,
          fontSize: 12.5,
          lineHeight: 1.85,
          flex: 1,
          animation: "kb-tab-in 360ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div style={{ color: "#9a9a98", marginBottom: 14 }}>
          {current.cmd}
          <span style={{ marginLeft: 6, color: "#7ab8ff", animation: "kb-blink 1s infinite" }}>▊</span>
        </div>
        {current.lines.map((line, idx) => {
          if (!line[0]) return <div key={idx} style={{ height: 6 }} />;
          const [k, v, kind] = line as [string, string | null | undefined, string | undefined];
          if (v === null || v === undefined) {
            return (
              <div key={idx} style={{ color: "#7ab8ff", marginTop: idx > 0 ? 10 : 0, marginBottom: 4 }}>
                {k} {"─".repeat(Math.max(0, 38 - k.length))}
              </div>
            );
          }
          return (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "#e7e7e3" }}>
              <span>{k}</span>
              <span style={{ color: kind === "good" ? "#7ab8ff" : "#bdbdbb" }}>{v}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "#0a0a0a",
          padding: "6px 14px",
          fontSize: 10,
          color: "#666",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #1a1a1a",
        }}
      >
        <span>tab {active + 1} / {STATUS_TABS.length}</span>
        <span style={{ display: "flex", gap: 6 }}>
          {STATUS_TABS.map((_, j) => (
            <span
              key={j}
              style={{
                width: 16,
                height: 2,
                background: j === active ? "#7ab8ff" : "#222",
                transition: "background 300ms",
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

const gridBg: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--kb-hairline-2) 1px, transparent 1px), linear-gradient(90deg, var(--kb-hairline-2) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  backgroundPosition: "-1px -1px",
};

export default function Landing() {
  const navigate = useNavigate();
  const { authData, memberStatus, session } = useAuth();
  const isLoggedIn = Boolean(session);
  const memberEntryPath = getPostAuthMemberPath(authData, memberStatus);
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLanding />;
  }

  return (
    <div className="kb-root" style={{ background: "var(--kb-paper)", minHeight: "100vh" }}>
      <PublicHeader variant="tech" />

      <section style={{ ...gridBg, padding: "80px 40px", minHeight: "calc(100vh - 50px)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto" }}>
          <div className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-500)", marginBottom: 56 }}>
            <span style={{ color: "var(--kb-navy-800)" }}>~/kobot</span>
            <span style={{ margin: "0 8px" }}>$</span>
            <span>cat README.md</span>
            <span style={{ marginLeft: 8, animation: "kb-blink 1s infinite" }}>▊</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
              gap: 64,
              alignItems: "start",
            }}
            className="lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] grid-cols-1"
          >
            <div className="kb-fade-up">
              <h1
                className="kb-display"
                style={{ margin: 0, color: "var(--kb-ink-900)", fontWeight: 700, lineHeight: 0.88 }}
              >
                <span
                  className="kb-mono"
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--kb-ink-500)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    marginBottom: 28,
                  }}
                >
                  <span style={{ color: "var(--kb-navy-800)" }}>● </span>
                  Kookmin · Robotics · Club
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "clamp(56px, 7vw, 88px)",
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
                    fontSize: "clamp(56px, 7vw, 88px)",
                    fontWeight: 300,
                    color: "var(--kb-ink-700)",
                    letterSpacing: "-0.035em",
                    fontStyle: "italic",
                    marginBottom: 6,
                  }}
                >
                  Deploy &amp; Run
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "clamp(96px, 14vw, 184px)",
                    lineHeight: 0.85,
                    fontWeight: 800,
                    letterSpacing: "-0.07em",
                    color: "var(--kb-navy-800)",
                    marginLeft: -6,
                  }}
                >
                  KOBOT.
                </span>
              </h1>

              <p
                className="kb-mono"
                style={{
                  fontSize: 14,
                  color: "var(--kb-ink-700)",
                  maxWidth: 560,
                  lineHeight: 1.8,
                  marginTop: 36,
                }}
              >
                {"> "}국민대 소프트웨어융합대학 로봇 학술 동아리.
                <br />
                {"> "}Kookmin Robotics Club.
                <br />
                {"> "}로봇 · 개발 · 연구 · IoT.
              </p>

              <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {isLoggedIn ? (
                  <button
                    type="button"
                    className="kb-mono"
                    onClick={() => navigate(memberEntryPath)}
                    style={{
                      padding: "14px 24px",
                      background: "var(--kb-ink-900)",
                      color: "var(--kb-paper)",
                      border: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                    }}
                  >
                    $ cd member/dashboard
                  </button>
                ) : (
                  <Link
                    to="/recruit"
                    className="kb-mono"
                    style={{
                      padding: "14px 24px",
                      background: "var(--kb-ink-900)",
                      color: "var(--kb-paper)",
                      border: 0,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                  >
                    $ apply --recruit-2026
                  </Link>
                )}
                <Link
                  to="/activities"
                  className="kb-mono"
                  style={{
                    padding: "14px 24px",
                    background: "transparent",
                    color: "var(--kb-ink-900)",
                    border: "1px solid var(--kb-ink-900)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  $ ls activities/
                </Link>
              </div>
            </div>

            <div className="kb-fade-up" style={{ animationDelay: "120ms" }}>
              <StatusStack />
            </div>
          </div>

          <div
            className="kb-mono"
            style={{
              marginTop: 80,
              paddingTop: 24,
              borderTop: "1px dashed var(--kb-ink-300)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 32,
              fontSize: 12,
            }}
          >
            {[
              ["[ROS]", "Navigation, MoveIt, Gazebo"],
              ["[EMBED]", "STM32, Arduino, RTOS"],
              ["[VISION]", "OpenCV, YOLO, PyTorch"],
              ["[WEB]", "React, FastAPI, ROS Bridge"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: "var(--kb-navy-800)", fontWeight: 600, marginBottom: 8 }}>{k}</div>
                <div style={{ color: "var(--kb-ink-500)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
