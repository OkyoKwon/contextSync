import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { aiEvaluationApi } from '../ai-evaluation.api';
import { api } from '../client';

describe('aiEvaluationApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('triggerEvaluation calls POST with input', async () => {
    const input = { targetUserId: 'u1' } as any;
    await aiEvaluationApi.triggerEvaluation('proj-1', input);
    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/ai-evaluation/evaluate', input);
  });

  it('getLatestEvaluation builds query params', async () => {
    await aiEvaluationApi.getLatestEvaluation('proj-1', 'user-1');
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('targetUserId=user-1');
  });

  it('getEvaluationHistory builds query params', async () => {
    await aiEvaluationApi.getEvaluationHistory('proj-1', 'user-1', 2, 10);
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('targetUserId=user-1');
    expect(callArg).toContain('page=2');
    expect(callArg).toContain('limit=10');
  });

  it('getEvaluationDetail calls GET', async () => {
    await aiEvaluationApi.getEvaluationDetail('proj-1', 'eval-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/ai-evaluation/eval-1');
  });

  it('getTeamSummary calls GET', async () => {
    await aiEvaluationApi.getTeamSummary('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/ai-evaluation/summary');
  });
});
