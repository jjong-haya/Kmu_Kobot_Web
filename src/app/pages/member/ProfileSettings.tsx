import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Eye,
  GraduationCap,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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
import type { PublicCreditNameMode } from "../../auth/types";

const NICKNAME_DISPLAY_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9 ]{2,12}$/u;

const creditNameModeLabels: Record<PublicCreditNameMode, string> = {
  anonymous: "익명",
  nickname: "닉네임",
  real_name: "실명",
};

function normalizeNicknameDisplay(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function createNicknameSlug(value: string) {
  return normalizeNicknameDisplay(value).toLocaleLowerCase("ko-KR").replace(/\s+/g, "_");
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

export default function ProfileSettings() {
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
  const nicknameSlug = useMemo(
    () => (normalizedNickname ? createNicknameSlug(normalizedNickname) : ""),
    [normalizedNickname],
  );
  const techTags = useMemo(() => parseTechTags(techTagsInput), [techTagsInput]);
  const isNicknameValid =
    !normalizedNickname ||
    (NICKNAME_DISPLAY_PATTERN.test(normalizedNickname) && !normalizedNickname.includes("_"));

  useEffect(() => {
    setNicknameDisplay(authData.profile.nicknameDisplay ?? authData.profile.displayName ?? "");
    setFullName(authData.profile.fullName ?? "");
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
      toast.success("프로필 설정을 저장했습니다.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "프로필 설정을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 pb-10 sm:px-0">
      <div className="overflow-hidden rounded-[2rem] border border-[#103078]/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,48,120,0.18),_transparent_34%),linear-gradient(135deg,_#F7FAFF_0%,_#EEF4E7_100%)] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="border-[#103078]/20 bg-white/70 text-[#103078]" variant="outline">
              KOBOT member profile
            </Badge>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                프로필/가입 설정
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                필수 가입 정보를 정리하고, 아이디 로그인과 공개 페이지 이름 표시 방식을 한곳에서 관리합니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Badge className="justify-center border-[#103078]/15 bg-white/80 px-3 py-1.5 text-slate-700" variant="outline">
              상태: {memberStatus ?? "unknown"}
            </Badge>
            <Badge className="justify-center border-[#103078]/15 bg-white/80 px-3 py-1.5 text-slate-700" variant="outline">
              아이디 로그인: {authData.account.hasLoginPassword ? "사용 가능" : "설정 필요"}
            </Badge>
          </div>
        </div>
      </div>

      {(submitError || (!authData.account.hasLoginPassword && authData.profile.loginId)) && (
        <Alert variant={submitError ? "destructive" : "default"}>
          {submitError ? <AlertCircle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
          <AlertTitle>
            {submitError ? "저장 전에 확인이 필요합니다" : "아이디는 있지만 비밀번호가 아직 없습니다"}
          </AlertTitle>
          <AlertDescription>
            {submitError ??
              "현재 login_id는 저장되어 있지만 비밀번호가 없어 아이디 로그인이 아직 동작하지 않습니다. 비밀번호를 함께 등록해 주세요."}
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-[#103078]/10 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#103078]/10 p-2 text-[#103078]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>프로필 필수항목</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  회원 확인과 공개 활동에 쓰이는 기본 정보입니다. 닉네임은 중복 확인 기준으로 정규화되어 저장됩니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
                description="2~12자, 한글/영문/숫자/공백만 허용됩니다. 밑줄(_)은 직접 입력할 수 없습니다."
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950">
              <p className="font-semibold">닉네임 규칙</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p>한글, 영문, 숫자, 공백만 사용할 수 있고 `_`는 입력할 수 없습니다.</p>
                <p>중복 확인은 대소문자를 구분하지 않으며, 변경은 7일에 1회만 가능합니다.</p>
              </div>
              <p className="mt-2 text-xs text-amber-800">
                저장될 정규화 키: {nicknameSlug || "닉네임을 입력하면 표시됩니다"}
              </p>
            </div>

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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
          </CardContent>
        </Card>

        <Card className="border-[#103078]/10 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#103078]/10 p-2 text-[#103078]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>아이디 로그인</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  Google 로그인은 유지하면서, 필요할 때 사용할 별도 아이디와 비밀번호를 설정합니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            <FieldShell
              description="영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-), 4~20자"
              htmlFor="login-id"
              label="로그인 아이디"
            >
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-id"
                  className="pl-10"
                  placeholder="예: honggildong"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value.toLowerCase())}
                />
              </div>
            </FieldShell>

            <FieldShell htmlFor="new-password" label="새 비밀번호">
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FieldShell>

            <FieldShell htmlFor="confirm-password" label="비밀번호 확인">
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="한 번 더 입력"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </FieldShell>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-[#103078]/10 shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#103078]/10 p-2 text-[#103078]">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>공개 페이지 표시 설정</CardTitle>
                  <CardDescription className="mt-1 leading-6">
                    프로젝트 크레딧이나 공개 페이지에서 이름을 어떻게 보여줄지 선택합니다. 기본값은 익명입니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
                <p className="mt-2 text-lg font-bold text-slate-950">
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
            </CardContent>
          </Card>

          <Card className="border-[#103078]/10 shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#103078]/10 p-2 text-[#103078]">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>기술태그</CardTitle>
                  <CardDescription className="mt-1 leading-6">
                    관심 기술이나 주력 스택을 쉼표 또는 공백으로 구분해 입력하면 배열로 저장됩니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldShell
                description="예: React, Supabase Python AI"
                htmlFor="tech-tags"
                label="기술태그 입력"
              >
                <Textarea
                  id="tech-tags"
                  className="min-h-28"
                  placeholder="React, TypeScript, Supabase"
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
                  <p className="text-sm text-slate-500">저장될 태그 미리보기가 여기에 표시됩니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
          <Button
            type="submit"
            className="h-11 w-full bg-[#103078] text-white hover:bg-[#2048A0] sm:w-auto"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "저장 중..." : "프로필 저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}

