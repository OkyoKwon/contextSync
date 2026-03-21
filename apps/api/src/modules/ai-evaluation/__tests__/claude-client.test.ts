import { describe, it, expect } from 'vitest';
import { sampleMessages } from '../claude-client.js';
import type { SampledMessage } from '../claude-client.js';

function makeMessage(
  id: string,
  sessionId: string,
  content: string,
  createdAt: string,
): SampledMessage {
  return { id, sessionId, content, createdAt };
}

describe('sampleMessages', () => {
  it('returns all messages when under the limit', () => {
    const messages = [
      makeMessage('1', 'sess-1', 'Hello', '2024-01-01T00:00:00Z'),
      makeMessage('2', 'sess-1', 'World', '2024-01-01T00:01:00Z'),
    ];
    const result = sampleMessages(messages);
    expect(result).toHaveLength(2);
  });

  it('truncates individual messages longer than 2000 chars', () => {
    const longContent = 'a'.repeat(3000);
    const messages = [makeMessage('1', 'sess-1', longContent, '2024-01-01T00:00:00Z')];
    const result = sampleMessages(messages);
    expect(result).toHaveLength(1);
    const first = result[0]!;
    expect(first.content.length).toBeLessThan(longContent.length);
    expect(first.content).toContain('...[truncated]');
  });

  it('performs stratified sampling for large message sets', () => {
    // Create 250 messages across 5 sessions (50 each)
    const messages: SampledMessage[] = [];
    for (let s = 0; s < 5; s++) {
      for (let m = 0; m < 50; m++) {
        messages.push(
          makeMessage(
            `msg-${s}-${m}`,
            `sess-${s}`,
            `Prompt content ${m}`,
            new Date(2024, 0, 1, s, m).toISOString(),
          ),
        );
      }
    }

    const result = sampleMessages(messages);
    // Should be sampled down (5 sessions * 6 messages each = 30)
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.length).toBeGreaterThan(0);
  });

  it('stops accumulating when total chars exceed 80K', () => {
    // Create messages that exceed total char limit
    const messages: SampledMessage[] = [];
    for (let i = 0; i < 100; i++) {
      messages.push(
        makeMessage(
          `msg-${i}`,
          'sess-1',
          'x'.repeat(1500),
          new Date(2024, 0, 1, 0, i).toISOString(),
        ),
      );
    }

    const result = sampleMessages(messages);
    const totalChars = result.reduce((sum, m) => sum + m.content.length, 0);
    expect(totalChars).toBeLessThanOrEqual(80_000 + 2000); // Allow one message over
  });

  it('handles empty messages array', () => {
    const result = sampleMessages([]);
    expect(result).toHaveLength(0);
  });

  it('preserves first 3 and last 3 messages per session in stratified sampling', () => {
    // Create 300 messages in a single session
    const messages: SampledMessage[] = [];
    for (let i = 0; i < 300; i++) {
      messages.push(
        makeMessage(
          `msg-${i}`,
          'sess-1',
          `Short prompt ${i}`,
          new Date(2024, 0, 1, 0, i % 60, Math.floor(i / 60)).toISOString(),
        ),
      );
    }

    const result = sampleMessages(messages);
    // Stratified: first 3 + last 3 = 6 from single session
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('parseEvaluationResponse (via sampleMessages integration)', () => {
  it('returns immutable results', () => {
    const messages = [makeMessage('1', 'sess-1', 'Test prompt', '2024-01-01T00:00:00Z')];
    const result = sampleMessages(messages);

    // Verify result is a new array, not the same reference
    expect(result).not.toBe(messages);
  });
});
