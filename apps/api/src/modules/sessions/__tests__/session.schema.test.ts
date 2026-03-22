import { describe, it, expect } from 'vitest';
import {
  sessionFilterSchema,
  tokenUsageQuerySchema,
  updateSessionSchema,
} from '../session.schema.js';

describe('Session Schemas', () => {
  describe('sessionFilterSchema', () => {
    it('should apply defaults for page and limit when empty', () => {
      const result = sessionFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept all valid filter fields', () => {
      const result = sessionFilterSchema.safeParse({
        status: 'active',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status value', () => {
      const result = sessionFilterSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should reject non-uuid userId', () => {
      const result = sessionFilterSchema.safeParse({ userId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject page less than 1', () => {
      const result = sessionFilterSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = sessionFilterSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('tokenUsageQuerySchema', () => {
    it('should default to 30d when no period provided', () => {
      const result = tokenUsageQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe('30d');
      }
    });

    it('should accept valid period values', () => {
      for (const period of ['7d', '30d', '90d'] as const) {
        const result = tokenUsageQuerySchema.safeParse({ period });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid period', () => {
      const result = tokenUsageQuerySchema.safeParse({ period: '1y' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSessionSchema', () => {
    it('should accept valid partial update', () => {
      const result = updateSessionSchema.safeParse({
        title: 'New Title',
        status: 'completed',
        tags: ['bug', 'feature'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = updateSessionSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });
});
