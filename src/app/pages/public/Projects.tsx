import { PublicHeader } from "../../components/public/PublicHeader";

type Project = {
  n: string;
  t: string;
  desc: string;
  tags: string;
  team: number;
  status: "진행중" | "완료" | "계획중";
  period: string;
};

const PROJECTS: Project[] = [
  { n: "01", t: "자율주행 로봇", desc: "SLAM 기반 실내 네비게이션", tags: "ROS · Python · SLAM", team: 5, status: "진행중", period: "25.09 →" },
  { n: "02", t: "6축 로봇팔 제어", desc: "역기구학 정밀 제어 시스템", tags: "C++ · ROS · Kinematics", team: 4, status: "완료", period: "25.03 — 25.08" },
  { n: "03", t: "드론 자동 착륙", desc: "컴퓨터 비전 기반 정밀 착륙", tags: "OpenCV · ArduPilot", team: 3, status: "진행중", period: "25.11 →" },
  { n: "04", t: "딥러닝 물체 인식", desc: "YOLO 실시간 인식 + ROS 통합", tags: "TensorFlow · YOLO · ROS", team: 6, status: "진행중", period: "25.09 →" },
  { n: "05", t: "협동 로봇 시스템", desc: "다중 로봇 분산 제어", tags: "ROS2 · DDS · Multi-Agent", team: 5, status: "계획중", period: "26.03 —" },
];

export default function Projects() {
  return (
    <div className="kb-root" style={{ background: "var(--kb-paper)", minHeight: "100vh" }}>
      <PublicHeader variant="editorial" />
      <section style={{ padding: "64px 56px", maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            marginBottom: 64,
            alignItems: "end",
          }}
        >
          <h1
            className="kb-display"
            style={{
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.95,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            <span className="kb-serif" style={{ fontStyle: "italic", fontWeight: 400 }}>
              Selected
            </span>
            <br />
            projects.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--kb-ink-500)",
              maxWidth: 480,
              justifySelf: "end",
              textAlign: "right",
              margin: 0,
            }}
          >
            매학기 8–12개의 팀 프로젝트가 진행됩니다. 일부는 대회로, 일부는 논문으로, 대부분은 다음 학기의 토대로.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
            <thead>
              <tr style={{ borderTop: "1px solid var(--kb-ink-900)", borderBottom: "1px solid var(--kb-ink-900)" }}>
                {["№", "Title", "Description", "Stack", "Team", "Status", "Period"].map((h, i) => (
                  <th
                    key={h}
                    className="kb-mono"
                    style={{
                      textAlign: i > 3 ? "right" : "left",
                      fontSize: 10,
                      color: "var(--kb-ink-500)",
                      padding: "14px 12px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p) => (
                <tr key={p.n} style={{ borderBottom: "1px solid var(--kb-hairline)" }}>
                  <td
                    className="kb-mono"
                    style={{
                      padding: "24px 12px",
                      color: "var(--kb-ink-400)",
                      fontSize: 13,
                      verticalAlign: "top",
                      width: 56,
                    }}
                  >
                    {p.n}
                  </td>
                  <td style={{ padding: "24px 12px", verticalAlign: "top" }}>
                    <div className="kb-display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>
                      {p.t}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "24px 12px",
                      verticalAlign: "top",
                      fontSize: 14,
                      color: "var(--kb-ink-700)",
                      maxWidth: 280,
                    }}
                  >
                    {p.desc}
                  </td>
                  <td
                    className="kb-mono"
                    style={{
                      padding: "24px 12px",
                      verticalAlign: "top",
                      fontSize: 12,
                      color: "var(--kb-ink-500)",
                    }}
                  >
                    {p.tags}
                  </td>
                  <td
                    className="kb-mono"
                    style={{ padding: "24px 12px", verticalAlign: "top", fontSize: 13, textAlign: "right" }}
                  >
                    {p.team}명
                  </td>
                  <td style={{ padding: "24px 12px", verticalAlign: "top", textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        border: "1px solid " + (p.status === "진행중" ? "var(--kb-navy-800)" : "var(--kb-hairline)"),
                        color: p.status === "진행중" ? "var(--kb-navy-800)" : "var(--kb-ink-700)",
                        fontWeight: 500,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td
                    className="kb-mono"
                    style={{
                      padding: "24px 12px",
                      verticalAlign: "top",
                      fontSize: 12,
                      color: "var(--kb-ink-500)",
                      textAlign: "right",
                    }}
                  >
                    {p.period}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
