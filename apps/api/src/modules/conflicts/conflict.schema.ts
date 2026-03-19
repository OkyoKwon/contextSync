import { z } from 'zod';

export const conflictFilterSchema = z.object({
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  status: z.enum(['detected', 'reviewing', 'resolved', 'dismissed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateConflictSchema = z.object({
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
});
