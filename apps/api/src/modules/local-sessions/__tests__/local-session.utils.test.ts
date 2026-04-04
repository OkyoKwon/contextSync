import { describe, it, expect } from 'vitest';
import { findFirstTimestamp } from '../local-session.service.js';

describe('findFirstTimestamp', () => {
  it('should extract timestamp from JSONL line', () => {
    const raw =
      '{"type":"message","timestamp":"2025-01-15T10:00:00Z","content":"hello"}\n{"type":"message","timestamp":"2025-01-15T11:00:00Z"}';

    const result = findFirstTimestamp(raw);

    expect(result).toBe('2025-01-15T10:00:00Z');
  });

  it('should extract _audit_timestamp from desktop session', () => {
    const raw = '{"_audit_timestamp":"2025-02-01T09:00:00Z","type":"user_message"}\n';

    const result = findFirstTimestamp(raw);

    expect(result).toBe('2025-02-01T09:00:00Z');
  });

  it('should return null when no timestamp found', () => {
    const raw = '{"type":"message","content":"no timestamp here"}\n{"type":"another"}';

    const result = findFirstTimestamp(raw);

    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(findFirstTimestamp('')).toBeNull();
  });

  it('should handle malformed JSON lines gracefully', () => {
    const raw = 'not json\n{"timestamp":"2025-03-01T12:00:00Z"}';

    const result = findFirstTimestamp(raw);

    expect(result).toBe('2025-03-01T12:00:00Z');
  });

  it('should only check first 10 lines', () => {
    const lines = Array.from({ length: 15 }, (_, i) =>
      JSON.stringify({ type: 'message', content: `line ${i}` }),
    );
    // Put timestamp on line 12 (0-indexed 11) — should NOT find it
    lines[11] = JSON.stringify({ timestamp: '2025-01-01T00:00:00Z' });

    const result = findFirstTimestamp(lines.join('\n'));

    expect(result).toBeNull();
  });
});
