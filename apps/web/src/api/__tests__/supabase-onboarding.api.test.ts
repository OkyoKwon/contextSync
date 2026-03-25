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

import { supabaseOnboardingApi } from '../supabase-onboarding.api';

setupMsw();

describe('supabaseOnboardingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('listProjects returns project list', async () => {
    const projects = [{ id: 'p1', name: 'Project 1', region: 'us-east-1' }];
    server.use(
      http.get('/api/supabase/projects', () =>
        HttpResponse.json({ success: true, data: projects, error: null }),
      ),
    );

    const result = await supabaseOnboardingApi.listProjects();
    expect(result.data).toEqual(projects);
  });

  it('listOrganizations returns organization list', async () => {
    const orgs = [{ id: 'org-1', name: 'My Org' }];
    server.use(
      http.get('/api/supabase/organizations', () =>
        HttpResponse.json({ success: true, data: orgs, error: null }),
      ),
    );

    const result = await supabaseOnboardingApi.listOrganizations();
    expect(result.data).toEqual(orgs);
  });

  it('autoSetup sends input and returns result', async () => {
    const setupResult = { requiresRestart: true, migrationsApplied: ['001'] };
    server.use(
      http.post('/api/supabase/auto-setup', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ projectRef: 'ref-1', region: 'us-east-1' });
        return HttpResponse.json({ success: true, data: setupResult, error: null });
      }),
    );

    const result = await supabaseOnboardingApi.autoSetup({
      projectRef: 'ref-1',
      region: 'us-east-1',
    } as any);
    expect(result.data).toEqual(setupResult);
  });

  it('createAndSetup sends input and returns result', async () => {
    const setupResult = { requiresRestart: false, migrationsApplied: [] };
    server.use(
      http.post('/api/supabase/create-and-setup', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ name: 'New Project', organizationId: 'org-1' });
        return HttpResponse.json({ success: true, data: setupResult, error: null });
      }),
    );

    const result = await supabaseOnboardingApi.createAndSetup({
      name: 'New Project',
      organizationId: 'org-1',
    } as any);
    expect(result.data).toEqual(setupResult);
  });

  it('autoSetup throws on server error', async () => {
    server.use(
      http.post('/api/supabase/auto-setup', () =>
        HttpResponse.json({ error: 'Setup failed' }, { status: 500 }),
      ),
    );

    await expect(
      supabaseOnboardingApi.autoSetup({ projectRef: 'ref-1', region: 'us-east-1' } as any),
    ).rejects.toThrow('Setup failed');
  });
});
