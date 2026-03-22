import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { adminApi } from '../admin.api';
import { api } from '../client';

describe('adminApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getStatus calls GET /admin/status', async () => {
    await adminApi.getStatus();
    expect(api.get).toHaveBeenCalledWith('/admin/status');
  });

  it('runMigrations calls POST /admin/migrations/run', async () => {
    await adminApi.runMigrations();
    expect(api.post).toHaveBeenCalledWith('/admin/migrations/run');
  });

  it('getConfig calls GET /admin/config', async () => {
    await adminApi.getConfig();
    expect(api.get).toHaveBeenCalledWith('/admin/config');
  });
});
