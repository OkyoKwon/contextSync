import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders, waitFor } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/auth.api', () => ({
  authApi: { getMe: vi.fn() },
}));

import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { useCurrentUser } from '../use-auth';

describe('useCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when no token', () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ token: null }));

    const { result } = renderHookWithProviders(() => useCurrentUser());
    expect(result.current.fetchStatus).toBe('idle');
    expect(authApi.getMe).not.toHaveBeenCalled();
  });

  it('fetches when token exists', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({ token: 'valid-token' }),
    );
    vi.mocked(authApi.getMe).mockResolvedValue({
      success: true,
      data: { id: 'user-1', name: 'Test' } as any,
      error: null,
    });

    const { result } = renderHookWithProviders(() => useCurrentUser());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authApi.getMe).toHaveBeenCalled();
  });
});
