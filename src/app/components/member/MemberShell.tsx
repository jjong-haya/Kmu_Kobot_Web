import type { CSSProperties, ReactNode } from "react";

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e8e4",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 28px 16px",
        borderBottom: "1px solid var(--kb-hairline-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

export function PageEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="kb-mono"
      style={{
        fontSize: 13,
        color: "var(--kb-ink-500)",
        letterSpacing: "0.14em",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="kb-display"
      style={{
        fontSize: 36,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {children}
    </h1>
  );
}

export const memberPagePadding: CSSProperties = {
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 24,
};
