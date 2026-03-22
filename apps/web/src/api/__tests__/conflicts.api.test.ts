import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    patch: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { conflictsApi } from '../conflicts.api';
import { api } from '../client';

describe('conflictsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list builds query string from filter', async () => {
    await conflictsApi.list('proj-1', { severity: 'high' } as any);
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('/projects/proj-1/conflicts?');
    expect(callArg).toContain('severity=high');
  });

  it('list without filter has no query string', async () => {
    await conflictsApi.list('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/conflicts');
  });

  it('get calls GET /conflicts/:id', async () => {
    await conflictsApi.get('conflict-1');
    expect(api.get).toHaveBeenCalledWith('/conflicts/conflict-1');
  });

  it('update calls PATCH /conflicts/:id', async () => {
    await conflictsApi.update('conflict-1', { status: 'resolved' } as any);
    expect(api.patch).toHaveBeenCalledWith('/conflicts/conflict-1', { status: 'resolved' });
  });

  it('assignReviewer calls PATCH with reviewerId', async () => {
    await conflictsApi.assignReviewer('conflict-1', 'user-1');
    expect(api.patch).toHaveBeenCalledWith('/conflicts/conflict-1/assign', {
      reviewerId: 'user-1',
    });
  });

  it('addReviewNotes calls PATCH with reviewNotes', async () => {
    await conflictsApi.addReviewNotes('conflict-1', 'Looks good');
    expect(api.patch).toHaveBeenCalledWith('/conflicts/conflict-1/review-notes', {
      reviewNotes: 'Looks good',
    });
  });
});
