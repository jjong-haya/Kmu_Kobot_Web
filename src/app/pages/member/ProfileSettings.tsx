import {
  Check,
  GraduationCap,
  IdCard,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../components/ui/utils";
import {
  KOOKMIN_COLLEGES,
  findCollege,
  findCollegeByDepartment,
  inferAcademicPlacementFromProfileName,
  normalizeCollegeName,
  normalizeDepartmentName,
} from "../../auth/kookminAcademic";
import { useAuth } from "../../auth/useAuth";
import type { MemberStatus } from "../../auth/types";
import { getSafeInternalPath, withNextPath } from "../../auth/redirects";

const NICKNAME_DISPLAY_PATTERN = /^[\uAC00-\uD7A3A-Za-z0-9 ]{2,12}$/u;
const NICKNAME_SPECIAL_CHARACTER_PATTERN = /[^\uAC00-\uD7A3A-Za-z0-9 ]/u;
const LOGIN_ID_ALLOWED_PATTERN = /^[a-z0-9]*$/;
const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;
const INVITATION_CLUB_LOCK_VALUES = new Set(["1", "true", "yes", "y", "locked"]);

type FieldKey =
  | "nicknameDisplay"
  | "fullName"
  | "studentId"
  | "phone"
  | "college"
  | "department"
  | "clubAffiliation"
  | "loginId"
  | "password"
  | "passwordConfirm";

const FIELD_ELEMENT_IDS: Record<FieldKey, string> = {
  nicknameDisplay: "nickname-display",
  fullName: "full-name",
  studentId: "student-id",
  phone: "phone",
  college: "college",
  department: "department",
  clubAffiliation: "club-affiliation",
  loginId: "login-id",
  password: "new-password",
  passwordConfirm: "confirm-password",
};

function normalizeNicknameDisplay(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function normalizeLoginIdInput(value: string) {
  return value.normalize("NFKC").replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function normalizeClubAffiliationInput(value: string | null | undefined) {
  const normalized = value?.normalize("NFKC").trim().replace(/\s+/g, " ");

  return normalized || null;
}

function getInvitationClubAffiliation(searchParams: URLSearchParams) {
  const clubAffiliation = normalizeClubAffiliationInput(
    searchParams.get("clubAffiliation") ??
      searchParams.get("club") ??
      searchParams.get("affiliation"),
  );

  if (!clubAffiliation) {
    return null;
  }

  const lockValue = (
    searchParams.get("lockClubAffiliation") ??
    searchParams.get("lockClub") ??
    searchParams.get("clubLocked") ??
    ""
  )
    .trim()
    .toLowerCase();

  return {
    clubAffiliation,
    locked: INVITATION_CLUB_LOCK_VALUES.has(lockValue),
  };
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

function ProfileSelect({
  disabled,
  id,
  invalid,
  isShaking,
  options,
  placeholder,
  value,
  onChange,
}: {
  disabled?: boolean;
  id: string;
  invalid?: boolean;
  isShaking?: boolean;
  options: Array<{
    label: string;
    aliases?: string[];
    description?: string;
  }>;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select disabled={disabled} value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          "h-11 rounded-xl border-slate-300 bg-white px-3 text-left text-sm font-medium shadow-none hover:bg-slate-50",
          !value && "text-slate-300",
          disabled && "cursor-not-allowed bg-slate-100 text-slate-400",
          invalid && "border-red-300 text-red-700 ring-1 ring-red-100 hover:bg-red-50/30",
          isShaking && "input-denied-shake",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="z-[80] max-h-72 w-[var(--radix-select-trigger-width)] rounded-2xl border-[#D8E0F0] bg-[#FBFCFF] p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.label}
              value={option.label}
              className={cn(
                "relative min-h-12 rounded-xl py-3 pl-4 pr-10 text-slate-700 transition-colors duration-150",
                "before:absolute before:bottom-2.5 before:left-2 before:top-2.5 before:w-0.5 before:rounded-full before:bg-transparent before:transition-colors",
                "hover:bg-[#F4F7FC] hover:text-slate-950",
                "focus:bg-[#EEF3FF] focus:text-[#0F2B68]",
                "data-[highlighted]:bg-[#EEF3FF] data-[highlighted]:text-[#0F2B68] data-[highlighted]:before:bg-[#9FB2DF]",
                "data-[state=checked]:bg-[#E8EEFF] data-[state=checked]:text-[#103078] data-[state=checked]:before:bg-[#103078]",
                "[&>span:first-child]:right-3 [&>span:first-child]:text-[#103078]",
                "[&_[data-option-description]]:text-slate-500 data-[highlighted]:[&_[data-option-description]]:text-[#58709E] data-[state=checked]:[&_[data-option-description]]:text-[#4F67A2]",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-900">{option.label}</span>
                {option.description ? (
                  <span
                    className="mt-0.5 block truncate text-xs transition-colors"
                    data-option-description
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authData, checkLoginIdAvailability, memberStatus, saveProfileSettings } = useAuth();
  const [nicknameDisplay, setNicknameDisplay] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [clubAffiliation, setClubAffiliation] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingLoginId, setIsCheckingLoginId] = useState(false);
  const [checkedAvailableLoginId, setCheckedAvailableLoginId] = useState<string | null>(null);
  const [shakingField, setShakingField] = useState<FieldKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const normalizedNickname = useMemo(
    () => normalizeNicknameDisplay(nicknameDisplay),
    [nicknameDisplay],
  );
  const isNicknameValid =
    !normalizedNickname ||
    (NICKNAME_DISPLAY_PATTERN.test(normalizedNickname) && !normalizedNickname.includes("_"));
  const hasNicknameSpecialCharacter = NICKNAME_SPECIAL_CHARACTER_PATTERN.test(
    nicknameDisplay.normalize("NFKC"),
  );
  const hasLoginIdInvalidCharacter = !LOGIN_ID_ALLOWED_PATTERN.test(loginId);
  const normalizedLoginId = loginId.trim().toLowerCase();
  const isPasswordConfirmMismatched =
    passwordConfirm.length > 0 && password !== passwordConfirm;
  const isJoinRequest = memberStatus === "pending" || memberStatus === null;
  const isJoinRoute = location.pathname === "/member/join";
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const safeNextPath = getSafeInternalPath(searchParams.get("next"));
  const invitationClubAffiliation = useMemo(
    () => getInvitationClubAffiliation(searchParams),
    [searchParams],
  );
  const shouldShowClubAffiliation = Boolean(invitationClubAffiliation);
  const isClubAffiliationLocked = invitationClubAffiliation?.locked ?? false;
  const isLoginIdLocked = !isJoinRequest && Boolean(authData.profile.loginId);
  const selectedCollege = findCollege(college);
  const departmentOptions =
    selectedCollege?.departments.map((department) => ({ label: department })) ?? [];
  const nicknameError =
    fieldErrors.nicknameDisplay ??
    (hasNicknameSpecialCharacter ? "특수문자는 불가합니다" : null);
  const loginIdError =
    fieldErrors.loginId ??
    (hasLoginIdInvalidCharacter ? "영어 소문자와 숫자만 사용할 수 있습니다." : null);
  const passwordConfirmError =
    fieldErrors.passwordConfirm ??
    (isPasswordConfirmMismatched ? "비밀번호가 일치하지 않습니다." : null);
  const isLoginIdAvailable = Boolean(
    normalizedLoginId &&
      checkedAvailableLoginId === normalizedLoginId &&
      normalizedLoginId !== authData.profile.loginId,
  );

  useEffect(() => {
    const inferredAcademic = inferAcademicPlacementFromProfileName(
      authData.profile.fullName ?? authData.profile.displayName,
    );
    const nextDepartmentSource = authData.profile.department ?? inferredAcademic.department;
    const nextCollege =
      normalizeCollegeName(authData.profile.college) ||
      findCollegeByDepartment(nextDepartmentSource)?.label ||
      inferredAcademic.college ||
      "";

    setNicknameDisplay(authData.profile.nicknameDisplay ?? "");
    setFullName(inferredAcademic.fullName ?? "");
    setStudentId(authData.profile.studentId ?? "");
    setPhone(formatPhoneNumber(authData.profile.phone ?? ""));
    setCollege(nextCollege);
    setDepartment(normalizeDepartmentName(nextCollege, nextDepartmentSource));
    setClubAffiliation(
      invitationClubAffiliation?.clubAffiliation ?? authData.profile.clubAffiliation ?? "",
    );
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
    authData.profile.studentId,
    invitationClubAffiliation?.clubAffiliation,
  ]);

  useEffect(() => {
    if (!shakingField) {
      return;
    }

    const timer = window.setTimeout(() => setShakingField(null), 220);

    return () => window.clearTimeout(timer);
  }, [shakingField]);

  function clearFieldError(field: FieldKey) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function showFieldError(field: FieldKey, message: string, shouldFocus = true) {
    setFieldErrors({ [field]: message });
    setShakingField(null);

    if (!shouldFocus) {
      return;
    }

    window.requestAnimationFrame(() => {
      const element = document.getElementById(FIELD_ELEMENT_IDS[field]);

      element?.scrollIntoView({ behavior: "smooth", block: "center" });

      if (element instanceof HTMLElement) {
        window.setTimeout(() => element.focus({ preventScroll: true }), 120);
      }

      setShakingField(field);
    });
  }

  function handleNicknameChange(value: string) {
    setNicknameDisplay(value);
    clearFieldError("nicknameDisplay");

    if (NICKNAME_SPECIAL_CHARACTER_PATTERN.test(value.normalize("NFKC"))) {
      setShakingField(null);
      window.requestAnimationFrame(() => setShakingField("nicknameDisplay"));
    }
  }

  function handleLoginIdChange(value: string) {
    const nextValue = normalizeLoginIdInput(value);
    setLoginId(nextValue);
    setCheckedAvailableLoginId(null);
    clearFieldError("loginId");

    if (!LOGIN_ID_ALLOWED_PATTERN.test(nextValue)) {
      setShakingField(null);
      window.requestAnimationFrame(() => setShakingField("loginId"));
    }
  }

  async function ensureLoginIdAvailable(shouldFocus = true) {
    const targetLoginId = normalizedLoginId;

    if (!targetLoginId || targetLoginId === authData.profile.loginId) {
      return true;
    }

    if (hasLoginIdInvalidCharacter || !LOGIN_ID_PATTERN.test(targetLoginId)) {
      return true;
    }

    if (checkedAvailableLoginId === targetLoginId) {
      return true;
    }

    setIsCheckingLoginId(true);

    try {
      const isAvailable = await checkLoginIdAvailability(targetLoginId);

      if (!isAvailable) {
        setCheckedAvailableLoginId(null);
        showFieldError("loginId", "이미 사용 중인 ID입니다.", shouldFocus);
        return false;
      }

      setCheckedAvailableLoginId(targetLoginId);
      clearFieldError("loginId");
      return true;
    } catch (error) {
      setCheckedAvailableLoginId(null);
      showFieldError("loginId", getSafeProfileError(error), shouldFocus);
      return false;
    } finally {
      setIsCheckingLoginId(false);
    }
  }

  function handleCollegeChange(value: string) {
    setCollege(value);
    setDepartment("");
    clearFieldError("college");
    clearFieldError("department");
  }

  function inputStateClass(field: FieldKey, invalid: boolean) {
    return cn(
      "placeholder:text-slate-300",
      invalid && "border-red-300 text-red-700 ring-1 ring-red-100 focus-visible:ring-red-500",
      shakingField === field && "input-denied-shake",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const requiredFields: Array<[FieldKey, string, string]> = [
      ["nicknameDisplay", normalizedNickname, "닉네임을 입력해 주세요."],
      ["fullName", fullName.trim(), "이름을 입력해 주세요."],
      ["studentId", studentId.trim(), "학번을 입력해 주세요."],
      ["phone", phone.trim(), "전화번호를 입력해 주세요."],
      ["college", college.trim(), "단과대를 선택해 주세요."],
      ["department", department.trim(), "학과를 선택해 주세요."],
    ];
    const missingField = requiredFields.find(([, value]) => !value);

    if (missingField) {
      showFieldError(missingField[0], missingField[2]);
      return;
    }

    if (phone.replace(/\D/g, "").length < 8) {
      showFieldError("phone", "전화번호는 숫자 8자리 이상 입력해 주세요.");
      return;
    }

    if (!isNicknameValid) {
      showFieldError("nicknameDisplay", "닉네임은 2~12자의 한글, 영문, 숫자, 공백만 사용할 수 있습니다.");
      return;
    }

    const wantsIdLogin = Boolean(loginId.trim() || password.trim() || passwordConfirm.trim());

    if (hasLoginIdInvalidCharacter) {
      showFieldError("loginId", "ID는 영어 소문자와 숫자만 사용할 수 있습니다.");
      return;
    }

    if (wantsIdLogin && !loginId.trim()) {
      showFieldError("loginId", "ID 로그인을 사용하려면 아이디를 입력해 주세요.");
      return;
    }

    if (wantsIdLogin && !LOGIN_ID_PATTERN.test(loginId.trim())) {
      showFieldError("loginId", "ID는 4~20자의 영어 소문자와 숫자로 입력해 주세요.");
      return;
    }

    if (!(await ensureLoginIdAvailable())) {
      return;
    }

    if (wantsIdLogin && !password.trim()) {
      showFieldError("password", "ID 로그인을 사용하려면 비밀번호를 입력해 주세요.");
      return;
    }

    if (password && password.length < 8) {
      showFieldError("password", "비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      showFieldError("passwordConfirm", "비밀번호가 일치하지 않습니다.");
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
        clubAffiliation: shouldShowClubAffiliation
          ? normalizeClubAffiliationInput(clubAffiliation)
          : authData.profile.clubAffiliation,
        publicCreditNameMode: isJoinRequest
          ? "anonymous"
          : (authData.profile.publicCreditNameMode ?? "anonymous"),
        techTags: authData.profile.techTags,
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
      const safeMessage = getSafeProfileError(error);

      if (safeMessage.includes("이미 사용 중인 ID") || safeMessage.includes("이미 사용 중인 아이디")) {
        showFieldError("loginId", "이미 사용 중인 ID입니다.");
        return;
      }

      if (safeMessage.includes("닉네임")) {
        showFieldError("nicknameDisplay", safeMessage);
        return;
      }

      toast.error(safeMessage);
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
      {!isJoinRequest && (
        <section className="border-b border-slate-200 pb-7">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#103078]">
              KOBOT Member Profile
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
              프로필/가입 설정
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              기본 회원 정보와 ID 로그인 정보를 관리합니다.
            </p>
          </div>
        </section>
      )}

      <form
        className="overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        onSubmit={handleSubmit}
      >
        <FormSection
          number="01"
          title="가입 정보"
          description="운영진 승인과 내부 프로젝트 참여자 목록에 필요한 정보입니다."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FieldShell htmlFor="nickname-display" label="닉네임" required>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="nickname-display"
                  aria-invalid={Boolean(nicknameError)}
                  className={cn("pl-10", inputStateClass("nicknameDisplay", Boolean(nicknameError)))}
                  value={nicknameDisplay}
                  onChange={(event) => handleNicknameChange(event.target.value)}
                />
              </div>
              {nicknameError ? (
                <p className="text-xs font-medium text-red-600">{nicknameError}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="full-name" label="이름" required>
              <Input
                id="full-name"
                aria-invalid={Boolean(fieldErrors.fullName)}
                className={inputStateClass("fullName", Boolean(fieldErrors.fullName))}
                placeholder="홍길동"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearFieldError("fullName");
                }}
              />
              {fieldErrors.fullName ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.fullName}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="student-id" label="학번" required>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="student-id"
                  aria-invalid={Boolean(fieldErrors.studentId)}
                  className={cn("pl-10", inputStateClass("studentId", Boolean(fieldErrors.studentId)))}
                  inputMode="numeric"
                  placeholder="20260000"
                  value={studentId}
                  onChange={(event) => {
                    setStudentId(event.target.value);
                    clearFieldError("studentId");
                  }}
                />
              </div>
              {fieldErrors.studentId ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.studentId}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="phone" label="전화번호" required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className={cn("pl-10", inputStateClass("phone", Boolean(fieldErrors.phone)))}
                  inputMode="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(event) => {
                    setPhone(formatPhoneNumber(event.target.value));
                    clearFieldError("phone");
                  }}
                />
              </div>
              {fieldErrors.phone ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.phone}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="college" label="단과대" required>
              <ProfileSelect
                id="college"
                value={college}
                options={KOOKMIN_COLLEGES.map((collegeOption) => ({
                  label: collegeOption.label,
                }))}
                placeholder="단과대를 선택해 주세요"
                invalid={Boolean(fieldErrors.college)}
                isShaking={shakingField === "college"}
                onChange={handleCollegeChange}
              />
              {fieldErrors.college ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.college}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="department" label="학과" required>
              <ProfileSelect
                id="department"
                disabled={!selectedCollege}
                value={department}
                options={departmentOptions}
                placeholder={
                  selectedCollege ? "학과를 선택해 주세요" : "먼저 단과대를 선택해 주세요"
                }
                invalid={Boolean(fieldErrors.department)}
                isShaking={shakingField === "department"}
                onChange={(value) => {
                  setDepartment(value);
                  clearFieldError("department");
                }}
              />
              {fieldErrors.department ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.department}</p>
              ) : null}
            </FieldShell>

            {shouldShowClubAffiliation ? (
              <FieldShell htmlFor="club-affiliation" label="초대 소속">
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="club-affiliation"
                    aria-invalid={Boolean(fieldErrors.clubAffiliation)}
                    className={cn(
                      "pl-10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
                      inputStateClass("clubAffiliation", Boolean(fieldErrors.clubAffiliation)),
                    )}
                    disabled={isClubAffiliationLocked}
                    value={clubAffiliation}
                    onChange={(event) => {
                      setClubAffiliation(event.target.value);
                      clearFieldError("clubAffiliation");
                    }}
                  />
                </div>
                {isClubAffiliationLocked ? (
                  <p className="text-xs font-medium text-slate-500">초대 링크로 고정된 소속입니다.</p>
                ) : null}
                {fieldErrors.clubAffiliation ? (
                  <p className="text-xs font-medium text-red-600">{fieldErrors.clubAffiliation}</p>
                ) : null}
              </FieldShell>
            ) : null}
          </div>
        </FormSection>

        <FormSection
          number="02"
          title="ID 로그인"
          description={
            isJoinRequest
              ? "이후 ID로 로그인 가능합니다."
              : "Google 로그인과 함께 사용할 별도 ID 로그인 정보입니다."
          }
        >
          <div className="grid gap-5 md:grid-cols-3">
            <FieldShell
              htmlFor="login-id"
              label="ID"
            >
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-id"
                  aria-invalid={Boolean(loginIdError)}
                  className={cn("pl-10", inputStateClass("loginId", Boolean(loginIdError)))}
                  disabled={isLoginIdLocked}
                  value={loginId}
                  onChange={(event) => handleLoginIdChange(event.target.value)}
                  onBlur={() => {
                    void ensureLoginIdAvailable(false);
                  }}
                />
              </div>
              {loginIdError ? (
                <p className="text-xs font-medium text-red-600">{loginIdError}</p>
              ) : isCheckingLoginId ? (
                <p className="text-xs font-medium text-slate-500">ID 중복 확인 중...</p>
              ) : isLoginIdAvailable ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  사용 가능한 ID입니다.
                </p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="new-password" label="비밀번호">
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                className={inputStateClass("password", Boolean(fieldErrors.password))}
                placeholder="8자 이상"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                  clearFieldError("passwordConfirm");
                }}
              />
              {fieldErrors.password ? (
                <p className="text-xs font-medium text-red-600">{fieldErrors.password}</p>
              ) : null}
            </FieldShell>

            <FieldShell htmlFor="confirm-password" label="비밀번호 확인">
              <div className="space-y-2">
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordConfirmError)}
                  className={cn(
                    "placeholder:text-slate-300",
                    passwordConfirmError
                      ? "border-red-300 text-red-700 ring-1 ring-red-100 focus-visible:ring-red-500"
                      : passwordConfirm
                        ? "border-emerald-300 focus-visible:ring-emerald-500"
                        : "",
                    shakingField === "passwordConfirm" && "input-denied-shake",
                  )}
                  placeholder="한 번 더 입력"
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                    clearFieldError("passwordConfirm");
                  }}
                />
                {passwordConfirmError ? (
                  <p className="text-xs font-medium text-red-600">
                    {passwordConfirmError}
                  </p>
                ) : passwordConfirm ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    비밀번호가 일치합니다.
                  </p>
                ) : null}
              </div>
            </FieldShell>
          </div>
        </FormSection>

        <div className="sticky bottom-3 z-10 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:flex sm:justify-end sm:bg-slate-50">
          <Button
            type="submit"
            className="h-11 w-full bg-[#103078] text-white hover:bg-[#2048A0] sm:w-auto"
            disabled={isSaving || isCheckingLoginId}
          >
            <Save className="h-4 w-4" />
            {isCheckingLoginId
              ? "ID 확인 중..."
              : isSaving
                ? "저장 중..."
                : isJoinRequest
                  ? "회원가입 요청하기"
                  : "프로필 저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}

