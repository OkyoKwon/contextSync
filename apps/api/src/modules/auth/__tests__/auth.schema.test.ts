import { describe, it, expect } from 'vitest';
import {
  upgradeSchema,
  updatePlanSchema,
  updateApiKeySchema,
  updateSupabaseTokenSchema,
} from '../auth.schema.js';

describe('Auth Schemas', () => {
  describe('upgradeSchema', () => {
    it('should accept valid name, email, and autoUserId', () => {
      const result = upgradeSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        autoUserId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = upgradeSchema.safeParse({
        name: '',
        email: 'test@example.com',
        autoUserId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = upgradeSchema.safeParse({
        name: 'Test User',
        email: 'not-an-email',
        autoUserId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-uuid autoUserId', () => {
      const result = upgradeSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        autoUserId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing autoUserId', () => {
      const result = upgradeSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePlanSchema', () => {
    it('should accept all valid plan values', () => {
      const plans = ['free', 'pro', 'max_5x', 'max_20x', 'team', 'enterprise'] as const;
      for (const claudePlan of plans) {
        const result = updatePlanSchema.safeParse({ claudePlan });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid plan value', () => {
      const result = updatePlanSchema.safeParse({ claudePlan: 'premium' });
      expect(result.success).toBe(false);
    });

    it('should reject missing claudePlan', () => {
      const result = updatePlanSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('updateApiKeySchema', () => {
    it('should accept a valid API key', () => {
      const result = updateApiKeySchema.safeParse({ apiKey: 'sk-ant-12345' });
      expect(result.success).toBe(true);
    });

    it('should reject empty API key', () => {
      const result = updateApiKeySchema.safeParse({ apiKey: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSupabaseTokenSchema', () => {
    it('should accept a valid token', () => {
      const result = updateSupabaseTokenSchema.safeParse({ token: 'sbp_abc123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const result = updateSupabaseTokenSchema.safeParse({ token: '' });
      expect(result.success).toBe(false);
    });
  });
});
