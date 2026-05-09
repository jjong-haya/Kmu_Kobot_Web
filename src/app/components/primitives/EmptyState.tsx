import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "../ui/utils";

type EmptyStateProps = {
  /** Lucide icon component (preferred) OR custom ReactNode */
  icon?: ComponentType<LucideProps> | ReactNode;
  title: string;
  description?: string;
  /** Primary action — usually a Button */
  action?: ReactNode;
  /** Optional secondary action */
  secondaryAction?: ReactNode;
  /** Visual size — 'sm' for inline empty rows, 'md' for full-page (default) */
  size?: "sm" | "md";
  className?: string;
};

/**
 * EmptyState — 4-slot fixed contract: icon / title / description / action.
 * Use when a list, search, or workspace surface has no data.
 * Don't repurpose for errors — use ErrorBoundary fallback instead.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const isComponent = typeof Icon === "function";

  const iconNode = isComponent ? (
    // Render lucide component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Icon className={size === "sm" ? "h-5 w-5" : "h-7 w-7"} aria-hidden />
  ) : (
    Icon ?? null
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "kb-fade-up mx-auto flex w-full flex-col items-center justify-center text-center",
        size === "sm" ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      {iconNode ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[var(--kb-paper-3)] text-[var(--kb-ink-500)]",
            size === "sm" ? "mb-1 h-9 w-9" : "mb-2 h-12 w-12",
          )}
        >
          {iconNode}
        </div>
      ) : null}
      <h2
        className={cn(
          "kb-display m-0 font-semibold tracking-tight text-[var(--kb-ink-900)]",
          size === "sm" ? "text-[15px] leading-tight" : "text-[20px] leading-tight",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "m-0 max-w-md text-[var(--kb-ink-500)]",
            size === "sm" ? "text-[12.5px] leading-5" : "text-[14px] leading-6",
          )}
        >
          {description}
        </p>
      ) : null}
      {(action || secondaryAction) ? (
        <div className={cn("flex items-center gap-2", size === "sm" ? "mt-1" : "mt-3")}>
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
