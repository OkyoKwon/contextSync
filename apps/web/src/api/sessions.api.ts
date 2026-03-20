import type {
  Session,
  SessionWithMessages,
  SessionImportResult,
  SessionFilterQuery,
  TimelineEntry,
  DashboardStats,
  LocalProjectGroup,
  LocalSessionDetail,
  SyncSessionResult,
  ProjectConversation,
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
    return api.get<readonly TimelineEntry[]>(`/projects/${projectId}/timeline${qs ? `?${qs}` : ''}`);
  },

  stats: (projectId: string) => api.get<DashboardStats>(`/projects/${projectId}/stats`),

  listLocal: (projectId: string, activeOnly = true) =>
    api.get<readonly LocalProjectGroup[]>(
      `/sessions/local?projectId=${projectId}&activeOnly=${activeOnly}`,
    ),

  getLocal: (sessionId: string) =>
    api.get<LocalSessionDetail>(`/sessions/local/${sessionId}`),

  getLocalProjectConversation: (projectPath: string, cursor?: string, limit = 100) =>
    api.get<ProjectConversation>(
      `/sessions/local/project-conversation?projectPath=${encodeURIComponent(projectPath)}${cursor ? `&cursor=${cursor}` : ''}&limit=${limit}`,
    ),

  sync: (projectId: string, sessionIds: readonly string[]) =>
    api.post<SyncSessionResult>(`/projects/${projectId}/sessions/sync`, { sessionIds }),
};
