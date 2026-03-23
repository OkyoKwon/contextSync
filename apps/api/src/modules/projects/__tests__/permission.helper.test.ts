import { describe, it, expect } from 'vitest';
import { getPermissions } from '../permission.helper.js';

describe('getPermissions', () => {
  describe('owner role', () => {
    const permissions = getPermissions('owner');

    it('returns 8 permissions', () => {
      expect(permissions.size).toBe(8);
    });

    it('has project:delete', () => {
      expect(permissions.has('project:delete')).toBe(true);
    });

    it('has all permissions', () => {
      const expected = [
        'project:delete',
        'project:edit',
        'collaborator:manage',
        'session:create',
        'session:edit_own',
        'session:edit_others',
        'conflict:resolve',
        'data:read',
      ] as const;
      for (const perm of expected) {
        expect(permissions.has(perm)).toBe(true);
      }
    });
  });

  describe('member role', () => {
    const permissions = getPermissions('member');

    it('returns 4 permissions', () => {
      expect(permissions.size).toBe(4);
    });

    it('has session:create, session:edit_own, conflict:resolve, data:read', () => {
      expect(permissions.has('session:create')).toBe(true);
      expect(permissions.has('session:edit_own')).toBe(true);
      expect(permissions.has('conflict:resolve')).toBe(true);
      expect(permissions.has('data:read')).toBe(true);
    });

    it('does NOT have project:edit', () => {
      expect(permissions.has('project:edit')).toBe(false);
    });

    it('does NOT have collaborator:manage', () => {
      expect(permissions.has('collaborator:manage')).toBe(false);
    });

    it('does NOT have session:edit_others', () => {
      expect(permissions.has('session:edit_others')).toBe(false);
    });

    it('does NOT have project:delete', () => {
      expect(permissions.has('project:delete')).toBe(false);
    });
  });

  describe('shared permissions across all roles', () => {
    const roles = ['owner', 'member'] as const;

    it('all roles have data:read', () => {
      for (const role of roles) {
        expect(getPermissions(role).has('data:read')).toBe(true);
      }
    });

    it('all roles have session:create', () => {
      for (const role of roles) {
        expect(getPermissions(role).has('session:create')).toBe(true);
      }
    });
  });
});
