export interface Session {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly title: string;
  readonly source: SessionSource;
  readonly status: SessionStatus;
  readonly filePaths: readonly string[];
  readonly moduleNames: readonly string[];
  readonly branch: string | null;
  readonly tags: readonly string[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly userName?: string;
  readonly userAvatarUrl?: string | null;
}

export type SessionSource = 'claude_code' | 'claude_ai' | 'api' | 'manual';
export type SessionStatus = 'active' | 'completed' | 'archived';

export interface Message {
  readonly id: string;
  readonly sessionId: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly contentType: MessageContentType;
  readonly tokensUsed: number | null;
  readonly modelUsed: string | null;
  readonly sortOrder: number;
  readonly createdAt: string;
}

export type MessageRole = 'user' | 'assistant';
export type MessageContentType = 'prompt' | 'response' | 'plan';

export interface SessionWithMessages extends Session {
  readonly messages: readonly Message[];
}

export interface SessionImportResult {
  readonly session: Session;
  readonly messageCount: number;
  readonly detectedConflicts: number;
}

export interface SessionFilterQuery {
  readonly status?: SessionStatus;
  readonly userId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly sortBy?: 'createdAt' | 'updatedAt';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly limit?: number;
}

export interface TimelineEntry {
  readonly id: string;
  readonly title: string;
  readonly source: SessionSource;
  readonly filePaths: readonly string[];
  readonly userName: string;
  readonly userAvatarUrl: string | null;
  readonly createdAt: string;
}

export interface DashboardStats {
  readonly todaySessions: number;
  readonly weekSessions: number;
  readonly activeConflicts: number;
  readonly activeMembers: number;
  readonly hotFilePaths: readonly { readonly path: string; readonly count: number }[];
}
