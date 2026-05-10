import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type ListGridProps = {
  /** Card grid (responsive) or list rows (vertical stack with hairlines) */
  viewMode: "card" | "list";
  children: ReactNode;
  /** Override grid columns for "card" mode. Default: 1 / sm:2 / lg:3. */
  cardColumns?: string;
  className?: string;
  /** ARIA role override (default: 'list') */
  role?: string;
  "aria-label"?: string;
};

/**
 * ListGrid — generic container that switches between card grid and list rows.
 * Pages keep their own item components (EventCard, FormCard, etc.) — this only
 * standardizes the wrapping layout, gaps, and surfaces.
 */
export function ListGrid({
  viewMode,
  children,
  cardColumns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  className,
  role = "list",
  ...rest
}: ListGridProps) {
  if (viewMode === "card") {
    return (
      <div
        role={role}
        aria-label={rest["aria-label"]}
        className={cn("grid gap-4", cardColumns, className)}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      role={role}
      aria-label={rest["aria-label"]}
      className={cn(
        "flex flex-col divide-y divide-[var(--kb-border-subtle)] overflow-hidden rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] shadow-[var(--kb-shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
