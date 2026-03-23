import Anthropic from '@anthropic-ai/sdk';
import type { RateLimitSnapshot } from '@context-sync/shared';

export interface CallWithRetryResult {
  readonly message: Anthropic.Message;
  readonly rateLimits: RateLimitSnapshot | null;
}

export async function callWithRetry(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userMessage: string,
  retries = 1,
): Promise<Anthropic.Message> {
  try {
    return await client.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(2000);
      return callWithRetry(client, model, systemPrompt, userMessage, retries - 1);
    }
    throw error;
  }
}

export async function callWithRetryAndHeaders(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userMessage: string,
  retries = 1,
): Promise<CallWithRetryResult> {
  try {
    const raw = await client.messages
      .create({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })
      .withResponse();

    const rateLimits = parseRateLimitHeaders(raw.response);

    return { message: raw.data, rateLimits };
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(2000);
      return callWithRetryAndHeaders(client, model, systemPrompt, userMessage, retries - 1);
    }
    throw error;
  }
}

export function parseRateLimitHeaders(response: Response): RateLimitSnapshot | null {
  const get = (name: string): string | null => response.headers.get(name);

  const requestsLimit = get('anthropic-ratelimit-requests-limit');
  if (!requestsLimit) return null;

  return {
    requestsLimit: toIntOrNull(requestsLimit),
    requestsRemaining: toIntOrNull(get('anthropic-ratelimit-requests-remaining')),
    requestsReset: get('anthropic-ratelimit-requests-reset'),
    tokensLimit: toIntOrNull(get('anthropic-ratelimit-tokens-limit')),
    tokensRemaining: toIntOrNull(get('anthropic-ratelimit-tokens-remaining')),
    tokensReset: get('anthropic-ratelimit-tokens-reset'),
    inputTokensLimit: toIntOrNull(get('anthropic-ratelimit-input-tokens-limit')),
    inputTokensRemaining: toIntOrNull(get('anthropic-ratelimit-input-tokens-remaining')),
    inputTokensReset: get('anthropic-ratelimit-input-tokens-reset'),
    outputTokensLimit: toIntOrNull(get('anthropic-ratelimit-output-tokens-limit')),
    outputTokensRemaining: toIntOrNull(get('anthropic-ratelimit-output-tokens-remaining')),
    outputTokensReset: get('anthropic-ratelimit-output-tokens-reset'),
    capturedAt: new Date().toISOString(),
  };
}

function toIntOrNull(value: string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
