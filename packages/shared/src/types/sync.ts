export interface LocalSessionInfo {
  readonly sessionId: string;
  readonly projectPath: string;
  readonly firstMessage: string;
  readonly messageCount: number;
  readonly startedAt: string;
  readonly lastModifiedAt: string;
  readonly isSynced: boolean;
  readonly isActive: boolean;
}

export interface LocalProjectGroup {
  readonly projectPath: string;
  readonly sessions: readonly LocalSessionInfo[];
  readonly totalMessages: number;
  readonly isActive: boolean;
}

export interface SyncSessionResult {
  readonly syncedCount: number;
  readonly results: readonly SyncSingleResult[];
}

export interface SyncSingleResult {
  readonly sessionId: string;
  readonly success: boolean;
  readonly messageCount?: number;
  readonly detectedConflicts?: number;
  readonly error?: string;
}
