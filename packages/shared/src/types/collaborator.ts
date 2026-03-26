import type { UserRole } from './user.js';

export interface Collaborator {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly role: UserRole;
  readonly localDirectory: string | null;
  readonly addedAt: string;
  readonly userName?: string;
  readonly userEmail?: string;
  readonly userAvatarUrl?: string | null;
}

export interface AddCollaboratorInput {
  readonly email: string;
  readonly role?: UserRole;
}

export interface CollaboratorDataSummary {
  readonly userId: string;
  readonly userName: string;
  readonly projectId: string;
  readonly summary: {
    readonly sessions: number;
    readonly messages: number;
    readonly prdDocuments: number;
    readonly prdAnalyses: number;
    readonly aiEvaluations: number;
    readonly activityLogs: number;
    readonly promptTemplates: number;
    readonly conflicts: number;
    readonly syncedSessions: number;
  };
}

export interface DeletedDataSummary {
  readonly sessions: number;
  readonly prdDocuments: number;
  readonly aiEvaluations: number;
  readonly activityLogs: number;
  readonly promptTemplates: number;
}
