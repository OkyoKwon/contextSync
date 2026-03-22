import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { supabaseOnboardingApi } from '../supabase-onboarding.api';
import { api } from '../client';

describe('supabaseOnboardingApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listProjects calls GET /supabase/projects', async () => {
    await supabaseOnboardingApi.listProjects();
    expect(api.get).toHaveBeenCalledWith('/supabase/projects');
  });

  it('listOrganizations calls GET /supabase/organizations', async () => {
    await supabaseOnboardingApi.listOrganizations();
    expect(api.get).toHaveBeenCalledWith('/supabase/organizations');
  });

  it('autoSetup calls POST /supabase/auto-setup', async () => {
    const input = { projectRef: 'ref-1', region: 'us-east-1' } as any;
    await supabaseOnboardingApi.autoSetup(input);
    expect(api.post).toHaveBeenCalledWith('/supabase/auto-setup', input);
  });

  it('createAndSetup calls POST /supabase/create-and-setup', async () => {
    const input = { name: 'New Project', organizationId: 'org-1' } as any;
    await supabaseOnboardingApi.createAndSetup(input);
    expect(api.post).toHaveBeenCalledWith('/supabase/create-and-setup', input);
  });
});
