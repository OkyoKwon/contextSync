import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { searchApi } from '../search.api';
import { api } from '../client';

describe('searchApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('search encodes query and includes params', async () => {
    await searchApi.search('proj-1', 'hello world', 'session', 2);
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('/projects/proj-1/search?');
    expect(callArg).toContain('q=hello%20world');
    expect(callArg).toContain('type=session');
    expect(callArg).toContain('page=2');
  });

  it('search uses defaults for type and page', async () => {
    await searchApi.search('proj-1', 'test');
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('type=all');
    expect(callArg).toContain('page=1');
  });
});
