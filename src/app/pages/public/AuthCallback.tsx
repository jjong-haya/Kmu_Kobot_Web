import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../auth/supabase";
import { useAuth } from "../../auth/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuthData } = useAuth();
  const [status, setStatus] = useState<"loading" | "restricted" | "error">("loading");
  const [message, setMessage] = useState("Google 로그인을 마무리하고 있습니다.");

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : null;

  function isRestrictedLoginMessage(value: string) {
    const normalized = value.toLowerCase();

    return (
      normalized.includes("restricted") ||
      normalized.includes("approved google") ||
      normalized.includes("kobot login") ||
      normalized.includes("kookmin")
    );
  }

  async function handleRetryWithDifferentAccount() {
    if (isSupabaseConfigured()) {
      await getSupabaseBrowserClient().auth.signOut();
    }

    navigate(`/login${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`, {
      replace: true,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function completeCallback() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            "Supabase 설정이 비어 있습니다. .env 파일에 URL과 anon key를 먼저 입력하세요.",
          );
        }
        return;
      }

      const errorDescription = searchParams.get("error_description");

      if (errorDescription) {
        if (!cancelled) {
          setStatus(isRestrictedLoginMessage(errorDescription) ? "restricted" : "error");
          setMessage(
            isRestrictedLoginMessage(errorDescription)
              ? "KOBOT member workspace는 국민대학교 Google 계정으로만 가입할 수 있습니다."
              : errorDescription,
          );
        }
        return;
      }

      const code = searchParams.get("code");

      try {
        const supabase = getSupabaseBrowserClient();

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const email = user?.email?.toLowerCase() ?? "";

        if (email && !email.endsWith("@kookmin.ac.kr")) {
          await supabase.auth.signOut();

          if (!cancelled) {
            setStatus("restricted");
            setMessage(
              "KOBOT member workspace는 국민대학교 Google 계정으로만 가입할 수 있습니다.",
            );
          }
          return;
        }

        const authData = await refreshAuthData();

        if (cancelled) {
          return;
        }

        if (authData?.account.status === "active") {
          navigate(safeNextPath ?? "/member", { replace: true });
          return;
        }

        navigate("/member/pending", { replace: true });
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error ? error.message : "Google 로그인 콜백을 처리하지 못했습니다.",
          );
        }
      }
    }

    void completeCallback();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-xl">
        <Card className="border-[#103078]/15 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Google 로그인 확인</CardTitle>
            <CardDescription>Supabase 세션과 Kobot 멤버 상태를 동기화합니다.</CardDescription>
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
            ) : status === "restricted" ? (
              <div className="space-y-4">
                <Alert className="border-[#103078]/20 bg-[#103078]/5">
                  <AlertCircle className="h-4 w-4 text-[#103078]" />
                  <AlertTitle>학교 계정으로만 접속할 수 있습니다</AlertTitle>
                  <AlertDescription className="leading-6">
                    {message} 잘못된 Google 계정으로 들어왔다면 계정 선택 화면으로 돌아가
                    `@kookmin.ac.kr` 계정을 선택해 주세요. 이미 생성된 잘못된 계정 정리와
                    재가입 처리는 운영진 승인 기록으로 남습니다.
                  </AlertDescription>
                </Alert>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  <p className="font-medium text-gray-900">다시 시도 전에 확인할 것</p>
                  <ul className="mt-2 space-y-1">
                    <li>Google 계정 선택 창에서 국민대 학교 메일을 선택해야 합니다.</li>
                    <li>카카오톡/모바일 브라우저에서도 로그인 후 원래 링크로 돌아가도록 `next` 값을 유지합니다.</li>
                    <li>학교 외부 인원은 운영진이 별도 계정을 발급한 뒤 아이디 로그인으로 접속합니다.</li>
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
                <Button className="bg-[#103078] hover:bg-[#2048A0]" onClick={() => void handleRetryWithDifferentAccount()}>
                  다른 Google 계정으로 다시 로그인
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:kobot@kookmin.ac.kr?subject=KOBOT%20%EA%B3%84%EC%A0%95%20%EC%A0%95%EB%A6%AC%20%EB%B0%8F%20%EC%9E%AC%EA%B0%80%EC%9E%85%20%EC%9A%94%EC%B2%AD">
                    계정 정리 문의
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
