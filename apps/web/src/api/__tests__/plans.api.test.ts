import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { plansApi } from '../plans.api';
import { api } from '../client';

describe('plansApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list calls GET /plans/local', async () => {
    await plansApi.list();
    expect(api.get).toHaveBeenCalledWith('/plans/local');
  });

  it('get encodes filename', async () => {
    await plansApi.get('my plan.md');
    expect(api.get).toHaveBeenCalledWith('/plans/local/my%20plan.md');
  });

  it('delete encodes filename', async () => {
    await plansApi.delete('my plan.md');
    expect(api.delete).toHaveBeenCalledWith('/plans/local/my%20plan.md');
  });
});
