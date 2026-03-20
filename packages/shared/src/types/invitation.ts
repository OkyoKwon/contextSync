export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface Invitation {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly inviterId: string;
  readonly inviterName: string;
  readonly inviterAvatarUrl: string | null;
  readonly email: string;
  readonly role: string;
  readonly status: InvitationStatus;
  readonly expiresAt: string;
  readonly createdAt: string;
}

export interface CreateInvitationInput {
  readonly email: string;
  readonly role?: string;
}
