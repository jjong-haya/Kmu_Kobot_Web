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
    hasText(profile.department) &&
    hasText(profile.clubAffiliation)
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

  if (memberStatus === "project_only" || memberStatus === "withdrawn") {
    return "/member/pending";
  }

  if (memberStatus === "pending" || memberStatus === null) {
    return isJoinRequestComplete(authData) ? "/member/pending" : "/member/join";
  }

  return "/member/pending";
}
