import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "./useAuth";

function GuardScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#103078]/10 text-[#103078]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export function RequireSession({ children }: { children?: ReactNode }) {
  const { isInitializing, session } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <GuardScreen
        title="로그인 상태를 확인하는 중입니다"
        description="Supabase 세션을 복원하고 있습니다. 잠시만 기다려 주세요."
      />
    );
  }

  if (!session) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return children ?? <Outlet />;
}

export function RequireActiveMember({ children }: { children?: ReactNode }) {
  const { isInitializing, session, memberStatus } = useAuth();

  if (isInitializing) {
    return (
      <GuardScreen
        title="멤버 상태를 불러오는 중입니다"
        description="가입 승인 여부와 권한 정보를 확인하고 있습니다."
      />
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (memberStatus !== "active") {
    return <Navigate to="/member/pending" replace />;
  }

  return children ?? <Outlet />;
}

export function RequirePermission({
  anyOf,
  fallbackTo = "/member",
  children,
}: {
  anyOf: string[];
  fallbackTo?: string;
  children?: ReactNode;
}) {
  const { isInitializing, session, memberStatus, hasPermission } = useAuth();

  if (isInitializing) {
    return (
      <GuardScreen
        title="권한을 확인하는 중입니다"
        description="현재 계정이 이 페이지에 접근할 수 있는지 검사하고 있습니다."
      />
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (memberStatus !== "active") {
    return <Navigate to="/member/pending" replace />;
  }

  if (!hasPermission(...anyOf)) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children ?? <Outlet />;
}
