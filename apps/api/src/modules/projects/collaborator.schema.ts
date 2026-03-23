import { z } from 'zod';

export const addCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'member']).optional(),
});
