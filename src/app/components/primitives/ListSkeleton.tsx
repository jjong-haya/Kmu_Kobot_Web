import { Skeleton } from "../ui/skeleton";
import { cn } from "../ui/utils";

type ListSkeletonProps = {
  /** Number of skeleton rows/cards */
  count?: number;
  /** 'list' renders horizontal rows; 'card' renders a responsive grid */
  variant?: "list" | "card";
  className?: string;
};

/**
 * ListSkeleton — drop-in loading placeholder for list and card grids.
 * Reuses shadcn `Skeleton` so the shimmer matches everywhere.
 */
export function ListSkeleton({ count = 6, variant = "list", className }: ListSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div
        aria-hidden
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
          className,
        )}
      >
        {items.map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-4 shadow-[var(--kb-shadow-sm)]"
          >
            <Skeleton className="aspect-[16/9] w-full rounded-[var(--kb-radius-sm)]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col gap-2 rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] shadow-[var(--kb-shadow-sm)]",
        className,
      )}
    >
      {items.map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-4 px-4 py-3",
            index !== items.length - 1
              ? "border-b border-[var(--kb-border-subtle)]"
              : "",
          )}
        >
          <Skeleton className="h-10 w-10 rounded-[var(--kb-radius-sm)]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}
