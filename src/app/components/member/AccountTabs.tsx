import { Link, useLocation } from "react-router";
import type { CSSProperties } from "react";
import { ShieldCheck, User, IdCard } from "lucide-react";

const TABS: { key: string; label: string; href: string; icon: typeof User }[] = [
  { key: "profile", label: "프로필", href: "/member/profile", icon: User },
  { key: "security", label: "계정 보안", href: "/member/security", icon: ShieldCheck },
  { key: "account-info", label: "회원 정보", href: "/member/account-info", icon: IdCard },
];

/** Inject responsive CSS once for all account pages */
export function AccountResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .kb-acct-page { margin: -32px -16px !important; padding: 18px 14px !important; }
        .kb-acct-title { font-size: 24px !important; }
        .kb-acct-eyebrow { font-size: 12px !important; }
        .kb-acct-card-pad { padding: 18px !important; }
        .kb-acct-grid-2 { grid-template-columns: 1fr !important; gap: 14px !important; }
        .kb-acct-info-actions { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
        .kb-acct-info-actions-row { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; width: 100%; }
        .kb-acct-info-actions-row button { flex: 1 1 calc(50% - 4px) !important; }
        .kb-acct-form-footer { flex-direction: column-reverse !important; align-items: stretch !important; gap: 10px !important; }
        .kb-acct-form-footer button { width: 100%; }
        .kb-acct-tabs > a { padding: 11px 14px !important; font-size: 13.5px !important; }
        .kb-acct-avatar-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
      }
      @media (max-width: 480px) {
        .kb-acct-info-actions-row button { flex: 1 1 100% !important; }
      }
    `}</style>
  );
}

export function AccountTabs() {
  const { pathname } = useLocation();

  return (
    <div
      className="kb-acct-tabs"
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid #ebe8e0",
        overflowX: "auto",
      }}
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const sel = pathname === t.href;
        return (
          <Link
            key={t.key}
            to={t.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 18px",
              background: "transparent",
              borderBottom: "2px solid " + (sel ? "#0a0a0a" : "transparent"),
              fontSize: 14.5,
              fontWeight: sel ? 700 : 500,
              cursor: "pointer",
              color: sel ? "#0a0a0a" : "var(--kb-ink-500)",
              marginBottom: -1,
              whiteSpace: "nowrap",
              fontFamily: "inherit",
              textDecoration: "none",
              transition: "color 120ms",
            }}
          >
            <Icon style={{ width: 14, height: 14 }} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const ACCOUNT_PAGE_WRAPPER: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

export const ACCOUNT_CARD: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
};
