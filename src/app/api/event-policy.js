export const EVENT_CREATE_PERMISSIONS = ["events.create", "events.manage"];

export function canCreateEvents(permissions = []) {
  return permissions.some((permission) => EVENT_CREATE_PERMISSIONS.includes(permission));
}
