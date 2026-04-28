import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  LogIn,
  Mail,
  Sparkles,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../auth/useAuth";
import wordLogo from "@/assets/wordLogo.png";

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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-[#103078]/10 bg-white shadow-xl shadow-[#103078]/10 lg:min-h-[620px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#2563ff] p-10 text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#0b2b90]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 opacity-35">
            <div className="mx-auto flex max-w-2xl items-end justify-center gap-3 px-8">
              {[36, 64, 48, 84, 58].map((height, index) => (
                <div
                  key={height}
                  className="w-full rounded-t-2xl border border-white/30 bg-white/10 backdrop-blur-sm"
                  style={{ height: `${height + index * 5}px` }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="rounded-[2rem] border border-white/35 bg-white/95 px-10 py-8 shadow-2xl shadow-[#082058]/20 backdrop-blur">
              <img src={wordLogo} alt="KOBOT" className="h-14 w-auto" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
              Member Workspace
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-sm space-y-5">
            <div>
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#103078] text-white">
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
                국민대 Google 계정으로 접속해 주세요.
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

            <div className="space-y-4">
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

              <form className="space-y-3" onSubmit={handleLoginIdSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700" htmlFor="login-id">
                    아이디
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="login-id"
                      autoComplete="username"
                      className="h-11 pl-10"
                      placeholder="ID"
                      value={loginId}
                      onChange={(event) => setLoginId(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
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
            </div>

            <p className="text-center text-xs leading-5 text-gray-500">
              국민대 계정이 아닌 경우 접근이 제한됩니다. 계정 문의는 운영진에게
              요청해 주세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
