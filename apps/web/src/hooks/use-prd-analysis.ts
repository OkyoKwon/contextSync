import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prdAnalysisApi } from '../api/prd-analysis.api';
import { useAuthStore } from '../stores/auth.store';

export function usePrdDocuments() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['prd-documents', projectId],
    queryFn: () => prdAnalysisApi.listDocuments(projectId!),
    enabled: !!projectId,
  });
}

export function useUploadPrdDocument() {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      prdAnalysisApi.uploadDocument(projectId!, file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd-documents', projectId] });
    },
  });
}

export function useDeletePrdDocument() {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => prdAnalysisApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd-documents', projectId] });
    },
  });
}

export function useStartAnalysis() {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prdDocumentId: string) =>
      prdAnalysisApi.startAnalysis(projectId!, prdDocumentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd-analysis-latest', projectId] });
      queryClient.invalidateQueries({ queryKey: ['prd-analysis-history', projectId] });
    },
  });
}

export function useLatestPrdAnalysis() {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['prd-analysis-latest', projectId],
    queryFn: () => prdAnalysisApi.getLatestAnalysis(projectId!),
    enabled: !!projectId,
  });
}

export function usePrdAnalysisHistory(page = 1) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['prd-analysis-history', projectId, page],
    queryFn: () => prdAnalysisApi.getAnalysisHistory(projectId!, page),
    enabled: !!projectId,
  });
}

export function useReplacePrdDocument() {
  const projectId = useAuthStore((s) => s.currentProjectId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldDocumentId, file }: { oldDocumentId: string; file: File }) => {
      await prdAnalysisApi.deleteDocument(oldDocumentId);
      return prdAnalysisApi.uploadDocument(projectId!, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd-documents', projectId] });
    },
  });
}

export function usePrdAnalysisDetail(analysisId: string | null) {
  return useQuery({
    queryKey: ['prd-analysis-detail', analysisId],
    queryFn: () => prdAnalysisApi.getAnalysisDetail(analysisId!),
    enabled: !!analysisId,
  });
}
