import { Clock3 } from "lucide-react";
import { getComingSoonPageTitle } from "../../api/member-feature-flags.js";

export default function ComingSoonPage({ pageKey }: { pageKey: string }) {
  const title = getComingSoonPageTitle(pageKey);

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
      <div className="mx-auto flex min-h-[520px] max-w-[900px] items-center justify-center">
        <section
          className="w-full rounded-lg border border-[#e8e8e4] bg-white px-8 py-14 text-center shadow-sm"
          style={{
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f1ea] text-[var(--kb-ink-600)]">
            <Clock3 className="h-7 w-7" />
          </div>
          <div
            className="kb-mono mb-2 text-[13px] uppercase text-[var(--kb-ink-500)]"
            style={{ letterSpacing: "0.14em" }}
          >
            Coming soon
          </div>
          <h1
            className="kb-display m-0 text-[30px] font-semibold leading-tight text-[#0a0a0a]"
            style={{ letterSpacing: 0 }}
          >
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-[var(--kb-ink-500)]">
            이 기능은 잠시 준비 중입니다.
          </p>
        </section>
      </div>
    </div>
  );
}
