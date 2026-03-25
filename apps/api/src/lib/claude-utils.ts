import Anthropic from '@anthropic-ai/sdk';

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

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
