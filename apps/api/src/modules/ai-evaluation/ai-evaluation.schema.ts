import { z } from 'zod';

export const triggerEvaluationSchema = z.object({
  targetUserId: z.string().uuid(),
  dateRangeStart: z.string().datetime().optional(),
  dateRangeEnd: z.string().datetime().optional(),
  maxSessions: z.coerce.number().int().min(1).max(100).optional(),
});

export const latestEvaluationQuerySchema = z.object({
  targetUserId: z.string().uuid(),
});

export const evaluationHistoryQuerySchema = z.object({
  targetUserId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const backfillTranslationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
