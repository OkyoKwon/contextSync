import { z } from 'zod';

export const loginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const identifySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
});

export type IdentifyInput = z.infer<typeof identifySchema>;

export const identifySelectSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type IdentifySelectInput = z.infer<typeof identifySelectSchema>;

export const upgradeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  autoUserId: z.string().uuid('Invalid user ID'),
});

export type UpgradeInput = z.infer<typeof upgradeSchema>;

export const updatePlanSchema = z.object({
  claudePlan: z.enum(['free', 'pro', 'max_5x', 'max_20x', 'team', 'enterprise']),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export const updateApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;

export const updateSupabaseTokenSchema = z.object({
  token: z.string().min(1, 'Supabase access token is required'),
});

export type UpdateSupabaseTokenInput = z.infer<typeof updateSupabaseTokenSchema>;
