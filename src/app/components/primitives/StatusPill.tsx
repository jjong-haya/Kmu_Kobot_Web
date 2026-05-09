import type { ReactNode } from "react";
import { cn } from "../ui/utils";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral:
    "bg-[var(--kb-paper-3)] text-[var(--kb-ink-700)] ring-1 ring-inset ring-[var(--kb-border-subtle)]",
  info:
    "bg-[var(--kb-info-50)] text-[var(--kb-info-700)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--kb-info-500)_30%,transparent)]",
  success:
    "bg-[var(--kb-success-50)] text-[var(--kb-success-700)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--kb-success-500)_30%,transparent)]",
  warning:
    "bg-[var(--kb-warning-50)] text-[var(--kb-warning-700)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--kb-warning-500)_30%,transparent)]",
  danger:
    "bg-[var(--kb-danger-50)] text-[var(--kb-danger-700)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--kb-danger-500)_30%,transparent)]",
  accent:
    "bg-[var(--kb-navy-50)] text-[var(--kb-navy-700)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--kb-navy-500)_30%,transparent)]",
};

type StatusPillProps = {
  tone?: StatusTone;
  children: ReactNode;
  /** Optional leading dot indicator (good for live state e.g. ongoing) */
  dot?: boolean;
  className?: string;
};

/**
 * StatusPill — semantic status badge. Use instead of color-by-role hardcoding.
 * Tones map to design tokens: success / warning / danger / info / accent / neutral.
 */
export function StatusPill({
  tone = "neutral",
  dot = false,
  children,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--kb-radius-full)] px-2.5 py-0.5 text-[11.5px] font-medium leading-5",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-[var(--kb-success-500)]",
            tone === "warning" && "bg-[var(--kb-warning-500)]",
            tone === "danger" && "bg-[var(--kb-danger-500)]",
            tone === "info" && "bg-[var(--kb-info-500)]",
            tone === "accent" && "bg-[var(--kb-navy-500)]",
            tone === "neutral" && "bg-[var(--kb-ink-400)]",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
