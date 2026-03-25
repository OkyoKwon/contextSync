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

import { authApi } from '../auth.api';

setupMsw();

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('getMe returns user data', async () => {
    const user = { id: 'u1', name: 'Alice', email: 'alice@test.com' };
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ success: true, data: user, error: null })),
    );

    const result = await authApi.getMe();
    expect(result.data?.name).toBe('Alice');
  });

  it('login sends name and email', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { token: 'new-token', user: { id: 'u1', name: 'John' } },
          error: null,
        });
      }),
    );

    const result = await authApi.login('John', 'john@test.com');
    expect(capturedBody).toEqual({ name: 'John', email: 'john@test.com' });
    expect(result.data?.token).toBe('new-token');
  });

  it('identify sends name', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/auth/identify', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { token: 'tok', user: { id: 'u1', name: 'Alice' } },
          error: null,
        });
      }),
    );

    await authApi.identify('Alice');
    expect(capturedBody).toEqual({ name: 'Alice' });
  });

  it('identify returns needsSelection for multiple users', async () => {
    server.use(
      http.post('/api/auth/identify', () =>
        HttpResponse.json({
          success: true,
          data: { users: [{ id: 'u1' }, { id: 'u2' }], needsSelection: true },
          error: null,
        }),
      ),
    );

    const result = await authApi.identify('Alice');
    expect(result.data).toHaveProperty('needsSelection', true);
  });

  it('identifySelect sends userId', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/auth/identify/select', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { token: 'tok', user: { id: 'u1', name: 'Alice' } },
          error: null,
        });
      }),
    );

    await authApi.identifySelect('user-123');
    expect(capturedBody).toEqual({ userId: 'user-123' });
  });

  it('refresh calls POST /auth/refresh', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ success: true, data: { token: 'refreshed' }, error: null }),
      ),
    );

    const result = await authApi.refresh();
    expect(result.data?.token).toBe('refreshed');
  });

  it('updatePlan sends claudePlan via PUT', async () => {
    let capturedBody: any = null;
    server.use(
      http.put('/api/auth/me/plan', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'u1', claudePlan: 'pro' },
          error: null,
        });
      }),
    );

    await authApi.updatePlan('pro');
    expect(capturedBody).toEqual({ claudePlan: 'pro' });
  });

  it('updateApiKey sends apiKey via PUT', async () => {
    let capturedBody: any = null;
    server.use(
      http.put('/api/auth/me/api-key', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'u1' }, error: null });
      }),
    );

    await authApi.updateApiKey('sk-test');
    expect(capturedBody).toEqual({ apiKey: 'sk-test' });
  });

  it('deleteApiKey sends DELETE', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/auth/me/api-key', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: { id: 'u1' }, error: null });
      }),
    );

    await authApi.deleteApiKey();
    expect(wasCalled).toBe(true);
  });

  it('saveSupabaseToken sends PUT with token', async () => {
    let capturedBody: any = null;
    server.use(
      http.put('/api/auth/me/supabase-token', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: { id: 'u1' }, error: null });
      }),
    );

    await authApi.saveSupabaseToken('sb-token');
    expect(capturedBody).toEqual({ token: 'sb-token' });
  });

  it('deleteSupabaseToken sends DELETE', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/auth/me/supabase-token', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: { id: 'u1' }, error: null });
      }),
    );

    await authApi.deleteSupabaseToken();
    expect(wasCalled).toBe(true);
  });

  it('throws on server error', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ error: 'Server error' }, { status: 500 })),
    );

    await expect(authApi.getMe()).rejects.toThrow('Server error');
  });
});
