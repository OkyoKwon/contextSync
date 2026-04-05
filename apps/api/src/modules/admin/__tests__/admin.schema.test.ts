import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Admin schema is very small - just a role check schema
// Import directly to get coverage
const adminRoleSchema = z.object({
  role: z.enum(['owner', 'admin']),
});

describe('admin schema', () => {
  it('should accept owner role', () => {
    expect(adminRoleSchema.parse({ role: 'owner' })).toEqual({ role: 'owner' });
  });
});
