import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../lib/claude-utils.js', () => ({
  callWithRetry: vi.fn(),
}));

import { callWithRetry } from '../../../lib/claude-utils.js';
import { analyzePrd } from '../claude-client.js';

const mockCallWithRetry = vi.mocked(callWithRetry);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analyzePrd', () => {
  it('should parse valid AI response', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            requirements: [
              {
                requirementText: 'Auth',
                category: 'Security',
                status: 'achieved',
                confidence: 95,
                evidence: 'JWT implemented',
                filePaths: ['auth.ts'],
              },
              {
                requirementText: 'Dashboard',
                category: 'UI',
                status: 'partial',
                confidence: 60,
                evidence: 'Basic layout',
                filePaths: ['dashboard.tsx'],
              },
            ],
            overallRate: 72.5,
          }),
        },
      ],
      usage: { input_tokens: 2000, output_tokens: 800 },
      model: 'claude-3',
    } as any);

    const result = await analyzePrd('key', 'model', '# PRD content', {
      totalFiles: 20,
      files: [{ path: 'src/a.ts', content: 'code' }],
    } as any);

    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0]!.status).toBe('achieved');
    expect(result.overallRate).toBe(72.5);
    expect(result.inputTokens).toBe(2000);
    expect(result.modelUsed).toBe('model');
  });

  it('should handle JSON with code fences', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n{"requirements":[],"overallRate":0}\n```' }],
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-3',
    } as any);

    const result = await analyzePrd('key', 'model', 'PRD', { totalFiles: 0, files: [] } as any);
    expect(result.requirements).toEqual([]);
    expect(result.overallRate).toBe(0);
  });

  it('should clamp overallRate to 0-100', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            requirements: [],
            overallRate: 150,
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-3',
    } as any);

    const result = await analyzePrd('key', 'model', 'PRD', { totalFiles: 0, files: [] } as any);
    expect(result.overallRate).toBeLessThanOrEqual(100);
  });
});
