import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

/* ───── types & data ───── */

type RequestStatus = "pending" | "accepted" | "rejected";

type ContactRequest = {
  id: number;
  requester: string;
  requesterRole: string;
  reason: string;
  disclosedMethods: string[];
  requestedAt: string;
  dueText: string;
  status: RequestStatus;
  responderContacts?: string[];
};

const STATUS_META: Record<
  RequestStatus,
  { label: string; icon: typeof Clock3; bg: string; fg: string; dot: string }
> = {
  pending: {
    label: "대기",
    icon: Clock3,
    bg: "#fef3c7",
    fg: "#92400e",
    dot: "#d97706",
  },
  accepted: {
    label: "수락",
    icon: CheckCircle2,
    bg: "#dff4e2",
    fg: "#15602e",
    dot: "#15803d",
  },
  rejected: {
    label: "거절",
    icon: XCircle,
    bg: "#f3f3f1",
    fg: "#6a6a6a",
    dot: "#9a9a98",
  },
};

const REQUESTS: ContactRequest[] = [
  {
    id: 1,
    requester: "김하린",
    requesterRole: "신입 부원",
    reason: "SLAM 스터디 참여 전 준비 자료와 첫 모임 장소를 확인하고 싶습니다.",
    disclosedMethods: ["이메일", "카카오톡 오픈채팅"],
    requestedAt: "2026-04-28 10:20",
    dueText: "응답 기한 D-2",
    status: "pending",
  },
  {
    id: 2,
    requester: "이도윤",
    requesterRole: "프로젝트 지원자",
    reason: "자율주행 프로젝트 온보딩 일정 조율을 위해 연락을 요청했습니다.",
    disclosedMethods: ["이메일", "전화번호"],
    requestedAt: "2026-04-27 18:05",
    dueText: "응답 기한 D-1",
    status: "accepted",
    responderContacts: ["이메일"],
  },
  {
    id: 3,
    requester: "박서준",
    requesterRole: "외부 협업 문의",
    reason: "동일한 장비 대여 문의를 반복 요청하여 정책 검토가 필요합니다.",
    disclosedMethods: ["이메일"],
    requestedAt: "2026-04-25 09:40",
    dueText: "반복 요청 경고 1회",
    status: "rejected",
  },
];

/* ───── filter ───── */

type FilterKey = "all" | "pending" | "accepted" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기" },
  { key: "accepted", label: "수락" },
  { key: "rejected", label: "거절" },
];

function filterRequests(items: ContactRequest[], key: FilterKey) {
  if (key === "all") return items;
  return items.filter((r) => r.status === key);
}

/* ───── shared container ───── */

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};

/* ───── request row (NOT a card — a row inside a list) ───── */

function RequestRow({ r }: { r: ContactRequest }) {
  const meta = STATUS_META[r.status];
  const StatusIcon = meta.icon;

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        padding: "22px 28px",
        borderTop: "1px solid #f1ede4",
        transition: "background 120ms",
        cursor: "pointer",
        position: "relative",
      }}
      className="hover:bg-[#fafaf6]"
    >
      {/* unread indicator bar for pending */}
      {r.status === "pending" && (
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

      {/* avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: r.status === "pending" ? "#0a0a0a" : "#f1ede4",
          marginTop: 2,
        }}
      >
        <UserRound
          style={{
            width: 20,
            height: 20,
            color: r.status === "pending" ? "#fff" : "var(--kb-ink-500)",
          }}
        />
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* top line: name + role + status + methods */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 16.5,
              fontWeight: r.status === "pending" ? 700 : 600,
              color: "var(--kb-ink-900)",
            }}
          >
            {r.requester}
          </span>
          <span
            style={{
              fontSize: 13.5,
              color: "var(--kb-ink-400)",
            }}
          >
            {r.requesterRole}
          </span>

          {/* status chip */}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 4,
              background: meta.bg,
              color: meta.fg,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <StatusIcon style={{ width: 12, height: 12 }} />
            {meta.label}
          </span>

          {r.status === "pending" && (
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

        {/* reason */}
        <div
          style={{
            fontSize: 15.5,
            lineHeight: 1.55,
            color: "var(--kb-ink-600, #505050)",
            marginBottom: 8,
          }}
        >
          {r.reason}
        </div>

        {/* bottom meta line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 13.5,
            color: "var(--kb-ink-400)",
          }}
        >
          {/* disclosed methods */}
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Mail style={{ width: 13, height: 13 }} />
            {r.disclosedMethods.join(", ")}
          </span>

          <span style={{ color: "#ddd" }}>·</span>
          <span>{r.requestedAt}</span>
          <span style={{ color: "#ddd" }}>·</span>
          <span
            style={{
              fontWeight: 600,
              color:
                r.status === "pending"
                  ? "var(--kb-navy-800)"
                  : r.status === "rejected"
                    ? "#dc2626"
                    : "var(--kb-ink-400)",
            }}
          >
            {r.dueText}
          </span>

          {/* accepted: show responder contacts inline */}
          {r.status === "accepted" && r.responderContacts && (
            <>
              <span style={{ color: "#ddd" }}>·</span>
              <span style={{ color: "#15803d", fontWeight: 500 }}>
                공개: {r.responderContacts.join(", ")}
              </span>
            </>
          )}
        </div>

        {/* pending: action buttons inline */}
        {r.status === "pending" && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              style={{
                padding: "8px 22px",
                background: "#0a0a0a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              수락
            </button>
            <button
              type="button"
              style={{
                padding: "8px 22px",
                background: "#fff",
                color: "var(--kb-ink-700)",
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              거절
            </button>
            <button
              type="button"
              style={{
                padding: "8px 14px",
                background: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Flag style={{ width: 13, height: 13 }} />
              신고
            </button>
          </div>
        )}
      </div>

      {/* time on right */}
      <div
        style={{
          fontSize: 13,
          color: "var(--kb-ink-400)",
          flexShrink: 0,
          paddingTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {r.requestedAt.split(" ")[1]}
      </div>
    </div>
  );
}

/* ───── page ───── */

export default function ContactRequests() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const filtered = filterRequests(REQUESTS, activeFilter);

  const pendingCount = REQUESTS.filter((r) => r.status === "pending").length;

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
      <div
        style={{
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1100,
        }}
      >
        {/* ─── page header ─── */}
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
              Contact Requests
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
              연락 요청
              <span
                style={{
                  color: "var(--kb-ink-500)",
                  fontWeight: 400,
                  marginLeft: 12,
                  fontSize: 17,
                }}
              >
                · 대기 {pendingCount}건
              </span>
            </h1>
          </div>

          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Send style={{ width: 15, height: 15 }} />
            새 요청
          </button>
        </div>

        {/* ─── privacy note (simple inline, not a card) ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            background: "#f8f9fc",
            borderRadius: 10,
            fontSize: 14.5,
            color: "var(--kb-ink-500)",
            lineHeight: 1.5,
          }}
        >
          <ShieldCheck
            style={{
              width: 18,
              height: 18,
              color: "var(--kb-navy-800)",
              flexShrink: 0,
            }}
          />
          연락처는 서로 동의한 범위에서만 공개됩니다. 미응답 시 3일 후 자동 거절됩니다.
        </div>

        {/* ─── single list container (like Notifications) ─── */}
        <div style={{ ...CONTAINER_STYLE, padding: 0, overflow: "hidden" }}>
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
              const count =
                f.key === "all"
                  ? REQUESTS.length
                  : REQUESTS.filter((r) => r.status === f.key).length;
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
                    border: isActive
                      ? "1px solid #0a0a0a"
                      : "1px solid #ebe8e0",
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

          {/* request rows */}
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "56px 28px",
                textAlign: "center",
                color: "var(--kb-ink-500)",
                fontSize: 15.5,
              }}
            >
              <UserRound
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 12px",
                  color: "var(--kb-ink-300)",
                }}
              />
              해당 필터에 요청이 없습니다.
            </div>
          ) : (
            <div>
              {filtered.map((r) => (
                <RequestRow key={r.id} r={r} />
              ))}
            </div>
          )}

          {/* footer */}
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
              {filtered.length} / {REQUESTS.length} 건
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck style={{ width: 13, height: 13 }} />
              스팸·반복 요청은 자동 차단됩니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
