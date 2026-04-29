import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
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

type CallbackStatus = "loading" | "cancelled" | "restricted" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthData } = useAuth();
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Google 로그인을 마무리하고 있습니다.");

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : null;
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

  async function handleRetryWithDifferentAccount() {
    if (isSupabaseConfigured()) {
      await getSupabaseBrowserClient().auth.signOut();
    }

    navigate(loginPath, { replace: true });
  }

  useEffect(() => {
    let disposed = false;

    async function completeCallback() {
      if (!isSupabaseConfigured()) {
        if (!disposed) {
          setStatus("error");
          setMessage(
            "Supabase 설정이 비어 있습니다. .env 파일에 URL과 anon key를 먼저 입력해 주세요.",
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
        if (disposed) {
          return;
        }

        if (isCancelledLoginMessage(combinedOAuthError)) {
          setStatus("cancelled");
          setMessage("Google 로그인이 취소되었습니다. 다시 로그인하려면 아래 버튼을 눌러 주세요.");
          return;
        }

        setStatus(isRestrictedLoginMessage(combinedOAuthError) ? "restricted" : "error");
        setMessage(
          isRestrictedLoginMessage(combinedOAuthError)
            ? "KOBOT member workspace는 국민대학교 Google 계정으로만 가입할 수 있습니다."
            : errorDescription || oauthError || "Google 로그인 요청을 완료하지 못했습니다.",
        );
        return;
      }

      const code = searchParams.get("code");

      if (!code) {
        if (!disposed) {
          setStatus("cancelled");
          setMessage("로그인 정보가 전달되지 않았습니다. 다시 로그인해 주세요.");
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (!disposed) {
            setStatus("cancelled");
            setMessage("로그인 세션을 찾을 수 없습니다. 다시 로그인해 주세요.");
          }
          return;
        }

        const email = user.email?.toLowerCase() ?? "";

        if (!email.endsWith("@kookmin.ac.kr")) {
          await supabase.auth.signOut();

          if (!disposed) {
            setStatus("restricted");
            setMessage("KOBOT member workspace는 국민대학교 Google 계정으로만 가입할 수 있습니다.");
          }
          return;
        }

        const authData = await refreshAuthData();

        if (disposed) {
          return;
        }

        if (authData?.account.status === "active") {
          navigate(safeNextPath ?? "/member", { replace: true });
          return;
        }

        navigate("/member/pending", { replace: true });
      } catch (error) {
        if (!disposed) {
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Google 로그인 콜백을 처리하지 못했습니다.",
          );
        }
      }
    }

    void completeCallback();

    return () => {
      disposed = true;
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <Card className="border-[#103078]/15 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Google 로그인 확인</CardTitle>
            <CardDescription>
              로그인 결과를 확인하고 KOBOT member workspace로 이동합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" ? (
              <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <LoaderCircle className="mt-0.5 h-5 w-5 animate-spin text-[#103078]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">인증 처리 중</p>
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                </div>
              </div>
            ) : status === "cancelled" ? (
              <Alert className="border-[#103078]/20 bg-[#103078]/5">
                <CheckCircle2 className="h-4 w-4 text-[#103078]" />
                <AlertTitle>로그인이 취소되었습니다</AlertTitle>
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
                    <li>로그인 후에는 원래 열었던 링크로 돌아가도록 next 값을 유지합니다.</li>
                    <li>학교 계정이 아닌 사용자는 운영진에게 계정 발급을 요청해야 합니다.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>로그인 콜백 처리 실패</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status !== "loading" && (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#103078] hover:bg-[#2048A0]"
                  onClick={() => void handleRetryWithDifferentAccount()}
                >
                  다시 로그인하기
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:kobot@kookmin.ac.kr?subject=KOBOT%20%EA%B3%84%EC%A0%95%20%EC%A0%95%EB%A6%AC%20%EB%B0%8F%20%EC%9E%AC%EA%B0%80%EC%9E%85%20%EC%9A%94%EC%B2%AD">
                    계정 문의
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
