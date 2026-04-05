import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('../../../lib/claude-utils.js', () => ({
  callWithRetry: vi.fn(),
}));

vi.mock('../perspective-prompts.js', () => ({
  getSystemPrompt: vi.fn().mockReturnValue('system-prompt'),
}));

import { callWithRetry } from '../../../lib/claude-utils.js';
import { analyzeEvaluation } from '../claude-client.js';
import type { SampledMessage } from '../claude-client.js';

const mockCallWithRetry = vi.mocked(callWithRetry);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMessage(id: string, sessionId: string, content: string): SampledMessage {
  return { id, sessionId, content, createdAt: '2025-01-01T00:00:00Z' };
}

const makeValidApiResponse = (dimensions: object[], improvementSummary = 'Keep improving') => ({
  content: [
    {
      type: 'text' as const,
      text: `\`\`\`json\n${JSON.stringify({ dimensions, improvementSummary })}\n\`\`\``,
    },
  ],
  usage: { input_tokens: 100, output_tokens: 200 },
});

describe('analyzeEvaluation', () => {
  const messages: SampledMessage[] = [
    makeMessage('msg-1', 'sess-1', 'How do I implement a REST API?'),
    makeMessage('msg-2', 'sess-1', 'Can you refactor this function?'),
  ];

  it('should_return_evaluation_result_when_api_succeeds', async () => {
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 75,
        confidence: 80,
        summary: 'Good prompts',
        strengths: ['Clear'],
        weaknesses: ['Could add context'],
        suggestions: ['Use examples'],
        evidence: [
          {
            excerpt: 'How do I implement',
            sentiment: 'positive',
            annotation: 'Clear question',
          },
        ],
      },
      {
        dimension: 'task_complexity',
        score: 60,
        confidence: 70,
        summary: 'Moderate tasks',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
      {
        dimension: 'iteration_pattern',
        score: 50,
        confidence: 65,
        summary: 'Basic iteration',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
      {
        dimension: 'context_utilization',
        score: 55,
        confidence: 60,
        summary: 'Some context use',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
      {
        dimension: 'ai_capability_leverage',
        score: 45,
        confidence: 55,
        summary: 'Basic usage',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    expect(result.dimensions).toHaveLength(5);
    expect(result.dimensions[0]!.dimension).toBe('prompt_quality');
    expect(result.dimensions[0]!.score).toBe(75);
    expect(result.improvementSummary).toBe('Keep improving');
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(200);
    expect(result.modelUsed).toBe('model');
  });

  it('should_clamp_score_to_0_100_range', async () => {
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 150,
        confidence: -10,
        summary: 'test',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    const pq = result.dimensions.find((d) => d.dimension === 'prompt_quality');
    expect(pq!.score).toBe(100);
    expect(pq!.confidence).toBe(0);
  });

  it('should_fill_missing_dimensions_with_defaults', async () => {
    // Only provide 1 of 5 expected claude dimensions
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 70,
        confidence: 80,
        summary: 'Good',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    // Should have all 5 claude dimensions
    expect(result.dimensions.length).toBe(5);
    const missing = result.dimensions.find((d) => d.dimension === 'task_complexity');
    expect(missing).toBeDefined();
    expect(missing!.score).toBe(0);
    expect(missing!.summary).toBe('Insufficient data for evaluation');
  });

  it('should_throw_when_response_is_not_json', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not JSON' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    await expect(analyzeEvaluation('key', 'model', messages, 1, 'claude')).rejects.toThrow(
      'Failed to parse evaluation response as JSON',
    );
  });

  it('should_throw_when_dimensions_array_missing', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ improvementSummary: 'test' }) }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    await expect(analyzeEvaluation('key', 'model', messages, 1, 'claude')).rejects.toThrow(
      'Evaluation response missing "dimensions" array',
    );
  });

  it('should_match_evidence_excerpts_to_messages', async () => {
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 70,
        confidence: 80,
        summary: 'Good',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [
          {
            excerpt: 'How do I implement a REST API?',
            sentiment: 'positive',
            annotation: 'Clear technical question',
          },
        ],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    const ev = result.dimensions.find((d) => d.dimension === 'prompt_quality')!.evidence[0]!;
    expect(ev.messageId).toBe('msg-1');
    expect(ev.sessionId).toBe('sess-1');
  });

  it('should_set_null_messageId_when_excerpt_not_matched', async () => {
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 70,
        confidence: 80,
        summary: 'Good',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [
          {
            excerpt: 'This text does not exist in any message',
            sentiment: 'neutral',
            annotation: 'Unknown',
          },
        ],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    const ev = result.dimensions.find((d) => d.dimension === 'prompt_quality')!.evidence[0]!;
    expect(ev.messageId).toBeNull();
    expect(ev.sessionId).toBeNull();
  });

  it('should_validate_sentiment_to_known_values', async () => {
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 50,
        confidence: 50,
        summary: 'Test',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [{ excerpt: 'test', sentiment: 'invalid_sentiment', annotation: 'test' }],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    const ev = result.dimensions.find((d) => d.dimension === 'prompt_quality')!.evidence[0]!;
    expect(ev.sentiment).toBe('neutral'); // fallback
  });

  it('should_use_chatgpt_perspective_dimensions', async () => {
    const dimensions = [
      {
        dimension: 'problem_framing',
        score: 80,
        confidence: 90,
        summary: 'Good framing',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'chatgpt');

    // chatgpt has 7 dimensions; only 1 provided, so 6 more are filled
    expect(result.dimensions.length).toBe(7);
    expect(result.dimensions[0]!.dimension).toBe('problem_framing');
  });

  it('should_handle_json_without_code_fence', async () => {
    const rawJson = JSON.stringify({
      dimensions: [
        {
          dimension: 'prompt_quality',
          score: 60,
          confidence: 70,
          summary: 'OK',
          strengths: [],
          weaknesses: [],
          suggestions: [],
          evidence: [],
        },
      ],
      improvementSummary: 'Improvement needed',
    });

    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: rawJson }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    expect(result.improvementSummary).toBe('Improvement needed');
  });

  it('should_truncate_long_evidence_excerpts_to_200_chars', async () => {
    const longExcerpt = 'x'.repeat(300);
    const dimensions = [
      {
        dimension: 'prompt_quality',
        score: 50,
        confidence: 50,
        summary: 'Test',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [{ excerpt: longExcerpt, sentiment: 'positive', annotation: 'test' }],
      },
    ];

    mockCallWithRetry.mockResolvedValue(makeValidApiResponse(dimensions) as any);

    const result = await analyzeEvaluation('key', 'model', messages, 1, 'claude');

    const ev = result.dimensions.find((d) => d.dimension === 'prompt_quality')!.evidence[0]!;
    expect(ev.excerpt.length).toBe(200);
  });
});
