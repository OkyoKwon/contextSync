import { describe, it, expect } from 'vitest';
import {
  triggerEvaluationSchema,
  latestEvaluationQuerySchema,
  evaluationHistoryQuerySchema,
  backfillTranslationsSchema,
} from '../ai-evaluation.schema.js';

describe('triggerEvaluationSchema', () => {
  it('should_accept_valid_input_with_required_fields_only', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should_accept_valid_input_with_all_optional_fields', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      dateRangeStart: '2025-01-01T00:00:00Z',
      dateRangeEnd: '2025-12-31T23:59:59Z',
      maxSessions: 50,
    });
    expect(result.success).toBe(true);
  });

  it('should_reject_invalid_uuid_for_targetUserId', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_missing_targetUserId', () => {
    const result = triggerEvaluationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should_reject_invalid_datetime_for_dateRangeStart', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      dateRangeStart: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should_coerce_maxSessions_from_string', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      maxSessions: '25',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxSessions).toBe(25);
    }
  });

  it('should_reject_maxSessions_below_1', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      maxSessions: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_maxSessions_above_100', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      maxSessions: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_non_integer_maxSessions', () => {
    const result = triggerEvaluationSchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      maxSessions: 5.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('latestEvaluationQuerySchema', () => {
  it('should_accept_valid_uuid', () => {
    const result = latestEvaluationQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should_reject_missing_targetUserId', () => {
    const result = latestEvaluationQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should_reject_invalid_uuid', () => {
    const result = latestEvaluationQuerySchema.safeParse({
      targetUserId: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('evaluationHistoryQuerySchema', () => {
  it('should_accept_valid_input_with_defaults', () => {
    const result = evaluationHistoryQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should_coerce_page_and_limit_from_strings', () => {
    const result = evaluationHistoryQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      page: '3',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should_reject_page_below_1', () => {
    const result = evaluationHistoryQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      page: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should_reject_limit_above_100', () => {
    const result = evaluationHistoryQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should_accept_boundary_values', () => {
    const result = evaluationHistoryQuerySchema.safeParse({
      targetUserId: '550e8400-e29b-41d4-a716-446655440000',
      page: 1,
      limit: 100,
    });
    expect(result.success).toBe(true);
  });
});

describe('backfillTranslationsSchema', () => {
  it('should_apply_default_limit_of_10', () => {
    const result = backfillTranslationsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('should_coerce_limit_from_string', () => {
    const result = backfillTranslationsSchema.safeParse({ limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it('should_reject_limit_below_1', () => {
    const result = backfillTranslationsSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should_reject_limit_above_50', () => {
    const result = backfillTranslationsSchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it('should_accept_boundary_values', () => {
    const min = backfillTranslationsSchema.safeParse({ limit: 1 });
    const max = backfillTranslationsSchema.safeParse({ limit: 50 });
    expect(min.success).toBe(true);
    expect(max.success).toBe(true);
  });
});
