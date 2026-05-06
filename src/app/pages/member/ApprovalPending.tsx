import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LogOut,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../auth/useAuth";
import type { MemberStatus } from "../../auth/types";
import { getPostAuthMemberPath, isJoinRequestComplete } from "../../auth/onboarding";
import { getSafeInternalPath, withNextPath } from "../../auth/redirects";

const STATUS_LABELS: Record<Exclude<MemberStatus, null>, string> = {
  active: "승인 완료",
  pending: "승인 대기",
  suspended: "이용 제한",
  rejected: "승인 보류",
  alumni: "비활동",
  project_only: "프로젝트 참여",
  course_member: "KOSS",
  withdrawn: "탈퇴 처리",
};

const STATUS_COPY: Record<
  Exclude<MemberStatus, null>,
  {
    eyebrow: string;
    title: string;
    description: string;
    note: string;
    accentClassName: string;
    icon: typeof AlertCircle;
  }
> = {
  pending: {
    eyebrow: "가입 요청 접수",
    title: "승인 대기 중입니다",
    description: "운영진이 가입 정보를 확인하면 KOBOT 멤버 공간이 열립니다.",
    note: "승인 전에는 자료실, 장비 대여, 프로젝트, 투표 메뉴를 사용할 수 없습니다.",
    accentClassName: "bg-[#103078]",
    icon: Clock3,
  },
  suspended: {
    eyebrow: "계정 확인 필요",
    title: "이용이 잠시 제한되었습니다",
    description: "계정 상태 확인이 필요합니다. 운영진 안내를 확인해 주세요.",
    note: "제한 사유를 확인해야 한다면 kobot@kookmin.ac.kr로 문의해 주세요.",
    accentClassName: "bg-red-500",
    icon: AlertCircle,
  },
  rejected: {
    eyebrow: "재확인 필요",
    title: "가입 승인이 보류되었습니다",
    description: "입력한 정보나 가입 대상 여부를 다시 확인해야 합니다.",
    note: "재검토가 필요하면 운영진에게 문의해 주세요.",
    accentClassName: "bg-red-500",
    icon: AlertCircle,
  },
  alumni: {
    eyebrow: "활동 상태",
    title: "현재 비활동 계정입니다",
    description: "내부 기능 접근이 제한되어 있습니다.",
    note: "활동 상태 전환이 필요하면 운영진에게 요청해 주세요.",
    accentClassName: "bg-slate-400",
    icon: AlertCircle,
  },
  active: {
    eyebrow: "승인 완료",
    title: "멤버 승인이 완료되었습니다",
    description: "KOBOT 멤버 공간으로 이동합니다.",
    note: "잠시만 기다려 주세요.",
    accentClassName: "bg-emerald-500",
    icon: CheckCircle2,
  },
  project_only: {
    eyebrow: "프로젝트 참여",
    title: "프로젝트 참여 계정입니다",
    description: "승인된 프로젝트 범위 안에서 필요한 기능만 사용할 수 있습니다.",
    note: "프로젝트 접근이 보이지 않으면 프로젝트 팀장에게 문의해 주세요.",
    accentClassName: "bg-blue-500",
    icon: CheckCircle2,
  },
  withdrawn: {
    eyebrow: "활동 종료",
    title: "탈퇴 처리된 계정입니다",
    description: "현재 계정으로는 내부 기능을 사용할 수 없습니다.",
    note: "재가입이나 기록 확인이 필요하면 운영진에게 문의해 주세요.",
    accentClassName: "bg-slate-400",
    icon: AlertCircle,
  },
  course_member: {
    eyebrow: "KOSS",
    title: "KOSS 회원으로 가입되었습니다",
    description: "초대 링크를 통해 가입한 KOSS 멤버입니다. 일부 메뉴만 접근 가능해요.",
    note: "전체 권한이 필요하면 운영진에게 문의해 주세요.",
    accentClassName: "bg-amber-500",
    icon: CheckCircle2,
  },
};

export default function ApprovalPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authData, memberStatus, refreshAuthData, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const safeNextPath = getSafeInternalPath(new URLSearchParams(location.search).get("next"));

  if (memberStatus === "active") {
    return <Navigate to={safeNextPath ?? "/member"} replace />;
  }

  if ((memberStatus === "pending" || memberStatus === null) && !isJoinRequestComplete(authData)) {
    return <Navigate to="/member/join" replace />;
  }

  const copy = STATUS_COPY[memberStatus ?? "pending"];
  const StatusIcon = copy.icon;

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      const nextAuthData = await refreshAuthData();

      if (nextAuthData?.account.status === "active") {
        navigate(safeNextPath ?? "/member", { replace: true });
        return;
      }

      if (nextAuthData) {
        navigate(
          withNextPath(
            getPostAuthMemberPath(nextAuthData, nextAuthData.account.status),
            safeNextPath,
          ),
          { replace: true },
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      // AuthProvider가 다음 렌더에서 사용자-facing 오류를 표시합니다.
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl flex-col justify-center px-1 py-8 sm:px-0">
      <section className="relative overflow-hidden border-y border-slate-200 py-10 sm:py-14">
        <div
          className={`absolute left-0 top-0 h-1 w-28 rounded-full ${copy.accentClassName}`}
          aria-hidden="true"
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#103078]">{copy.eyebrow}</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              {copy.description}
            </p>
          </div>

          <dl className="space-y-5 text-sm">
            <div className="border-b border-slate-200 pb-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                계정
              </dt>
              <dd className="mt-2 break-all font-medium text-slate-950">
                {authData.profile.email ?? "확인되지 않음"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                상태
              </dt>
              <dd className="mt-2 inline-flex items-center gap-2 font-medium text-slate-950">
                <StatusIcon className="h-4 w-4 text-[#103078]" />
                {STATUS_LABELS[memberStatus ?? "pending"]}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="max-w-2xl text-sm leading-7 text-slate-500">{copy.note}</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="h-11 bg-[#103078] px-5 text-white hover:bg-[#2048A0]"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "확인 중" : "상태 확인"}
            </Button>
            <Button className="h-11 px-5" variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
            <a
              className="inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-slate-500 transition-colors hover:text-[#103078]"
              href="mailto:kobot@kookmin.ac.kr?subject=KOBOT%20%EA%B0%80%EC%9E%85%20%EC%8A%B9%EC%9D%B8%20%EB%AC%B8%EC%9D%98"
            >
              <Mail className="h-4 w-4" />
              kobot@kookmin.ac.kr
            </a>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-xs leading-6 text-slate-400">
          다른 계정으로 로그인했다면 로그아웃 후 국민대학교 Google 계정으로 다시 로그인하세요.
        </p>
      </section>
    </main>
  );
}
