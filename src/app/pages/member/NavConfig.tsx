import { Navigate } from "react-router";

/**
 * Legacy redirect: the dedicated KOSS sidebar toggle UI was superseded by
 * the full tag system. We forward straight to the KOSS tag detail page
 * which exposes the same nav toggles plus permissions and assignments.
 */
export default function NavConfig() {
  return <Navigate to="/member/tags/koss" replace />;
}
