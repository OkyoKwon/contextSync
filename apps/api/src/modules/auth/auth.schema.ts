import { z } from 'zod';

export const loginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const upgradeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  autoUserId: z.string().uuid('Invalid user ID'),
});

export type UpgradeInput = z.infer<typeof upgradeSchema>;
