import { z } from 'zod';

export const autoSetupExistingSchema = z.object({
  supabaseProjectRef: z.string().min(1, 'Project reference is required'),
  dbPassword: z.string().min(1, 'Database password is required'),
});

export type AutoSetupExistingInput = z.infer<typeof autoSetupExistingSchema>;

export const autoSetupNewSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(40),
  dbPassword: z.string().min(6, 'Password must be at least 6 characters'),
  region: z.string().min(1, 'Region is required'),
  organizationId: z.string().min(1, 'Organization is required'),
});

export type AutoSetupNewInput = z.infer<typeof autoSetupNewSchema>;
