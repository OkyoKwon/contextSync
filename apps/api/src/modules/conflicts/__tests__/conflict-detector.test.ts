import { describe, it, expect } from 'vitest';
import { detectFileConflicts, determineSeverity } from '../conflict-detector.js';

describe('detectFileConflicts', () => {
  const baseSession = {
    id: 'session-new',
    userId: 'user-a',
    filePaths: ['src/auth/login.ts', 'src/auth/register.ts', 'src/utils/hash.ts'],
  };

  it('should return no conflicts when no overlapping files', () => {
    const existing = [
      {
        id: 'session-old',
        userId: 'user-b',
        filePaths: ['src/dashboard/index.ts'],
        title: 'Dashboard work',
      },
    ];

    const conflicts = detectFileConflicts(baseSession, existing);
    expect(conflicts).toHaveLength(0);
  });

  it('should detect conflict when files overlap with another user', () => {
    const existing = [
      {
        id: 'session-old',
        userId: 'user-b',
        filePaths: ['src/auth/login.ts', 'src/api/routes.ts'],
        title: 'Auth update',
      },
    ];

    const conflicts = detectFileConflicts(baseSession, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.overlappingPaths).toContain('src/auth/login.ts');
    expect(conflicts[0]!.severity).toBe('info');
  });

  it('should NOT detect conflict for same user', () => {
    const existing = [
      {
        id: 'session-old',
        userId: 'user-a',
        filePaths: ['src/auth/login.ts'],
        title: 'My previous work',
      },
    ];

    const conflicts = detectFileConflicts(baseSession, existing);
    expect(conflicts).toHaveLength(0);
  });

  it('should NOT detect conflict when new session has no file paths', () => {
    const emptySession = { id: 'session-new', userId: 'user-a', filePaths: [] as string[] };
    const existing = [
      {
        id: 'session-old',
        userId: 'user-b',
        filePaths: ['src/auth/login.ts'],
        title: 'Work',
      },
    ];

    const conflicts = detectFileConflicts(emptySession, existing);
    expect(conflicts).toHaveLength(0);
  });

  it('should detect multiple conflicts across sessions', () => {
    const existing = [
      { id: 'session-1', userId: 'user-b', filePaths: ['src/auth/login.ts'], title: 'A' },
      { id: 'session-2', userId: 'user-c', filePaths: ['src/utils/hash.ts'], title: 'B' },
    ];

    const conflicts = detectFileConflicts(baseSession, existing);
    expect(conflicts).toHaveLength(2);
  });

  it('should assign warning severity for 4-7 overlapping files', () => {
    const paths = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts'];
    const newSession = {
      id: 'session-new',
      userId: 'user-a',
      filePaths: paths,
    };

    const existing = [
      {
        id: 'session-old',
        userId: 'user-b',
        filePaths: ['a.ts', 'b.ts', 'c.ts', 'd.ts'],
        title: 'Work',
      },
    ];

    const conflicts = detectFileConflicts(newSession, existing);
    expect(conflicts[0]!.severity).toBe('warning');
  });

  it('should assign critical severity for 8+ overlapping files', () => {
    const paths = Array.from({ length: 9 }, (_, i) => `src/file${i}.ts`);
    const newSession = { id: 'new', userId: 'user-a', filePaths: paths };
    const existing = [
      {
        id: 'old',
        userId: 'user-b',
        filePaths: paths,
        title: 'Big change',
      },
    ];

    const conflicts = detectFileConflicts(newSession, existing);
    expect(conflicts[0]!.severity).toBe('critical');
  });
});

describe('determineSeverity', () => {
  it('should return info for 1-3 overlaps', () => {
    expect(determineSeverity(1)).toBe('info');
    expect(determineSeverity(3)).toBe('info');
  });

  it('should return warning for 4-7 overlaps', () => {
    expect(determineSeverity(4)).toBe('warning');
    expect(determineSeverity(7)).toBe('warning');
  });

  it('should return critical for 8+ overlaps', () => {
    expect(determineSeverity(8)).toBe('critical');
    expect(determineSeverity(100)).toBe('critical');
  });
});
