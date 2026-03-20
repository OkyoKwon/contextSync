import { z } from 'zod';

export const planFilenameSchema = z.string().regex(/^[a-zA-Z0-9_-]+\.md$/);
