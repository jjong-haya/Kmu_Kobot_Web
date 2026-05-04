import { useState } from "react";
import { PublicHeader } from "../../components/public/PublicHeader";

type Activity = {
  n: string;
  t: string;
  d: string;
  tag: string;
  big?: boolean;
  category: string;
};

const FILTERS: Array<{ label: string; key: string; count: number }> = [
  { label: "전체", key: "all", count: 47 },
  { label: "ROS", key: "ros", count: 12 },
  { label: "임베디드", key: "embed", count: 8 },
  { label: "비전", key: "vision", count: 7 },
  { label: "웹·통합", key: "web", count: 5 },
  { label: "대회", key: "contest", count: 9 },
  { label: "세미나", key: "seminar", count: 6 },
];

const ITEMS: Activity[] = [
  { n: "01", t: "ROS2 워크샵 — 자율주행 시뮬레이션", d: "2026.02.15", tag: "WORKSHOP", big: true, category: "ros" },
  { n: "02", t: "ARM Cortex-M 임베디드 스터디", d: "2026.02.08", tag: "STUDY", category: "embed" },
  { n: "03", t: "2026 Winter Hackathon · 우수상", d: "2026.02.01", tag: "AWARD", big: true, category: "contest" },
  { n: "04", t: "Arduino 입문 세미나", d: "2026.01.25", tag: "SEMINAR", category: "embed" },
  { n: "05", t: "6축 로봇팔 제어 프로젝트", d: "2026.01.18", tag: "PROJECT", big: true, category: "ros" },
  { n: "06", t: "Python 알고리즘 코딩 세션", d: "2026.01.12", tag: "STUDY", category: "web" },
];

export default function Activities() {
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? ITEMS : ITEMS.filter((i) => i.category === active);
  return (
    <div className="kb-root" style={{ background: "var(--kb-paper)", minHeight: "100vh" }}>
      <PublicHeader variant="editorial" />
      <section style={{ padding: "64px 56px", maxWidth: 1440, margin: "0 auto" }}>
        <div
          className="kb-mono"
          style={{
            fontSize: 11,
            color: "var(--kb-ink-500)",
            borderBottom: "1px solid var(--kb-ink-900)",
            paddingBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Section · Activities</span>
          <span>총 47건</span>
          <span>2026 → 2024</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 4fr)",
            gap: 56,
            marginTop: 48,
          }}
        >
          <aside>
            <h2
              className="kb-display"
              style={{ fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 0.95, fontWeight: 500, margin: 0 }}
            >
              활동
              <br />
              아카이브
            </h2>
            <p style={{ fontSize: 14, color: "var(--kb-ink-500)", marginTop: 16, lineHeight: 1.6 }}>
              매주의 스터디, 매학기의 프로젝트, 매년의 대회. 2018년부터 쌓인 기록.
            </p>
            <div style={{ marginTop: 32 }}>
              <div
                className="kb-mono"
                style={{
                  fontSize: 10,
                  color: "var(--kb-ink-500)",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Filter
              </div>
              {FILTERS.map((f) => {
                const sel = f.key === active;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActive(f.key)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--kb-hairline)",
                      fontSize: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      color: sel ? "var(--kb-ink-900)" : "var(--kb-ink-700)",
                      fontWeight: sel ? 600 : 400,
                      background: "transparent",
                      borderTop: 0,
                      borderLeft: 0,
                      borderRight: 0,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{f.label}</span>
                    <span className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-400)" }}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div>
            <div
              className="kb-mono"
              style={{
                fontSize: 10,
                color: "var(--kb-ink-500)",
                marginBottom: 24,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              ── 2026년 02월
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24 }}>
              {filtered.map((it) => (
                <article
                  key={it.n}
                  style={{
                    gridColumn: it.big ? "span 4" : "span 2",
                    borderTop: "1px solid var(--kb-ink-900)",
                    paddingTop: 16,
                  }}
                  className="kb-fade-up"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-500)" }}>
                      № {it.n} · {it.tag}
                    </span>
                    <span className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-500)" }}>
                      {it.d}
                    </span>
                  </div>
                  <div
                    style={{
                      aspectRatio: it.big ? "16/9" : "4/5",
                      background: "var(--kb-paper-3)",
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.03) 14px 15px)",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-400)" }}>
                      [ photo ]
                    </span>
                  </div>
                  <h3
                    className={it.big ? "kb-display" : ""}
                    style={{
                      fontSize: it.big ? 28 : 17,
                      lineHeight: 1.25,
                      letterSpacing: it.big ? "-0.02em" : 0,
                      fontWeight: it.big ? 500 : 600,
                      margin: 0,
                    }}
                  >
                    {it.t}
                  </h3>
                  {it.big && (
                    <p style={{ fontSize: 14, color: "var(--kb-ink-500)", marginTop: 12, lineHeight: 1.55 }}>
                      Read more →
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
