/**
 * Primitives — project-specific layout & state components built on top of shadcn.
 * All design-system imports from pages should go through this barrel:
 *   import { EmptyState, PageHeader, FilterBar, ... } from "@/app/components/primitives";
 *
 * Conventions:
 *  - Pages must NOT inline header/empty/error/skeleton patterns. Reach for these instead.
 *  - When a new shared pattern emerges, add it here and document in
 *    docs/design/system/components.md.
 */
export { EmptyState } from "./EmptyState";
export { PageHeader } from "./PageHeader";
export { FilterBar } from "./FilterBar";
export { ListSkeleton } from "./ListSkeleton";
export { ListGrid } from "./ListGrid";
export { ViewToggle, type ViewToggleOption } from "./ViewToggle";
export { ErrorBoundary, ErrorFallback } from "./ErrorBoundary";
export { StatusPill, type StatusTone } from "./StatusPill";
