import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuotaStatus, triggerPlanDetection } from '../api/quota.api';

const QUOTA_KEY = ['quota'] as const;

export function useQuotaStatus() {
  return useQuery({
    queryKey: QUOTA_KEY,
    queryFn: fetchQuotaStatus,
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    staleTime: 60 * 1000,
  });
}

export function useDetectPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerPlanDetection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_KEY });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
