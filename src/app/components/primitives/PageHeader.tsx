import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type PageHeaderProps = {
  /** Optional eyebrow / breadcrumb area above the title */
  eyebrow?: ReactNode;
  /** Page title — required */
  title: ReactNode;
  /** One-line description shown below title */
  description?: ReactNode;
  /** Right-aligned actions (buttons, view toggles) */
  actions?: ReactNode;
  /** Tight bottom border, on by default */
  bordered?: boolean;
  className?: string;
};

/**
 * PageHeader — single header contract for every member/public page.
 * Always render this at the top of a page surface to guarantee:
 *   - title is the largest type on the page
 *   - actions sit at the top-right
 *   - description sits between title and content
 * Avoid duplicating header layout inline on a page.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  bordered = true,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        bordered ? "border-b border-[var(--kb-border-subtle)]" : "",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="kb-mono mb-2 text-[11.5px] uppercase tracking-[0.14em] text-[var(--kb-ink-500)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="kb-display m-0 truncate text-[26px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)] sm:text-[30px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--kb-ink-500)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
