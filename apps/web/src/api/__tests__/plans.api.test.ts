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

import { plansApi } from '../plans.api';

setupMsw();

describe('plansApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('list returns plan summaries', async () => {
    const plans = [{ filename: 'plan1.md', title: 'Plan 1' }];
    server.use(
      http.get('/api/plans/local', () =>
        HttpResponse.json({ success: true, data: plans, error: null }),
      ),
    );

    const result = await plansApi.list();
    expect(result.data).toEqual(plans);
  });

  it('get encodes filename and returns plan detail', async () => {
    const plan = { filename: 'my plan.md', title: 'My Plan', content: '# My Plan' };
    server.use(
      http.get('/api/plans/local/:filename', ({ request }) => {
        const url = new URL(request.url);
        expect(url.pathname).toBe('/api/plans/local/my%20plan.md');
        return HttpResponse.json({ success: true, data: plan, error: null });
      }),
    );

    const result = await plansApi.get('my plan.md');
    expect(result.data).toEqual(plan);
  });

  it('delete encodes filename and returns success', async () => {
    server.use(
      http.delete('/api/plans/local/:filename', ({ request }) => {
        const url = new URL(request.url);
        expect(url.pathname).toBe('/api/plans/local/my%20plan.md');
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const result = await plansApi.delete('my plan.md');
    expect(result.success).toBe(true);
  });

  it('list throws on server error', async () => {
    server.use(
      http.get('/api/plans/local', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    await expect(plansApi.list()).rejects.toThrow('Not found');
  });

  it('get throws on server error', async () => {
    server.use(
      http.get('/api/plans/local/:filename', () =>
        HttpResponse.json({ error: 'Plan not found' }, { status: 404 }),
      ),
    );

    await expect(plansApi.get('missing.md')).rejects.toThrow('Plan not found');
  });
});
