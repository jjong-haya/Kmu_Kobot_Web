import { Link } from "react-router";
import wordLogo from "@/assets/wordLogo.png";

type Variant = "editorial" | "tech";

const NAV: Array<{ label: { editorial: string; tech: string }; to: string }> = [
  { label: { editorial: "활동", tech: "/activities" }, to: "/activities" },
  { label: { editorial: "프로젝트", tech: "/projects" }, to: "/projects" },
  { label: { editorial: "공지", tech: "/notice" }, to: "/notice" },
  { label: { editorial: "모집", tech: "/recruit" }, to: "/recruit" },
];

export function PublicHeader({ variant = "tech" }: { variant?: Variant }) {
  if (variant === "editorial") {
    return (
      <header
        style={{
          borderBottom: "1px solid var(--kb-hairline)",
          padding: "20px 56px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          background: "var(--kb-paper)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "baseline", gap: 16, textDecoration: "none" }}>
          <img src={wordLogo} alt="Kookmin Robot" style={{ height: 22, width: "auto" }} />
          <span
            className="kb-mono"
            style={{
              fontSize: 11,
              color: "var(--kb-ink-500)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            국민대 로봇 학술동아리
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 32, fontSize: 14, color: "var(--kb-ink-700)" }}>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              style={{ textDecoration: "none", color: "inherit" }}
              className="hover:text-[var(--kb-navy-800)] transition-colors"
            >
              {n.label.editorial}
            </Link>
          ))}
          <Link to="/login" style={{ color: "var(--kb-navy-800)", fontWeight: 600, textDecoration: "none" }}>
            로그인 →
          </Link>
        </nav>
      </header>
    );
  }
  return (
    <header
      className="kb-mono"
      style={{
        borderBottom: "1px solid var(--kb-hairline)",
        padding: "14px 40px",
        display: "grid",
        gridTemplateColumns: "200px 1fr 200px",
        alignItems: "center",
        background: "var(--kb-paper)",
        fontSize: 12,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center" }}>
        <img src={wordLogo} alt="Kookmin Robot" style={{ height: 22, width: "auto" }} />
      </Link>
      <nav
        style={{
          display: "flex",
          gap: 28,
          justifyContent: "center",
          color: "var(--kb-ink-500)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontSize: 11,
        }}
      >
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            style={{ textDecoration: "none", color: "inherit" }}
            className="hover:text-[var(--kb-navy-800)] transition-colors"
          >
            {n.label.tech}
          </Link>
        ))}
      </nav>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          fontSize: 11,
          color: "var(--kb-ink-500)",
          alignItems: "center",
        }}
      >
        <span>v3.2</span>
        <span>·</span>
        <span style={{ color: "var(--kb-navy-800)" }}>● online</span>
      </div>
    </header>
  );
}
