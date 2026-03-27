import Anthropic from '@anthropic-ai/sdk';
import { callWithRetry } from '../../lib/claude-utils.js';
import type { EvaluationAnalysisResult } from './claude-client.js';

export interface DimensionTranslation {
  readonly dimension: string;
  readonly summaryKo: string;
  readonly strengthsKo: readonly string[];
  readonly weaknessesKo: readonly string[];
  readonly suggestionsKo: readonly string[];
  readonly evidenceAnnotationsKo: readonly string[];
}

export interface TranslationResult {
  readonly improvementSummaryKo: string;
  readonly dimensions: readonly DimensionTranslation[];
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional English-to-Korean translator specializing in technical evaluations and assessments.

Translate all JSON string values from English to natural, fluent Korean. Keep all JSON keys exactly as-is. Return valid JSON only.

Guidelines:
- Use natural Korean that reads well for a professional audience
- Preserve technical terms when commonly used in Korean tech context (e.g., API, prompt, hallucination)
- Maintain the same tone (professional, constructive, encouraging)
- Do not add or remove any content — translate faithfully
- Return ONLY the translated JSON, no additional text`;

export async function translateEvaluationToKorean(
  apiKey: string,
  model: string,
  analysisResult: EvaluationAnalysisResult,
): Promise<TranslationResult> {
  const client = new Anthropic({ apiKey });

  const translatablePayload = {
    improvementSummary: analysisResult.improvementSummary,
    dimensions: analysisResult.dimensions.map((d) => ({
      dimension: d.dimension,
      summary: d.summary,
      strengths: d.strengths,
      weaknesses: d.weaknesses,
      suggestions: d.suggestions,
      evidenceAnnotations: d.evidence.map((e) => e.annotation),
    })),
  };

  const userMessage = `Translate the following evaluation result JSON to Korean:\n\n\`\`\`json\n${JSON.stringify(translatablePayload, null, 2)}\n\`\`\``;

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

  const parsed = parseTranslationResponse(text, analysisResult);

  return {
    ...parsed,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

function parseTranslationResponse(
  text: string,
  original: EvaluationAnalysisResult,
): Omit<TranslationResult, 'inputTokens' | 'outputTokens'> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse translation response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as {
    improvementSummary?: string;
    dimensions?: unknown[];
  };

  const dimensions: DimensionTranslation[] = original.dimensions.map((origDim, index) => {
    const translatedDim = Array.isArray(result.dimensions) ? result.dimensions[index] : undefined;
    const td = (translatedDim ?? {}) as Record<string, unknown>;

    return {
      dimension: origDim.dimension,
      summaryKo: String(td['summary'] ?? origDim.summary),
      strengthsKo: toStringArray(td['strengths'] ?? origDim.strengths),
      weaknessesKo: toStringArray(td['weaknesses'] ?? origDim.weaknesses),
      suggestionsKo: toStringArray(td['suggestions'] ?? origDim.suggestions),
      evidenceAnnotationsKo: toStringArray(
        td['evidenceAnnotations'] ?? origDim.evidence.map((e) => e.annotation),
      ),
    };
  });

  return {
    improvementSummaryKo: String(result.improvementSummary ?? original.improvementSummary),
    dimensions,
  };
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

// === Stored evaluation translation (for backfill) ===

export interface StoredDimensionText {
  readonly dimensionId: string;
  readonly dimension: string;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly suggestions: readonly string[];
  readonly evidenceAnnotations: readonly string[];
}

export interface StoredEvaluationText {
  readonly improvementSummary: string;
  readonly dimensions: readonly StoredDimensionText[];
}

export interface StoredTranslationResult {
  readonly translatedImprovementSummary: string;
  readonly dimensions: readonly {
    readonly dimensionId: string;
    readonly dimension: string;
    readonly translatedSummary: string;
    readonly translatedStrengths: readonly string[];
    readonly translatedWeaknesses: readonly string[];
    readonly translatedSuggestions: readonly string[];
    readonly translatedEvidenceAnnotations: readonly string[];
  }[];
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const KO_TO_EN_SYSTEM_PROMPT = `You are a professional Korean-to-English translator specializing in technical evaluations and assessments.

Translate all JSON string values from Korean to natural, fluent English. Keep all JSON keys exactly as-is. Return valid JSON only.

Guidelines:
- Use natural English that reads well for a professional audience
- Preserve technical terms (e.g., API, prompt, hallucination)
- Maintain the same tone (professional, constructive, encouraging)
- Do not add or remove any content — translate faithfully
- Return ONLY the translated JSON, no additional text`;

const EN_TO_KO_SYSTEM_PROMPT = TRANSLATION_SYSTEM_PROMPT;

async function translateStoredEvaluation(
  apiKey: string,
  model: string,
  source: StoredEvaluationText,
  systemPrompt: string,
  direction: 'en-to-ko' | 'ko-to-en',
): Promise<StoredTranslationResult> {
  const client = new Anthropic({ apiKey });

  const payload = {
    improvementSummary: source.improvementSummary,
    dimensions: source.dimensions.map((d) => ({
      dimension: d.dimension,
      summary: d.summary,
      strengths: d.strengths,
      weaknesses: d.weaknesses,
      suggestions: d.suggestions,
      evidenceAnnotations: d.evidenceAnnotations,
    })),
  };

  const langLabel = direction === 'en-to-ko' ? 'Korean' : 'English';
  const userMessage = `Translate the following evaluation result JSON to ${langLabel}:\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;

  const message = await callWithRetry(client, model, systemPrompt, userMessage, 1, 8192);

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseStoredTranslationResponse(text, source);

  return {
    ...parsed,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

function parseStoredTranslationResponse(
  text: string,
  source: StoredEvaluationText,
): Omit<StoredTranslationResult, 'inputTokens' | 'outputTokens'> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse translation response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as {
    improvementSummary?: string;
    dimensions?: unknown[];
  };

  const dimensions = source.dimensions.map((origDim, index) => {
    const translatedDim = Array.isArray(result.dimensions) ? result.dimensions[index] : undefined;
    const td = (translatedDim ?? {}) as Record<string, unknown>;

    return {
      dimensionId: origDim.dimensionId,
      dimension: origDim.dimension,
      translatedSummary: String(td['summary'] ?? origDim.summary),
      translatedStrengths: toStringArray(td['strengths'] ?? origDim.strengths),
      translatedWeaknesses: toStringArray(td['weaknesses'] ?? origDim.weaknesses),
      translatedSuggestions: toStringArray(td['suggestions'] ?? origDim.suggestions),
      translatedEvidenceAnnotations: toStringArray(
        td['evidenceAnnotations'] ?? origDim.evidenceAnnotations,
      ),
    };
  });

  return {
    translatedImprovementSummary: String(result.improvementSummary ?? source.improvementSummary),
    dimensions,
  };
}

export function translateStoredEvaluationToKorean(
  apiKey: string,
  model: string,
  source: StoredEvaluationText,
): Promise<StoredTranslationResult> {
  return translateStoredEvaluation(apiKey, model, source, EN_TO_KO_SYSTEM_PROMPT, 'en-to-ko');
}

export function translateStoredEvaluationToEnglish(
  apiKey: string,
  model: string,
  source: StoredEvaluationText,
): Promise<StoredTranslationResult> {
  return translateStoredEvaluation(apiKey, model, source, KO_TO_EN_SYSTEM_PROMPT, 'ko-to-en');
}
