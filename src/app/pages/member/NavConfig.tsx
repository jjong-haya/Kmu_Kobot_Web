import { Navigate } from "react-router";

/**
 * Legacy redirect: the dedicated sidebar toggle UI was superseded by
 * the full tag system.
 */
export default function NavConfig() {
  return <Navigate to="/member/tags" replace />;
}
