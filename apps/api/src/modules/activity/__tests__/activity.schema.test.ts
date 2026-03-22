import { describe, it, expect } from 'vitest';
import { activityQuerySchema } from '../activity.schema.js';

describe('Activity Schemas', () => {
  describe('activityQuerySchema', () => {
    it('should apply defaults when no input provided', () => {
      const result = activityQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept valid page and limit', () => {
      const result = activityQuerySchema.safeParse({ page: 3, limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject page less than 1', () => {
      const result = activityQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = activityQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
