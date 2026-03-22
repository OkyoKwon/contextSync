import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/projects.api', () => ({
  projectsApi: { list: vi.fn() },
}));

import { useAuthStore } from '../../stores/auth.store';
import { useOnboardingStatus } from '../use-onboarding-status';

describe('useOnboardingStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns "ready" when currentProjectId exists', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) =>
      s({ token: 'tok', currentProjectId: 'p1', setCurrentProject: vi.fn() }),
    );
    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    expect(result.current).toBe('ready');
  });

  it('returns "needs-project" when no token and no projectId', () => {
    vi.mocked(useAuthStore).mockImplementation((s: any) =>
      s({ token: null, currentProjectId: null, setCurrentProject: vi.fn() }),
    );
    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    expect(result.current).toBe('needs-project');
  });
});
