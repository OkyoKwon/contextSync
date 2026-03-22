import { z } from 'zod';

export const testConnectionSchema = z.object({
  connectionUrl: z.string().min(1, 'Connection URL is required'),
  provider: z.enum(['self-hosted', 'supabase']).default('self-hosted'),
  sslEnabled: z.boolean().default(true),
});

export const saveDbConfigSchema = z.object({
  connectionUrl: z.string().min(1, 'Connection URL is required'),
  provider: z.enum(['self-hosted', 'supabase']).default('self-hosted'),
  sslEnabled: z.boolean().default(true),
});

export type TestConnectionInput = z.infer<typeof testConnectionSchema>;
export type SaveDbConfigInput = z.infer<typeof saveDbConfigSchema>;
