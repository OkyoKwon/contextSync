export interface LocalDirectory {
  readonly path: string;
  readonly sessionCount: number;
  readonly lastActivityAt: string;
  readonly isActive: boolean;
}

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

export interface LocalSessionDetail {
  readonly sessionId: string;
  readonly projectPath: string;
  readonly title: string;
  readonly branch: string | null;
  readonly filePaths: readonly string[];
  readonly messages: readonly LocalSessionMessage[];
  readonly startedAt: string | null;
  readonly lastModifiedAt: string;
}

export interface LocalSessionMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly modelUsed?: string;
  readonly tokensUsed?: number;
}

export interface SyncSingleResult {
  readonly sessionId: string;
  readonly success: boolean;
  readonly messageCount?: number;
  readonly detectedConflicts?: number;
  readonly error?: string;
}

export interface UnifiedMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
  readonly sessionId: string;
  readonly sessionTitle: string;
  readonly modelUsed?: string;
  readonly tokensUsed?: number;
}

export interface ProjectConversation {
  readonly projectPath: string;
  readonly messages: readonly UnifiedMessage[];
  readonly sessionCount: number;
  readonly totalMessages: number;
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
}
