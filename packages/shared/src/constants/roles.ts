export const USER_ROLES = ['owner', 'member'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];
