import Anthropic from '@anthropic-ai/sdk';
import { callWithRetry } from '../../lib/claude-utils.js';
import type { LearningGuide, LearningStep, LearningResource } from '@context-sync/shared';

export interface LearningGuideTranslationResult {
  readonly currentTierSummaryKo: string;
  readonly nextTierGoalKo: string;
  readonly steps: readonly StepTranslation[];
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface StepTranslation {
  readonly stepNumber: number;
  readonly titleKo: string;
  readonly objectiveKo: string;
  readonly keyActionsKo: readonly string[];
  readonly practicePromptKo: string | null;
  readonly resources: readonly { readonly titleKo: string; readonly descriptionKo: string }[];
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional English-to-Korean translator specializing in technical evaluations and learning guides.

Translate all JSON string values from English to natural, fluent Korean. Keep all JSON keys exactly as-is. Return valid JSON only.

Guidelines:
- Use natural Korean that reads well for a professional audience
- Preserve technical terms when commonly used in Korean tech context (e.g., API, prompt, hallucination)
- Maintain the same tone (professional, constructive, encouraging)
- Do not add or remove any content — translate faithfully
- Return ONLY the translated JSON, no additional text`;

export async function translateLearningGuideToKorean(
  apiKey: string,
  model: string,
  guide: LearningGuide,
): Promise<LearningGuideTranslationResult> {
  const client = new Anthropic({ apiKey });

  const translatablePayload = {
    currentTierSummary: guide.currentTierSummary,
    nextTierGoal: guide.nextTierGoal,
    steps: guide.steps.map((s: LearningStep) => ({
      stepNumber: s.stepNumber,
      title: s.title,
      objective: s.objective,
      keyActions: [...s.keyActions],
      practicePrompt: s.practicePrompt,
      resources: s.resources.map((r: LearningResource) => ({
        title: r.title,
        description: r.description,
      })),
    })),
  };

  const userMessage = `Translate the following learning guide JSON to Korean:\n\n\`\`\`json\n${JSON.stringify(translatablePayload, null, 2)}\n\`\`\``;

  const message = await callWithRetry(
    client,
    model,
    TRANSLATION_SYSTEM_PROMPT,
    userMessage,
    1,
    8192,
  );

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseTranslationResponse(text, guide);

  return {
    ...parsed,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

function parseTranslationResponse(
  text: string,
  original: LearningGuide,
): Omit<LearningGuideTranslationResult, 'inputTokens' | 'outputTokens'> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  try {
    const result = JSON.parse(jsonStr) as {
      currentTierSummary?: string;
      nextTierGoal?: string;
      steps?: Array<{
        stepNumber?: number;
        title?: string;
        objective?: string;
        keyActions?: string[];
        practicePrompt?: string | null;
        resources?: Array<{ title?: string; description?: string }>;
      }>;
    };

    return {
      currentTierSummaryKo: String(result.currentTierSummary ?? original.currentTierSummary ?? ''),
      nextTierGoalKo: String(result.nextTierGoal ?? original.nextTierGoal ?? ''),
      steps: original.steps.map((origStep: LearningStep, i: number) => {
        const translatedStep = result.steps?.[i];
        return {
          stepNumber: origStep.stepNumber,
          titleKo: String(translatedStep?.title ?? origStep.title),
          objectiveKo: String(translatedStep?.objective ?? origStep.objective),
          keyActionsKo: (translatedStep?.keyActions ?? [...origStep.keyActions]).map(String),
          practicePromptKo:
            translatedStep?.practicePrompt != null
              ? String(translatedStep.practicePrompt)
              : origStep.practicePrompt,
          resources: origStep.resources.map((origRes: LearningResource, j: number) => {
            const translatedRes = translatedStep?.resources?.[j];
            return {
              titleKo: String(translatedRes?.title ?? origRes.title),
              descriptionKo: String(translatedRes?.description ?? origRes.description),
            };
          }),
        };
      }),
    };
  } catch {
    // Fallback: return original English text as Korean
    return {
      currentTierSummaryKo: original.currentTierSummary ?? '',
      nextTierGoalKo: original.nextTierGoal ?? '',
      steps: original.steps.map((s: LearningStep) => ({
        stepNumber: s.stepNumber,
        titleKo: s.title,
        objectiveKo: s.objective,
        keyActionsKo: [...s.keyActions],
        practicePromptKo: s.practicePrompt,
        resources: s.resources.map((r: LearningResource) => ({
          titleKo: r.title,
          descriptionKo: r.description,
        })),
      })),
    };
  }
}
