import { describe, it, expect } from 'vitest';
import {
  conflictFilterSchema,
  updateConflictSchema,
  assignReviewerSchema,
  reviewNotesSchema,
  batchResolveSchema,
} from '../conflict.schema.js';

describe('conflictFilterSchema', () => {
  it('should apply defaults when no input provided', () => {
    const result = conflictFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(50);
      expect(result.data.severity).toBeUndefined();
      expect(result.data.status).toBeUndefined();
      expect(result.data.since).toBeUndefined();
    }
  });

  it('should accept valid severity values', () => {
    for (const severity of ['info', 'warning', 'critical'] as const) {
      const result = conflictFilterSchema.safeParse({ severity });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid severity', () => {
    const result = conflictFilterSchema.safeParse({ severity: 'urgent' });
    expect(result.success).toBe(false);
  });

  it('should accept valid status values', () => {
    for (const status of ['detected', 'reviewing', 'resolved', 'dismissed'] as const) {
      const result = conflictFilterSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = conflictFilterSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('should accept valid ISO datetime with offset for since', () => {
    const result = conflictFilterSchema.safeParse({ since: '2025-01-01T00:00:00.000Z' });
    expect(result.success).toBe(true);
  });

  it('should reject non-datetime string for since', () => {
    const result = conflictFilterSchema.safeParse({ since: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('should reject page less than 1', () => {
    const result = conflictFilterSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit greater than 200', () => {
    const result = conflictFilterSchema.safeParse({ limit: 201 });
    expect(result.success).toBe(false);
  });

  it('should reject limit less than 1', () => {
    const result = conflictFilterSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should coerce string numbers for page and limit', () => {
    const result = conflictFilterSchema.safeParse({ page: '2', limit: '30' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(30);
    }
  });
});

describe('updateConflictSchema', () => {
  it('should accept valid statuses', () => {
    for (const status of ['reviewing', 'resolved', 'dismissed'] as const) {
      const result = updateConflictSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('should reject detected status (cannot go back)', () => {
    const result = updateConflictSchema.safeParse({ status: 'detected' });
    expect(result.success).toBe(false);
  });

  it('should reject empty object', () => {
    const result = updateConflictSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('assignReviewerSchema', () => {
  it('should accept valid UUID', () => {
    const result = assignReviewerSchema.safeParse({
      reviewerId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-UUID string', () => {
    const result = assignReviewerSchema.safeParse({ reviewerId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject missing reviewerId', () => {
    const result = assignReviewerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('reviewNotesSchema', () => {
  it('should accept valid review notes', () => {
    const result = reviewNotesSchema.safeParse({ reviewNotes: 'Looks good.' });
    expect(result.success).toBe(true);
  });

  it('should reject empty string', () => {
    const result = reviewNotesSchema.safeParse({ reviewNotes: '' });
    expect(result.success).toBe(false);
  });

  it('should reject string exceeding 5000 characters', () => {
    const result = reviewNotesSchema.safeParse({ reviewNotes: 'a'.repeat(5001) });
    expect(result.success).toBe(false);
  });

  it('should accept string at max boundary (5000 chars)', () => {
    const result = reviewNotesSchema.safeParse({ reviewNotes: 'a'.repeat(5000) });
    expect(result.success).toBe(true);
  });
});

describe('batchResolveSchema', () => {
  it('should accept resolved status', () => {
    const result = batchResolveSchema.safeParse({ status: 'resolved' });
    expect(result.success).toBe(true);
  });

  it('should accept dismissed status', () => {
    const result = batchResolveSchema.safeParse({ status: 'dismissed' });
    expect(result.success).toBe(true);
  });

  it('should reject reviewing status', () => {
    const result = batchResolveSchema.safeParse({ status: 'reviewing' });
    expect(result.success).toBe(false);
  });

  it('should reject detected status', () => {
    const result = batchResolveSchema.safeParse({ status: 'detected' });
    expect(result.success).toBe(false);
  });
});
