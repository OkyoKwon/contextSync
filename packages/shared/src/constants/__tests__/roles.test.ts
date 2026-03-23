import { describe, it, expect } from 'vitest';
import { USER_ROLES } from '../roles.js';

describe('USER_ROLES', () => {
  it('should contain owner and member', () => {
    expect(USER_ROLES).toContain('owner');
    expect(USER_ROLES).toContain('member');
  });

  it('should have exactly two roles', () => {
    expect(USER_ROLES.length).toBe(2);
  });
});
