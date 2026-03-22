import { describe, it, expect } from 'vitest';
import {
  uploadPrdSchema,
  startAnalysisSchema,
  analysisHistoryQuerySchema,
} from '../prd-analysis.schema.js';

describe('PRD Analysis Schemas', () => {
  describe('uploadPrdSchema', () => {
    it('should accept empty object (title is optional)', () => {
      const result = uploadPrdSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid title', () => {
      const result = uploadPrdSchema.safeParse({ title: 'My PRD Document' });
      expect(result.success).toBe(true);
    });

    it('should reject empty title string', () => {
      const result = uploadPrdSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 500 characters', () => {
      const result = uploadPrdSchema.safeParse({ title: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('startAnalysisSchema', () => {
    it('should accept valid uuid for prdDocumentId', () => {
      const result = startAnalysisSchema.safeParse({
        prdDocumentId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-uuid prdDocumentId', () => {
      const result = startAnalysisSchema.safeParse({ prdDocumentId: 'abc123' });
      expect(result.success).toBe(false);
    });
  });

  describe('analysisHistoryQuerySchema', () => {
    it('should apply defaults when no input provided', () => {
      const result = analysisHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject limit greater than 100', () => {
      const result = analysisHistoryQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
