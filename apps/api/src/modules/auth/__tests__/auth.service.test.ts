import { describe, it, expect } from 'vitest';
import { loginSchema } from '../auth.schema.js';

describe('Auth', () => {
  describe('loginSchema', () => {
    it('should accept valid name and email', () => {
      const result = loginSchema.safeParse({ name: 'Test User', email: 'test@example.com' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test User', email: 'test@example.com' });
      }
    });

    it('should reject empty name', () => {
      const result = loginSchema.safeParse({ name: '', email: 'test@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ name: 'Test', email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({ name: 'Test' });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 255 characters', () => {
      const result = loginSchema.safeParse({ name: 'a'.repeat(256), email: 'test@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = `${'a'.repeat(244)}@example.com`;
      const result = loginSchema.safeParse({ name: 'Test', email: longEmail });
      expect(result.success).toBe(false);
    });
  });
});
