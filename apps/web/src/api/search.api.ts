import { api } from './client';

export interface SearchResult {
  readonly type: 'session' | 'message';
  readonly id: string;
  readonly sessionId: string;
  readonly title: string;
  readonly highlight: string;
  readonly createdAt: string;
}

export const searchApi = {
  search: (projectId: string, q: string, type = 'all', page = 1) =>
    api.get<{ results: readonly SearchResult[]; total: number }>(
      `/projects/${projectId}/search?q=${encodeURIComponent(q)}&type=${type}&page=${page}`,
    ),
};
