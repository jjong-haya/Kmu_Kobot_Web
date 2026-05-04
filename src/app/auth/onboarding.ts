import type { AuthorizationContextData, MemberStatus } from "./types";

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isJoinRequestComplete(authData: AuthorizationContextData) {
  const { account, profile } = authData;

  return (
    hasText(profile.nicknameDisplay) &&
    hasText(profile.fullName) &&
    hasText(profile.studentId) &&
    hasText(profile.phone) &&
    hasText(profile.college) &&
    hasText(profile.department)
  );
}

export function getPostAuthMemberPath(
  authData: AuthorizationContextData,
  memberStatus: MemberStatus,
  activePath = "/member",
) {
  if (memberStatus === "active") {
    return activePath;
  }

  if (memberStatus === "course_member") {
    // KOSS 코드만 적용된 상태라도 단과대/학과 등 기본 프로필이 비어 있으면
    // 회원 영역에 들어가기 전에 정보 입력을 강제한다.
    return isJoinRequestComplete(authData) ? activePath : "/member/join";
  }

  if (memberStatus === "project_only" || memberStatus === "withdrawn") {
    return "/member/pending";
  }

  if (memberStatus === "pending" || memberStatus === null) {
    // 초대코드(KOSS 등)가 이미 적용된 사용자(profile.clubAffiliation 세팅됨)는
    // 코드 입력 단계를 다시 보여주지 않고 바로 정보 입력 폼으로 보낸다.
    const hasInvite = Boolean(authData.profile.clubAffiliation);
    if (isJoinRequestComplete(authData)) return "/member/pending";
    return hasInvite ? "/member/join?course=1" : "/member/welcome";
  }

  return "/member/pending";
}
