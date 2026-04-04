import { describe, it, expect, vi, beforeEach } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { callWithRetry, toAppError, isRetryableError, delay } from '../claude-utils.js';
import { AppError } from '../../plugins/error-handler.plugin.js';

const emptyHeaders = { get: () => null } as any;

function makeApiError(status: number, message: string): Anthropic.APIError {
  return new Anthropic.APIError(
    status,
    { type: 'error', error: { type: 'api_error', message } },
    message,
    emptyHeaders,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('toAppError', () => {
  it('should return same error when already AppError', () => {
    const original = new AppError('test', 400);
    expect(toAppError(original)).toBe(original);
  });

  it('should map Anthropic 401 to 400 with API key message', () => {
    const result = toAppError(makeApiError(401, 'invalid api key'));
    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(400);
    expect(result.message).toContain('API Key');
  });

  it('should map Anthropic 403 to 400', () => {
    const result = toAppError(makeApiError(403, 'no access'));
    expect(result.statusCode).toBe(400);
  });

  it('should map Anthropic 404 to 400', () => {
    const result = toAppError(makeApiError(404, 'not found'));
    expect(result.statusCode).toBe(400);
  });

  it('should map Anthropic 429 to 429', () => {
    const result = toAppError(makeApiError(429, 'rate limited'));
    expect(result.statusCode).toBe(429);
  });

  it('should map Anthropic 500+ to 502', () => {
    const result = toAppError(makeApiError(503, 'server error'));
    expect(result.statusCode).toBe(502);
  });

  it('should map Anthropic 4xx (other) to 400', () => {
    const result = toAppError(makeApiError(422, 'bad request'));
    expect(result.statusCode).toBe(400);
  });

  it('should handle regular Error', () => {
    const result = toAppError(new Error('something broke'));
    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(500);
    expect(result.message).toContain('something broke');
  });

  it('should handle non-Error value', () => {
    const result = toAppError('string error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(500);
  });
});

describe('isRetryableError', () => {
  it('should return true for 500+ Anthropic errors', () => {
    expect(isRetryableError(makeApiError(503, 'server'))).toBe(true);
  });

  it('should return true for 429 rate limit error', () => {
    expect(isRetryableError(makeApiError(429, 'rate'))).toBe(true);
  });

  it('should return false for 4xx (non-429) errors', () => {
    expect(isRetryableError(makeApiError(401, 'auth'))).toBe(false);
  });

  it('should return false for non-Anthropic errors', () => {
    expect(isRetryableError(new Error('generic'))).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isRetryableError(null)).toBe(false);
  });
});

describe('delay', () => {
  it('should resolve after specified time', async () => {
    vi.useFakeTimers();
    const promise = delay(100);
    vi.advanceTimersByTime(100);
    await promise;
    vi.useRealTimers();
  });
});

describe('callWithRetry', () => {
  it('should return result on success', async () => {
    const mockResponse = { id: 'msg-1', content: [{ type: 'text', text: 'hello' }] };
    const mockClient = {
      messages: { create: vi.fn().mockResolvedValue(mockResponse) },
    } as unknown as Anthropic;

    const result = await callWithRetry(mockClient, 'model', 'system', 'user');

    expect(result).toEqual(mockResponse);
    expect(mockClient.messages.create).toHaveBeenCalledWith({
      model: 'model',
      max_tokens: 8192,
      system: 'system',
      messages: [{ role: 'user', content: 'user' }],
    });
  });

  it('should throw AppError on non-retryable error', async () => {
    const mockClient = {
      messages: { create: vi.fn().mockRejectedValue(makeApiError(401, 'bad key')) },
    } as unknown as Anthropic;

    await expect(callWithRetry(mockClient, 'model', 'system', 'user', 0)).rejects.toThrow(AppError);
  });
});
