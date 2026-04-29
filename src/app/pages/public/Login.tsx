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

            <p className="text-center text-xs leading-5 text-gray-400">
              국민대학교 계정으로만 로그인 가능합니다.
            </p>
          </div>
        </section>

        <div className="login-intro-panel pointer-events-none absolute inset-0 z-30 hidden overflow-hidden bg-[#061b4c] text-white lg:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(73,123,255,0.62),transparent_28%),radial-gradient(circle_at_72%_76%,rgba(17,53,143,0.82),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:38px_38px]" />
          <IntroRobotArm />
          <div className="login-kobot-lockup">
            <div className="login-kobot-word">
              <span className="login-carried-k">K</span>
              <span className="login-word-rest">OBOT</span>
            </div>
            <p className="login-intro-caption">KMU ROBOTICS CLUB</p>
          </div>
          <p className="login-intro-note">국민대학교 계정으로만 로그인 가능</p>
        </div>
      </div>
    </div>
  );
}

function IntroRobotArm() {
  return (
    <svg
      className="login-robot-arm"
      viewBox="0 0 920 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="armSteel" x1="204" y1="48" x2="488" y2="370" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7FAFF" />
          <stop offset="0.45" stopColor="#AFC4F4" />
          <stop offset="1" stopColor="#DDE7FF" />
        </linearGradient>
        <linearGradient id="armBlue" x1="320" y1="80" x2="318" y2="356" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8FB1FF" />
          <stop offset="1" stopColor="#315FDB" />
        </linearGradient>
        <filter
          id="armShadow"
          x="40"
          y="-260"
          width="760"
          height="900"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#00133F" floodOpacity="0.34" />
        </filter>
      </defs>

      <g className="login-robot-rig" filter="url(#armShadow)">
        <path
          className="login-arm-cable"
          d="M553 36C516 87 492 111 436 138C390 161 366 200 346 262C337 290 330 316 316 344"
          stroke="rgba(222,232,255,0.42)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="9 12"
        />

        <g className="login-top-carriage">
          <rect x="432" y="20" width="218" height="34" rx="17" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.34)" />
          <rect x="462" y="32" width="156" height="9" rx="4.5" fill="rgba(151,180,255,0.58)" />
          <circle cx="485" cy="37" r="4" fill="rgba(255,255,255,0.78)" />
          <circle cx="541" cy="37" r="4" fill="rgba(255,255,255,0.78)" />
          <circle cx="597" cy="37" r="4" fill="rgba(255,255,255,0.78)" />
        </g>

        <g className="login-shoulder" transform="translate(512 72)">
          <circle r="47" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.72)" strokeWidth="10" />
          <circle r="23" fill="rgba(49,95,219,0.52)" stroke="rgba(255,255,255,0.62)" strokeWidth="6" />
          <circle cx="-18" cy="-18" r="4" fill="rgba(255,255,255,0.78)" />
          <circle cx="18" cy="-18" r="4" fill="rgba(255,255,255,0.78)" />
          <circle cx="-18" cy="18" r="4" fill="rgba(255,255,255,0.78)" />
          <circle cx="18" cy="18" r="4" fill="rgba(255,255,255,0.78)" />
        </g>

        <path
          d="M480 104C446 127 421 150 391 179"
          stroke="url(#armSteel)"
          strokeWidth="36"
          strokeLinecap="round"
        />
        <path
          d="M480 104C446 127 421 150 391 179"
          stroke="rgba(255,255,255,0.36)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M464 123C438 142 420 161 399 184"
          stroke="url(#armBlue)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <g className="login-hydraulic">
          <path d="M462 143C430 169 405 203 388 241" stroke="rgba(238,244,255,0.76)" strokeWidth="8" strokeLinecap="round" />
          <path d="M440 163C416 187 399 211 386 241" stroke="rgba(56,101,220,0.9)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="462" cy="143" r="9" fill="#DDE7FF" stroke="rgba(255,255,255,0.72)" strokeWidth="3" />
          <circle cx="388" cy="241" r="9" fill="#DDE7FF" stroke="rgba(255,255,255,0.72)" strokeWidth="3" />
        </g>

        <g className="login-elbow" transform="translate(382 188)">
          <circle r="40" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.72)" strokeWidth="9" />
          <circle r="18" fill="rgba(17,48,120,0.64)" stroke="rgba(151,180,255,0.76)" strokeWidth="6" />
          <path d="M-30 0H30M0 -30V30" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
        </g>

        <path
          d="M360 216C334 246 318 284 306 326"
          stroke="url(#armSteel)"
          strokeWidth="32"
          strokeLinecap="round"
        />
        <path
          d="M360 216C334 246 318 284 306 326"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M341 232C325 260 314 291 307 319"
          stroke="url(#armBlue)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <g className="login-wrist" transform="translate(304 334)">
          <circle r="28" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.68)" strokeWidth="8" />
          <circle r="11" fill="rgba(49,95,219,0.72)" />
          <path d="M-18 22H18" stroke="rgba(255,255,255,0.66)" strokeWidth="7" strokeLinecap="round" />
        </g>

        <g className="login-gripper" transform="translate(304 366)">
          <rect x="-26" y="-17" width="52" height="28" rx="11" fill="rgba(221,231,255,0.92)" stroke="rgba(255,255,255,0.76)" strokeWidth="4" />
          <path
            className="login-gripper-left"
            d="M-21 7C-48 21 -58 46 -47 68C-35 59 -28 47 -24 31"
            stroke="rgba(246,249,255,0.94)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="login-gripper-right"
            d="M21 7C48 21 58 46 47 68C35 59 28 47 24 31"
            stroke="rgba(246,249,255,0.94)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M-16 31H16" stroke="rgba(151,180,255,0.72)" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
