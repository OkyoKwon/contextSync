import { useQuery } from '@tanstack/react-query';
import type { ActivityEntry } from '@context-sync/shared';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

function getActivity(projectId: string, page = 1, limit = 20) {
  return api.get<readonly ActivityEntry[]>(
    `/projects/${projectId}/activity?page=${page}&limit=${limit}`,
  );
}

export function useActivity(page = 1, limit = 20) {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['activity', projectId, page, limit],
    queryFn: () => getActivity(projectId!, page, limit),
    enabled: !!projectId,
  });
}
