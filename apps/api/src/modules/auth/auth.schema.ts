import { z } from 'zod';

export const githubCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});
