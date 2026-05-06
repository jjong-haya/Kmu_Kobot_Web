export const SENSITIVE_PERMISSION_MESSAGE =
  "위험 권한은 동아리 태그나 초대 코드 기본 태그에 붙일 수 없습니다.";

const SENSITIVE_PERMISSION_CODES = new Set([
  "admin.access",
  "permissions.manage",
  "members.manage",
  "org_positions.manage",
  "team_roles.manage",
  "teams.manage",
  "exceptions.manage",
  "operations.manage",
  "integrations.manage",
]);

export function normalizePermissionCode(permission: string) {
  return permission.trim().toLowerCase();
}

export function isSensitivePermission(permission: string) {
  const code = normalizePermissionCode(permission);
  return SENSITIVE_PERMISSION_CODES.has(code) || code.endsWith(".manage");
}

export function getSensitivePermissions(permissions: Iterable<string>) {
  return Array.from(permissions).filter(isSensitivePermission);
}

export function hasSensitivePermissions(permissions: Iterable<string>) {
  return getSensitivePermissions(permissions).length > 0;
}
