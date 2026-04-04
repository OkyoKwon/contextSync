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

import { callWithRetry } from '../../../lib/claude-utils.js';
import {
  translateEvaluationToKorean,
  translateStoredEvaluationToKorean,
  translateStoredEvaluationToEnglish,
} from '../translate-evaluation.js';
import type { EvaluationAnalysisResult } from '../claude-client.js';
import type { StoredEvaluationText } from '../translate-evaluation.js';

const mockCallWithRetry = vi.mocked(callWithRetry);

beforeEach(() => {
  vi.clearAllMocks();
});

const makeAnalysisResult = (): EvaluationAnalysisResult => ({
  dimensions: [
    {
      dimension: 'prompt_quality',
      score: 75,
      confidence: 80,
      summary: 'Good prompt quality',
      strengths: ['Clear instructions', 'Good context'],
      weaknesses: ['Could be more specific'],
      suggestions: ['Add more examples'],
      evidence: [
        {
          excerpt: 'example prompt',
          sentiment: 'positive',
          annotation: 'Well structured prompt',
          messageId: 'msg-1',
          sessionId: 'sess-1',
        },
      ],
    },
  ],
  improvementSummary: 'Overall good, keep improving',
  inputTokens: 100,
  outputTokens: 200,
  modelUsed: 'claude-sonnet',
});

const makeTranslationApiResponse = (json: object) => ({
  content: [
    {
      type: 'text' as const,
      text: `\`\`\`json\n${JSON.stringify(json)}\n\`\`\``,
    },
  ],
  usage: { input_tokens: 50, output_tokens: 60 },
});

describe('translateEvaluationToKorean', () => {
  it('should_return_translated_result_when_api_succeeds', async () => {
    const translated = {
      improvementSummary: '전반적으로 좋습니다',
      dimensions: [
        {
          dimension: 'prompt_quality',
          summary: '좋은 프롬프트 품질',
          strengths: ['명확한 지시', '좋은 맥락'],
          weaknesses: ['더 구체적일 수 있음'],
          suggestions: ['더 많은 예시 추가'],
          evidenceAnnotations: ['잘 구조화된 프롬프트'],
        },
      ],
    };

    mockCallWithRetry.mockResolvedValue(makeTranslationApiResponse(translated) as any);

    const result = await translateEvaluationToKorean('key', 'model', makeAnalysisResult());

    expect(result.improvementSummaryKo).toBe('전반적으로 좋습니다');
    expect(result.dimensions).toHaveLength(1);
    expect(result.dimensions[0]!.summaryKo).toBe('좋은 프롬프트 품질');
    expect(result.dimensions[0]!.strengthsKo).toEqual(['명확한 지시', '좋은 맥락']);
    expect(result.inputTokens).toBe(50);
    expect(result.outputTokens).toBe(60);
  });

  it('should_fallback_to_original_when_translation_dimension_missing', async () => {
    // Return empty dimensions array
    const translated = {
      improvementSummary: '번역된 요약',
      dimensions: [],
    };

    mockCallWithRetry.mockResolvedValue(makeTranslationApiResponse(translated) as any);

    const result = await translateEvaluationToKorean('key', 'model', makeAnalysisResult());

    // Should fallback to originals when translated dimensions are missing
    expect(result.dimensions[0]!.summaryKo).toBe('Good prompt quality');
    expect(result.dimensions[0]!.dimension).toBe('prompt_quality');
  });

  it('should_throw_when_response_is_not_json', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json at all' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    await expect(translateEvaluationToKorean('key', 'model', makeAnalysisResult())).rejects.toThrow(
      'Failed to parse translation response as JSON',
    );
  });

  it('should_parse_json_without_code_fence', async () => {
    const translated = {
      improvementSummary: '번역됨',
      dimensions: [
        {
          summary: '요약',
          strengths: ['강점'],
          weaknesses: ['약점'],
          suggestions: ['제안'],
          evidenceAnnotations: ['주석'],
        },
      ],
    };

    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(translated) }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    const result = await translateEvaluationToKorean('key', 'model', makeAnalysisResult());

    expect(result.improvementSummaryKo).toBe('번역됨');
  });
});

// === StoredEvaluation translation tests ===

const makeStoredEvaluation = (): StoredEvaluationText => ({
  improvementSummary: 'Keep improving',
  dimensions: [
    {
      dimensionId: 'dim-1',
      dimension: 'prompt_quality',
      summary: 'Good quality',
      strengths: ['Clear'],
      weaknesses: ['Vague'],
      suggestions: ['Be specific'],
      evidenceAnnotations: ['Well done'],
    },
  ],
});

describe('translateStoredEvaluationToKorean', () => {
  it('should_translate_stored_evaluation_to_korean', async () => {
    const translated = {
      improvementSummary: '계속 개선하세요',
      dimensions: [
        {
          summary: '좋은 품질',
          strengths: ['명확함'],
          weaknesses: ['모호함'],
          suggestions: ['구체적으로'],
          evidenceAnnotations: ['잘했습니다'],
        },
      ],
    };

    mockCallWithRetry.mockResolvedValue(makeTranslationApiResponse(translated) as any);

    const result = await translateStoredEvaluationToKorean('key', 'model', makeStoredEvaluation());

    expect(result.translatedImprovementSummary).toBe('계속 개선하세요');
    expect(result.dimensions[0]!.translatedSummary).toBe('좋은 품질');
    expect(result.dimensions[0]!.dimensionId).toBe('dim-1');
    expect(result.inputTokens).toBe(50);
  });

  it('should_fallback_to_source_when_translation_missing', async () => {
    mockCallWithRetry.mockResolvedValue(makeTranslationApiResponse({ dimensions: [] }) as any);

    const result = await translateStoredEvaluationToKorean('key', 'model', makeStoredEvaluation());

    // Falls back to original values
    expect(result.translatedImprovementSummary).toBe('Keep improving');
    expect(result.dimensions[0]!.translatedSummary).toBe('Good quality');
  });
});

describe('translateStoredEvaluationToEnglish', () => {
  it('should_translate_stored_evaluation_to_english', async () => {
    const koreanSource: StoredEvaluationText = {
      improvementSummary: '개선 요약',
      dimensions: [
        {
          dimensionId: 'dim-1',
          dimension: 'prompt_quality',
          summary: '좋은 품질',
          strengths: ['명확'],
          weaknesses: ['모호'],
          suggestions: ['구체적'],
          evidenceAnnotations: ['잘함'],
        },
      ],
    };

    const translated = {
      improvementSummary: 'Improvement summary',
      dimensions: [
        {
          summary: 'Good quality',
          strengths: ['Clear'],
          weaknesses: ['Vague'],
          suggestions: ['Specific'],
          evidenceAnnotations: ['Well done'],
        },
      ],
    };

    mockCallWithRetry.mockResolvedValue(makeTranslationApiResponse(translated) as any);

    const result = await translateStoredEvaluationToEnglish('key', 'model', koreanSource);

    expect(result.translatedImprovementSummary).toBe('Improvement summary');
    expect(result.dimensions[0]!.translatedSummary).toBe('Good quality');
  });

  it('should_throw_when_json_parsing_fails', async () => {
    mockCallWithRetry.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n{invalid json}\n```' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    } as any);

    await expect(
      translateStoredEvaluationToEnglish('key', 'model', makeStoredEvaluation()),
    ).rejects.toThrow('Failed to parse translation response as JSON');
  });
});
