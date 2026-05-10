import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "../ui/utils";

export type ViewToggleOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon: ComponentType<LucideProps>;
};

type ViewToggleProps<TValue extends string> = {
  value: TValue;
  onChange: (next: TValue) => void;
  options: ViewToggleOption<TValue>[];
  /** Hide labels on small viewports — icons only when true (default: true) */
  iconsOnlyOnMobile?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * ViewToggle — small segmented control for switching between projections
 * of the same data (e.g. card vs list). Keeps the chosen visual idiom consistent
 * across pages by ensuring the same styles, sizing, and a11y semantics.
 */
export function ViewToggle<TValue extends string>({
  value,
  onChange,
  options,
  iconsOnlyOnMobile = true,
  className,
  ...rest
}: ViewToggleProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"] ?? "보기 방식"}
      className={cn(
        "inline-flex items-center rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-0.5 shadow-[var(--kb-shadow-sm)]",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-[calc(var(--kb-radius-sm)-2px)] px-2.5 text-[12.5px] font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-accent)]",
              active
                ? "bg-[var(--kb-ink-900)] text-[var(--kb-on-accent)]"
                : "text-[var(--kb-ink-500)] hover:bg-[var(--kb-paper-3)] hover:text-[var(--kb-ink-900)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className={iconsOnlyOnMobile ? "hidden sm:inline" : ""}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
