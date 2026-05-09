import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";

type FilterBarProps = {
  /** Search field — pass undefined to hide */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    "aria-label"?: string;
  };
  /** Left-side controls (segmented control / status filters / chips) */
  start?: ReactNode;
  /** Right-side controls (view-mode toggle / sort dropdown) */
  end?: ReactNode;
  className?: string;
};

/**
 * FilterBar — single horizontal control surface for list/search pages.
 * Layout: [search][start  ][end]
 * Stacks on mobile (search full width, start row 2, end row 3).
 * Use sparingly — pages with no filters should NOT render an empty FilterBar.
 */
export function FilterBar({ search, start, end, className }: FilterBarProps) {
  const hasSearch = Boolean(search);
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-3 shadow-[var(--kb-shadow-sm)] sm:flex-row sm:items-center",
        className,
      )}
    >
      {hasSearch ? (
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]"
            aria-hidden
          />
          <Input
            value={search!.value}
            onChange={(event) => search!.onChange(event.target.value)}
            placeholder={search!.placeholder ?? "검색"}
            aria-label={search!["aria-label"] ?? search!.placeholder ?? "검색"}
            className="h-9 pl-8 pr-8"
          />
          {search!.value ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => search!.onChange("")}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[var(--kb-radius-sm)] text-[var(--kb-ink-400)] hover:bg-[var(--kb-paper-3)] hover:text-[var(--kb-ink-700)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      {start ? (
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">{start}</div>
      ) : null}
      {end ? <div className="flex flex-shrink-0 items-center gap-2">{end}</div> : null}
    </div>
  );
}
