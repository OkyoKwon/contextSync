import { z } from 'zod';

export const sessionFilterSchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const tokenUsageQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});
