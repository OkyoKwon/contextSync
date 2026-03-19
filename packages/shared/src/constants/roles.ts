export const USER_ROLES = ['owner', 'admin', 'member'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];
