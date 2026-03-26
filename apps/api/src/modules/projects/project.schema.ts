import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  repoUrl: z.string().url().optional(),
  localDirectory: z.string().max(1024).optional(),
  databaseMode: z.enum(['local', 'remote']).default('local'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  repoUrl: z.string().url().optional(),
  localDirectory: z.string().max(1024).nullable().optional(),
});

export const setMyDirectorySchema = z.object({
  localDirectory: z.string().max(1024).nullable(),
});

export const joinProjectSchema = z.object({
  code: z.string().min(4).max(8),
});

export const removeCollaboratorQuerySchema = z.object({
  deleteData: z.coerce.boolean().default(false),
});
