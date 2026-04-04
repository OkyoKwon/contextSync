import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../lib/claude-utils.js', () => ({
  callWithRetry: vi.fn(),
}));

import { callWithRetry } from '../../../lib/claude-utils.js';
import {
  analyzeConflict,
  analyzeConflictOverview,
  sampleSessionMessages,
} from '../conflict-ai-analyzer.js';

const mockCallWithRetry = vi.mocked(callWithRetry);

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_SESSION = {
  id: 'sess-1',
  projectId: 'proj-1',
  userId: 'user-1',
  title: 'Session',
  source: 'manual',
  status: 'active',
  filePaths: ['src/index.ts'],
  moduleNames: [],
  branch: null,
  tags: [],
  metadata: {},
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_MESSAGE = {
  id: 'msg-1',
  sessionId: 'sess-1',
  role: 'user',
  content: 'Fix bug',
  contentType: 'prompt',
  tokensUsed: 100,
  modelUsed: 'claude-3',
  sortOrder: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_CONFLICT = {
  id: 'c-1',
  projectId: 'proj-1',
  sessionAId: 'sess-1',
  sessionBId: 'sess-2',
  conflictType: 'file_overlap',
  severity: 'medium',
  status: 'detected',
  description: 'Overlap',
  overlappingPaths: ['src/index.ts'],
};

describe('analyzeConflict', () => {
  it('should parse valid AI response', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            verdict: 'real_conflict',
            confidence: 85,
            overlapType: 'same_function',
            summary: 'Both sessions modify the same file',
            riskAreas: ['data loss'],
            recommendation: 'coordinate',
            recommendationDetail: 'Coordinate changes',
          }),
        },
      ],
      usage: { input_tokens: 500, output_tokens: 200 },
      model: 'claude-3',
    } as any);

    const result = await analyzeConflict(
      'key',
      'model',
      MOCK_SESSION as any,
      [MOCK_MESSAGE] as any,
      { ...MOCK_SESSION, id: 'sess-2' } as any,
      [MOCK_MESSAGE] as any,
      MOCK_CONFLICT as any,
    );

    expect(result.verdict).toBe('real_conflict');
    expect(result.confidence).toBe(85);
    expect(result.inputTokens).toBe(500);
  });

  it('should handle invalid verdict by defaulting', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            verdict: 'invalid_value',
            confidence: 50,
            overlapType: 'invalid',
            summary: 'Unknown',
            riskAreas: [],
            recommendation: 'invalid',
            recommendationDetail: 'N/A',
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-3',
    } as any);

    const result = await analyzeConflict(
      'key',
      'model',
      MOCK_SESSION as any,
      [MOCK_MESSAGE] as any,
      { ...MOCK_SESSION, id: 'sess-2' } as any,
      [MOCK_MESSAGE] as any,
      MOCK_CONFLICT as any,
    );

    // Should use fallback values for invalid enums
    expect(result.verdict).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });
});

describe('sampleSessionMessages', () => {
  it('should return all messages when under limit', () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      ...MOCK_MESSAGE,
      id: `msg-${i}`,
      content: `Message ${i}`,
    }));
    const result = sampleSessionMessages(messages as any);
    expect(result).toHaveLength(5);
  });

  it('should sample first and last when over limit', () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      ...MOCK_MESSAGE,
      id: `msg-${i}`,
      content: `Message ${i}`,
    }));
    const result = sampleSessionMessages(messages as any);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should truncate long message content', () => {
    const messages = [
      {
        ...MOCK_MESSAGE,
        content: 'x'.repeat(5000),
      },
    ];
    const result = sampleSessionMessages(messages as any);
    expect(result[0].content.length).toBeLessThan(5000);
    expect(result[0].content).toContain('[truncated]');
  });
});

describe('analyzeConflictOverview', () => {
  it('should parse overview response', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            riskLevel: 'high',
            summary: 'Overview summary',
            hotspotFiles: ['src/index.ts'],
            recommendations: ['Coordinate team meetings'],
          }),
        },
      ],
      usage: { input_tokens: 300, output_tokens: 150 },
      model: 'claude-3',
    } as any);

    const result = await analyzeConflictOverview('key', 'model', [
      { ...MOCK_CONFLICT, aiVerdict: 'real_conflict' },
    ] as any);

    expect(result.summary).toBe('Overview summary');
    expect(result.riskLevel).toBe('high');
  });
});
