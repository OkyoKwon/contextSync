export interface Conflict {
  readonly id: string;
  readonly projectId: string;
  readonly sessionAId: string;
  readonly sessionBId: string;
  readonly conflictType: ConflictType;
  readonly severity: ConflictSeverity;
  readonly status: ConflictStatus;
  readonly description: string;
  readonly overlappingPaths: readonly string[];
  readonly diffData: Record<string, unknown>;
  readonly resolvedBy: string | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly sessionATitle?: string;
  readonly sessionBTitle?: string;
  readonly sessionAUserName?: string;
  readonly sessionBUserName?: string;
}

export type ConflictType = 'file' | 'design' | 'dependency' | 'plan';
export type ConflictSeverity = 'info' | 'warning' | 'critical';
export type ConflictStatus = 'detected' | 'reviewing' | 'resolved' | 'dismissed';

export interface ConflictFilterQuery {
  readonly severity?: ConflictSeverity;
  readonly status?: ConflictStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface UpdateConflictInput {
  readonly status: 'reviewing' | 'resolved' | 'dismissed';
}

export interface DetectedConflict {
  readonly sessionAId: string;
  readonly sessionBId: string;
  readonly conflictType: ConflictType;
  readonly severity: ConflictSeverity;
  readonly description: string;
  readonly overlappingPaths: readonly string[];
}
