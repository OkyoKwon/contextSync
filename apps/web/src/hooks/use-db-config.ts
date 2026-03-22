import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SaveDbConfigInput, TestConnectionInput } from '@context-sync/shared';
import { dbConfigApi } from '../api/db-config.api';

export function useDbConfig(projectId: string | null) {
  return useQuery({
    queryKey: ['db-config', projectId],
    queryFn: () => dbConfigApi.get(projectId!),
    enabled: !!projectId,
  });
}

export function useTestConnection(projectId: string) {
  return useMutation({
    mutationFn: (input: TestConnectionInput) => dbConfigApi.testConnection(projectId, input),
  });
}

export function useSaveDbConfig(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveDbConfigInput) => dbConfigApi.save(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    },
  });
}

export function useDeleteDbConfig(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dbConfigApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-config', projectId] });
    },
  });
}

export function useMigrationPreview(projectId: string | null) {
  return useQuery({
    queryKey: ['db-config', 'migration-preview', projectId],
    queryFn: () => dbConfigApi.getMigrationPreview(projectId!),
    enabled: !!projectId,
  });
}

export function useStartMigration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dbConfigApi.startMigration(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-config', 'migration-progress', projectId] });
    },
  });
}

export function useMigrationProgress(projectId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['db-config', 'migration-progress', projectId],
    queryFn: () => dbConfigApi.getMigrationProgress(projectId!),
    enabled: !!projectId && enabled,
    refetchInterval: enabled ? 2000 : false,
  });
}
