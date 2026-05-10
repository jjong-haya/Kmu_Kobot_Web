import type { CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowLeft, Hammer } from "lucide-react";
import { getComingSoonPageTitle } from "../../api/member-feature-flags.js";
import { EmptyState } from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

/**
 * ComingSoonPage — shared placeholder for member features still in build.
 * Wired up via `member-feature-flags.js` so several routes share this surface
 * (study-playlist, resources, equipment, etc.). Designed against the
 * EmptyState primitive so the Coming Soon state matches list/empty surfaces.
 */
export default function ComingSoonPage({ pageKey }: { pageKey: string }) {
  const title = getComingSoonPageTitle(pageKey);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="kb-fade-up mx-auto flex min-h-[520px] max-w-[760px] items-center justify-center">
        <section
          aria-labelledby={`coming-soon-${pageKey}`}
          className="w-full rounded-[var(--kb-radius-lg)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-6 py-12 shadow-[var(--kb-shadow-sm)]"
        >
          <EmptyState
            icon={Hammer}
            title={title}
            description="이 기능은 잠시 준비 중입니다. 동아리 운영진이 디자인과 기능을 다듬고 있어요."
            action={
              <Link
                to="/member"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] no-underline transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                대시보드로
              </Link>
            }
          />
          <div className="kb-mono mt-4 text-center text-[10.5px] uppercase tracking-[0.16em] text-[var(--kb-ink-400)]">
            <span id={`coming-soon-${pageKey}`}>{pageKey}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
