import { describe, it, expect } from 'vitest';
import { autoSetupExistingSchema, autoSetupNewSchema } from '../supabase-onboarding.schema.js';

describe('Supabase Onboarding Schemas', () => {
  describe('autoSetupExistingSchema', () => {
    it('should accept valid input', () => {
      const result = autoSetupExistingSchema.safeParse({
        supabaseProjectRef: 'abcdefghijklmnop',
        dbPassword: 'my-secure-password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty supabaseProjectRef', () => {
      const result = autoSetupExistingSchema.safeParse({
        supabaseProjectRef: '',
        dbPassword: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty dbPassword', () => {
      const result = autoSetupExistingSchema.safeParse({
        supabaseProjectRef: 'ref123',
        dbPassword: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = autoSetupExistingSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('autoSetupNewSchema', () => {
    it('should accept valid input', () => {
      const result = autoSetupNewSchema.safeParse({
        name: 'my-project',
        dbPassword: 'secure-password-123',
        region: 'us-east-1',
        organizationId: 'org-abc123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject name exceeding 40 characters', () => {
      const result = autoSetupNewSchema.safeParse({
        name: 'a'.repeat(41),
        dbPassword: 'secure-password-123',
        region: 'us-east-1',
        organizationId: 'org-abc123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject dbPassword shorter than 6 characters', () => {
      const result = autoSetupNewSchema.safeParse({
        name: 'my-project',
        dbPassword: '12345',
        region: 'us-east-1',
        organizationId: 'org-abc123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty region', () => {
      const result = autoSetupNewSchema.safeParse({
        name: 'my-project',
        dbPassword: 'secure-password-123',
        region: '',
        organizationId: 'org-abc123',
      });
      expect(result.success).toBe(false);
    });
  });
});
