import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UnifiedMessage } from '@context-sync/shared';
import { sessionsApi } from '../api/sessions.api';

export function useLocalProjectConversation(projectPath: string | null) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<readonly UnifiedMessage[]>([]);

  const query = useQuery({
    queryKey: ['local-project-conversation', projectPath, cursor],
    queryFn: async () => {
      const result = await sessionsApi.getLocalProjectConversation(projectPath!, cursor);
      const data = result.data;
      if (data) {
        setAccumulated((prev) =>
          cursor ? [...prev, ...data.messages] : data.messages,
        );
      }
      return result;
    },
    enabled: !!projectPath,
  });

  const messages = useMemo(
    () => (cursor ? accumulated : query.data?.data?.messages ?? []),
    [accumulated, cursor, query.data],
  );

  const loadMore = useCallback(() => {
    const data = query.data?.data;
    if (data?.hasMore && data.nextCursor) {
      setCursor(data.nextCursor);
    }
  }, [query.data]);

  const reset = useCallback(() => {
    setCursor(undefined);
    setAccumulated([]);
  }, []);

  return {
    messages,
    sessionCount: query.data?.data?.sessionCount ?? 0,
    totalMessages: query.data?.data?.totalMessages ?? 0,
    hasMore: query.data?.data?.hasMore ?? false,
    isLoading: query.isLoading,
    error: query.error,
    loadMore,
    reset,
  };
}
