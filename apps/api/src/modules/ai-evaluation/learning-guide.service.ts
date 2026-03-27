import Anthropic from '@anthropic-ai/sdk';
import type { Db } from '../../database/client.js';
import type { LearningGuide, LearningStep, EvaluationGroupResult } from '@context-sync/shared';
import { callWithRetry, toAppError, delay } from '../../lib/claude-utils.js';
import {
  LEARNING_GUIDE_SYSTEM_PROMPT,
  buildLearningGuideUserMessage,
} from './learning-guide-prompts.js';
import * as guideRepo from './learning-guide.repository.js';
import * as evalRepo from './ai-evaluation.repository.js';
import { translateLearningGuideToKorean } from './translate-learning-guide.js';

export async function generateLearningGuide(
  db: Db,
  apiKey: string,
  model: string,
  groupId: string,
  targetUserId: string,
): Promise<LearningGuide | null> {
  // Fail stuck guides before starting
  await guideRepo.failStuckLearningGuides(db);

  const countCompleted = (g: EvaluationGroupResult | null) =>
    g ? [g.claude, g.chatgpt, g.gemini].filter((e) => e?.status === 'completed').length : 0;

  // Fetch completed evaluations — retry once after 1s if not visible yet
  let group = await evalRepo.findEvaluationGroup(db, groupId);
  let completedCount = countCompleted(group);

  if (completedCount < 1 && group) {
    console.log('[LearningGuide] No completed evaluations yet, retrying in 1s...');
    await delay(1000);
    group = await evalRepo.findEvaluationGroup(db, groupId);
    completedCount = countCompleted(group);
  }

  if (!group || completedCount < 1) {
    console.warn(`[LearningGuide] Skipped: group=${groupId}, completedCount=${completedCount}`);
    return null;
  }

  console.log(`[LearningGuide] Generating for group=${groupId}, completedCount=${completedCount}`);

  // Create guide record
  const { id: guideId } = await guideRepo.createLearningGuide(db, {
    evaluationGroupId: groupId,
    targetUserId,
    modelUsed: model,
  });

  await guideRepo.updateLearningGuide(db, guideId, { status: 'generating' });

  try {
    const result = await callLearningGuideAI(apiKey, model, group);

    // Save steps and resources
    for (const step of result.steps) {
      const stepIds = await guideRepo.createLearningSteps(db, guideId, [
        {
          stepNumber: step.stepNumber,
          title: step.title,
          objective: step.objective,
          targetDimensions: step.targetDimensions,
          keyActions: step.keyActions,
          practicePrompt: step.practicePrompt,
          sortOrder: step.stepNumber - 1,
        },
      ]);

      const stepId = stepIds[0];
      if (stepId && step.resources.length > 0) {
        await guideRepo.createLearningResources(
          db,
          stepId,
          step.resources.map((r, i) => ({
            title: r.title,
            url: r.url,
            type: r.type,
            level: r.level,
            description: r.description,
            estimatedMinutes: r.estimatedMinutes,
            sortOrder: i,
          })),
        );
      }
    }

    // Update guide with results
    await guideRepo.updateLearningGuide(db, guideId, {
      status: 'completed',
      currentTierSummary: result.currentTierSummary,
      nextTierGoal: result.nextTierGoal,
      priorityAreas: result.priorityAreas,
      inputTokensUsed: result.inputTokens,
      outputTokensUsed: result.outputTokens,
      completedAt: new Date(),
    });

    // Fetch the complete guide with steps/resources
    const savedGuide = await guideRepo.findLearningGuideByGroupId(db, groupId);
    if (!savedGuide) return null;

    // Translate to Korean (non-blocking)
    try {
      const translation = await translateLearningGuideToKorean(apiKey, model, savedGuide);

      await guideRepo.updateLearningGuide(db, guideId, {
        currentTierSummaryKo: translation.currentTierSummaryKo,
        nextTierGoalKo: translation.nextTierGoalKo,
      });

      for (const stepTranslation of translation.steps) {
        const step = savedGuide.steps.find(
          (s: LearningStep) => s.stepNumber === stepTranslation.stepNumber,
        );
        if (step) {
          await guideRepo.updateStepTranslations(db, step.id, {
            titleKo: stepTranslation.titleKo,
            objectiveKo: stepTranslation.objectiveKo,
            keyActionsKo: stepTranslation.keyActionsKo,
            practicePromptKo: stepTranslation.practicePromptKo,
          });
          await guideRepo.updateResourceTranslations(db, step.id, stepTranslation.resources);
        }
      }
    } catch (translationError) {
      console.warn(
        '[LearningGuide] Translation to Korean failed (non-blocking):',
        translationError instanceof Error ? translationError.message : translationError,
      );
    }

    return guideRepo.findLearningGuideByGroupId(db, groupId);
  } catch (error) {
    const appError = toAppError(error);
    await guideRepo.updateLearningGuide(db, guideId, {
      status: 'failed',
      errorMessage: appError.message,
    });
    return null;
  }
}

export async function getLearningGuide(db: Db, groupId: string): Promise<LearningGuide | null> {
  return guideRepo.findLearningGuideByGroupId(db, groupId);
}

export async function regenerateLearningGuide(
  db: Db,
  apiKey: string,
  model: string,
  groupId: string,
  targetUserId: string,
): Promise<LearningGuide | null> {
  // Delete existing guide (CASCADE deletes steps + resources)
  await guideRepo.deleteLearningGuidesByGroupId(db, groupId);

  return generateLearningGuide(db, apiKey, model, groupId, targetUserId);
}

// ── Internal helpers ──

interface LearningGuideAIResult {
  readonly currentTierSummary: string;
  readonly nextTierGoal: string;
  readonly priorityAreas: readonly string[];
  readonly steps: readonly LearningGuideAIStep[];
  readonly inputTokens: number;
  readonly outputTokens: number;
}

interface LearningGuideAIStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly objective: string;
  readonly targetDimensions: readonly string[];
  readonly keyActions: readonly string[];
  readonly practicePrompt: string | null;
  readonly resources: readonly LearningGuideAIResource[];
}

interface LearningGuideAIResource {
  readonly title: string;
  readonly url: string;
  readonly type: string;
  readonly level: string;
  readonly description: string;
  readonly estimatedMinutes: number | null;
}

async function callLearningGuideAI(
  apiKey: string,
  model: string,
  group: EvaluationGroupResult,
): Promise<LearningGuideAIResult> {
  const client = new Anthropic({ apiKey });
  const userMessage = buildLearningGuideUserMessage({
    claude: group.claude,
    chatgpt: group.chatgpt,
    gemini: group.gemini,
  });

  const message = await callWithRetry(client, model, LEARNING_GUIDE_SYSTEM_PROMPT, userMessage);

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseLearningGuideResponse(text);

  return {
    ...parsed,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

function parseLearningGuideResponse(
  text: string,
): Omit<LearningGuideAIResult, 'inputTokens' | 'outputTokens'> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  const raw = JSON.parse(jsonStr) as Record<string, unknown>;

  const rawSteps = Array.isArray(raw['steps']) ? raw['steps'] : [];

  const steps: LearningGuideAIStep[] = rawSteps
    .slice(0, 6)
    .map((s: Record<string, unknown>, i: number) => {
      const rawResources = Array.isArray(s['resources']) ? s['resources'] : [];

      return {
        stepNumber: typeof s['stepNumber'] === 'number' ? s['stepNumber'] : i + 1,
        title: String(s['title'] ?? `Step ${i + 1}`),
        objective: String(s['objective'] ?? ''),
        targetDimensions: Array.isArray(s['targetDimensions'])
          ? (s['targetDimensions'] as unknown[]).map(String)
          : [],
        keyActions: Array.isArray(s['keyActions'])
          ? (s['keyActions'] as unknown[]).map(String)
          : [],
        practicePrompt: s['practicePrompt'] != null ? String(s['practicePrompt']) : null,
        resources: rawResources.slice(0, 4).map((r: Record<string, unknown>, j: number) => ({
          title: String(r['title'] ?? `Resource ${j + 1}`),
          url: String(r['url'] ?? ''),
          type: String(r['type'] ?? 'article'),
          level: String(r['level'] ?? 'beginner'),
          description: String(r['description'] ?? ''),
          estimatedMinutes:
            typeof r['estimatedMinutes'] === 'number' ? r['estimatedMinutes'] : null,
        })),
      };
    });

  return {
    currentTierSummary: String(raw['currentTierSummary'] ?? ''),
    nextTierGoal: String(raw['nextTierGoal'] ?? ''),
    priorityAreas: Array.isArray(raw['priorityAreas'])
      ? (raw['priorityAreas'] as unknown[]).map(String)
      : [],
    steps,
  };
}
