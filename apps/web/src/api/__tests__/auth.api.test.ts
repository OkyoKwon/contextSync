import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    put: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { authApi } from '../auth.api';
import { api } from '../client';

describe('authApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getMe calls GET /auth/me', async () => {
    await authApi.getMe();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('login calls POST /auth/login with credentials', async () => {
    await authApi.login('John', 'john@test.com');
    expect(api.post).toHaveBeenCalledWith('/auth/login', { name: 'John', email: 'john@test.com' });
  });

  it('identify calls POST /auth/identify with name', async () => {
    await authApi.identify('Alice');
    expect(api.post).toHaveBeenCalledWith('/auth/identify', { name: 'Alice' });
  });

  it('identifySelect calls POST /auth/identify/select with userId', async () => {
    await authApi.identifySelect('user-123');
    expect(api.post).toHaveBeenCalledWith('/auth/identify/select', { userId: 'user-123' });
  });

  it('refresh calls POST /auth/refresh', async () => {
    await authApi.refresh();
    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
  });

  it('updatePlan calls PUT /auth/me/plan', async () => {
    await authApi.updatePlan('pro');
    expect(api.put).toHaveBeenCalledWith('/auth/me/plan', { claudePlan: 'pro' });
  });

  it('updateApiKey calls PUT /auth/me/api-key', async () => {
    await authApi.updateApiKey('sk-test');
    expect(api.put).toHaveBeenCalledWith('/auth/me/api-key', { apiKey: 'sk-test' });
  });

  it('deleteApiKey calls DELETE /auth/me/api-key', async () => {
    await authApi.deleteApiKey();
    expect(api.delete).toHaveBeenCalledWith('/auth/me/api-key');
  });

  it('saveSupabaseToken calls PUT /auth/me/supabase-token', async () => {
    await authApi.saveSupabaseToken('sb-token');
    expect(api.put).toHaveBeenCalledWith('/auth/me/supabase-token', { token: 'sb-token' });
  });

  it('deleteSupabaseToken calls DELETE /auth/me/supabase-token', async () => {
    await authApi.deleteSupabaseToken();
    expect(api.delete).toHaveBeenCalledWith('/auth/me/supabase-token');
  });
});
