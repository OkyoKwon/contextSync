import type { UserRole } from './user.js';

export interface Collaborator {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role: UserRole;
  readonly addedAt: string;
  readonly userName?: string;
  readonly userEmail?: string;
  readonly userAvatarUrl?: string | null;
}

export interface AddCollaboratorInput {
  readonly email: string;
  readonly role?: UserRole;
}
