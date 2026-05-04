import { useState, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Bell,
  Check,
  Handshake,
  KeyRound,
  MailOpen,
  ShieldCheck,
  Vote,
} from "lucide-react";

/* ───── types & data ───── */

type NotificationCategory = "contact" | "vote" | "project" | "permission";

type Notification = {
  id: number;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  status: string;
};

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: typeof Bell; chipBg: string; chipFg: string; dot: string }
> = {
  contact: {
    label: "연락 요청",
    icon: Handshake,
    chipBg: "#e3ecfb",
    chipFg: "#163b86",
    dot: "var(--kb-navy-800)",
  },
  vote: {
    label: "투표",
    icon: Vote,
    chipBg: "#fef3c7",
    chipFg: "#92400e",
    dot: "#d97706",
  },
  project: {
    label: "프로젝트 승인",
    icon: ShieldCheck,
    chipBg: "#dff4e2",
    chipFg: "#15602e",
    dot: "#15803d",
  },
  permission: {
    label: "권한 양도",
    icon: KeyRound,
    chipBg: "#f3e8ff",
    chipFg: "#6b21a8",
    dot: "#9333ea",
  },
};

const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    category: "contact",
    title: "김하린 님이 연락을 요청했습니다",
    message:
      "SLAM 스터디 참여 전 준비 자료와 첫 모임 장소를 확인하고 싶다는 요청입니다.",
    time: "10분 전",
    unread: true,
    status: "응답 대기",
  },
  {
    id: 2,
    category: "vote",
    title: "회장 보궐 선거 결선 투표가 시작되었습니다",
    message:
      "1차 투표에서 과반 후보가 없어 상위 2인 결선 투표가 진행 중입니다.",
    time: "1시간 전",
    unread: true,
    status: "참여 필요",
  },
  {
    id: 3,
    category: "project",
    title: "자율주행 프로젝트 참여가 승인되었습니다",
    message:
      "운영진 승인으로 프로젝트 멤버 권한이 부여되었습니다. 온보딩 자료를 확인해 주세요.",
    time: "어제",
    unread: false,
    status: "승인 완료",
  },
  {
    id: 4,
    category: "permission",
    title: "장비 관리 권한 양도 요청이 도착했습니다",
    message:
      "기존 담당자가 다음 학기 장비 대여 관리 권한을 양도하려고 합니다.",
    time: "2일 전",
    unread: true,
    status: "수락 필요",
  },
  {
    id: 5,
    category: "vote",
    title: "정기 세미나 요일 변경 안건이 마감되었습니다",
    message:
      "결과 공개 시점 설정에 따라 운영진 검토 후 결과가 공개될 예정입니다.",
    time: "3일 전",
    unread: false,
    status: "마감",
  },
  {
    id: 6,
    category: "contact",
    title: "반복 연락 요청 경고가 기록되었습니다",
    message:
      "동일한 대상에게 짧은 시간 안에 유사한 요청이 반복되어 자동화 차단 정책 안내가 발송되었습니다.",
    time: "4일 전",
    unread: false,
    status: "정책 안내",
  },
  {
    id: 7,
    category: "project",
    title: "딥러닝 프로젝트 중간 점검 결과 안내",
    message:
      "프로젝트 중간 평가에서 A등급을 받았습니다. 상세 피드백을 확인하세요.",
    time: "5일 전",
    unread: false,
    status: "확인 완료",
  },
];

/* ───── filter definitions ───── */

type FilterKey = "all" | "unread" | "contact" | "vote" | "approval";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unread", label: "읽지 않음" },
  { key: "contact", label: "연락 요청" },
  { key: "vote", label: "투표" },
  { key: "approval", label: "승인/권한" },
];

function filterNotifications(items: Notification[], key: FilterKey): Notification[] {
  switch (key) {
    case "all":
      return items;
    case "unread":
      return items.filter((n) => n.unread);
    case "contact":
      return items.filter((n) => n.category === "contact");
    case "vote":
      return items.filter((n) => n.category === "vote");
    case "approval":
      return items.filter((n) => n.category === "project" || n.category === "permission");
  }
}

function countForFilter(items: Notification[], key: FilterKey): number {
  return filterNotifications(items, key).length;
}

/** Exported so MemberLayout can import to show badge count */
export const UNREAD_COUNT = NOTIFICATIONS.filter((n) => n.unread).length;

/* ───── shared primitives (same as Dashboard) ───── */

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...CARD_STYLE, ...style }}>{children}</div>;
}

/* ───── notification row ───── */

function NotificationRow({ n }: { n: Notification }) {
  const meta = CATEGORY_META[n.category];
  const Icon = meta.icon;

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        padding: "20px 28px",
        borderTop: "1px solid #f1ede4",
        transition: "background 120ms",
        cursor: "pointer",
        position: "relative",
      }}
      className="hover:bg-[#fafaf6]"
    >
      {/* unread indicator bar */}
      {n.unread && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--kb-navy-800)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}

      {/* icon circle */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: n.unread ? "#0a0a0a" : "#f1ede4",
          marginTop: 2,
        }}
      >
        <Icon
          style={{
            width: 18,
            height: 18,
            color: n.unread ? "#fff" : "var(--kb-ink-500)",
          }}
        />
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          {/* category chip */}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 4,
              background: meta.chipBg,
              color: meta.chipFg,
              letterSpacing: "0.02em",
            }}
          >
            {meta.label}
          </span>
          {/* status chip */}
          <span
            style={{
              fontSize: 12.5,
              color: "var(--kb-ink-500)",
              fontWeight: 500,
            }}
          >
            {n.status}
          </span>
          {n.unread && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#dc2626",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: n.unread ? 600 : 500,
            color: "var(--kb-ink-900)",
            lineHeight: 1.45,
            marginBottom: 4,
          }}
        >
          {n.title}
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--kb-ink-500)",
            lineHeight: 1.5,
          }}
        >
          {n.message}
        </div>
      </div>

      {/* time */}
      <div
        style={{
          fontSize: 13,
          color: "var(--kb-ink-400)",
          flexShrink: 0,
          paddingTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {n.time}
      </div>
    </div>
  );
}

/* ───── page ───── */

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => filterNotifications(NOTIFICATIONS, activeFilter),
    [activeFilter],
  );

  const unreadCount = useMemo(() => NOTIFICATIONS.filter((n) => n.unread).length, []);

  return (
    <div
      className="kb-root"
      style={{
        minHeight: "calc(100vh - 4rem)",
        margin: -32,
        padding: 32,
        background: "#ffffff",
      }}
    >
      <div style={{ margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>
        {/* page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            paddingBottom: 4,
          }}
        >
          <div>
            <div
              className="kb-mono"
              style={{
                fontSize: 13,
                color: "var(--kb-ink-500)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Notifications
            </div>
            <h1
              className="kb-display"
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
                color: "#0a0a0a",
              }}
            >
              알림
              <span style={{ color: "var(--kb-ink-500)", fontWeight: 400, marginLeft: 12, fontSize: 17 }}>
                · 읽지 않은 알림 {unreadCount}건
              </span>
            </h1>
          </div>

          {/* mark all read */}
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              border: "1px solid #ebe8e0",
              background: "#fff",
              borderRadius: 8,
              fontSize: 14.5,
              fontWeight: 500,
              cursor: "pointer",
              color: "var(--kb-ink-700)",
              fontFamily: "inherit",
              transition: "border-color 120ms",
            }}
            className="hover:border-[var(--kb-ink-300)]"
          >
            <Check style={{ width: 14, height: 14 }} />
            모두 읽음 처리
          </button>
        </div>

        {/* parent card wrapping everything */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {/* filter pills bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "18px 28px",
              borderBottom: "1px solid #f1ede4",
              flexWrap: "wrap",
            }}
          >
            {FILTERS.map((f) => {
              const count = countForFilter(NOTIFICATIONS, f.key);
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: isActive ? "1px solid #0a0a0a" : "1px solid #ebe8e0",
                    background: isActive ? "#0a0a0a" : "#fff",
                    color: isActive ? "#fff" : "var(--kb-ink-700)",
                    fontSize: 14.5,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 150ms",
                  }}
                  className={isActive ? "" : "hover:border-[var(--kb-ink-300)]"}
                >
                  {f.label}
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      opacity: isActive ? 0.8 : 0.5,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* notification list */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "56px 28px",
                textAlign: "center",
                color: "var(--kb-ink-500)",
                fontSize: 15.5,
              }}
            >
              <MailOpen
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 12px",
                  color: "var(--kb-ink-300)",
                }}
              />
              해당 필터에 알림이 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((n) => (
                <NotificationRow key={n.id} n={n} />
              ))}
            </div>
          )}

          {/* footer summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 28px",
              borderTop: "1px solid #f1ede4",
              fontSize: 13.5,
              color: "var(--kb-ink-500)",
            }}
          >
            <span>
              {filtered.length} / {NOTIFICATIONS.length} items
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bell style={{ width: 13, height: 13 }} />
              중요한 투표와 권한 요청은 읽지 않음으로 우선 표시됩니다.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
