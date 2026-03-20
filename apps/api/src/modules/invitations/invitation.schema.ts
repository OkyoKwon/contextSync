import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const respondInvitationSchema = z.object({
  token: z.string().min(1),
  action: z.enum(['accept', 'decline']),
});
