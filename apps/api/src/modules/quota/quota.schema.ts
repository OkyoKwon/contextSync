import { z } from 'zod';

export const detectPlanSchema = z.object({}).optional();

export type DetectPlanInput = z.infer<typeof detectPlanSchema>;
