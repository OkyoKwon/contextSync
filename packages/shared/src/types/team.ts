import type { UserRole } from './user.js';

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly settings: TeamSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TeamSettings {
  readonly defaultConflictWindow?: number;
  readonly notificationsEnabled?: boolean;
}

export interface TeamMember {
  readonly id: string;
  readonly teamId: string;
  readonly userId: string;
  readonly role: UserRole;
  readonly joinedAt: string;
  readonly userName?: string;
  readonly userEmail?: string;
  readonly userAvatarUrl?: string | null;
}

export interface CreateTeamInput {
  readonly name: string;
  readonly slug: string;
}

export interface UpdateTeamInput {
  readonly name?: string;
  readonly settings?: TeamSettings;
}

export interface AddMemberInput {
  readonly email: string;
  readonly role?: UserRole;
}
