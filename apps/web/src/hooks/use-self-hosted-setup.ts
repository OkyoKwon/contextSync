import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setupApi } from '../api/setup.api';

export function useTestConnection() {
  return useMutation({
    mutationFn: ({ connectionUrl, sslEnabled }: { connectionUrl: string; sslEnabled: boolean }) =>
      setupApi.testConnection(connectionUrl, sslEnabled),
  });
}

export function useSwitchToRemote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      connectionUrl,
      sslEnabled,
      projectId,
    }: {
      connectionUrl: string;
      sslEnabled: boolean;
      projectId: string;
    }) => setupApi.switchToRemote(connectionUrl, sslEnabled, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
