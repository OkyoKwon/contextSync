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

import { fetchQuotaStatus, triggerPlanDetection } from '../quota.api';

setupMsw();

describe('quota API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('fetchQuotaStatus returns quota data', async () => {
    server.use(
      http.get('/api/auth/me/quota', () =>
        HttpResponse.json({
          success: true,
          data: { used: 10, limit: 100, remaining: 90 },
          error: null,
        }),
      ),
    );

    const result = await fetchQuotaStatus();
    expect(result.data).toEqual({ used: 10, limit: 100, remaining: 90 });
  });

  it('fetchQuotaStatus throws on server error', async () => {
    server.use(
      http.get('/api/auth/me/quota', () =>
        HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
      ),
    );

    await expect(fetchQuotaStatus()).rejects.toThrow('Internal error');
  });

  it('triggerPlanDetection returns detection result', async () => {
    server.use(
      http.post('/api/auth/me/plan/detect', () =>
        HttpResponse.json({
          success: true,
          data: { plan: 'pro', source: 'api' },
          error: null,
        }),
      ),
    );

    const result = await triggerPlanDetection();
    expect(result.data).toEqual({ plan: 'pro', source: 'api' });
  });

  it('triggerPlanDetection throws on server error', async () => {
    server.use(
      http.post('/api/auth/me/plan/detect', () =>
        HttpResponse.json({ error: 'Detection failed' }, { status: 500 }),
      ),
    );

    await expect(triggerPlanDetection()).rejects.toThrow('Detection failed');
  });
});
