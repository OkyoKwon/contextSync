export type ActivityAction =
  | 'session_created'
  | 'session_completed'
  | 'session_synced'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'collaborator_joined'
  | 'directory_updated'
  | 'prd_analyzed'
  | 'evaluation_completed';

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
