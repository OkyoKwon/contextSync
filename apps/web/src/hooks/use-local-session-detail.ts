import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';

export function useLocalSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ['local-session-detail', sessionId],
    queryFn: () => sessionsApi.getLocal(sessionId!),
    enabled: !!sessionId,
  });
}
