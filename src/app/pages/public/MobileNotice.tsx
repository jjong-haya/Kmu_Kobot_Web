import { Link } from "react-router";
import wordLogo from "@/assets/wordLogo.png";
import { NOTICES } from "./Notice";

export default function MobileNotice() {
  return (
    <div
      className="kb-root"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle 600px at 100% -100px, rgba(16, 48, 120, 0.07), transparent 60%), " +
          "radial-gradient(rgba(16, 48, 120, 0.12) 1px, transparent 1px) 0 0 / 24px 24px, " +
          "var(--kb-paper)",
      }}
    >
      {/* compact header */}
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
          to="/"
          aria-label="홈"
          style={{
            fontSize: 18,
            color: "var(--kb-ink-700)",
            textDecoration: "none",
            padding: "2px 10px",
            lineHeight: 1,
          }}
        >
          ←
        </Link>
      </header>

      <section style={{ padding: "32px 20px 56px" }}>
        {/* prompt */}
        <div
          className="kb-mono"
          style={{
            fontSize: 10.5,
            color: "var(--kb-ink-500)",
            marginBottom: 20,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: "var(--kb-navy-800)" }}>~/kobot</span>
          <span style={{ margin: "0 6px" }}>$</span>
          <span>cat notice/</span>
        </div>

        {/* page heading */}
        <div
          className="kb-mono"
          style={{
            fontSize: 11,
            color: "var(--kb-ink-500)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          <span style={{ color: "var(--kb-navy-800)" }}>● </span>NOTICE
        </div>
        <h1
          className="kb-display"
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "var(--kb-ink-900)",
          }}
        >
          공지사항
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--kb-ink-500)",
            margin: "8px 0 0",
            lineHeight: 1.55,
            fontWeight: 500,
          }}
        >
          동아리 운영 / 시스템 공지
        </p>

        {/* notice list */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          {NOTICES.map((n) => (
            <Link
              key={n.slug}
              to={`/notice/${n.slug}`}
              style={{
                border: "1px solid var(--kb-hairline)",
                background: "var(--kb-paper)",
                padding: "18px 18px 20px",
                position: "relative",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              {/* category + pin */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                {n.pinned && (
                  <span
                    className="kb-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--kb-navy-800)",
                      background: "var(--kb-navy-50)",
                      padding: "2px 8px",
                      letterSpacing: "0.06em",
                    }}
                  >
                    ★ PINNED
                  </span>
                )}
                <span
                  className="kb-mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--kb-ink-500)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  [{n.category}]
                </span>
                <span
                  className="kb-mono"
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--kb-ink-500)",
                  }}
                >
                  {n.date}
                </span>
              </div>

              {/* title */}
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--kb-ink-900)",
                  margin: "0 0 8px",
                  lineHeight: 1.4,
                  letterSpacing: "-0.01em",
                }}
              >
                {n.title}
              </h2>

              {/* preview / body */}
              <p
                style={{
                  fontSize: 14,
                  color: "var(--kb-ink-700)",
                  margin: 0,
                  lineHeight: 1.65,
                  fontWeight: 500,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {n.preview}
              </p>
              <div
                className="kb-mono"
                style={{
                  marginTop: 10,
                  fontSize: 10.5,
                  color: "var(--kb-ink-500)",
                  letterSpacing: "0.04em",
                }}
              >
                $ open →
              </div>
            </Link>
          ))}

          {NOTICES.length === 0 && (
            <div
              className="kb-mono"
              style={{
                padding: "40px 16px",
                textAlign: "center",
                fontSize: 12,
                color: "var(--kb-ink-500)",
                border: "1px dashed var(--kb-ink-300)",
              }}
            >
              아직 등록된 공지가 없습니다.
            </div>
          )}
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
          <span style={{ color: "var(--kb-navy-800)" }}>$ </span>
          echo "{NOTICES.length} item(s)"
        </div>
      </section>
    </div>
  );
}
