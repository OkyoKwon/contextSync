import Anthropic from '@anthropic-ai/sdk';
import type { EvaluationDimension, EvidenceSentiment } from '@context-sync/shared';
import { EVALUATION_DIMENSIONS } from '@context-sync/shared';

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
  readonly dimension: EvaluationDimension;
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

const SYSTEM_PROMPT = `You are an AI utilization skills evaluator. Your task is to analyze a user's prompts/messages sent to an AI coding assistant and evaluate their proficiency across 5 dimensions.

## Evaluation Dimensions

1. **prompt_quality** (25% weight) — Specificity, clear requirements, acceptance criteria
2. **task_complexity** (20% weight) — Simple fixes vs architecture design, multi-file refactoring scope
3. **iteration_pattern** (20% weight) — Effective feedback loops, error handling, incremental improvement
4. **context_utilization** (20% weight) — Providing file paths, error messages, code snippets, environment info
5. **ai_capability_leverage** (15% weight) — Using planning mode, code review, test writing, multi-step workflows

## Scoring Guide

- 0-25: Novice — Vague prompts, single-line requests, no context
- 26-50: Developing — Some structure, basic context, limited iteration
- 51-70: Proficient — Clear requirements, good context, effective iteration
- 71-85: Advanced — Detailed specs, rich context, strategic AI use
- 86-100: Expert — Comprehensive specs, optimal context, advanced workflows

## Output Format

Respond ONLY with valid JSON:
{
  "dimensions": [
    {
      "dimension": "prompt_quality",
      "score": 75,
      "confidence": 85,
      "summary": "Brief assessment of this dimension",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "evidence": [
        {
          "excerpt": "Exact quote from a user prompt (max 200 chars)",
          "sentiment": "positive",
          "annotation": "Why this excerpt is relevant"
        }
      ]
    }
  ],
  "improvementSummary": "2-3 paragraph comprehensive improvement guide"
}

## Guidelines
- Evaluate ALL 5 dimensions, in the order listed above
- Score each 0-100, confidence 0-100
- Confidence should be lower when fewer messages are available
- Each dimension should have 1-3 evidence excerpts
- Evidence excerpts must be exact quotes from the provided prompts (max 200 chars)
- Sentiment: "positive" for good examples, "negative" for areas to improve, "neutral" for mixed
- improvementSummary should be actionable, specific, and encouraging
- Be fair — recognize strengths as well as weaknesses`;

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
): Promise<EvaluationAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const sampled = sampleMessages(messages);
  const userMessage = buildUserMessage(sampled, sessionCount, messages.length);

  const response = await callWithRetry(client, model, userMessage);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = parseEvaluationResponse(text, sampled);

  return {
    ...parsed,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
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

async function callWithRetry(
  client: Anthropic,
  model: string,
  userMessage: string,
  retries = 1,
): Promise<Anthropic.Message> {
  try {
    return await client.messages.create({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(2000);
      return callWithRetry(client, model, userMessage, retries - 1);
    }
    throw error;
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEvaluationResponse(
  text: string,
  sampledMessages: readonly SampledMessage[],
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
    throw new Error(`Failed to parse Claude evaluation response as JSON: ${text.slice(0, 200)}`);
  }

  const result = parsed as {
    dimensions?: unknown[];
    improvementSummary?: string;
  };

  if (!result.dimensions || !Array.isArray(result.dimensions)) {
    throw new Error('Claude evaluation response missing "dimensions" array');
  }

  // Build a lookup for matching evidence to message IDs
  const messageByExcerpt = buildExcerptLookup(sampledMessages);

  const dimensions: ParsedDimensionResult[] = result.dimensions.map((dim: unknown) => {
    const d = dim as Record<string, unknown>;
    const dimension = validateDimension(String(d['dimension'] ?? ''));
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

  // Ensure all 5 dimensions are present
  const presentDimensions = new Set(dimensions.map((d) => d.dimension));
  for (const dim of EVALUATION_DIMENSIONS) {
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

function validateDimension(dimension: string): EvaluationDimension {
  const valid: readonly string[] = EVALUATION_DIMENSIONS;
  if (valid.includes(dimension)) {
    return dimension as EvaluationDimension;
  }
  // Try to match partial names
  const match = EVALUATION_DIMENSIONS.find((d) => dimension.toLowerCase().includes(d));
  return match ?? 'prompt_quality';
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
    // Find the message that contains this excerpt
    const normalized = excerpt.toLowerCase();
    return messages.find((m) => m.content.toLowerCase().includes(normalized)) ?? null;
  };
}
