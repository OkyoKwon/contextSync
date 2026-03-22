import { useQuery } from '@tanstack/react-query';
import { setupApi } from '../api/setup.api';

export function useDatabaseStatus() {
  return useQuery({
    queryKey: ['setup', 'status'],
    queryFn: () => setupApi.getStatus(),
    staleTime: 5 * 60 * 1000,
  });
}
