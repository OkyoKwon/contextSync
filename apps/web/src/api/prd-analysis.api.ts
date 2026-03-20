import type {
  PrdDocument,
  PrdAnalysisWithRequirements,
  PrdAnalysisHistoryEntry,
} from '@context-sync/shared';
import { api } from './client';

export const prdAnalysisApi = {
  uploadDocument: (projectId: string, file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return api.post<PrdDocument>(`/projects/${projectId}/prd/documents`, formData);
  },

  listDocuments: (projectId: string) =>
    api.get<readonly PrdDocument[]>(`/projects/${projectId}/prd/documents`),

  deleteDocument: (documentId: string) =>
    api.delete<null>(`/prd/documents/${documentId}`),

  startAnalysis: (projectId: string, prdDocumentId: string) =>
    api.post<PrdAnalysisWithRequirements>(`/projects/${projectId}/prd/analyze`, { prdDocumentId }),

  getLatestAnalysis: (projectId: string) =>
    api.get<PrdAnalysisWithRequirements | null>(`/projects/${projectId}/prd/analysis/latest`),

  getAnalysisHistory: (projectId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api.get<readonly PrdAnalysisHistoryEntry[]>(
      `/projects/${projectId}/prd/analysis/history?${params}`,
    );
  },

  getAnalysisDetail: (analysisId: string) =>
    api.get<PrdAnalysisWithRequirements>(`/prd/analysis/${analysisId}`),
};
