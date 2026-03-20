import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
  });
}

export function usePlanDetail(filename: string | null) {
  return useQuery({
    queryKey: ['plan', filename],
    queryFn: () => plansApi.get(filename!),
    enabled: !!filename,
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filename: string) => plansApi.delete(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
