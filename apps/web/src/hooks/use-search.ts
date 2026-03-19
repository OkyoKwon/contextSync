import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';
import { useAuthStore } from '../stores/auth.store';

export function useSearch(query: string, type = 'all') {
  const projectId = useAuthStore((s) => s.currentProjectId);

  return useQuery({
    queryKey: ['search', projectId, query, type],
    queryFn: () => searchApi.search(projectId!, query, type),
    enabled: !!projectId && query.length >= 2,
  });
}
