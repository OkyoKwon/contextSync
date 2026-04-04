import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../learning-guide.repository.js', () => ({
  failStuckLearningGuides: vi.fn(),
  createLearningGuide: vi.fn(),
  updateLearningGuide: vi.fn(),
  createLearningSteps: vi.fn(),
  createLearningResources: vi.fn(),
  findLearningGuideByGroupId: vi.fn(),
  deleteLearningGuidesByGroupId: vi.fn(),
  updateStepTranslations: vi.fn(),
  updateResourceTranslations: vi.fn(),
}));

vi.mock('../ai-evaluation.repository.js', () => ({
  findEvaluationGroup: vi.fn(),
}));

vi.mock('../translate-learning-guide.js', () => ({
  translateLearningGuideToKorean: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('../../../lib/claude-utils.js', () => ({
  callWithRetry: vi.fn(),
  toAppError: vi.fn((err: unknown) => (err instanceof Error ? err : new Error(String(err)))),
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../learning-guide-prompts.js', () => ({
  LEARNING_GUIDE_SYSTEM_PROMPT: 'system-prompt',
  buildLearningGuideUserMessage: vi.fn().mockReturnValue('user-message'),
}));

import * as guideRepo from '../learning-guide.repository.js';
import * as evalRepo from '../ai-evaluation.repository.js';
import { translateLearningGuideToKorean } from '../translate-learning-guide.js';
import { callWithRetry } from '../../../lib/claude-utils.js';
import {
  generateLearningGuide,
  getLearningGuide,
  regenerateLearningGuide,
} from '../learning-guide.service.js';

const mockFailStuck = vi.mocked(guideRepo.failStuckLearningGuides);
const mockFindGroup = vi.mocked(evalRepo.findEvaluationGroup);
const mockCreateGuide = vi.mocked(guideRepo.createLearningGuide);
const mockUpdateGuide = vi.mocked(guideRepo.updateLearningGuide);
const mockCreateSteps = vi.mocked(guideRepo.createLearningSteps);
const mockCreateResources = vi.mocked(guideRepo.createLearningResources);
const mockFindGuideByGroup = vi.mocked(guideRepo.findLearningGuideByGroupId);
const mockDeleteGuides = vi.mocked(guideRepo.deleteLearningGuidesByGroupId);
const mockUpdateStepTranslations = vi.mocked(guideRepo.updateStepTranslations);
const mockUpdateResourceTranslations = vi.mocked(guideRepo.updateResourceTranslations);
const mockTranslate = vi.mocked(translateLearningGuideToKorean);
const mockCallWithRetry = vi.mocked(callWithRetry);

const db = {} as any;

const makeGroupResult = (completedCount: number) => ({
  id: 'group-1',
  claude:
    completedCount >= 1
      ? { id: 'eval-1', status: 'completed' as const }
      : { id: 'eval-1', status: 'pending' as const },
  chatgpt: completedCount >= 2 ? { id: 'eval-2', status: 'completed' as const } : null,
  gemini: completedCount >= 3 ? { id: 'eval-3', status: 'completed' as const } : null,
});

const makeAIResponse = () => ({
  content: [
    {
      type: 'text' as const,
      text: JSON.stringify({
        currentTierSummary: 'You are at developing level',
        nextTierGoal: 'Aim for proficient',
        priorityAreas: ['prompt_quality', 'task_complexity'],
        steps: [
          {
            stepNumber: 1,
            title: 'Step 1',
            objective: 'Learn basics',
            targetDimensions: ['prompt_quality'],
            keyActions: ['Practice daily'],
            practicePrompt: 'Try this prompt',
            resources: [
              {
                title: 'Resource 1',
                url: 'https://example.com',
                type: 'article',
                level: 'beginner',
                description: 'A good resource',
                estimatedMinutes: 30,
              },
            ],
          },
        ],
      }),
    },
  ],
  usage: { input_tokens: 100, output_tokens: 200 },
});

const makeSavedGuide = () => ({
  id: 'guide-1',
  evaluationGroupId: 'group-1',
  targetUserId: 'user-1',
  status: 'completed' as const,
  currentTierSummary: 'summary',
  currentTierSummaryKo: null,
  nextTierGoal: 'goal',
  nextTierGoalKo: null,
  priorityAreas: ['prompt_quality'],
  steps: [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'Step 1',
      titleKo: null,
      objective: 'Learn basics',
      objectiveKo: null,
      targetDimensions: ['prompt_quality'],
      keyActions: ['Practice daily'],
      keyActionsKo: null,
      practicePrompt: 'Try this',
      practicePromptKo: null,
      resources: [],
      sortOrder: 0,
    },
  ],
  modelUsed: 'claude-sonnet',
  inputTokensUsed: 100,
  outputTokensUsed: 200,
  errorMessage: null,
  createdAt: '2025-01-01T00:00:00Z',
  completedAt: '2025-01-01T00:01:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLearningGuide', () => {
  it('should_return_guide_when_exists', async () => {
    const guide = makeSavedGuide();
    mockFindGuideByGroup.mockResolvedValue(guide);

    const result = await getLearningGuide(db, 'group-1');

    expect(result).toEqual(guide);
    expect(mockFindGuideByGroup).toHaveBeenCalledWith(db, 'group-1');
  });

  it('should_return_null_when_no_guide', async () => {
    mockFindGuideByGroup.mockResolvedValue(null);

    const result = await getLearningGuide(db, 'group-1');

    expect(result).toBeNull();
  });
});

describe('generateLearningGuide', () => {
  it('should_return_null_when_no_completed_evaluations', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(makeGroupResult(0) as any);

    const result = await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    expect(result).toBeNull();
    expect(mockFailStuck).toHaveBeenCalledWith(db);
  });

  it('should_return_null_when_group_not_found', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(null);

    const result = await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    expect(result).toBeNull();
  });

  it('should_generate_guide_when_evaluations_completed', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(makeGroupResult(1) as any);
    mockCreateGuide.mockResolvedValue({ id: 'guide-1' });
    mockUpdateGuide.mockResolvedValue(undefined);
    mockCallWithRetry.mockResolvedValue(makeAIResponse() as any);
    mockCreateSteps.mockResolvedValue(['step-1']);
    mockCreateResources.mockResolvedValue(undefined);

    const savedGuide = makeSavedGuide();
    mockFindGuideByGroup
      .mockResolvedValueOnce(savedGuide) // after completed
      .mockResolvedValueOnce(savedGuide); // final return

    mockTranslate.mockResolvedValue({
      currentTierSummaryKo: '요약',
      nextTierGoalKo: '목표',
      steps: [
        {
          stepNumber: 1,
          titleKo: '단계 1',
          objectiveKo: '기본 학습',
          keyActionsKo: ['매일 연습'],
          practicePromptKo: '이 프롬프트를 시도',
          resources: [],
        },
      ],
      inputTokens: 50,
      outputTokens: 60,
    });
    mockUpdateStepTranslations.mockResolvedValue(undefined);
    mockUpdateResourceTranslations.mockResolvedValue(undefined);

    const result = await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    expect(result).toEqual(savedGuide);
    expect(mockCreateGuide).toHaveBeenCalledWith(db, {
      evaluationGroupId: 'group-1',
      targetUserId: 'user-1',
      modelUsed: 'model',
    });
    expect(mockUpdateGuide).toHaveBeenCalledWith(db, 'guide-1', { status: 'generating' });
    expect(mockCreateSteps).toHaveBeenCalled();
    expect(mockCreateResources).toHaveBeenCalled();
  });

  it('should_set_status_failed_when_ai_call_throws', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(makeGroupResult(1) as any);
    mockCreateGuide.mockResolvedValue({ id: 'guide-1' });
    mockUpdateGuide.mockResolvedValue(undefined);
    mockCallWithRetry.mockRejectedValue(new Error('API error'));

    const result = await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    expect(result).toBeNull();
    // First call: status generating. Second call: status failed
    expect(mockUpdateGuide).toHaveBeenCalledTimes(2);
    expect(mockUpdateGuide).toHaveBeenLastCalledWith(db, 'guide-1', {
      status: 'failed',
      errorMessage: expect.any(String),
    });
  });

  it('should_still_complete_when_translation_fails', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(makeGroupResult(1) as any);
    mockCreateGuide.mockResolvedValue({ id: 'guide-1' });
    mockUpdateGuide.mockResolvedValue(undefined);
    mockCallWithRetry.mockResolvedValue(makeAIResponse() as any);
    mockCreateSteps.mockResolvedValue(['step-1']);
    mockCreateResources.mockResolvedValue(undefined);

    const savedGuide = makeSavedGuide();
    mockFindGuideByGroup.mockResolvedValueOnce(savedGuide).mockResolvedValueOnce(savedGuide);

    mockTranslate.mockRejectedValue(new Error('Translation failed'));

    const result = await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    // Should still return the guide despite translation failure
    expect(result).toEqual(savedGuide);
  });

  it('should_skip_resources_when_step_has_none', async () => {
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(makeGroupResult(1) as any);
    mockCreateGuide.mockResolvedValue({ id: 'guide-1' });
    mockUpdateGuide.mockResolvedValue(undefined);

    const noResourceResponse = {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            currentTierSummary: 'summary',
            nextTierGoal: 'goal',
            priorityAreas: [],
            steps: [
              {
                stepNumber: 1,
                title: 'Step 1',
                objective: 'Obj',
                targetDimensions: [],
                keyActions: [],
                practicePrompt: null,
                resources: [],
              },
            ],
          }),
        },
      ],
      usage: { input_tokens: 10, output_tokens: 20 },
    };
    mockCallWithRetry.mockResolvedValue(noResourceResponse as any);
    mockCreateSteps.mockResolvedValue(['step-1']);

    const savedGuide = makeSavedGuide();
    mockFindGuideByGroup.mockResolvedValueOnce(savedGuide).mockResolvedValueOnce(savedGuide);
    mockTranslate.mockResolvedValue({
      currentTierSummaryKo: '',
      nextTierGoalKo: '',
      steps: [],
      inputTokens: 0,
      outputTokens: 0,
    });

    await generateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    // createLearningResources should NOT be called when resources is empty
    expect(mockCreateResources).not.toHaveBeenCalled();
  });
});

describe('regenerateLearningGuide', () => {
  it('should_delete_existing_and_regenerate', async () => {
    mockDeleteGuides.mockResolvedValue(undefined);
    mockFailStuck.mockResolvedValue(0);
    mockFindGroup.mockResolvedValue(null); // will result in null return

    const result = await regenerateLearningGuide(db, 'key', 'model', 'group-1', 'user-1');

    expect(mockDeleteGuides).toHaveBeenCalledWith(db, 'group-1');
    expect(mockFailStuck).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
