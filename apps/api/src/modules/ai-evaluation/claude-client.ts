import Anthropic from '@anthropic-ai/sdk';
import type { EvaluationPerspective, EvidenceSentiment } from '@context-sync/shared';
import { PERSPECTIVE_DIMENSIONS } from '@context-sync/shared';
import { callWithRetry } from '../../lib/claude-utils.js';
import { getSystemPrompt } from './perspective-prompts.js';

const MAX_PROMPT_CHAR_LENGTH = 2000;
const MAX_TOTAL_CHARS = 80_000;
const MAX_SAMPLED_MESSAGES = 200;

export interface SampledMessage {
  readonly id: string;
  readonly sessionId: string;
  readonly content: string;
  readonly createdAt: string;
}

export interface ParsedDimensionResult {
  readonly dimension: string;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly suggestions: readonly string[];
  readonly evidence: readonly {
    readonly excerpt: string;
    readonly sentiment: EvidenceSentiment;
    readonly annotation: string;
    readonly messageId: string | null;
    readonly sessionId: string | null;
  }[];
}

export interface EvaluationAnalysisResult {
  readonly dimensions: readonly ParsedDimensionResult[];
  readonly improvementSummary: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly modelUsed: string;
}

export function sampleMessages(messages: readonly SampledMessage[]): readonly SampledMessage[] {
  if (messages.length <= MAX_SAMPLED_MESSAGES) {
    return truncateMessages(messages);
  }

  // Group by session
  const bySession = new Map<string, SampledMessage[]>();
  for (const msg of messages) {
    const existing = bySession.get(msg.sessionId) ?? [];
    bySession.set(msg.sessionId, [...existing, msg]);
  }

  // Stratified sampling: first 3 + last 3 from each session
  const sampled: SampledMessage[] = [];
  for (const [, sessionMessages] of bySession) {
    if (sessionMessages.length <= 6) {
      sampled.push(...sessionMessages);
    } else {
      sampled.push(...sessionMessages.slice(0, 3));
      sampled.push(...sessionMessages.slice(-3));
    }
  }

  // If still over limit, take most recent
  const sorted = [...sampled].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return truncateMessages(sorted.slice(0, MAX_SAMPLED_MESSAGES));
}

function truncateMessages(messages: readonly SampledMessage[]): readonly SampledMessage[] {
  let totalChars = 0;
  const result: SampledMessage[] = [];

  for (const msg of messages) {
    const truncated =
      msg.content.length > MAX_PROMPT_CHAR_LENGTH
        ? msg.content.slice(0, MAX_PROMPT_CHAR_LENGTH) + '...[truncated]'
        : msg.content;
    totalChars += truncated.length;
    if (totalChars > MAX_TOTAL_CHARS) break;
    result.push({ ...msg, content: truncated });
  }

  return result;
}

export async function analyzeEvaluation(
  apiKey: string,
  model: string,
  messages: readonly SampledMessage[],
  sessionCount: number,
  perspective: EvaluationPerspective = 'claude',
): Promise<EvaluationAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const sampled = sampleMessages(messages);
  const userMessage = buildUserMessage(sampled, sessionCount, messages.length);
  const systemPrompt = getSystemPrompt(perspective);

  const message = await callWithRetry(client, model, systemPrompt, userMessage);

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseEvaluationResponse(text, sampled, perspective);

  return {
    ...parsed,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    modelUsed: model,
  };
}

function buildUserMessage(
  messages: readonly SampledMessage[],
  sessionCount: number,
  totalMessageCount: number,
): string {
  const promptEntries = messages
    .map((msg, i) => `### Prompt ${i + 1} (Session: ${msg.sessionId.slice(0, 8)})\n${msg.content}`)
    .join('\n\n');

  return `## Analysis Context

- Total sessions: ${sessionCount}
- Total user messages: ${totalMessageCount}
- Sampled messages shown: ${messages.length}

## User Prompts

${promptEntries}

Analyze these prompts and return the JSON evaluation result.`;
}

function parseEvaluationResponse(
  text: string,
  sampledMessages: readonly SampledMessage[],
  perspective: EvaluationPerspective,
): {
  dimensions: readonly ParsedDimensionResult[];
  improvementSummary: string;
} {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const jsonStr = (jsonMatch[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse evaluation response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as {
    dimensions?: unknown[];
    improvementSummary?: string;
  };

  if (!result.dimensions || !Array.isArray(result.dimensions)) {
    throw new Error('Evaluation response missing "dimensions" array');
  }

  const expectedDimensions = PERSPECTIVE_DIMENSIONS[perspective] as readonly string[];
  const messageByExcerpt = buildExcerptLookup(sampledMessages);

  const dimensions: ParsedDimensionResult[] = result.dimensions.map((dim: unknown) => {
    const d = dim as Record<string, unknown>;
    const dimension = validateDimension(String(d['dimension'] ?? ''), expectedDimensions);
    const evidence = Array.isArray(d['evidence'])
      ? (d['evidence'] as unknown[]).map((e: unknown) => {
          const ev = e as Record<string, unknown>;
          const excerpt = String(ev['excerpt'] ?? '').slice(0, 200);
          const matched = messageByExcerpt(excerpt);
          return {
            excerpt,
            sentiment: validateSentiment(String(ev['sentiment'] ?? 'neutral')),
            annotation: String(ev['annotation'] ?? ''),
            messageId: matched?.id ?? null,
            sessionId: matched?.sessionId ?? null,
          };
        })
      : [];

    return {
      dimension,
      score: clamp(Number(d['score'] ?? 0), 0, 100),
      confidence: clamp(Number(d['confidence'] ?? 0), 0, 100),
      summary: String(d['summary'] ?? ''),
      strengths: toStringArray(d['strengths']),
      weaknesses: toStringArray(d['weaknesses']),
      suggestions: toStringArray(d['suggestions']),
      evidence,
    };
  });

  // Ensure all expected dimensions are present
  const presentDimensions = new Set(dimensions.map((d) => d.dimension));
  for (const dim of expectedDimensions) {
    if (!presentDimensions.has(dim)) {
      dimensions.push({
        dimension: dim,
        score: 0,
        confidence: 0,
        summary: 'Insufficient data for evaluation',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        evidence: [],
      });
    }
  }

  return {
    dimensions,
    improvementSummary: String(result.improvementSummary ?? ''),
  };
}

function validateDimension(dimension: string, expectedDimensions: readonly string[]): string {
  if (expectedDimensions.includes(dimension)) {
    return dimension;
  }
  // Try to match partial names
  const match = expectedDimensions.find((d) => dimension.toLowerCase().includes(d));
  return match ?? expectedDimensions[0] ?? dimension;
}

function validateSentiment(sentiment: string): EvidenceSentiment {
  if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
    return sentiment;
  }
  return 'neutral';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function buildExcerptLookup(
  messages: readonly SampledMessage[],
): (excerpt: string) => SampledMessage | null {
  return (excerpt: string) => {
    const normalized = excerpt.toLowerCase();
    return messages.find((m) => m.content.toLowerCase().includes(normalized)) ?? null;
  };
}
