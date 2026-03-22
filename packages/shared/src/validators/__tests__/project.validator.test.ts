import { describe, it, expect } from 'vitest';
import { validateProjectName, validateRepoUrl } from '../project.validator.js';

describe('validateProjectName', () => {
  it('should accept a valid project name', () => {
    const result = validateProjectName('My Project');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject an empty string', () => {
    const result = validateProjectName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Project name is required');
  });

  it('should reject a whitespace-only string', () => {
    const result = validateProjectName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Project name is required');
  });

  it('should accept a name with exactly 255 characters', () => {
    const name = 'a'.repeat(255);
    const result = validateProjectName(name);
    expect(result.valid).toBe(true);
  });

  it('should reject a name with 256 characters', () => {
    const name = 'a'.repeat(256);
    const result = validateProjectName(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Project name must be 255 characters or less');
  });
});

describe('validateRepoUrl', () => {
  it('should accept a valid https URL', () => {
    const result = validateRepoUrl('https://github.com/user/repo');
    expect(result.valid).toBe(true);
  });

  it('should accept a valid http URL', () => {
    const result = validateRepoUrl('http://github.com/user/repo');
    expect(result.valid).toBe(true);
  });

  it('should reject an ftp URL', () => {
    const result = validateRepoUrl('ftp://files.example.com/repo');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Repository URL must use http or https');
  });

  it('should reject an invalid URL format', () => {
    const result = validateRepoUrl('not-a-url');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid repository URL format');
  });

  it('should accept an empty string (optional field)', () => {
    const result = validateRepoUrl('');
    expect(result.valid).toBe(true);
  });
});
