import {
  AlertCircle,
  KeyRound,
  Mail,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../auth/useAuth";

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
    <div className="flex min-h-screen items-center justify-center bg-[#eef3f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="login-shell relative grid w-full max-w-[920px] overflow-hidden rounded-[2rem] border border-[#dbe4f0] bg-[#f8fbff] shadow-[0_28px_80px_rgba(7,31,84,0.16)] lg:min-h-[600px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="login-brand-panel relative hidden overflow-hidden bg-[#061b4c] text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(73,123,255,0.55),transparent_26%),radial-gradient(circle_at_75%_78%,rgba(17,53,143,0.78),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:38px_38px]" />

          <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center justify-center px-10 text-center">
            <div className="text-[clamp(4.75rem,8vw,7rem)] font-black leading-none tracking-[-0.08em] text-white drop-shadow-[0_18px_34px_rgba(2,12,35,0.32)]">
              KOBOT
            </div>
            <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.48em] text-white/62">
              KMU ROBOTICS CLUB
            </p>
            <p className="absolute bottom-10 left-0 right-0 text-[0.72rem] font-medium tracking-[0.12em] text-white/38">
              국민대학교 계정으로만 로그인 가능
            </p>
          </div>
        </section>

        <section className="login-form-panel flex items-center justify-center bg-white px-5 py-9 sm:px-10 lg:px-14">
          <div className="w-full max-w-[350px] space-y-5">
            <div>
              <p className="mb-2 text-lg font-black tracking-[-0.04em] text-[#103078]">
                KOBOT
              </p>
              <h2 className="text-[2rem] font-black tracking-[-0.05em] text-slate-950">
                로그인
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
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
                variant="outline"
                className="h-12 w-full justify-center gap-3 border-[#dadce0] bg-white text-[15px] font-medium text-[#3c4043] shadow-sm transition hover:border-[#c9d1dc] hover:bg-[#f8fafd] hover:text-[#1f1f1f] disabled:bg-white disabled:text-[#9aa0a6]"
                disabled={!isConfigured || isSubmittingGoogleLogin || isInitializing}
                onClick={handleGoogleLogin}
              >
                <span className="grid h-5 w-5 place-items-center" aria-hidden="true">
                  <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.72H.94v2.33A9 9 0 0 0 9 18Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.96 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.02-2.33Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58Z"
                    />
                  </svg>
                </span>
                {isSubmittingGoogleLogin ? "Google로 이동 중..." : "Google로 계속하기"}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span className="bg-white px-3">or</span>
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleLoginIdSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="login-id">
                    ID
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  <label className="text-sm font-medium text-slate-700" htmlFor="password">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

            <p className="text-center text-xs leading-5 text-gray-400">
              국민대학교 계정으로만 로그인 가능합니다.
            </p>
          </div>
        </section>

        <div className="login-intro-panel pointer-events-none absolute inset-0 z-30 hidden overflow-hidden bg-[#061b4c] text-white lg:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(73,123,255,0.62),transparent_28%),radial-gradient(circle_at_72%_76%,rgba(17,53,143,0.82),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="login-kobot-lockup">
            <div className="login-kobot-word">
              {["K", "O", "B", "O", "T"].map((letter, index) => (
                <span className={`login-final-letter login-final-letter-${index + 1}`} key={`final-${letter}-${index}`}>
                  {letter}
                </span>
              ))}
            </div>
            <p className="login-intro-caption">KMU ROBOTICS CLUB</p>
          </div>
          <p className="login-intro-note">국민대학교 계정으로만 로그인 가능</p>
        </div>
      </div>
    </div>
  );
}
