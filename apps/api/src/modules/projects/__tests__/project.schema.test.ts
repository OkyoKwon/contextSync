import { describe, it, expect } from 'vitest';
import { createProjectSchema, updateProjectSchema, joinProjectSchema } from '../project.schema.js';

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should accept valid input with required fields only', () => {
      const result = createProjectSchema.safeParse({ name: 'My Project' });
      expect(result.success).toBe(true);
    });

    it('should accept valid input with all optional fields', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
        description: 'A short description',
        repoUrl: 'https://github.com/user/repo',
        localDirectory: '/home/user/projects/my-project',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      const result = createProjectSchema.safeParse({ name: 'a'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 2000 characters', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
        description: 'a'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid repoUrl', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
        repoUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should accept empty object (all fields optional)', () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update with name only', () => {
      const result = updateProjectSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should accept null for localDirectory', () => {
      const result = updateProjectSchema.safeParse({ localDirectory: null });
      expect(result.success).toBe(true);
    });

    it('should reject empty name string', () => {
      const result = updateProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('joinProjectSchema', () => {
    it('should accept a valid join code', () => {
      const result = joinProjectSchema.safeParse({ code: 'ABCD1234' });
      expect(result.success).toBe(true);
    });

    it('should reject code shorter than 4 characters', () => {
      const result = joinProjectSchema.safeParse({ code: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should reject code longer than 8 characters', () => {
      const result = joinProjectSchema.safeParse({ code: 'ABCDEFGHI' });
      expect(result.success).toBe(false);
    });
  });
});
