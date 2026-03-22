import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../api/plans.api', () => ({
  plansApi: {
    list: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { plansApi } from '../../api/plans.api';
import { usePlans, usePlanDetail, useDeletePlan } from '../use-plans';

describe('usePlans hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usePlans calls plansApi.list', async () => {
    vi.mocked(plansApi.list).mockResolvedValue({ success: true, data: [], error: null });
    const { result } = renderHookWithProviders(() => usePlans());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(plansApi.list).toHaveBeenCalled();
  });

  it('usePlanDetail is disabled when filename is null', () => {
    const { result } = renderHookWithProviders(() => usePlanDetail(null));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('usePlanDetail fetches with filename', async () => {
    vi.mocked(plansApi.get).mockResolvedValue({ success: true, data: {} as any, error: null });
    const { result } = renderHookWithProviders(() => usePlanDetail('plan.md'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(plansApi.get).toHaveBeenCalledWith('plan.md');
  });

  it('useDeletePlan returns mutate', () => {
    const { result } = renderHookWithProviders(() => useDeletePlan());
    expect(result.current.mutate).toBeDefined();
  });
});
