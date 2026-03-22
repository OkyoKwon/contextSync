import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../api/admin.api', () => ({
  adminApi: {
    getStatus: vi.fn(),
    getConfig: vi.fn(),
    runMigrations: vi.fn(),
  },
}));

import { adminApi } from '../../api/admin.api';
import { useAdminStatus, useAdminConfig, useRunMigrations } from '../use-admin';

describe('useAdmin hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useAdminStatus calls adminApi.getStatus', async () => {
    vi.mocked(adminApi.getStatus).mockResolvedValue({
      success: true,
      data: {} as any,
      error: null,
    });
    const { result } = renderHookWithProviders(() => useAdminStatus());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(adminApi.getStatus).toHaveBeenCalled();
  });

  it('useAdminConfig calls adminApi.getConfig', async () => {
    vi.mocked(adminApi.getConfig).mockResolvedValue({
      success: true,
      data: {} as any,
      error: null,
    });
    const { result } = renderHookWithProviders(() => useAdminConfig());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('useRunMigrations returns mutate', () => {
    const { result } = renderHookWithProviders(() => useRunMigrations());
    expect(result.current.mutate).toBeDefined();
  });
});
