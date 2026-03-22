import { describe, it, expect } from 'vitest';
import { SUPPORTED_PRD_EXTENSIONS, MAX_PRD_FILE_SIZE } from '../prd-analysis.js';

describe('SUPPORTED_PRD_EXTENSIONS', () => {
  it('should include .md and .txt', () => {
    expect(SUPPORTED_PRD_EXTENSIONS).toContain('.md');
    expect(SUPPORTED_PRD_EXTENSIONS).toContain('.txt');
  });

  it('should have all extensions starting with a dot', () => {
    for (const ext of SUPPORTED_PRD_EXTENSIONS) {
      expect(ext.startsWith('.'), `${ext} should start with '.'`).toBe(true);
    }
  });
});

describe('MAX_PRD_FILE_SIZE', () => {
  it('should be 512KB (524288 bytes)', () => {
    expect(MAX_PRD_FILE_SIZE).toBe(524288);
  });

  it('should be a positive number', () => {
    expect(MAX_PRD_FILE_SIZE).toBeGreaterThan(0);
  });
});
