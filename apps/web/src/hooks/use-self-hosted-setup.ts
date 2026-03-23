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
    mutationFn: ({ connectionUrl, sslEnabled }: { connectionUrl: string; sslEnabled: boolean }) =>
      setupApi.switchToRemote(connectionUrl, sslEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup', 'status'] });
    },
  });
}
