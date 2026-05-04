import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
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
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../auth/supabase";
import { useAuth } from "../../auth/useAuth";
import { getPostAuthMemberPath } from "../../auth/onboarding";
import { getSafeInternalPath, withNextPath } from "../../auth/redirects";
import robotRun from "../../../assets/auth-callback/toy-robot-run.webp";

type CallbackStatus = "loading" | "cancelled" | "restricted" | "retry" | "error";

const LOADING_STEPS = [
  "국민대학교 계정 확인 중",
  "학생 인증 정보를 확인하는 중",
  "KOBOT 멤버 상태 확인 중",
];
const MIN_CALLBACK_LOADING_MS = 1000;
const MIN_LOADING_STEP_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthData } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("로그인 결과를 확인하고 있습니다.");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get("next");
  const safeNextPath = getSafeInternalPath(nextPath);
  const loginPath = `/login${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`;

  function isRestrictedLoginMessage(value: string) {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("restricted") ||
      normalized.includes("approved google") ||
      normalized.includes("kobot login") ||
      normalized.includes("kookmin")
    );
  }

  function isCancelledLoginMessage(value: string) {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("access_denied") ||
      normalized.includes("cancel") ||
      normalized.includes("denied") ||
      normalized.includes("dismissed")
    );
  }

  function isRecoverableSessionMessage(value: string) {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("code verifier") ||
      normalized.includes("not found in storage") ||
      normalized.includes("auth flow") ||
      normalized.includes("pkce") ||
      normalized.includes("invalid_grant") ||
      normalized.includes("expired")
    );
  }

  function isTechnicalCallbackMessage(value: string) {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("supabase") ||
      normalized.includes("postgrest") ||
      normalized.includes("schema cache") ||
      normalized.includes("public.") ||
      normalized.includes("function") ||
      normalized.includes("relation") ||
      normalized.includes("column") ||
      normalized.includes("vite_") ||
      normalized.includes(".env")
    );
  }

  async function handleRetryWithDifferentAccount() {
    if (isSupabaseConfigured()) {
      await getSupabaseBrowserClient().auth.signOut();
    }

    navigate(loginPath, { replace: true });
  }

  useEffect(() => {
    let disposed = false;
    const loadingStartedAt = performance.now();

    async function waitForMinimumLoading() {
      const remaining = MIN_CALLBACK_LOADING_MS - (performance.now() - loadingStartedAt);

      if (remaining > 0) {
        await wait(remaining);
      }
    }

    async function runLoadingStep<T>(stepIndex: number, task: () => Promise<T>) {
      if (!disposed) {
        setLoadingStepIndex(stepIndex);
      }

      const stepStartedAt = performance.now();
      const result = await task();
      const remaining = MIN_LOADING_STEP_MS - (performance.now() - stepStartedAt);

      if (remaining > 0) {
        await wait(remaining);
      }

      return result;
    }

    async function completeCallback() {
      if (!isSupabaseConfigured()) {
        await waitForMinimumLoading();

        if (!disposed) {
          setStatus("error");
          setMessage(
            "서비스 설정을 확인하지 못했습니다. 잠시 후 다시 시도하거나 운영진에게 문의해 주세요.",
          );
        }
        return;
      }

      const oauthError = searchParams.get("error") ?? "";
      const errorCode = searchParams.get("error_code") ?? "";
      const errorDescription = searchParams.get("error_description") ?? "";
      const combinedOAuthError = [oauthError, errorCode, errorDescription]
        .filter(Boolean)
        .join(" ");

      if (combinedOAuthError) {
        await waitForMinimumLoading();

        if (disposed) {
          return;
        }

        if (isCancelledLoginMessage(combinedOAuthError)) {
          setStatus("cancelled");
          setMessage("Google 로그인이 취소되었습니다. 다시 로그인하려면 아래 버튼을 눌러 주세요.");
          return;
        }

        if (isRecoverableSessionMessage(combinedOAuthError)) {
          setStatus("retry");
          setMessage(
            "로그인 세션이 만료되었거나 다른 브라우저에서 시작된 로그인입니다. 로그인 화면에서 다시 시도해 주세요.",
          );
          return;
        }

        setStatus(isRestrictedLoginMessage(combinedOAuthError) ? "restricted" : "error");
        setMessage(
          isRestrictedLoginMessage(combinedOAuthError)
            ? "KOBOT 멤버 공간은 국민대학교 Google 계정으로만 가입할 수 있습니다."
            : errorDescription || oauthError || "Google 로그인 요청을 완료하지 못했습니다.",
        );
        return;
      }

      const code = searchParams.get("code");

      if (!code) {
        await waitForMinimumLoading();

        if (!disposed) {
          setStatus("cancelled");
          setMessage("로그인 정보가 전달되지 않았습니다. 다시 로그인해 주세요.");
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          exchangeError,
          user,
          userError,
        } = await runLoadingStep(0, async () => {
          const { error: nextExchangeError } = await supabase.auth.exchangeCodeForSession(code);
          const {
            data: { user: nextUser },
            error: nextUserError,
          } = await supabase.auth.getUser();

          return {
            exchangeError: nextExchangeError,
            user: nextUser,
            userError: nextUserError,
          };
        });

        if (exchangeError) {
          await waitForMinimumLoading();

          if (!disposed) {
            setStatus("retry");
            setMessage(
              "로그인 세션이 만료되었거나 다른 브라우저에서 시작된 로그인입니다. 로그인 화면에서 다시 시도해 주세요.",
            );
          }
          return;
        }

        if (userError) {
          throw userError;
        }

        if (!user) {
          await waitForMinimumLoading();

          if (!disposed) {
            setStatus("retry");
            setMessage("로그인 세션을 찾을 수 없습니다. 다시 로그인해 주세요.");
          }
          return;
        }

        const email = user.email?.toLowerCase() ?? "";
        const isSchoolAccount = await runLoadingStep(1, async () => {
          if (!email.endsWith("@kookmin.ac.kr")) {
            await supabase.auth.signOut();
            return false;
          }

          return true;
        });

        if (!isSchoolAccount) {
          await waitForMinimumLoading();

          if (!disposed) {
            setStatus("restricted");
            setMessage("KOBOT 멤버 공간은 국민대학교 Google 계정으로만 가입할 수 있습니다.");
          }
          return;
        }

        // If user came through /invite/course, redeem the code BEFORE refreshing
        // auth data so the new status is reflected.
        try {
          const inviteCode = window.localStorage.getItem("kobot:course-invite-code");
          if (inviteCode) {
            const supabase = getSupabaseBrowserClient();
            const { error: redeemErr } = await supabase.rpc("redeem_course_invite", {
              invite_code: inviteCode,
            });
            // success or already-redeemed → clear the code so it isn't reused
            if (!redeemErr) {
              window.localStorage.removeItem("kobot:course-invite-code");
            }
          }
        } catch {
          // non-blocking: even if RPC fails, continue to normal callback flow
        }

        const authData = await runLoadingStep(2, refreshAuthData);
        await waitForMinimumLoading();

        if (disposed) {
          return;
        }

        if (!authData) {
          navigate(withNextPath("/member/join", safeNextPath), { replace: true });
          return;
        }

        navigate(
          withNextPath(
            getPostAuthMemberPath(authData, authData.account.status, safeNextPath ?? "/member"),
            safeNextPath,
          ),
          { replace: true },
        );
      } catch (error) {
        await waitForMinimumLoading();

        if (disposed) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Google 로그인 콜백을 처리하지 못했습니다.";

        if (isRecoverableSessionMessage(errorMessage)) {
          setStatus("retry");
          setMessage(
            "로그인 세션이 만료되었거나 다른 브라우저에서 시작된 로그인입니다. 로그인 화면에서 다시 시도해 주세요.",
          );
          return;
        }

        setStatus("error");
        setMessage(
          errorMessage.length > 90 || isTechnicalCallbackMessage(errorMessage)
            ? "로그인을 완료하지 못했습니다. 다시 로그인해도 같은 문제가 생기면 운영진에게 문의해 주세요."
            : errorMessage,
        );
      }
    }

    void completeCallback();

    return () => {
      disposed = true;
    };
  }, [location.search, navigate]);

  return (
    <div className="auth-callback-page">
      <Card className="auth-callback-card border-[#103078]/15 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            로그인 확인
          </CardTitle>
          <CardDescription>
            계정 정보를 확인하고 KOBOT 멤버 공간으로 이동합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "loading" ? (
            <div className="space-y-5">
              <div className="auth-robot-stage" data-step={loadingStepIndex} aria-hidden="true">
                <div className="auth-robot-path">
                  <span className="auth-robot-progress" />
                </div>
                <img className="auth-robot-runner" src={robotRun} alt="" draggable={false} />
                {LOADING_STEPS.map((step, index) => (
                  <span
                    key={step}
                    className={`auth-checkpoint auth-checkpoint-${index + 1} ${
                      index < loadingStepIndex
                        ? "is-complete"
                        : index === loadingStepIndex
                          ? "is-active"
                          : "is-pending"
                    }`}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-[#103078]/15 bg-[#f8fbff] p-5 text-center">
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#103078]/10 text-[#103078]">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
                <p className="text-base font-bold text-slate-950">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  국민대학교 계정과 KOBOT 멤버 상태를 차례대로 확인하고 있습니다.
                </p>
              </div>
            </div>
          ) : status === "cancelled" ? (
            <Alert className="border-[#103078]/20 bg-[#103078]/5">
              <CheckCircle2 className="h-4 w-4 text-[#103078]" />
              <AlertTitle>로그인이 취소되었습니다</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : status === "retry" ? (
            <Alert className="border-[#103078]/20 bg-[#103078]/5">
              <RotateCcw className="h-4 w-4 text-[#103078]" />
              <AlertTitle>다시 로그인이 필요합니다</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : status === "restricted" ? (
            <div className="space-y-4">
              <Alert className="border-[#103078]/20 bg-[#103078]/5">
                <AlertCircle className="h-4 w-4 text-[#103078]" />
                <AlertTitle>학교 계정으로만 접속할 수 있습니다</AlertTitle>
                <AlertDescription className="leading-6">
                  {message} 다른 Google 계정으로 들어왔다면 계정 선택 화면에서
                  `@kookmin.ac.kr` 계정을 선택해 주세요.
                </AlertDescription>
              </Alert>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                <p className="font-medium text-gray-900">다시 시도 전에 확인할 것</p>
                <ul className="mt-2 space-y-1">
                  <li>Google 계정 선택 창에서 국민대학교 메일을 선택해야 합니다.</li>
                  <li>학교 계정이 아닌 사용자는 운영진에게 계정 발급을 요청해야 합니다.</li>
                </ul>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>로그인을 완료하지 못했습니다</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status !== "loading" && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                className="bg-[#103078] hover:bg-[#2048A0]"
                onClick={() => void handleRetryWithDifferentAccount()}
              >
                다시 로그인하기
              </Button>
              <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
                홈으로 가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
