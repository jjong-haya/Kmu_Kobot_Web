import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  LogIn,
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
      <div className="grid w-full max-w-[920px] overflow-hidden rounded-[2rem] border border-[#dbe4f0] bg-[#f8fbff] shadow-[0_28px_80px_rgba(7,31,84,0.16)] lg:min-h-[600px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#061b4c] text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(73,123,255,0.55),transparent_26%),radial-gradient(circle_at_75%_78%,rgba(17,53,143,0.78),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:38px_38px]" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 460 600"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M70 486H392"
              stroke="rgba(255,255,255,.2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M132 486V392L214 324L301 245"
              stroke="rgba(255,255,255,.78)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M214 324L274 371"
              stroke="rgba(151,180,255,.72)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="132" cy="392" r="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.65)" strokeWidth="7" />
            <circle cx="214" cy="324" r="24" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.62)" strokeWidth="7" />
            <circle cx="301" cy="245" r="23" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.62)" strokeWidth="7" />
            <path
              d="M315 226L362 188"
              stroke="rgba(255,255,255,.82)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M372 180L397 159M372 180L391 208"
              stroke="rgba(151,180,255,.85)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M98 486H166"
              stroke="rgba(151,180,255,.8)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <circle cx="374" cy="155" r="4" fill="white" />
            <circle cx="386" cy="220" r="3" fill="rgba(151,180,255,.9)" />
            <circle cx="82" cy="336" r="3" fill="rgba(151,180,255,.9)" />
            <path
              d="M67 338C118 280 176 248 241 242"
              stroke="rgba(151,180,255,.18)"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute left-10 top-10 z-10">
            <div className="text-4xl font-black leading-none tracking-[-0.08em] text-white">
              KOBOT
            </div>
            <p className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[0.38em] text-white/58">
              KMU ROBOTICS
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-9 sm:px-10 lg:px-14">
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

            <p className="text-center text-xs leading-5 text-gray-500">
              접근이 제한되면 운영진에게 문의하세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
