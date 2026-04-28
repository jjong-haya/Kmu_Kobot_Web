import { AlertCircle, Clock3, LogOut, UserRoundCog } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../auth/useAuth";

const STATUS_COPY = {
  pending: {
    badge: "승인 대기",
    title: "첫 로그인은 완료되었습니다",
    description:
      "운영진이 멤버 상태를 active로 변경하면 member workspace 전체에 접근할 수 있습니다.",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
  suspended: {
    badge: "일시 중지",
    title: "현재 계정 사용이 일시 중지되어 있습니다",
    description:
      "운영진이 계정 상태를 다시 활성화하기 전까지 member 기능은 열리지 않습니다.",
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  rejected: {
    badge: "승인 거절",
    title: "이 계정은 멤버 승인이 완료되지 않았습니다",
    description:
      "가입 대상이 맞는지 운영진에게 다시 확인한 뒤 상태를 조정해야 합니다.",
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  alumni: {
    badge: "졸업/비활성",
    title: "현재 계정은 alumni 상태입니다",
    description:
      "읽기 전용이나 일부 권한만 남길지 운영 정책에 맞춰 상태를 다시 배정해야 합니다.",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
} as const;

export default function ApprovalPending() {
  const navigate = useNavigate();
  const { authData, memberStatus, signOut } = useAuth();

  if (memberStatus === "active") {
    return <Navigate to="/member" replace />;
  }

  const copy = STATUS_COPY[memberStatus ?? "pending"];

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      // The next mount will surface the provider error if sign-out fails.
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">멤버 상태 확인</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Google 로그인은 통과했지만, 현재 계정 상태 때문에 member workspace 전체를
          열 수 없는 상태입니다.
        </p>
      </div>

      <Card className="border-[#103078]/15 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-xl">{copy.title}</CardTitle>
            <Badge className={copy.tone}>{copy.badge}</Badge>
          </div>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert>
            <Clock3 className="h-4 w-4" />
            <AlertTitle>다음 단계</AlertTitle>
            <AlertDescription>
              운영진이 이 계정에 팀/직책과 멤버 상태를 배정하면 자동으로 권한이
              열립니다. 별도 재가입은 필요하지 않습니다.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Account email
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {authData.profile.email ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Login ID
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {authData.profile.loginId ?? "아직 설정되지 않음"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Current assignments
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {authData.orgPositions.length === 0 && authData.teamMemberships.length === 0 ? (
                <span className="text-sm text-gray-500">아직 배정된 직책과 팀이 없습니다.</span>
              ) : (
                <>
                  {authData.orgPositions.map((position) => (
                    <Badge key={position.id} variant="outline">
                      {position.name}
                    </Badge>
                  ))}
                  {authData.teamMemberships.map((membership) => (
                    <Badge key={membership.teamId} variant="outline">
                      {membership.teamName}
                      {membership.roleName ? ` · ${membership.roleName}` : ""}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-[#103078] hover:bg-[#2048A0]"
              onClick={() => navigate("/member/profile")}
            >
              <UserRoundCog className="h-4 w-4" />
              프로필 설정
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>운영진 확인 포인트</AlertTitle>
        <AlertDescription>
          `allowed_login_exceptions`, `member_accounts.status`, 팀 배정, 직책 배정이
          모두 권한과 화면 노출에 연결됩니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}

