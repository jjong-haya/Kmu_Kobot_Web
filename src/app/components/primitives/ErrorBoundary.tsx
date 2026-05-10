import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { EmptyState } from "./EmptyState";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Optional custom fallback render — receives the caught error */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Telemetry hook — fire to logger or Sentry */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = { error: Error | null };

/**
 * ErrorBoundary — wrap routes/sections with this to catch render errors.
 * Default fallback uses EmptyState with an "다시 시도" reset button.
 * Pass `fallback` for page-specific recovery flows (e.g. retry a query).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) this.props.onError(error, info);
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
    return (
      <ErrorFallback error={this.state.error} onReset={this.reset} />
    );
  }
}

type ErrorFallbackProps = {
  error: Error;
  onReset: () => void;
  /** Override default copy when the boundary is inline (small) vs full-page */
  size?: "sm" | "md";
};

/** Default error fallback — exposed so pages can render it directly without a boundary. */
export function ErrorFallback({ error, onReset, size = "md" }: ErrorFallbackProps) {
  return (
    <EmptyState
      size={size}
      icon={AlertTriangle}
      title="화면을 불러오지 못했어요"
      description={
        process.env.NODE_ENV === "development" && error.message
          ? error.message
          : "잠시 후 다시 시도하거나 페이지를 새로고침 해주세요."
      }
      action={
        <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          다시 시도
        </Button>
      }
    />
  );
}
