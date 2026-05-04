import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/* ──────────────────────────────────────────────────────────────────
 * Design Lab — 4 dashboard mockups in distinct visual languages.
 * Same data, different design philosophies. Pick one to converge on.
 * ────────────────────────────────────────────────────────────────── */

const SAMPLE = {
  user: "코봇 회장",
  role: "President",
  initials: "코회",
  date: "5월 3일 (토)",
  kpis: [
    { label: "출석률", value: "94", unit: "%", delta: "+2%", trend: "up" as const },
    { label: "이번 달 세션", value: "8", unit: "회", delta: "4회 남음", trend: "flat" as const },
    { label: "진행중 프로젝트", value: "2", unit: "개", delta: "1개 완료", trend: "flat" as const },
    { label: "마감 임박", value: "1", unit: "개", delta: "D-3", trend: "down" as const },
  ],
  today: [
    { time: "마감", title: "컴퓨터 비전 과제 제출", meta: "오늘 23:59", urgent: true },
    { time: "19:00", title: "ROS 2 Navigation 세미나", meta: "과기관 310호", urgent: false },
    { time: "마감", title: "프로젝트 문서 작성", meta: "내일까지", urgent: false },
  ],
  projects: [
    { name: "자율주행 로봇 개발", role: "리드", prog: 65, members: 5 },
    { name: "딥러닝 기반 물체 인식", role: "참여", prog: 40, members: 6 },
  ],
  navSections: [
    { label: "내 활동", items: ["대시보드", "알림", "연락 요청"] },
    { label: "소통", items: ["공지", "Q&A"] },
    { label: "학습", items: ["스터디 기록", "플레이리스트", "동료 리뷰"] },
    { label: "프로젝트", items: ["프로젝트", "쇼케이스"] },
  ],
};

type VariantKey = "linear" | "vercel" | "notion" | "operator" | "bento" | "brutalist" | "glass" | "terminal";

const VARIANTS: Array<{ key: VariantKey; name: string; tag: string; desc: string }> = [
  { key: "linear",    name: "Linear",       tag: "Dense · Mono · Hairline",            desc: "Sharp grayscale, mono labels, no shadows. Information density first." },
  { key: "vercel",    name: "Geist/Vercel", tag: "Clean · Soft · Spacious",            desc: "Generous whitespace, soft shadows, big numerical KPIs. Premium calm." },
  { key: "notion",    name: "Notion",       tag: "Document · Minimal · Content-first", desc: "Almost no chrome. Reads like a document. Inline buttons, big titles." },
  { key: "operator",  name: "Operator",     tag: "Data-rich · Dark · Sparkline",       desc: "Datadog/Posthog vibe. Dark side, sparklines, dense metrics." },
  { key: "bento",     name: "Bento",        tag: "Tile · Mixed-size · Apple-y",        desc: "Apple Bento box grid. Mixed-size rounded tiles, asymmetric, playful." },
  { key: "brutalist", name: "Brutalist",    tag: "Sharp · Bold · Editorial",           desc: "Black borders, sharp corners, oversized typography. Newsprint energy." },
  { key: "glass",     name: "Glass",        tag: "Gradient · Frosted · Pastel",        desc: "Gradient mesh background, frosted glass cards, soft pastels. Premium vibe." },
  { key: "terminal",  name: "Terminal",     tag: "ASCII · Mono · Hacker",              desc: "Full terminal — ASCII boxes, mono everywhere, green-on-black aesthetic." },
];

export default function DesignLab() {
  const [active, setActive] = useState<VariantKey>("linear");
  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f4", fontFamily: "Pretendard, system-ui" }}>
      {/* Top bar with picker */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#0a0a0a",
          color: "#fff",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <strong style={{ fontSize: 14, letterSpacing: "-0.01em" }}>Kobot · Design Lab</strong>
          <span style={{ fontSize: 11, color: "#999", fontFamily: "JetBrains Mono, monospace" }}>
            dashboard-variants/v1
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
          {VARIANTS.map((v, i) => {
            const sel = active === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setActive(v.key)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid " + (sel ? "#fff" : "#333"),
                  background: sel ? "#fff" : "transparent",
                  color: sel ? "#000" : "#bbb",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 200ms",
                }}
              >
                <span style={{ opacity: 0.6, marginRight: 6, fontFamily: "JetBrains Mono, monospace" }}>
                  0{i + 1}
                </span>
                {v.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description band */}
      <div
        style={{
          padding: "16px 24px",
          background: "#fff",
          borderBottom: "1px solid #e7e7e3",
          display: "flex",
          gap: 24,
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Now showing
          </span>
          <strong style={{ fontSize: 16 }}>{VARIANTS.find((v) => v.key === active)?.name}</strong>
          <span
            style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "#888",
            }}
          >
            {VARIANTS.find((v) => v.key === active)?.tag}
          </span>
        </div>
        <span style={{ fontSize: 13, color: "#555" }}>
          {VARIANTS.find((v) => v.key === active)?.desc}
        </span>
      </div>

      {/* Mockup canvas */}
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            border: "1px solid #d8d8d3",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 30px 60px -25px rgba(0,0,0,0.18)",
          }}
        >
          {active === "linear" && <LinearVariant />}
          {active === "vercel" && <VercelVariant />}
          {active === "notion" && <NotionVariant />}
          {active === "operator" && <OperatorVariant />}
          {active === "bento" && <BentoVariant />}
          {active === "brutalist" && <BrutalistVariant />}
          {active === "glass" && <GlassVariant />}
          {active === "terminal" && <TerminalVariant />}
        </div>
      </div>
    </div>
  );
}

/* ───────── shared building blocks ───────── */

function MockSidebar({
  background = "#fff",
  text = "#333",
  activeBg = "#000",
  activeText = "#fff",
  sectionStyle,
  itemStyle,
  border = "#e7e7e3",
  brandStyle,
  brand,
}: {
  background?: string;
  text?: string;
  activeBg?: string;
  activeText?: string;
  sectionStyle?: CSSProperties;
  itemStyle?: CSSProperties;
  border?: string;
  brandStyle?: CSSProperties;
  brand?: ReactNode;
}) {
  return (
    <aside
      style={{
        width: 220,
        background,
        color: text,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          borderBottom: `1px solid ${border}`,
          ...brandStyle,
        }}
      >
        {brand ?? (
          <strong style={{ fontSize: 14, letterSpacing: "-0.02em" }}>
            <span
              style={{
                background: activeBg,
                color: activeText,
                padding: "2px 6px",
                borderRadius: 4,
                marginRight: 6,
                fontWeight: 700,
              }}
            >
              K
            </span>
            kobot
          </strong>
        )}
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", fontSize: 13 }}>
        {SAMPLE.navSections.map((sec) => (
          <div key={sec.label} style={{ marginBottom: 18 }}>
            <div
              style={{
                padding: "0 8px 6px",
                fontSize: 10.5,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "JetBrains Mono, monospace",
                ...sectionStyle,
              }}
            >
              {sec.label}
            </div>
            {sec.items.map((item, i) => {
              const isActive = sec.label === "내 활동" && i === 0;
              return (
                <div
                  key={item}
                  style={{
                    padding: "7px 10px",
                    margin: "1px 0",
                    borderRadius: 6,
                    background: isActive ? activeBg : "transparent",
                    color: isActive ? activeText : text,
                    fontWeight: isActive ? 500 : 400,
                    cursor: "pointer",
                    ...itemStyle,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: 10, borderTop: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 6 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: activeBg,
              color: activeText,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {SAMPLE.initials}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{SAMPLE.user}</div>
            <div style={{ fontSize: 10.5, color: "#888", lineHeight: 1.2 }}>{SAMPLE.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MockTopBar({ background = "#fff", border = "#e7e7e3" }: { background?: string; border?: string }) {
  return (
    <header
      style={{
        height: 56,
        borderBottom: `1px solid ${border}`,
        background,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          padding: "8px 14px",
          background: "#f6f6f4",
          border: `1px solid ${border}`,
          borderRadius: 8,
          color: "#888",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span>⌕</span>
        <span>Search everywhere…</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            background: "#fff",
            border: `1px solid ${border}`,
            padding: "1px 6px",
            borderRadius: 4,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          ⌘K
        </span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ position: "relative", fontSize: 16 }}>
          ⚐
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -6,
              fontSize: 9,
              fontWeight: 700,
              background: "#ef4444",
              color: "#fff",
              padding: "1px 5px",
              borderRadius: 8,
            }}
          >
            3
          </span>
        </span>
      </div>
    </header>
  );
}

/* ───────── 1. LINEAR ───────── */

function LinearVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Inter, Pretendard, system-ui" }}>
      <MockSidebar
        background="#fafafa"
        text="#444"
        activeBg="#1c1c1c"
        activeText="#fff"
        border="#ececea"
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
        <MockTopBar />
        <main style={{ padding: 28 }}>
          {/* Hero */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  fontFamily: "JetBrains Mono, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Dashboard · {SAMPLE.date}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
                {SAMPLE.user}
              </h1>
            </div>
            <button
              style={{
                fontSize: 12,
                padding: "7px 12px",
                background: "#1c1c1c",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + 새 활동
            </button>
          </div>

          {/* KPI grid — 4 hairline cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              border: "1px solid #ececea",
              borderRadius: 6,
              marginBottom: 24,
              background: "#fff",
            }}
          >
            {SAMPLE.kpis.map((k, i) => (
              <div
                key={k.label}
                style={{
                  padding: "16px 18px",
                  borderRight: i < 3 ? "1px solid #ececea" : 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#888",
                    fontFamily: "JetBrains Mono, monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {k.label}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{k.value}</span>
                  <span style={{ fontSize: 13, color: "#888" }}>{k.unit}</span>
                </div>
                <span style={{ fontSize: 11, color: k.trend === "down" ? "#ef4444" : "#666" }}>{k.delta}</span>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #ececea", borderRadius: 6 }}>
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: 11,
                  color: "#888",
                  borderBottom: "1px solid #ececea",
                  fontFamily: "JetBrains Mono, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Today</span>
                <span>3 items</span>
              </div>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    padding: "12px 16px",
                    gap: 12,
                    borderBottom: i < SAMPLE.today.length - 1 ? "1px solid #f1f1ee" : 0,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: it.urgent ? "#ef4444" : "#1c1c1c",
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 600,
                    }}
                  >
                    {it.time}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{it.title}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{it.meta}</span>
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid #ececea", borderRadius: 6 }}>
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: 11,
                  color: "#888",
                  borderBottom: "1px solid #ececea",
                  fontFamily: "JetBrains Mono, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Projects</span>
                <span>2 active</span>
              </div>
              {SAMPLE.projects.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    padding: "14px 16px",
                    borderBottom: i < SAMPLE.projects.length - 1 ? "1px solid #f1f1ee" : 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#888",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {p.prog}% · {p.role}
                    </span>
                  </div>
                  <div style={{ height: 3, background: "#ececea", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.prog}%`, background: "#1c1c1c" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 2. VERCEL / GEIST ───────── */

function VercelVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Inter, Pretendard, system-ui", background: "#f7f7f5" }}>
      <MockSidebar
        background="#fff"
        text="#1a1a1a"
        activeBg="#0a0a0a"
        activeText="#fff"
        border="#ececea"
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MockTopBar background="#fff" />
        <main style={{ padding: 36, display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{SAMPLE.date}</div>
            <h1
              style={{
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              안녕하세요, {SAMPLE.user}
            </h1>
            <p style={{ fontSize: 14, color: "#666", margin: "8px 0 0" }}>
              마감 임박 1건 · 이번 주 일정 3건
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {SAMPLE.kpis.map((k) => (
              <div
                key={k.label}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px -8px rgba(0,0,0,0.08)",
                  border: "1px solid #f0f0ee",
                }}
              >
                <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {k.value}
                  </span>
                  <span style={{ fontSize: 16, color: "#999" }}>{k.unit}</span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 8,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: k.trend === "down" ? "#fee2e2" : k.trend === "up" ? "#dcfce7" : "#f3f3f1",
                    color: k.trend === "down" ? "#b91c1c" : k.trend === "up" ? "#15803d" : "#666",
                    width: "fit-content",
                    fontWeight: 500,
                  }}
                >
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px -8px rgba(0,0,0,0.08)",
                border: "1px solid #f0f0ee",
              }}
            >
              <div style={{ padding: "20px 24px 12px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>오늘 할 일과 일정</h3>
                <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>3 items</p>
              </div>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #f3f3f1",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: it.urgent ? "#ef4444" : "#0a0a0a",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{it.title}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {it.time} · {it.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px -8px rgba(0,0,0,0.08)",
                border: "1px solid #f0f0ee",
              }}
            >
              <div style={{ padding: "20px 24px 12px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>내 프로젝트</h3>
                <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>2 active</p>
              </div>
              {SAMPLE.projects.map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #f3f3f1",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "#888" }}>{p.role}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "#f0f0ee",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${p.prog}%`,
                          background: "#0a0a0a",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{p.prog}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 3. NOTION ───────── */

function NotionVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Inter, Pretendard, system-ui" }}>
      <MockSidebar
        background="#fbfbfa"
        text="#37352f"
        activeBg="#ebebe9"
        activeText="#37352f"
        border="#ebebe9"
        sectionStyle={{ fontFamily: "Inter, Pretendard, system-ui", fontWeight: 500, color: "#9b9a97", textTransform: "none", letterSpacing: 0, fontSize: 11 }}
        itemStyle={{ borderRadius: 4 }}
        brand={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <strong style={{ fontSize: 14, color: "#37352f" }}>Kobot Workspace</strong>
          </div>
        }
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
        <header
          style={{
            padding: "10px 24px",
            borderBottom: "1px solid #ebebe9",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#9b9a97",
          }}
        >
          <span>대시보드</span>
          <span>›</span>
          <span style={{ color: "#37352f" }}>{SAMPLE.user}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 12 }}>
            <span>공유</span>
            <span>업데이트</span>
            <span>⋯</span>
          </div>
        </header>
        <main style={{ padding: "60px 80px 80px", maxWidth: 960, margin: "0 auto" }}>
          {/* Document hero */}
          <div style={{ fontSize: 64, marginBottom: 12 }}>👋</div>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              lineHeight: 1.2,
              color: "#37352f",
            }}
          >
            안녕하세요, {SAMPLE.user}
          </h1>
          <p style={{ fontSize: 14, color: "#787774", margin: "0 0 36px" }}>
            오늘은 {SAMPLE.date}. 마감 임박 1건이 있어요. ✦
          </p>

          {/* Inline KPI row — like callout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              background: "#ebebe9",
              border: "1px solid #ebebe9",
              borderRadius: 4,
              marginBottom: 40,
              overflow: "hidden",
            }}
          >
            {SAMPLE.kpis.map((k) => (
              <div key={k.label} style={{ background: "#fff", padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "#9b9a97", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: "#37352f" }}>
                  {k.value}
                  <span style={{ fontSize: 13, color: "#787774", marginLeft: 4 }}>{k.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: k.trend === "down" ? "#cd5b3d" : "#787774", marginTop: 4 }}>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Heading like a doc */}
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: "0 0 12px",
              color: "#37352f",
              letterSpacing: "-0.01em",
            }}
          >
            오늘
          </h2>
          <div style={{ marginBottom: 36 }}>
            {SAMPLE.today.map((it) => (
              <div
                key={it.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f1ef",
                }}
              >
                <input type="checkbox" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: 14, color: "#37352f", flex: 1 }}>{it.title}</span>
                <span style={{ fontSize: 12, color: "#9b9a97" }}>
                  {it.time} · {it.meta}
                </span>
              </div>
            ))}
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: "0 0 12px",
              color: "#37352f",
              letterSpacing: "-0.01em",
            }}
          >
            내 프로젝트
          </h2>
          <div>
            {SAMPLE.projects.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid #f1f1ef",
                }}
              >
                <span style={{ fontSize: 14, color: "#37352f", fontWeight: 500, flex: 1 }}>{p.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 3,
                    background: "#f1f1ef",
                    color: "#787774",
                  }}
                >
                  {p.role}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: 200 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: "#ebebe9",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ height: "100%", width: `${p.prog}%`, background: "#37352f" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#787774", minWidth: 32 }}>{p.prog}%</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 4. OPERATOR / DATADOG ───────── */

function Sparkline({ color }: { color: string }) {
  const pts = [3, 7, 5, 8, 6, 9, 7, 11, 9, 12, 10, 14];
  const max = Math.max(...pts);
  const w = 80;
  const h = 24;
  const step = w / (pts.length - 1);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={path} stroke={color} strokeWidth={1.5} fill="none" />
    </svg>
  );
}

function OperatorVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Inter, Pretendard, system-ui", background: "#0e0e10", color: "#e7e7e3" }}>
      <MockSidebar
        background="#0a0a0c"
        text="#bbb"
        activeBg="#1d4ed8"
        activeText="#fff"
        border="#1f1f23"
        sectionStyle={{ color: "#666" }}
        brand={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 22,
                height: 22,
                background: "linear-gradient(135deg, #3b6bc4, #1d4ed8)",
                borderRadius: 5,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              K
            </span>
            <strong style={{ fontSize: 14, color: "#e7e7e3" }}>kobot.ops</strong>
          </div>
        }
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 52,
            borderBottom: "1px solid #1f1f23",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            background: "#0a0a0c",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              color: "#666",
            }}
          >
            ~/dashboard
          </div>
          <div
            style={{
              padding: "5px 12px",
              background: "#15151a",
              borderRadius: 20,
              fontSize: 11,
              color: "#7ab8ff",
              fontFamily: "JetBrains Mono, monospace",
              border: "1px solid #1f2a44",
            }}
          >
            ● live · last 24h
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#888" }}>
            <span>refresh: 30s</span>
            <span style={{ color: "#7ab8ff" }}>{SAMPLE.user}</span>
          </div>
        </header>
        <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Greeting strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              background: "linear-gradient(90deg, #15151a, #0e0e10)",
              border: "1px solid #1f1f23",
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "JetBrains Mono, monospace" }}>
                $ kobot status --user me
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: "4px 0 0", color: "#fff" }}>
                안녕하세요, {SAMPLE.user}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 11, color: "#888" }}>
              <div>
                <div style={{ color: "#666" }}>uptime</div>
                <div style={{ color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>8d 14h</div>
              </div>
              <div>
                <div style={{ color: "#666" }}>last login</div>
                <div style={{ color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>2h ago</div>
              </div>
            </div>
          </div>

          {/* KPI grid with sparklines */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {SAMPLE.kpis.map((k) => (
              <div
                key={k.label}
                style={{
                  background: "#15151a",
                  border: "1px solid #1f1f23",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#666",
                    fontFamily: "JetBrains Mono, monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {k.label}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 26,
                          fontWeight: 600,
                          color: "#fff",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {k.value}
                      </span>
                      <span style={{ fontSize: 12, color: "#888" }}>{k.unit}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: k.trend === "down" ? "#ef4444" : "#7ab8ff" }}>
                      {k.delta}
                    </span>
                  </div>
                  <Sparkline color={k.trend === "down" ? "#ef4444" : "#7ab8ff"} />
                </div>
              </div>
            ))}
          </div>

          {/* Two column: tasks/events + projects */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div
              style={{
                background: "#15151a",
                border: "1px solid #1f1f23",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #1f1f23",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: "#888",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>$ tail today.log</span>
                <span style={{ color: "#7ab8ff" }}>3 events</span>
              </div>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < SAMPLE.today.length - 1 ? "1px solid #1f1f23" : 0,
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12.5,
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: 10,
                  }}
                >
                  <span style={{ color: it.urgent ? "#ef4444" : "#7ab8ff" }}>
                    [{it.time === "마감" ? "DUE" : it.time}]
                  </span>
                  <span style={{ color: "#e7e7e3" }}>{it.title}</span>
                  <span style={{ color: "#666" }}>{it.meta}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#15151a",
                border: "1px solid #1f1f23",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #1f1f23",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: "#888",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>$ ls projects/ --mine</span>
                <span style={{ color: "#7ab8ff" }}>2 active</span>
              </div>
              {SAMPLE.projects.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    padding: "14px 16px",
                    borderBottom: i < SAMPLE.projects.length - 1 ? "1px solid #1f1f23" : 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#e7e7e3" }}>{p.name}</span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "#7ab8ff",
                      }}
                    >
                      {p.prog}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#1f1f23",
                      borderRadius: 2,
                      overflow: "hidden",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${p.prog}%`,
                        background: "linear-gradient(90deg, #1d4ed8, #7ab8ff)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10.5, color: "#666", fontFamily: "JetBrains Mono, monospace" }}>
                    role: {p.role} · members: {p.members}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 5. BENTO ───────── */

function BentoTile({
  children,
  span = 1,
  rowSpan = 1,
  bg = "#fff",
  color = "#1a1a1a",
}: {
  children: ReactNode;
  span?: number;
  rowSpan?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        gridColumn: `span ${span}`,
        gridRow: `span ${rowSpan}`,
        background: bg,
        color,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -12px rgba(0,0,0,0.12)",
        border: "1px solid rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function BentoVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Pretendard, system-ui", background: "#f1f1ef" }}>
      <MockSidebar background="#fff" text="#1a1a1a" activeBg="#1a1a1a" activeText="#fff" border="#ececea" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MockTopBar background="#fff" />
        <main style={{ padding: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "minmax(140px, auto)",
              gap: 14,
            }}
          >
            {/* Hero greeting tile */}
            <BentoTile span={2} bg="linear-gradient(135deg, #103078, #2a52a3)" color="#fff">
              <span style={{ fontSize: 12, opacity: 0.8 }}>{SAMPLE.date}</span>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                안녕하세요,<br />{SAMPLE.user} 👋
              </h1>
              <span style={{ fontSize: 12, opacity: 0.85, marginTop: "auto" }}>
                마감 임박 1건 · 일정 3건
              </span>
            </BentoTile>

            {/* Single big KPI */}
            <BentoTile bg="#0a0a0a" color="#fff">
              <span style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {SAMPLE.kpis[0].label}
              </span>
              <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
                {SAMPLE.kpis[0].value}
                <span style={{ fontSize: 22, opacity: 0.6, marginLeft: 4 }}>%</span>
              </span>
              <span style={{ fontSize: 11, color: "#7ab8ff", marginTop: "auto" }}>{SAMPLE.kpis[0].delta}</span>
            </BentoTile>

            <BentoTile bg="#fef3c7">
              <span style={{ fontSize: 11, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {SAMPLE.kpis[3].label}
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", color: "#a16207", lineHeight: 1 }}>
                {SAMPLE.kpis[3].value}
                <span style={{ fontSize: 18, marginLeft: 4 }}>개</span>
              </span>
              <span style={{ fontSize: 11, color: "#a16207", marginTop: "auto" }}>D-3</span>
            </BentoTile>

            {/* Today */}
            <BentoTile span={2} rowSpan={2}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>오늘 ☀️</h3>
                <span style={{ fontSize: 11, color: "#888" }}>3 items</span>
              </div>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < SAMPLE.today.length - 1 ? "1px solid #f3f3f1" : 0,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: it.urgent ? "#fee2e2" : "#e0e7ff",
                      color: it.urgent ? "#b91c1c" : "#3730a3",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {it.time}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{it.title}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{it.meta}</div>
                  </div>
                </div>
              ))}
            </BentoTile>

            {/* KPI 2 + 3 */}
            <BentoTile bg="#fff">
              <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {SAMPLE.kpis[1].label}
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {SAMPLE.kpis[1].value}
                <span style={{ fontSize: 16, color: "#888", marginLeft: 2 }}>회</span>
              </span>
              <span style={{ fontSize: 11, color: "#888", marginTop: "auto" }}>{SAMPLE.kpis[1].delta}</span>
            </BentoTile>

            <BentoTile bg="#dcfce7">
              <span style={{ fontSize: 11, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {SAMPLE.kpis[2].label}
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", color: "#15803d" }}>
                {SAMPLE.kpis[2].value}개
              </span>
              <span style={{ fontSize: 11, color: "#15803d", marginTop: "auto" }}>{SAMPLE.kpis[2].delta}</span>
            </BentoTile>

            {/* Projects */}
            <BentoTile span={4}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>내 프로젝트 🚀</h3>
                <span style={{ fontSize: 11, color: "#888" }}>2 active</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
                {SAMPLE.projects.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      padding: 14,
                      background: "#f6f6f4",
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{p.role}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: "#fff", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${p.prog}%`,
                            background: "linear-gradient(90deg, #103078, #2a52a3)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{p.prog}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </BentoTile>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 6. BRUTALIST ───────── */

function BrutalistVariant() {
  return (
    <div style={{ display: "flex", minHeight: 760, fontFamily: "Pretendard, system-ui", background: "#fff" }}>
      <aside
        style={{
          width: 240,
          background: "#0a0a0a",
          color: "#fff",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "24px 22px 20px", borderBottom: "2px solid #fff" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
            }}
          >
            KOBOT.<br />
            <span style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0 }}>WORKSPACE™</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "14px 0", overflowY: "auto" }}>
          {SAMPLE.navSections.map((sec) => (
            <div key={sec.label} style={{ marginBottom: 14 }}>
              <div
                style={{
                  padding: "0 22px 6px",
                  fontSize: 10,
                  color: "#888",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                — {sec.label}
              </div>
              {sec.items.map((item, i) => {
                const isActive = sec.label === "내 활동" && i === 0;
                return (
                  <div
                    key={item}
                    style={{
                      padding: "9px 22px",
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? "#fff" : "transparent",
                      color: isActive ? "#0a0a0a" : "#fff",
                      borderLeft: isActive ? "4px solid #ef4444" : "4px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    {item.toUpperCase()}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: 18, borderTop: "2px solid #fff", fontSize: 12 }}>
          <div style={{ fontWeight: 700 }}>{SAMPLE.user.toUpperCase()}</div>
          <div style={{ color: "#888", fontSize: 11, letterSpacing: "0.08em" }}>{SAMPLE.role.toUpperCase()}</div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            padding: "16px 32px",
            borderBottom: "2px solid #0a0a0a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            ISSUE №47 — DASHBOARD — {SAMPLE.date}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>↗ INDEX</div>
        </header>
        <main style={{ padding: "40px 32px" }}>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              lineHeight: 0.85,
              margin: "0 0 24px",
              textTransform: "uppercase",
            }}
          >
            안녕,<br />
            <span style={{ fontStyle: "italic", fontWeight: 600 }}>{SAMPLE.user}.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              maxWidth: 540,
              margin: "0 0 40px",
              borderLeft: "4px solid #0a0a0a",
              paddingLeft: 16,
            }}
          >
            마감 임박 1건 · 이번 주 일정 3건. 오늘 안 끝내면 내일이 더 바빠짐.
          </p>

          {/* KPI strip with hard borders */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              border: "2px solid #0a0a0a",
              marginBottom: 32,
            }}
          >
            {SAMPLE.kpis.map((k, i) => (
              <div
                key={k.label}
                style={{
                  padding: "20px 22px",
                  borderRight: i < 3 ? "2px solid #0a0a0a" : 0,
                  background: i === 3 ? "#ef4444" : "#fff",
                  color: i === 3 ? "#fff" : "#0a0a0a",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginBottom: 10,
                  }}
                >
                  {k.label}
                </div>
                <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.85 }}>
                  {k.value}
                  <span style={{ fontSize: 22 }}>{k.unit}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8 }}>→ {k.delta}</div>
              </div>
            ))}
          </div>

          {/* Two columns hard-bordered */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ border: "2px solid #0a0a0a" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: 0,
                  padding: "12px 18px",
                  borderBottom: "2px solid #0a0a0a",
                  background: "#0a0a0a",
                  color: "#fff",
                }}
              >
                ─── TODAY ─── 3
              </h3>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    padding: "14px 18px",
                    borderBottom: i < SAMPLE.today.length - 1 ? "1px solid #0a0a0a" : 0,
                    display: "flex",
                    gap: 14,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: it.urgent ? "#ef4444" : "#0a0a0a", minWidth: 60 }}>
                    {it.time}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{it.title}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{it.meta}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ border: "2px solid #0a0a0a" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: 0,
                  padding: "12px 18px",
                  borderBottom: "2px solid #0a0a0a",
                  background: "#0a0a0a",
                  color: "#fff",
                }}
              >
                ─── PROJECTS ─── 2
              </h3>
              {SAMPLE.projects.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    padding: "16px 18px",
                    borderBottom: i < SAMPLE.projects.length - 1 ? "1px solid #0a0a0a" : 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name.toUpperCase()}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{p.prog}%</span>
                  </div>
                  <div style={{ height: 10, background: "#fff", border: "2px solid #0a0a0a" }}>
                    <div style={{ height: "100%", width: `${p.prog}%`, background: "#0a0a0a" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 7. GLASS ───────── */

function GlassCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.6)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 4px 24px rgba(99, 102, 241, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GlassVariant() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: 760,
        fontFamily: "Pretendard, system-ui",
        background: `
          radial-gradient(circle at 15% 20%, rgba(167, 139, 250, 0.35), transparent 40%),
          radial-gradient(circle at 85% 30%, rgba(96, 165, 250, 0.35), transparent 40%),
          radial-gradient(circle at 60% 80%, rgba(244, 114, 182, 0.28), transparent 40%),
          linear-gradient(180deg, #fdf4ff, #eff6ff)
        `,
      }}
    >
      <aside
        style={{
          width: 220,
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.6)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ height: 56, padding: "0 20px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
          <span
            style={{
              background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              marginRight: 8,
            }}
          >
            K
          </span>
          <strong style={{ fontSize: 14, color: "#3730a3" }}>kobot</strong>
        </div>
        <nav style={{ flex: 1, padding: "14px 12px", fontSize: 13, color: "#4338ca" }}>
          {SAMPLE.navSections.map((sec) => (
            <div key={sec.label} style={{ marginBottom: 16 }}>
              <div style={{ padding: "0 8px 4px", fontSize: 10.5, color: "#7c6fd1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {sec.label}
              </div>
              {sec.items.map((item, i) => {
                const isActive = sec.label === "내 활동" && i === 0;
                return (
                  <div
                    key={item}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: isActive ? "linear-gradient(135deg, rgba(167,139,250,0.7), rgba(96,165,250,0.7))" : "transparent",
                      color: isActive ? "#fff" : "#4338ca",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      marginBottom: 2,
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 56,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.5)",
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              maxWidth: 480,
              padding: "8px 14px",
              background: "rgba(255,255,255,0.6)",
              borderRadius: 10,
              fontSize: 13,
              color: "#7c6fd1",
            }}
          >
            ⌕ Search…
          </div>
        </header>
        <main style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: "#7c6fd1" }}>{SAMPLE.date}</div>
            <h1
              style={{
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                margin: "4px 0 0",
                background: "linear-gradient(135deg, #4338ca, #7c3aed, #db2777)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              안녕하세요, {SAMPLE.user} ✨
            </h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {SAMPLE.kpis.map((k) => (
              <GlassCard key={k.label}>
                <div style={{ fontSize: 12, color: "#7c6fd1", marginBottom: 8 }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "#3730a3", letterSpacing: "-0.03em" }}>
                    {k.value}
                  </span>
                  <span style={{ fontSize: 14, color: "#7c6fd1" }}>{k.unit}</span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    color: k.trend === "down" ? "#db2777" : "#3730a3",
                    fontWeight: 500,
                  }}
                >
                  {k.delta}
                </div>
              </GlassCard>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <GlassCard>
              <h3 style={{ fontSize: 15, color: "#3730a3", margin: "0 0 12px" }}>오늘 ☀️</h3>
              {SAMPLE.today.map((it, i) => (
                <div
                  key={it.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < SAMPLE.today.length - 1 ? "1px solid rgba(255,255,255,0.6)" : 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: it.urgent ? "rgba(244,114,182,0.4)" : "rgba(96,165,250,0.4)",
                      color: it.urgent ? "#9d174d" : "#1e3a8a",
                      fontWeight: 600,
                    }}
                  >
                    {it.time}
                  </span>
                  <div style={{ flex: 1, fontSize: 13, color: "#3730a3" }}>{it.title}</div>
                  <span style={{ fontSize: 11, color: "#7c6fd1" }}>{it.meta}</span>
                </div>
              ))}
            </GlassCard>
            <GlassCard>
              <h3 style={{ fontSize: 15, color: "#3730a3", margin: "0 0 12px" }}>내 프로젝트 🚀</h3>
              {SAMPLE.projects.map((p) => (
                <div key={p.name} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#3730a3" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "#7c6fd1" }}>{p.prog}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.7)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${p.prog}%`,
                        background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────── 8. TERMINAL ───────── */

function TerminalVariant() {
  const G = "#7ee787";
  const D = "#0d1117";
  const F = "#c9d1d9";
  const M = "#8b949e";
  return (
    <div style={{ background: D, color: F, fontFamily: "JetBrains Mono, ui-monospace, monospace", minHeight: 760, fontSize: 13 }}>
      {/* Single-pane terminal layout */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #21262d", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ width: 11, height: 11, borderRadius: 6, background: "#ff5f57" }} />
        <span style={{ width: 11, height: 11, borderRadius: 6, background: "#febc2e" }} />
        <span style={{ width: 11, height: 11, borderRadius: 6, background: "#28c840" }} />
        <span style={{ marginLeft: 14, color: M, fontSize: 12 }}>kobot@dashboard ~ %</span>
        <span style={{ marginLeft: "auto", color: M, fontSize: 11 }}>tmux 1:dash 2:tasks 3:projects</span>
      </div>

      <div style={{ display: "flex", minHeight: 700 }}>
        <aside style={{ width: 220, padding: 14, borderRight: "1px solid #21262d", flexShrink: 0 }}>
          <div style={{ color: G, marginBottom: 10 }}>$ ls /menu</div>
          {SAMPLE.navSections.map((sec) => (
            <div key={sec.label} style={{ marginBottom: 14 }}>
              <div style={{ color: M, fontSize: 11, marginBottom: 4 }}>── {sec.label} ──────</div>
              {sec.items.map((item, i) => {
                const isActive = sec.label === "내 활동" && i === 0;
                return (
                  <div
                    key={item}
                    style={{
                      padding: "3px 6px",
                      color: isActive ? D : F,
                      background: isActive ? G : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {isActive ? "> " : "  "}
                    {item}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ color: M, marginTop: 24 }}>
            ─── user ──────<br />
            {SAMPLE.user}<br />
            <span style={{ color: G }}>● {SAMPLE.role}</span>
          </div>
        </aside>

        <main style={{ flex: 1, padding: 24, lineHeight: 1.7 }}>
          <div style={{ color: M }}>$ kobot status --user me --date {SAMPLE.date.replace(/[가-힣() ]/g, "")}</div>
          <div style={{ color: G, fontWeight: 600, marginTop: 4 }}>
            ✓ Ready. 안녕하세요, {SAMPLE.user}
            <span style={{ marginLeft: 6, animation: "kb-blink 1s infinite" }}>▊</span>
          </div>
          <div style={{ color: M, marginTop: 4, marginBottom: 24 }}>
            // 마감 임박 1건 · 일정 3건
          </div>

          {/* KPI ASCII boxes */}
          <pre
            style={{
              margin: 0,
              fontFamily: "inherit",
              color: F,
              fontSize: 12.5,
              lineHeight: 1.5,
              whiteSpace: "pre",
            }}
          >
{`┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ ${pad("출석률", 16)}│ ${pad("이번 달 세션", 16)}│ ${pad("진행중 프로젝트", 16)}│ ${pad("마감 임박", 16)}│
│ `}<span style={{ color: G, fontSize: 22 }}>94%</span>{`             │ `}<span style={{ color: G, fontSize: 22 }}>8회</span>{`             │ `}<span style={{ color: G, fontSize: 22 }}>2개</span>{`             │ `}<span style={{ color: "#ff7b72", fontSize: 22 }}>1개</span>{`             │
│ ${color("+2% MoM", G)}        │ ${color("4회 남음", M)}       │ ${color("1개 완료", M)}       │ ${color("D-3", "#ff7b72")}             │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘`}
          </pre>

          <div style={{ color: M, marginTop: 28 }}>$ tail today.log</div>
          <div style={{ color: G, marginBottom: 8 }}>=== TODAY ({SAMPLE.today.length} events) ===</div>
          {SAMPLE.today.map((it) => (
            <div key={it.title} style={{ marginBottom: 4 }}>
              <span style={{ color: it.urgent ? "#ff7b72" : G }}>[{it.time === "마감" ? "DUE" : it.time}]</span>{" "}
              <span style={{ color: F }}>{it.title}</span>{" "}
              <span style={{ color: M }}>// {it.meta}</span>
            </div>
          ))}

          <div style={{ color: M, marginTop: 28 }}>$ ls projects/ --mine --status</div>
          <div style={{ color: G, marginBottom: 8 }}>=== PROJECTS ({SAMPLE.projects.length} active) ===</div>
          {SAMPLE.projects.map((p) => (
            <div key={p.name} style={{ marginBottom: 8 }}>
              <div style={{ color: F }}>
                {p.name} <span style={{ color: M }}>[{p.role}, {p.members}명]</span>
              </div>
              <div style={{ color: G, fontSize: 12 }}>
                [{"█".repeat(Math.floor(p.prog / 5))}{"░".repeat(20 - Math.floor(p.prog / 5))}] {p.prog}%
              </div>
            </div>
          ))}

          <div style={{ color: M, marginTop: 28 }}>$ _<span style={{ animation: "kb-blink 1s infinite" }}>▊</span></div>
        </main>
      </div>
    </div>
  );
}

function pad(s: string, len: number) {
  // pad with spaces accounting for CJK width = 2
  let width = 0;
  for (const ch of s) width += /[ㄱ-힝]/.test(ch) ? 2 : 1;
  return s + " ".repeat(Math.max(0, len - width));
}

function color(s: string, c: string) {
  // helper for inline-styled spans inside pre — returns plain string here, color applied via outer span
  return s;
}
