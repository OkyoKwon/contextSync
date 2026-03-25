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

import { useSearch } from '../use-search';

setupMsw();

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
  });

  it('is disabled when no projectId', () => {
    setMockAuthState({ token: 'tok', currentProjectId: null });
    const { result } = renderHookWithProviders(() => useSearch('test'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when query is too short', () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
    const { result } = renderHookWithProviders(() => useSearch('t'));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches with valid projectId and query', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });

    server.use(
      http.get('/api/projects/p1/search', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('q')).toBe('hello');
        expect(url.searchParams.get('type')).toBe('all');
        return HttpResponse.json({
          success: true,
          data: { results: [], total: 0 },
          error: null,
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useSearch('hello'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual({ results: [], total: 0 });
  });

  it('returns search results', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });

    const mockResults = [
      {
        type: 'session',
        id: 's1',
        sessionId: 's1',
        title: 'Result 1',
        highlight: 'match',
        createdAt: '2024-01-01',
      },
    ];

    server.use(
      http.get('/api/projects/p1/search', () =>
        HttpResponse.json({
          success: true,
          data: { results: mockResults, total: 1 },
          error: null,
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useSearch('hello'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.results).toHaveLength(1);
  });

  it('handles error response', async () => {
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });

    server.use(
      http.get('/api/projects/p1/search', () =>
        HttpResponse.json({ success: false, data: null, error: 'Search failed' }, { status: 500 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useSearch('hello'));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
