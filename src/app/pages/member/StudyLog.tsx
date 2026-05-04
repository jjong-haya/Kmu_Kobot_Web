import { useMemo, useState } from "react";
import { Card, PageEyebrow, PageTitle } from "../../components/member/MemberShell";

type LogCategory = "study" | "project" | "event" | "qna";

type LogEntry = {
  d: string;
  t: string;
  cat: LogCategory;
  title: string;
  hours: number;
  tags: string[];
};

const LOGS: LogEntry[] = [
  { d: "2026.02.17", t: "14:32", cat: "study",   title: "ROS Navigation 2 — Costmap 튜닝",                                   hours: 2.5, tags: ["ROS", "Nav2"] },
  { d: "2026.02.16", t: "20:18", cat: "project", title: "자율주행 로봇 — SLAM 파라미터 조정 후 5m 이상 안정 주행 확인",     hours: 3.0, tags: ["SLAM"] },
  { d: "2026.02.15", t: "19:00", cat: "event",   title: "ROS 2 워크샵 참석",                                                hours: 2.0, tags: ["워크샵"] },
  { d: "2026.02.14", t: "15:40", cat: "study",   title: "PyTorch 객체 인식 모델 학습 — fine-tuning",                          hours: 4.0, tags: ["PyTorch", "YOLO"] },
  { d: "2026.02.13", t: "21:05", cat: "qna",     title: 'Q&A 답변 — "Costmap이 너무 보수적으로 잡힌다" 질문에 답변',          hours: 0.5, tags: [] },
  { d: "2026.02.12", t: "18:30", cat: "project", title: "딥러닝 물체 인식 — 데이터셋 라벨링 작업",                            hours: 2.0, tags: ["Dataset"] },
];

const CATEGORY_STYLES: Record<LogCategory, { bg: string; fg: string; label: string }> = {
  study:   { bg: "rgba(34,197,94,0.13)",  fg: "#15803d",         label: "STUDY" },
  project: { bg: "rgba(16,48,120,0.13)",  fg: "var(--kb-navy-800)", label: "PROJECT" },
  event:   { bg: "rgba(249,115,22,0.13)", fg: "#c2410c",         label: "EVENT" },
  qna:     { bg: "rgba(168,85,247,0.13)", fg: "#7e22ce",         label: "Q&A" },
};

const STATS: Array<[string, string, string]> = [
  ["이번 주", "12.0h", "+2.5h vs 지난 주"],
  ["이번 달", "47.5h", "목표 60h 중 79%"],
  ["최다 카테고리", "STUDY", "전체의 42%"],
  ["연속 기록일", "8일", "최장 12일"],
];

const FILTERS: Array<{ key: "all" | LogCategory; label: string }> = [
  { key: "all", label: "전체" },
  { key: "study", label: "study" },
  { key: "project", label: "project" },
  { key: "event", label: "event" },
  { key: "qna", label: "qna" },
];

export default function StudyLog() {
  const [filter, setFilter] = useState<"all" | LogCategory>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return LOGS.filter((l) => {
      if (filter !== "all" && l.cat !== filter) return false;
      if (query.trim() && !l.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [filter, query]);

  return (
    <div className="kb-root" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <PageEyebrow>member / study-log</PageEyebrow>
          <PageTitle>Study Log</PageTitle>
          <p style={{ fontSize: 16, color: "var(--kb-ink-500)", margin: "6px 0 0" }}>
            이번 학기 누적 <strong style={{ color: "var(--kb-ink-900)" }}>47.5시간</strong> · 활동 23건
          </p>
        </div>
        <button
          type="button"
          style={{
            padding: "10px 16px",
            border: 0,
            background: "var(--kb-navy-800)",
            color: "var(--kb-paper)",
            borderRadius: 8,
            fontSize: 14.5,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + 새 활동 기록
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {STATS.map(([t, v, s]) => (
          <Card key={t} style={{ padding: 20 }}>
            <p style={{ fontSize: 13.5, color: "var(--kb-ink-500)", margin: 0 }}>{t}</p>
            <p
              className="kb-display"
              style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "4px 0" }}
            >
              {v}
            </p>
            <p style={{ fontSize: 13, color: "var(--kb-ink-500)", margin: 0 }}>{s}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="활동 검색…"
          style={{
            padding: "8px 12px",
            border: "1px solid var(--kb-hairline)",
            borderRadius: 8,
            fontSize: 14.5,
            width: 280,
            outline: "none",
            fontFamily: "inherit",
            background: "var(--kb-paper)",
          }}
        />
        <span style={{ fontSize: 13.5, color: "var(--kb-ink-500)", marginLeft: 8 }}>카테고리:</span>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 13.5,
                background: active ? "var(--kb-ink-900)" : "var(--kb-paper)",
                color: active ? "var(--kb-paper)" : "var(--kb-ink-700)",
                border: "1px solid " + (active ? "var(--kb-ink-900)" : "var(--kb-hairline)"),
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
                fontFamily: "var(--kb-font-mono)",
              }}
            >
              {f.label}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 13.5, color: "var(--kb-ink-500)" }}>
          Group by: <strong style={{ color: "var(--kb-ink-900)" }}>날짜</strong>
        </span>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--kb-ink-500)" }}>
            기록이 없어요. 첫 활동을 추가해 보세요.
          </div>
        ) : (
          filtered.map((l, i) => {
            const cs = CATEGORY_STYLES[l.cat];
            return (
              <div
                key={`${l.d}-${l.t}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 80px 1fr 100px 80px",
                  padding: "18px 28px",
                  alignItems: "center",
                  gap: 16,
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--kb-hairline-2)" : 0,
                  cursor: "pointer",
                }}
              >
                <div>
                  <div className="kb-mono" style={{ fontSize: 14.5, color: "var(--kb-ink-900)" }}>
                    {l.d}
                  </div>
                  <div className="kb-mono" style={{ fontSize: 13, color: "var(--kb-ink-500)" }}>
                    {l.t}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: cs.bg,
                    color: cs.fg,
                    textAlign: "center",
                    width: "fit-content",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {cs.label}
                </span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{l.title}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {l.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: "var(--kb-paper-3)",
                          color: "var(--kb-ink-700)",
                          fontFamily: "var(--kb-font-mono)",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="kb-mono"
                  style={{ fontSize: 14.5, color: "var(--kb-ink-700)", textAlign: "right" }}
                >
                  {l.hours}h
                </span>
                <span style={{ fontSize: 13.5, color: "var(--kb-ink-500)", textAlign: "right" }}>편집 ↗</span>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
