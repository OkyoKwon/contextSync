export type ActivityAction =
  | 'session_created'
  | 'session_completed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'directory_updated'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'invitation_cancelled';

export interface ActivityEntry {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly userName: string;
  readonly userAvatarUrl: string | null;
  readonly action: ActivityAction;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
}
