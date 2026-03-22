import { describe, it, expect } from 'vitest';
import { generateJoinCode } from '../join-code.js';

describe('generateJoinCode', () => {
  it('should return a 6-character string', () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(6);
  });

  it('should be uppercase alphanumeric', () => {
    const code = generateJoinCode();
    expect(code).toMatch(/^[A-Z0-9_-]{6}$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateJoinCode());
    }
    // With 100 random 6-char codes, collisions should be extremely rare
    expect(codes.size).toBeGreaterThanOrEqual(95);
  });
});
