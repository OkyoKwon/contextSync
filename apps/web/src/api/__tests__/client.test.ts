import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

// Must mock stores/hooks before importing client
vi.mock('../../stores/auth.store', () => {
  const store = {
    token: null as string | null,
    user: null as any,
    setAuth: vi.fn(),
  };
  return {
    useAuthStore: {
      getState: () => store,
      setState: (partial: any) => Object.assign(store, partial),
      __store: store,
    },
  };
});

vi.mock('../../hooks/use-login-modal', () => {
  const store = { isOpen: false, openLoginModal: vi.fn(), closeLoginModal: vi.fn() };
  return { useLoginModal: { getState: () => store } };
});

vi.mock('../../hooks/use-upgrade-modal', () => {
  const store = { isOpen: false, openUpgradeModal: vi.fn(), closeUpgradeModal: vi.fn() };
  return { useUpgradeModal: { getState: () => store } };
});

import { api } from '../client';
import { useAuthStore } from '../../stores/auth.store';
import { useLoginModal } from '../../hooks/use-login-modal';
import { useUpgradeModal } from '../../hooks/use-upgrade-modal';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  (useAuthStore as any).__store.token = null;
  (useAuthStore as any).__store.user = null;
});
afterAll(() => server.close());

describe('api client', () => {
  it('sends Authorization header when token exists', async () => {
    (useAuthStore as any).__store.token = 'my-token';
    let capturedAuth: string | null = null;
    server.use(
      http.get('/api/test', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: 'ok', error: null });
      }),
    );

    await api.get('/test');
    expect(capturedAuth).toBe('Bearer my-token');
  });

  it('does not send Authorization header when no token', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get('/api/test', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: 'ok', error: null });
      }),
    );

    await api.get('/test');
    expect(capturedAuth).toBeNull();
  });

  it('sets Content-Type for JSON body', async () => {
    let capturedContentType: string | null = null;
    server.use(
      http.post('/api/test', ({ request }) => {
        capturedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await api.post('/test', { key: 'value' });
    expect(capturedContentType).toBe('application/json');
  });

  it('does not set Content-Type for FormData body', async () => {
    let capturedContentType: string | null = null;
    server.use(
      http.post('/api/upload', ({ request }) => {
        capturedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    await api.upload('/upload', file);
    // Browser sets multipart/form-data with boundary automatically
    expect(capturedContentType).not.toBe('application/json');
  });

  it('throws on non-ok response with error body', async () => {
    server.use(
      http.get('/api/fail', () =>
        HttpResponse.json({ error: 'Server error occurred' }, { status: 500 }),
      ),
    );

    await expect(api.get('/fail')).rejects.toThrow('Server error occurred');
  });

  it('throws on success:false response', async () => {
    server.use(
      http.get('/api/soft-fail', () =>
        HttpResponse.json({ success: false, data: null, error: 'Validation failed' }),
      ),
    );

    await expect(api.get('/soft-fail')).rejects.toThrow('Validation failed');
  });

  it('opens login modal on 401 when refresh fails', async () => {
    (useAuthStore as any).__store.token = 'expired-token';
    server.use(
      http.get('/api/protected', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ),
      http.post('/api/auth/refresh', () => HttpResponse.json({ success: false }, { status: 401 })),
    );

    await expect(api.get('/protected')).rejects.toThrow('Session expired');
    expect(useLoginModal.getState().openLoginModal).toHaveBeenCalled();
  });

  it('retries after successful token refresh', async () => {
    (useAuthStore as any).__store.token = 'expired-token';
    (useAuthStore as any).__store.user = { id: 'user-1', name: 'Test' };
    let callCount = 0;
    server.use(
      http.get('/api/protected', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ success: true, data: 'refreshed', error: null });
      }),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ success: true, data: { token: 'new-token' }, error: null }),
      ),
    );

    const result = await api.get('/protected');
    expect(result.data).toBe('refreshed');
    expect(callCount).toBe(2);
  });

  it('opens upgrade modal on 403 with account upgrade message', async () => {
    server.use(
      http.get('/api/premium', () =>
        HttpResponse.json({ error: 'Requires account upgrade' }, { status: 403 }),
      ),
    );

    await expect(api.get('/premium')).rejects.toThrow('account upgrade');
    expect(useUpgradeModal.getState().openUpgradeModal).toHaveBeenCalled();
  });

  it('throws on 403 without upgrade message', async () => {
    server.use(
      http.get('/api/forbidden', () =>
        HttpResponse.json({ error: 'No permission' }, { status: 403 }),
      ),
    );

    await expect(api.get('/forbidden')).rejects.toThrow('No permission');
    expect(useUpgradeModal.getState().openUpgradeModal).not.toHaveBeenCalled();
  });

  it('api.patch sends PATCH method', async () => {
    let capturedMethod: string | null = null;
    server.use(
      http.patch('/api/resource/1', ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await api.patch('/resource/1', { name: 'updated' });
    expect(capturedMethod).toBe('PATCH');
  });

  it('api.put sends PUT method', async () => {
    let capturedMethod: string | null = null;
    server.use(
      http.put('/api/resource/1', ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await api.put('/resource/1', { name: 'replaced' });
    expect(capturedMethod).toBe('PUT');
  });

  it('api.delete sends DELETE method', async () => {
    let capturedMethod: string | null = null;
    server.use(
      http.delete('/api/resource/1', ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await api.delete('/resource/1');
    expect(capturedMethod).toBe('DELETE');
  });
});
