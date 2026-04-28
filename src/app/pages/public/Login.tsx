import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../auth/useAuth";

const LOGIN_STEPS = [
  "최초 로그인은 국민대 Google 계정으로 시작합니다.",
  "운영진 승인 후 member workspace가 열립니다.",
  "프로필에서 아이디를 만들면 다음부터 아이디 로그인도 가능합니다.",
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isConfigured,
    isInitializing,
    session,
    memberStatus,
    authError,
    signInWithGoogle,
    signInWithLoginId,
  } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmittingIdLogin, setIsSubmittingIdLogin] = useState(false);
  const [isSubmittingGoogleLogin, setIsSubmittingGoogleLogin] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextPath = (() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("next");
    return value && value.startsWith("/") ? value : null;
  })();

  useEffect(() => {
    if (isInitializing || !session) {
      return;
    }

    if (memberStatus === "active") {
      navigate(nextPath ?? "/member", { replace: true });
      return;
    }

    navigate("/member/pending", { replace: true });
  }, [isInitializing, memberStatus, navigate, nextPath, session]);

  async function handleGoogleLogin() {
    setSubmitError(null);
    setIsSubmittingGoogleLogin(true);

    try {
      await signInWithGoogle(nextPath ?? undefined);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Google 로그인을 시작하지 못했습니다.",
      );
      setIsSubmittingGoogleLogin(false);
    }
  }

  async function handleLoginIdSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmittingIdLogin(true);

    try {
      const authData = await signInWithLoginId(loginId, password);

      if (authData?.account.status === "active") {
        navigate(nextPath ?? "/member", { replace: true });
        return;
      }

      navigate("/member/pending", { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "아이디 로그인을 진행하지 못했습니다.",
      );
    } finally {
      setIsSubmittingIdLogin(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-[#103078]/10 bg-white shadow-2xl shadow-[#103078]/10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[34rem] flex-col justify-between overflow-hidden bg-[#2563ff] p-8 text-white sm:p-10 lg:min-h-full lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0b2b90]/75 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 opacity-45">
            <div className="mx-auto flex max-w-3xl items-end justify-center gap-3 px-8">
              {[34, 58, 44, 72, 52, 88, 64].map((height, index) => (
                <div
                  key={height}
                  className="w-full rounded-t-2xl border border-white/30 bg-white/10 backdrop-blur-sm"
                  style={{ height: `${height + index * 4}px` }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            KOBOT Member Workspace
          </div>

          <div className="relative z-10 max-w-2xl py-12 lg:py-20">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.32em] text-white/75">
              Kookmin University Robotics Club
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              함께 만든 기록이
              <br />
              다음 프로젝트의
              <br />
              출발점이 됩니다.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/82">
              공지, 자료, 장비 대여, 프로젝트 팀, 투표, 연락 요청까지 동아리 운영을
              한 곳에서 관리하는 KOBOT 내부 공간입니다.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-3">
            {LOGIN_STEPS.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/20 bg-white/12 p-4 text-sm leading-6 backdrop-blur"
              >
                <p className="mb-2 text-lg font-semibold">0{index + 1}</p>
                <p className="text-white/86">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md space-y-6">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#103078] text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#103078]">KOBOT</p>
                  <p className="text-xs text-gray-500">국민대학교 로봇 동아리</p>
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-950">
                로그인
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                학교 메일 인증을 위해 첫 로그인은 Google로 진행합니다. 링크로
                들어온 경우 로그인 후 원래 페이지로 자동 이동합니다.
              </p>
            </div>

            {(submitError || authError || !isConfigured) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {!isConfigured ? "Supabase 설정이 필요합니다" : "로그인을 진행할 수 없습니다"}
                </AlertTitle>
                <AlertDescription>
                  {!isConfigured
                    ? ".env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 값을 입력해야 합니다."
                    : submitError ?? authError}
                </AlertDescription>
              </Alert>
            )}

            {nextPath && (
              <Alert className="border-[#103078]/20 bg-[#103078]/5">
                <CheckCircle2 className="h-4 w-4 text-[#103078]" />
                <AlertTitle>이동할 페이지를 기억하고 있습니다</AlertTitle>
                <AlertDescription>
                  로그인 완료 후 <span className="font-medium">{nextPath}</span> 페이지로
                  돌아갑니다.
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>계정으로 계속하기</CardTitle>
                <CardDescription>
                  Google 로그인 또는 등록한 아이디로 member workspace에 접속합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Button
                  type="button"
                  className="h-12 w-full bg-[#2563ff] text-base hover:bg-[#2048A0]"
                  disabled={!isConfigured || isSubmittingGoogleLogin || isInitializing}
                  onClick={handleGoogleLogin}
                >
                  <LogIn className="h-4 w-4" />
                  {isSubmittingGoogleLogin ? "Google로 이동 중..." : "Google로 로그인"}
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.24em] text-gray-400">
                    <span className="bg-white px-3">or</span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleLoginIdSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="login-id">
                      아이디
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="login-id"
                        autoComplete="username"
                        className="h-11 pl-10"
                        placeholder="프로필에서 만든 login_id"
                        value={loginId}
                        onChange={(event) => setLoginId(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">
                      비밀번호
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        className="h-11 pl-10"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 w-full border-[#103078]/20 text-[#103078]"
                    disabled={!isConfigured || isSubmittingIdLogin || isInitializing}
                  >
                    {isSubmittingIdLogin ? "로그인 확인 중..." : "아이디로 로그인"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs leading-5 text-gray-500">
              국민대 계정이 아닌 경우 접근 안내 페이지만 표시됩니다. 계정 정정이나
              탈퇴 처리는 운영진 승인 기록으로 남습니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
