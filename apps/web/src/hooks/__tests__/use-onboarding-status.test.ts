import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { useOnboardingStatus } from '../use-onboarding-status';

setupMsw();

describe('useOnboardingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('returns "ready" when currentProjectId exists', () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    expect(result.current).toBe('ready');
  });

  it('returns "needs-project" when no token and no projectId', () => {
    setMockAuthState({ token: null, currentProjectId: null });
    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    expect(result.current).toBe('needs-project');
  });

  it('returns "loading" when token exists but no projectId and query is loading', () => {
    setMockAuthState({ token: 'tok', currentProjectId: null });

    // Delay the response to keep the query in loading state
    server.use(
      http.get('/api/projects', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    expect(result.current).toBe('loading');
  });

  it('transitions from loading to needs-project when no projects returned', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: null });

    server.use(
      http.get('/api/projects', () => HttpResponse.json({ success: true, data: [], error: null })),
    );

    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    // Initially loading, then transitions to needs-project
    await waitFor(() => expect(result.current).toBe('needs-project'));
  });

  it('returns "needs-project" when fetch returns empty list', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: null });

    server.use(
      http.get('/api/projects', () => HttpResponse.json({ success: true, data: [], error: null })),
    );

    const { result } = renderHookWithProviders(() => useOnboardingStatus());
    await waitFor(() => expect(result.current).toBe('needs-project'));
  });
});
