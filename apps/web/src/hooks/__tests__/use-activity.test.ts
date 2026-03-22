import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  api: { get: vi.fn().mockResolvedValue({ success: true, data: [], error: null }) },
}));

import { useAuthStore } from '../../stores/auth.store';
import { useActivity } from '../use-activity';

describe('useActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled without projectId', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: null }));
    const { result } = renderHookWithProviders(() => useActivity());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when skipped', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) => s({ currentProjectId: 'skipped' }));
    const { result } = renderHookWithProviders(() => useActivity());
    expect(result.current.fetchStatus).toBe('idle');
  });
});
