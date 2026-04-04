import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDimensions, createEvidence } from '../ai-evaluation-detail.repository.js';

function createMockDb() {
  const execute = vi.fn().mockResolvedValue([]);
  const executeTakeFirst = vi.fn();

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returningAll = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.execute = execute;
  chain.executeTakeFirst = executeTakeFirst;

  return {
    insertInto: vi.fn().mockReturnValue(chain),
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _execute: execute,
  } as any;
}

const now = new Date('2025-01-01T00:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createDimensions', () => {
  it('should return empty array for empty input', async () => {
    const db = createMockDb();
    const result = await createDimensions(db, 'eval-1', []);
    expect(result).toEqual([]);
    expect(db.insertInto).not.toHaveBeenCalled();
  });

  it('should insert dimensions and return mapped results', async () => {
    const db = createMockDb();
    db._execute.mockResolvedValue([
      {
        id: 'dim-1',
        evaluation_id: 'eval-1',
        dimension: 'prompt_quality',
        score: 85,
        confidence: 90,
        summary: 'Good',
        summary_ko: null,
        strengths: ['clear'],
        strengths_ko: null,
        weaknesses: ['verbose'],
        weaknesses_ko: null,
        suggestions: ['be concise'],
        suggestions_ko: null,
        sort_order: 0,
        created_at: now,
      },
    ]);

    const result = await createDimensions(db, 'eval-1', [
      {
        dimension: 'prompt_quality',
        score: 85,
        confidence: 90,
        summary: 'Good',
        strengths: ['clear'],
        weaknesses: ['verbose'],
        suggestions: ['be concise'],
        sortOrder: 0,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].dimension).toBe('prompt_quality');
    expect(result[0].score).toBe(85);
  });
});

describe('createEvidence', () => {
  it('should return empty array for empty input', async () => {
    const db = createMockDb();
    const result = await createEvidence(db, []);
    expect(result).toEqual([]);
  });

  it('should validate message IDs before inserting', async () => {
    const db = createMockDb();
    // First execute: message ID validation query
    db._execute.mockResolvedValueOnce([{ id: 'msg-1' }]);
    // Second execute: insert evidence
    db._execute.mockResolvedValueOnce([
      {
        id: 'ev-1',
        dimension_id: 'dim-1',
        message_id: 'msg-1',
        session_id: 'sess-1',
        excerpt: 'example',
        sentiment: 'positive',
        annotation: 'Good prompt',
        annotation_ko: null,
        sort_order: 0,
        created_at: now,
      },
    ]);

    const result = await createEvidence(db, [
      {
        dimensionId: 'dim-1',
        messageId: 'msg-1',
        sessionId: 'sess-1',
        excerpt: 'example',
        sentiment: 'positive',
        annotation: 'Good prompt',
        sortOrder: 0,
      },
    ]);

    expect(result).toHaveLength(1);
  });

  it('should set invalid message IDs to null', async () => {
    const db = createMockDb();
    // No valid message IDs found
    db._execute.mockResolvedValueOnce([]);
    db._execute.mockResolvedValueOnce([
      {
        id: 'ev-1',
        dimension_id: 'dim-1',
        message_id: null,
        session_id: null,
        excerpt: 'ex',
        sentiment: 'neutral',
        annotation: 'note',
        annotation_ko: null,
        sort_order: 0,
        created_at: now,
      },
    ]);

    const result = await createEvidence(db, [
      {
        dimensionId: 'dim-1',
        messageId: 'invalid-id',
        sessionId: 'sess-1',
        excerpt: 'ex',
        sentiment: 'neutral',
        annotation: 'note',
        sortOrder: 0,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].messageId).toBeNull();
  });
});
