import {
  AlertCircle,
  BadgeCheck,
  Building2,
  GraduationCap,
  IdCard,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../auth/useAuth";
import type { MemberStatus, PublicCreditNameMode } from "../../auth/types";
import { getSafeInternalPath, withNextPath } from "../../auth/redirects";

const NICKNAME_DISPLAY_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9 ]{2,12}$/u;

const creditNameModeLabels: Record<PublicCreditNameMode, string> = {
  anonymous: "익명",
  nickname: "닉네임",
  real_name: "실명",
};

const memberStatusLabels: Record<Exclude<MemberStatus, null>, string> = {
  active: "승인 완료",
  pending: "가입 요청 전",
  suspended: "일시 제한",
  rejected: "승인 거절",
  alumni: "졸업/비활동",
  project_only: "프로젝트 참여",
  withdrawn: "탈퇴 처리",
};

function normalizeNicknameDisplay(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function parseTechTags(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter((tag) => {
      const key = tag.toLocaleLowerCase("ko-KR");

      if (!tag || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function getMemberStatusLabel(status: MemberStatus) {
  return status ? memberStatusLabels[status] : "가입 요청 전";
}

function getSafeProfileError(error: unknown) {
  const message = error instanceof Error ? error.message : "프로필 설정을 저장하지 못했습니다.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("supabase") ||
    normalized.includes("postgrest") ||
    normalized.includes("schema cache") ||
    normalized.includes("public.") ||
    normalized.includes("function") ||
    normalized.includes("vite_") ||
    normalized.includes(".env") ||
    message.length > 120
  ) {
    return "저장을 완료하지 못했습니다. 다시 시도해도 같은 문제가 생기면 운영진에게 문의해 주세요.";
  }

  return message;
}

function FieldShell({
  children,
  description,
  htmlFor,
  label,
  required,
}: {
  children: ReactNode;
  description?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-semibold text-slate-800" htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-[#D94F30]">*</span> : null}
      </Label>
      {children}
      {description ? <p className="text-xs leading-5 text-slate-500">{description}</p> : null}
    </div>
  );
}

function FormSection({
  children,
  description,
  number,
  title,
}: {
  children: ReactNode;
  description: string;
  number: string;
  title: string;
}) {
  return (
    <section className="grid gap-6 border-t border-slate-300 bg-white p-5 first:border-t-0 sm:p-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:p-8">
      <div className="lg:border-r lg:border-slate-200 lg:pr-8">
        <p className="inline-flex h-8 min-w-12 items-center justify-center rounded-full border border-[#103078]/20 bg-[#103078]/5 px-3 text-xs font-semibold tracking-[0.16em] text-[#103078]">
          {number}
        </p>
        <h2 className="mt-3 text-lg font-semibold tracking-[-0.025em] text-slate-950">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className="min-w-0 space-y-6 lg:pl-1">{children}</div>
    </section>
  );
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authData, memberStatus, saveProfileSettings } = useAuth();
  const [nicknameDisplay, setNicknameDisplay] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [clubAffiliation, setClubAffiliation] = useState("");
  const [publicCreditNameMode, setPublicCreditNameMode] =
    useState<PublicCreditNameMode>("anonymous");
  const [techTagsInput, setTechTagsInput] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedNickname = useMemo(
    () => normalizeNicknameDisplay(nicknameDisplay),
    [nicknameDisplay],
  );
  const techTags = useMemo(() => parseTechTags(techTagsInput), [techTagsInput]);
  const isNicknameValid =
    !normalizedNickname ||
    (NICKNAME_DISPLAY_PATTERN.test(normalizedNickname) && !normalizedNickname.includes("_"));
  const isJoinRequest = memberStatus === "pending" || memberStatus === null;
  const isJoinRoute = location.pathname === "/member/join";
  const safeNextPath = getSafeInternalPath(new URLSearchParams(location.search).get("next"));
  const isLoginIdLocked = !isJoinRequest && Boolean(authData.profile.loginId);

  useEffect(() => {
    setNicknameDisplay(authData.profile.nicknameDisplay ?? "");
    setFullName(authData.profile.fullName ?? authData.profile.displayName ?? "");
    setStudentId(authData.profile.studentId ?? "");
    setPhone(authData.profile.phone ?? "");
    setCollege(authData.profile.college ?? "");
    setDepartment(authData.profile.department ?? "");
    setClubAffiliation(authData.profile.clubAffiliation ?? "");
    setPublicCreditNameMode(authData.profile.publicCreditNameMode ?? "anonymous");
    setTechTagsInput(authData.profile.techTags.join(", "));
    setLoginId(authData.profile.loginId ?? "");
  }, [
    authData.profile.clubAffiliation,
    authData.profile.college,
    authData.profile.department,
    authData.profile.displayName,
    authData.profile.fullName,
    authData.profile.loginId,
    authData.profile.nicknameDisplay,
    authData.profile.phone,
    authData.profile.publicCreditNameMode,
    authData.profile.studentId,
    authData.profile.techTags,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const requiredFields = [
      [normalizedNickname, "닉네임"],
      [fullName.trim(), "실명"],
      [studentId.trim(), "학번"],
      [phone.trim(), "전화번호"],
      [college.trim(), "단과대"],
      [department.trim(), "학과"],
    ];
    const missingField = requiredFields.find(([value]) => !value)?.[1];

    if (missingField) {
      setSubmitError(`${missingField}을(를) 입력해 주세요.`);
      return;
    }

    if (!isNicknameValid) {
      setSubmitError(
        "닉네임은 2~12자의 한글, 영문, 숫자, 공백만 사용할 수 있으며 밑줄(_)은 입력할 수 없습니다.",
      );
      return;
    }

    if (isJoinRequest && !loginId.trim()) {
      setSubmitError("가입 요청을 위해 로그인 아이디를 설정해 주세요.");
      return;
    }

    if (isJoinRequest && !password.trim()) {
      setSubmitError("가입 요청을 위해 아이디 로그인 비밀번호를 설정해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setSubmitError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsSaving(true);

    try {
      await saveProfileSettings({
        nicknameDisplay: normalizedNickname,
        fullName,
        studentId,
        phone,
        college,
        department,
        clubAffiliation: clubAffiliation.trim() ? clubAffiliation : null,
        publicCreditNameMode,
        techTags,
        loginId: loginId.trim() ? loginId : null,
        password: password.trim() ? password : undefined,
      });

      setPassword("");
      setPasswordConfirm("");

      if (isJoinRequest) {
        toast.success("회원가입 요청을 보냈습니다. 운영진 승인 후 KOBOT 멤버 공간이 열립니다.");
        navigate(withNextPath("/member/pending", safeNextPath), { replace: true });
        return;
      }

      toast.success("프로필 설정을 저장했습니다.");
    } catch (error) {
      setSubmitError(getSafeProfileError(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isJoinRoute && memberStatus === "active") {
    return <Navigate to="/member/profile" replace />;
  }

  if (
    memberStatus === "suspended" ||
    memberStatus === "rejected" ||
    memberStatus === "alumni" ||
    memberStatus === "project_only" ||
    memberStatus === "withdrawn"
  ) {
    return <Navigate to={withNextPath("/member/pending", safeNextPath)} replace />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 pb-10 sm:px-0">
      <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#103078]">
            {isJoinRequest ? "KOBOT Join Request" : "KOBOT Member Profile"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {isJoinRequest ? "가입 요청 정보 입력" : "프로필/가입 설정"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
            {isJoinRequest
              ? "승인에 필요한 정보만 먼저 입력합니다. 공개 표시와 기술태그는 기본값으로 두고 나중에 바꿀 수 있습니다."
              : "내부 확인 정보, 로그인 ID, 공개 표시 방식을 한 곳에서 정리합니다."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="border-slate-200 bg-white px-3 py-1.5 text-slate-700" variant="outline">
            상태: {getMemberStatusLabel(memberStatus)}
          </Badge>
          <Badge className="border-slate-200 bg-white px-3 py-1.5 text-slate-700" variant="outline">
            ID 로그인: {authData.account.hasLoginPassword ? "사용 가능" : "설정 필요"}
          </Badge>
        </div>
      </section>

      {isJoinRequest && (
        <Alert className="border-[#103078]/20 bg-[#103078]/5">
          <BadgeCheck className="h-4 w-4 text-[#103078]" />
          <AlertTitle>먼저 가입 정보를 설정합니다</AlertTitle>
          <AlertDescription className="leading-6">
            Google 계정 이름을 참고해 실명칸을 채워 두었습니다. 실제 이름과 다르면 수정하고,
            닉네임, 학번, 연락처, 아이디 로그인을 설정한 뒤 회원가입 요청을 보내 주세요.
          </AlertDescription>
        </Alert>
      )}

      {(submitError || (!authData.account.hasLoginPassword && authData.profile.loginId)) && (
        <Alert variant={submitError ? "destructive" : "default"}>
          {submitError ? <AlertCircle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
          <AlertTitle>
            {submitError ? "저장 전에 확인이 필요합니다" : "아이디는 있지만 비밀번호가 아직 없습니다"}
          </AlertTitle>
          <AlertDescription>
            {submitError ??
              "현재 ID는 저장되어 있지만 비밀번호가 없어 아이디 로그인이 아직 동작하지 않습니다. 비밀번호를 함께 등록해 주세요."}
          </AlertDescription>
        </Alert>
      )}

      <form
        className="overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        onSubmit={handleSubmit}
      >
        <FormSection
          number="01"
          title="계정 확인"
          description="학교 계정과 내부에서 사용할 닉네임을 확인합니다."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell htmlFor="email" label="이메일">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  className="bg-slate-50 pl-10 text-slate-600"
                  value={authData.profile.email ?? ""}
                  readOnly
                />
              </div>
            </FieldShell>

            <FieldShell
              description="2~12자, 한글/영문/숫자/공백만 허용됩니다."
              htmlFor="nickname-display"
              label="닉네임"
              required
            >
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="nickname-display"
                  aria-invalid={!isNicknameValid}
                  className="pl-10"
                  placeholder="예: 코봇 메이커"
                  value={nicknameDisplay}
                  onChange={(event) => setNicknameDisplay(event.target.value)}
                />
              </div>
            </FieldShell>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">닉네임 규칙</p>
            <p className="mt-2">
              공백은 사용할 수 있지만 밑줄(_)은 입력할 수 없습니다. 중복 확인은 대소문자를
              구분하지 않으며, 변경은 7일에 1회만 가능합니다.
            </p>
            <p className="mt-2 text-xs font-medium text-[#103078]">
              미리보기: {normalizedNickname || "닉네임을 입력하면 표시됩니다"}
            </p>
          </div>
        </FormSection>

        <FormSection
          number="02"
          title="실명과 소속"
          description="운영진 승인과 프로젝트 참여자 목록에서 확인할 기본 정보입니다."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell htmlFor="full-name" label="실명" required>
              <Input
                id="full-name"
                placeholder="예: 홍길동"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </FieldShell>

            <FieldShell htmlFor="student-id" label="학번" required>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="student-id"
                  className="pl-10"
                  inputMode="numeric"
                  placeholder="예: 20260000"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="phone" label="전화번호" required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  className="pl-10"
                  inputMode="tel"
                  placeholder="예: 010-1234-5678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="club-affiliation" label="동아리 소속">
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="club-affiliation"
                  className="pl-10"
                  placeholder="예: 운영진, 일반회원, 수료회원"
                  value={clubAffiliation}
                  onChange={(event) => setClubAffiliation(event.target.value)}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="college" label="단과대" required>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="college"
                  className="pl-10"
                  placeholder="예: 소프트웨어융합대학"
                  value={college}
                  onChange={(event) => setCollege(event.target.value)}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="department" label="학과" required>
              <Input
                id="department"
                placeholder="예: 인공지능학부"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              />
            </FieldShell>
          </div>
        </FormSection>

        <FormSection
          number="03"
          title="ID 로그인"
          description={
            isJoinRequest
              ? "첫 가입 요청 때 ID와 비밀번호를 같이 설정합니다."
              : "Google 로그인과 함께 사용할 별도 ID 로그인 정보입니다."
          }
        >
          <div className="grid gap-5 md:grid-cols-3">
            <FieldShell
              description={
                isLoginIdLocked
                  ? "이미 만든 ID는 직접 변경할 수 없습니다."
                  : "영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-), 4~20자"
              }
              htmlFor="login-id"
              label="로그인 아이디"
              required={isJoinRequest}
            >
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-id"
                  className="pl-10"
                  disabled={isLoginIdLocked}
                  placeholder="예: honggildong"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value.toLowerCase())}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="new-password" label="새 비밀번호" required={isJoinRequest}>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FieldShell>

            <FieldShell htmlFor="confirm-password" label="비밀번호 확인" required={isJoinRequest}>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="한 번 더 입력"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </FieldShell>
          </div>
        </FormSection>

        <FormSection
          number="04"
          title="공개 표시"
          description="공개 프로젝트 페이지에 보일 이름과 기술태그입니다. 기본값은 익명입니다."
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5">
              <FieldShell htmlFor="public-credit-name-mode" label="표시 방식">
                <Select
                  value={publicCreditNameMode}
                  onValueChange={(value) => setPublicCreditNameMode(value as PublicCreditNameMode)}
                >
                  <SelectTrigger id="public-credit-name-mode">
                    <SelectValue placeholder="표시 방식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anonymous">익명</SelectItem>
                    <SelectItem value="nickname">닉네임</SelectItem>
                    <SelectItem value="real_name">실명</SelectItem>
                  </SelectContent>
                </Select>
              </FieldShell>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  공개 표시 미리보기
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {publicCreditNameMode === "anonymous"
                    ? "익명 멤버"
                    : publicCreditNameMode === "nickname"
                      ? normalizedNickname || "닉네임"
                      : fullName.trim() || "실명"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  현재 선택: {creditNameModeLabels[publicCreditNameMode]}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <FieldShell
                description="예: ROS, Python, 임베디드, AI"
                htmlFor="tech-tags"
                label="기술태그 입력"
              >
                <Textarea
                  id="tech-tags"
                  className="min-h-28"
                  placeholder="ROS, Python, 임베디드, AI"
                  value={techTagsInput}
                  onChange={(event) => setTechTagsInput(event.target.value)}
                />
              </FieldShell>

              <div className="min-h-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
                {techTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {techTags.map((tag) => (
                      <Badge key={tag} className="bg-[#103078] text-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">태그 미리보기가 여기에 표시됩니다.</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-3 z-10 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:flex sm:justify-end sm:bg-slate-50">
          <Button
            type="submit"
            className="h-11 w-full bg-[#103078] text-white hover:bg-[#2048A0] sm:w-auto"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "저장 중..." : isJoinRequest ? "회원가입 요청하기" : "프로필 저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}

