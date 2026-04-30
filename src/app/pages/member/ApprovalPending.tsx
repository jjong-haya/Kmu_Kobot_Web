import {
  AlertCircle,
  Clock3,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useAuth } from "../../auth/useAuth";
import type { MemberStatus } from "../../auth/types";
import { getPostAuthMemberPath, isJoinRequestComplete } from "../../auth/onboarding";
import { getSafeInternalPath, withNextPath } from "../../auth/redirects";

const STATUS_COPY: Record<Exclude<MemberStatus, null>, {
  badge: string;
  title: string;
  description: string;
  tone: string;
}> = {
  pending: {
    badge: "승인 대기",
    title: "운영진 승인을 기다리고 있습니다",
    description:
      "Google 로그인은 완료됐지만 아직 KOBOT 내부 멤버 권한이 열리지 않았습니다. 회장, 부회장 또는 공식 팀장이 가입 정보를 확인한 뒤 승인합니다.",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  suspended: {
    badge: "일시 제한",
    title: "계정 사용이 일시 제한되었습니다",
    description:
      "현재 계정은 운영진 조치로 KOBOT 멤버 공간 접근이 제한되어 있습니다. 제한 사유와 해제 가능 여부는 운영진에게 문의해 주세요.",
    tone: "border-red-200 bg-red-50 text-red-700",
  },
  rejected: {
    badge: "승인 거절",
    title: "가입 승인이 완료되지 않았습니다",
    description:
      "가입 대상 여부를 다시 확인해야 합니다. 입력한 계정이 맞는지 확인하고, 필요하면 운영진에게 재검토를 요청해 주세요.",
    tone: "border-red-200 bg-red-50 text-red-700",
  },
  alumni: {
    badge: "졸업/비활동",
    title: "현재 계정은 alumni 상태입니다",
    description:
      "일부 기록 확인만 가능하거나 내부 기능 접근이 제한될 수 있습니다. 활동 상태 전환이 필요하면 운영진에게 요청해 주세요.",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  },
  active: {
    badge: "승인 완료",
    title: "멤버 승인이 완료되었습니다",
    description: "KOBOT 멤버 공간으로 이동합니다.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  project_only: {
    badge: "프로젝트 참여",
    title: "프로젝트 참여 계정입니다",
    description:
      "KOBOT 정회원 권한은 아니지만 승인된 프로젝트 범위 안에서 필요한 정보만 이용할 수 있습니다. 프로젝트 접근이 열리지 않았다면 프로젝트 팀장에게 문의해 주세요.",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  withdrawn: {
    badge: "탈퇴 처리",
    title: "탈퇴 처리된 계정입니다",
    description:
      "현재 계정은 활동이 종료되어 내부 기능 접근이 제한됩니다. 재가입이나 기록 확인이 필요하면 운영진에게 문의해 주세요.",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

const STATUS_LABELS: Record<Exclude<MemberStatus, null>, string> = {
  active: "승인 완료",
  pending: "승인 대기",
  suspended: "일시 제한",
  rejected: "승인 거절",
  alumni: "졸업/비활동",
  project_only: "프로젝트 참여",
  withdrawn: "탈퇴 처리",
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
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-[2rem] border border-[#103078]/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,48,120,0.12),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f3f7fb_100%)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge className={copy.tone} variant="outline">
              {copy.badge}
            </Badge>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {copy.description}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#103078]/10 bg-white/75 p-3 text-[#103078]">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
      </section>

      <Card className="border-[#103078]/15 shadow-sm">
        <CardHeader>
          <CardTitle>지금 할 수 있는 것</CardTitle>
          <CardDescription>
            가입 요청 정보는 접수되었습니다. 이제 운영진 승인이 완료될 때까지 기다리면 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-[#103078]/20 bg-[#103078]/5">
            <Clock3 className="h-4 w-4 text-[#103078]" />
            <AlertTitle>승인 대기 중입니다</AlertTitle>
            <AlertDescription className="leading-6">
              운영진이 가입자 명단에서 이름, 학교 계정, 소속 정보를 확인한 뒤 권한을 부여합니다.
              승인이 완료되면 다시 로그인하거나 아래 새로고침 버튼을 눌렀을 때 KOBOT 멤버 공간이 열립니다.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                로그인 계정
              </p>
              <p className="mt-2 break-all text-sm font-medium text-gray-900">
                {authData.profile.email ?? "확인되지 않음"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                현재 상태
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {STATUS_LABELS[memberStatus ?? "pending"]}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">승인 전 제한</p>
            <p className="mt-1">
              승인 전에는 자료실, 장비 대여, 프로젝트 팀, 투표 같은 내부 기능에 접근할 수 없습니다.
              가입 요청 정보를 다시 수정해야 한다면 운영진에게 문의해 주세요.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-[#103078] hover:bg-[#2048A0]"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "확인 중..." : "승인 상태 새로고침"}
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:kobot@kookmin.ac.kr?subject=KOBOT%20%EA%B0%80%EC%9E%85%20%EC%8A%B9%EC%9D%B8%20%EB%AC%B8%EC%9D%98">
                <Mail className="h-4 w-4" />
                운영진에게 문의
              </a>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>다른 계정으로 로그인했다면</AlertTitle>
        <AlertDescription className="leading-6">
          로그아웃 후 국민대학교 Google 계정으로 다시 로그인해 주세요. 계속 같은 화면이 보이면 운영진에게 계정 확인을 요청해 주세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}
