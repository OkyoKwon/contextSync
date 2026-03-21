import type {
  Session,
  SessionWithMessages,
  SessionImportResult,
  SessionFilterQuery,
  TimelineEntry,
  DashboardStats,
  MemberActivity,
  TokenUsageStats,
  TokenUsagePeriod,
  LocalDirectory,
  LocalProjectGroup,
  LocalSessionDetail,
  SyncSessionResult,
  RecalculateTokenResult,
  ProjectConversation,
  BrowseDirectoryEntry,
} from '@context-sync/shared';
import { api } from './client';

export const sessionsApi = {
  list: (projectId: string, filter?: SessionFilterQuery) => {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    return api.get<readonly Session[]>(`/projects/${projectId}/sessions${qs ? `?${qs}` : ''}`);
  },

  get: (sessionId: string) => api.get<SessionWithMessages>(`/sessions/${sessionId}`),

  import: (projectId: string, file: File) =>
    api.upload<SessionImportResult>(`/projects/${projectId}/sessions/import`, file),

  update: (sessionId: string, input: { title?: string; status?: string; tags?: string[] }) =>
    api.patch<Session>(`/sessions/${sessionId}`, input),

  delete: (sessionId: string) => api.delete(`/sessions/${sessionId}`),

  timeline: (projectId: string, filter?: SessionFilterQuery) => {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    return api.get<readonly TimelineEntry[]>(
      `/projects/${projectId}/timeline${qs ? `?${qs}` : ''}`,
    );
  },

  stats: (projectId: string) => api.get<DashboardStats>(`/projects/${projectId}/stats`),

  teamStats: (projectId: string) =>
    api.get<readonly MemberActivity[]>(`/projects/${projectId}/team-stats`),

  tokenUsage: (projectId: string, period: TokenUsagePeriod = '30d') =>
    api.get<TokenUsageStats>(`/projects/${projectId}/token-usage?period=${period}`),

  browseDirectory: (path?: string) =>
    api.get<readonly BrowseDirectoryEntry[]>(
      `/sessions/local/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`,
    ),

  listLocalDirectories: () => api.get<readonly LocalDirectory[]>('/sessions/local/directories'),

  listLocal: (projectId: string, activeOnly = true) =>
    api.get<readonly LocalProjectGroup[]>(
      `/sessions/local?projectId=${projectId}&activeOnly=${activeOnly}`,
    ),

  getLocal: (sessionId: string) => api.get<LocalSessionDetail>(`/sessions/local/${sessionId}`),

  getLocalProjectConversation: (projectPath: string, cursor?: string, limit = 100) =>
    api.get<ProjectConversation>(
      `/sessions/local/project-conversation?projectPath=${encodeURIComponent(projectPath)}${cursor ? `&cursor=${cursor}` : ''}&limit=${limit}`,
    ),

  sync: (projectId: string, sessionIds: readonly string[]) =>
    api.post<SyncSessionResult>(`/projects/${projectId}/sessions/sync`, { sessionIds }),

  recalculateTokens: (projectId: string) =>
    api.post<RecalculateTokenResult>(`/projects/${projectId}/sessions/recalculate-tokens`),

  exportMarkdown: async (projectId: string): Promise<Blob> => {
    const { useAuthStore } = await import('../stores/auth.store');
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/projects/${projectId}/sessions/export/markdown`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        const { useLoginModal } = await import('../hooks/use-login-modal');
        useLoginModal.getState().openLoginModal();
        throw new Error('Session expired. Please log in again.');
      }
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error ?? `Export failed (${response.status})`);
    }
    return response.blob();
  },
};
