import { useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { Info, Lock, Send, X } from "lucide-react";
import {
  AccountTabs,
  AccountResponsiveStyles,
  ACCOUNT_PAGE_WRAPPER,
  ACCOUNT_CARD,
} from "../../components/member/AccountTabs";
import { useAuth } from "../../auth/useAuth";
import { getSupabaseBrowserClient } from "../../auth/supabase";
import { sanitizeUserError } from "../../utils/sanitize-error";

const FIELD_KEY: Record<string, string> = {
  이름: "full_name",
  학번: "student_id",
  학과: "department",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--kb-ink-400)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const fieldValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: "var(--kb-ink-900)",
  padding: "10px 14px",
  background: "#fafaf9",
  border: "1px solid #ebe8e0",
  borderRadius: 8,
};

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value || "—"}</div>
    </div>
  );
}

function ChangeRequestModal({
  field,
  currentValue,
  onClose,
  onSubmit,
}: {
  field: string;
  currentValue: string;
  onClose: () => void;
  onSubmit: (next: string, reason: string) => void;
}) {
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!next.trim() || !reason.trim()) return;
    onSubmit(next.trim(), reason.trim());
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        overflowY: "auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.1)",
          overflow: "hidden",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1ede4",
          }}
        >
          <h2
            className="kb-display"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: 0,
              color: "var(--kb-ink-900)",
            }}
          >
            {field} 변경 요청
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--kb-ink-500)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--kb-ink-400)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              현재 값
            </div>
            <div style={fieldValueStyle}>{currentValue || "—"}</div>
          </div>

          <div>
            <label
              htmlFor="cr-next"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              변경할 값
            </label>
            <input
              id="cr-next"
              type="text"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14.5,
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="cr-reason"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--kb-ink-700)",
                marginBottom: 6,
              }}
            >
              변경 사유
            </label>
            <textarea
              id="cr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="운영진이 검토할 수 있도록 변경 사유를 적어 주세요."
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14.5,
                border: "1px solid #e8e8e4",
                borderRadius: 8,
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "var(--kb-ink-500)",
              padding: "10px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 8,
              lineHeight: 1.5,
            }}
          >
            운영진 검토 후 승인되어야 변경됩니다. 보통 1~2일 이내 처리돼요.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 24px",
            borderTop: "1px solid #f1ede4",
            background: "#fafaf9",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid #ebe8e0",
              background: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--kb-ink-700)",
              fontFamily: "inherit",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              background: "#0a0a0a",
              color: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Send style={{ width: 13, height: 13 }} />
            요청 보내기
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AccountInfo() {
  const { authData } = useAuth();
  const profile = authData.profile;

  const [requestField, setRequestField] = useState<string | null>(null);
  const [requestValue, setRequestValue] = useState("");
  const [submittedField, setSubmittedField] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function openRequest(field: string, currentValue: string) {
    setRequestField(field);
    setRequestValue(currentValue);
    setSubmitError(null);
  }

  async function handleSubmit(next: string, reason: string) {
    if (!requestField) return;
    setSubmitError(null);
    try {
      const fieldKey = FIELD_KEY[requestField] ?? requestField;
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profile_change_requests")
        .insert({
          requester_id: profile.id,
          field: fieldKey,
          current_value: requestValue || null,
          requested_value: next,
          reason,
          status: "pending",
        });
      if (error) {
        setSubmitError(sanitizeUserError(error, "요청을 보낼 수 없습니다. 잠시 후 다시 시도해 주세요."));
        return;
      }
      setSubmittedField(requestField);
      setRequestField(null);
      setTimeout(() => setSubmittedField(null), 3000);
    } catch (err) {
      setSubmitError(sanitizeUserError(err, "요청 전송에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    }
  }

  return (
    <div className="kb-root kb-acct-page" style={ACCOUNT_PAGE_WRAPPER}>
      <AccountResponsiveStyles />
      <div
        style={{
          margin: "0 auto",
          maxWidth: 900,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <div
            className="kb-mono kb-acct-eyebrow"
            style={{
              fontSize: 13,
              color: "var(--kb-ink-500)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Account · Info
          </div>
          <h1
            className="kb-display kb-acct-title"
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
              color: "#0a0a0a",
            }}
          >
            회원 정보
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--kb-ink-500)",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            가입 시 등록한 신원 정보입니다. 변경하려면 운영진에게 요청해야 해요.
          </p>
        </div>

        <AccountTabs />

        {submittedField && (
          <div
            style={{
              padding: "12px 18px",
              background: "#f0faf1",
              border: "1px solid #c6e7c9",
              borderRadius: 10,
              color: "#15602e",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ✓ {submittedField} 변경 요청을 보냈습니다. 운영진 검토 후 반영됩니다.
          </div>
        )}
        {submitError && (
          <div
            style={{
              padding: "12px 18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              color: "#991b1b",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            요청 전송 실패: {submitError}
          </div>
        )}

        {/* read-only info card */}
        <div
          style={{
            ...ACCOUNT_CARD,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #f1ede4",
              background: "#fafaf9",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Lock
              style={{ width: 14, height: 14, color: "var(--kb-ink-500)" }}
            />
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "var(--kb-ink-700)",
              }}
            >
              읽기 전용 — 변경 요청만 가능
            </span>
          </div>

          <div
            className="kb-acct-grid-2"
            style={{
              padding: "22px 24px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            <ReadOnlyField label="이름" value={profile.fullName} />
            <ReadOnlyField label="학번" value={profile.studentId} />
            <ReadOnlyField label="단과대" value={profile.college} />
            <ReadOnlyField label="학과" value={profile.department} />
            <ReadOnlyField label="이메일" value={profile.email} />
            <ReadOnlyField
              label="가입 ID"
              value={
                <span className="kb-mono" style={{ fontWeight: 600 }}>
                  {profile.loginId ?? "—"}
                </span>
              }
            />
          </div>

          <div
            className="kb-acct-info-actions"
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f1ede4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              background: "#fafaf9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--kb-ink-500)",
              }}
            >
              <Info style={{ width: 14, height: 14 }} />
              잘못된 정보가 있다면 변경 요청을 보내 주세요.
            </div>
            <div className="kb-acct-info-actions-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                ["이름", profile.fullName ?? ""],
                ["학번", profile.studentId ?? ""],
                ["학과", profile.department ?? ""],
              ].map(([label, val]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openRequest(label, val)}
                  style={{
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "1px solid #ebe8e0",
                    background: "#fff",
                    color: "var(--kb-ink-700)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label} 변경 요청
                </button>
              ))}
            </div>
          </div>
        </div>

        {requestField && (
          <ChangeRequestModal
            field={requestField}
            currentValue={requestValue}
            onClose={() => setRequestField(null)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
