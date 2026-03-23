import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export function useAdminStatus(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'status'],
    queryFn: () => adminApi.getStatus(),
    refetchInterval: 30_000,
    enabled,
  });
}

export function useAdminConfig() {
  return useQuery({
    queryKey: ['admin', 'config'],
    queryFn: () => adminApi.getConfig(),
  });
}

export function useRunMigrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminApi.runMigrations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'status'] });
    },
  });
}
