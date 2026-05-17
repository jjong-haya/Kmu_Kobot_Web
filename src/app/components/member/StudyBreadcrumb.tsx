import { Link } from "react-router";

export type StudyBreadcrumbItem = {
  label: string;
  to?: string;
};

export function StudyBreadcrumb({ items }: { items: StudyBreadcrumbItem[] }) {
  const visibleItems = items.filter((item) => item.label.trim());

  if (visibleItems.length === 0) return null;

  return (
    <nav aria-label="스터디 위치" className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13.5px]">
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="max-w-[220px] truncate font-medium text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)] hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "max-w-[320px] truncate font-semibold text-[var(--kb-ink-900)]"
                    : "max-w-[220px] truncate font-medium text-[var(--kb-ink-500)]"
                }
              >
                {item.label}
              </span>
            )}
            {!isLast ? <span className="text-[var(--kb-ink-300)]">&gt;</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
