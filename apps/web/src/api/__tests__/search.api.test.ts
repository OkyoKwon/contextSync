import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { searchApi } from '../search.api';

setupMsw();

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('search encodes query and includes params', async () => {
    const searchData = { results: [{ id: 's1', type: 'session', title: 'Hello' }], total: 1 };
    server.use(
      http.get('/api/projects/:projectId/search', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('q')).toBe('hello world');
        expect(url.searchParams.get('type')).toBe('session');
        expect(url.searchParams.get('page')).toBe('2');
        return HttpResponse.json({ success: true, data: searchData, error: null });
      }),
    );

    const result = await searchApi.search('proj-1', 'hello world', 'session', 2);
    expect(result.data).toEqual(searchData);
  });

  it('search uses defaults for type and page', async () => {
    const searchData = { results: [], total: 0 };
    server.use(
      http.get('/api/projects/:projectId/search', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('q')).toBe('test');
        expect(url.searchParams.get('type')).toBe('all');
        expect(url.searchParams.get('page')).toBe('1');
        return HttpResponse.json({ success: true, data: searchData, error: null });
      }),
    );

    const result = await searchApi.search('proj-1', 'test');
    expect(result.data).toEqual(searchData);
  });

  it('search throws on server error', async () => {
    server.use(
      http.get('/api/projects/:projectId/search', () =>
        HttpResponse.json({ error: 'Search unavailable' }, { status: 500 }),
      ),
    );

    await expect(searchApi.search('proj-1', 'test')).rejects.toThrow('Search unavailable');
  });
});
