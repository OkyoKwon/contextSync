import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally for supabaseFetch tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../../auth/auth.service.js', () => ({
  getSupabaseToken: vi.fn(),
}));

vi.mock('../../../lib/test-connection.js', () => ({
  testConnection: vi.fn(),
}));

vi.mock('../../setup/setup.service.js', () => ({
  switchToRemote: vi.fn(),
}));

import {
  listProjects,
  listOrganizations,
  buildConnectionUrl,
  resolveConnectionErrorMessage,
  resolveSupabaseErrorMessage,
} from '../supabase-onboarding.service.js';
import { AppError } from '../../../plugins/error-handler.plugin.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listProjects', () => {
  it('should return mapped projects', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve([
          {
            id: '1',
            ref: 'proj-ref',
            name: 'My Project',
            region: 'us-east-1',
            status: 'ACTIVE_HEALTHY',
            created_at: '2025-01-01',
            organization_id: 'org-1',
          },
        ]),
    });

    const result = await listProjects('token-123');

    expect(result).toHaveLength(1);
    expect(result[0].ref).toBe('proj-ref');
    expect(result[0].name).toBe('My Project');
  });

  it('should throw AppError on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(listProjects('bad-token')).rejects.toThrow(AppError);
  });

  it('should throw AppError on 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    });

    await expect(listProjects('token')).rejects.toThrow(AppError);
  });

  it('should throw AppError on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(listProjects('token')).rejects.toThrow(AppError);
  });
});

describe('listOrganizations', () => {
  it('should return mapped organizations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 'org-1', name: 'My Org' }]),
    });

    const result = await listOrganizations('token-123');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('org-1');
    expect(result[0].name).toBe('My Org');
  });
});

describe('buildConnectionUrl', () => {
  it('should build valid connection URL', () => {
    const url = buildConnectionUrl('abc123', 'mypassword', 'us-east-1');

    expect(url).toContain('postgres.abc123');
    expect(url).toContain('mypassword');
    expect(url).toContain('aws-0-us-east-1');
    expect(url).toContain('pooler.supabase.com');
  });

  it('should encode special characters in password', () => {
    const url = buildConnectionUrl('ref', 'p@ss/w0rd#!', 'eu-west-1');

    expect(url).not.toContain('p@ss/w0rd#!');
    expect(url).toContain(encodeURIComponent('p@ss/w0rd#!'));
  });
});

describe('resolveConnectionErrorMessage', () => {
  it('should resolve ECONNREFUSED', () => {
    const msg = resolveConnectionErrorMessage('ECONNREFUSED 127.0.0.1:5432');
    expect(msg).toContain('reach the Supabase database');
  });

  it('should resolve password authentication failed', () => {
    const msg = resolveConnectionErrorMessage('password authentication failed for user');
    expect(msg).toContain('Incorrect database password');
  });

  it('should resolve tenant or user not found', () => {
    const msg = resolveConnectionErrorMessage('tenant or user not found');
    expect(msg).toContain('database password');
  });

  it('should fallback for unknown errors', () => {
    const msg = resolveConnectionErrorMessage('something unknown happened');
    expect(msg).toContain('something unknown happened');
  });
});

describe('resolveSupabaseErrorMessage', () => {
  it('should resolve tenant not found', () => {
    const msg = resolveSupabaseErrorMessage('tenant or user not found');
    expect(msg).toContain('access token');
  });

  it('should resolve project not found', () => {
    const msg = resolveSupabaseErrorMessage('project abc-123 not found');
    expect(msg).toContain('project could not be found');
  });

  it('should passthrough unknown messages', () => {
    const msg = resolveSupabaseErrorMessage('some other error');
    expect(msg).toBe('some other error');
  });
});
