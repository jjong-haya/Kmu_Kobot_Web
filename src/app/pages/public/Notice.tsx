import { useState } from "react";
import { Link } from "react-router";
import { PublicHeader } from "../../components/public/PublicHeader";
import { useIsMobile } from "../../hooks/useIsMobile";
import MobileNotice from "./MobileNotice";

export type NoticeItem = {
  slug: string;
  pinned: boolean;
  category: "all" | "system" | "general";
  title: string;
  date: string;
  preview: string;
  body: string;
  author: string;
};

export const NOTICES: NoticeItem[] = [
  {
    slug: "space-booking-launch",
    pinned: true,
    category: "system",
    title: "공간 예약 시스템 오픈",
    date: "2026.05.04",
    author: "운영진",
    preview: "동아리실 일정을 캘린더로 관리합니다.",
    body:
      "복지관 B128-1호 동아리실 사용을 위한 공간 예약 시스템이 오픈되었습니다.\n\n" +
      "■ 주요 기능\n" +
      "- 월간 캘린더에서 한눈에 일정 확인\n" +
      "- 예약 유형 3가지: 회의 / 스터디 / 개인\n" +
      "- 사용 범위 3단계: 전체 단독 사용 / 책상만 사용 / 자유 출입\n" +
      "- 본인이 만든 예약만 수정·취소 가능\n\n" +
      "■ 사용 방법\n" +
      "1. 멤버 → 공간 예약 메뉴 진입\n" +
      "2. 캘린더에서 원하는 날짜 클릭\n" +
      "3. 우측 하단 '+ 새 예약' 버튼으로 일정 등록\n\n" +
      "예약 충돌이나 정책 관련 문의는 운영진에게 알려주세요.",
  },
];

export function findNoticeBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return NOTICES.find((n) => n.slug === slug);
}

const FILTERS: Array<NoticeItem["category"]> = ["all", "system", "general"];

export default function Notice() {
  const [filter, setFilter] = useState<NoticeItem["category"]>("all");
  const filtered = filter === "all" ? NOTICES : NOTICES.filter((n) => n.category === filter);
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileNotice />;
  }

  return (
    <div className="kb-root" style={{ background: "var(--kb-paper)", minHeight: "100vh" }}>
      <PublicHeader variant="tech" />
      <section style={{ padding: "40px", maxWidth: 1080, margin: "0 auto" }}>
        <div className="kb-mono" style={{ fontSize: 11, color: "var(--kb-ink-500)", marginBottom: 24 }}>
          ~/kobot $ tail -n 50 notice.log
        </div>
        <h1
          className="kb-mono"
          style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.02em" }}
        >
          /notice
        </h1>
        <p className="kb-mono" style={{ fontSize: 12, color: "var(--kb-ink-500)", margin: "0 0 32px" }}>
          # all official announcements
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            fontFamily: "var(--kb-font-mono)",
            fontSize: 11,
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((t) => {
            const active = filter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                style={{
                  padding: "6px 12px",
                  background: active ? "var(--kb-ink-900)" : "transparent",
                  color: active ? "var(--kb-paper)" : "var(--kb-ink-700)",
                  border: "1px solid " + (active ? "var(--kb-ink-900)" : "var(--kb-hairline)"),
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "inherit",
                }}
              >
                --{t}
              </button>
            );
          })}
        </div>

        <div style={{ border: "1px solid var(--kb-hairline)", fontFamily: "var(--kb-font-mono)" }}>
          {filtered.map((n, i) => (
            <Link
              key={n.slug}
              to={`/notice/${n.slug}`}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 80px 1fr 110px",
                padding: "20px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--kb-hairline-2)" : 0,
                alignItems: "baseline",
                gap: 16,
                background: n.pinned ? "var(--kb-navy-50)" : "transparent",
                transition: "background 200ms",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: 11, color: n.pinned ? "var(--kb-navy-800)" : "var(--kb-ink-400)" }}>
                {n.pinned ? "[★]" : `[${String(filtered.length - i).padStart(2, "0")}]`}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--kb-ink-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {n.category}
              </span>
              <div>
                <h3 style={{ fontFamily: "var(--kb-font-body)", fontSize: 16, fontWeight: 600, margin: 0 }}>
                  {n.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--kb-font-body)",
                    fontSize: 13,
                    color: "var(--kb-ink-500)",
                    margin: "4px 0 0",
                  }}
                >
                  {n.preview}
                </p>
              </div>
              <span style={{ fontSize: 11, color: "var(--kb-ink-500)", textAlign: "right" }}>{n.date}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
