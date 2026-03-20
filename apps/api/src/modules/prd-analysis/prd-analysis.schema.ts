import { z } from 'zod';

export const uploadPrdSchema = z.object({
  title: z.string().min(1).max(500).optional(),
});

export const startAnalysisSchema = z.object({
  prdDocumentId: z.string().uuid(),
});

export const analysisHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
