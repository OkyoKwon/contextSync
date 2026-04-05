import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, readdir, stat } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { scanCodebase } from '../codebase-scanner.js';

const mockReadFile = vi.mocked(readFile);
const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scanCodebase', () => {
  it('should scan directory and return files', async () => {
    // Root .gitignore
    mockReadFile.mockResolvedValueOnce('');

    // Root readdir
    mockReaddir.mockResolvedValueOnce([
      { name: 'package.json', isFile: () => true, isDirectory: () => false } as any,
      { name: 'src', isFile: () => false, isDirectory: () => true } as any,
      { name: 'node_modules', isFile: () => false, isDirectory: () => true } as any,
    ]);

    // stat for package.json
    mockStat.mockResolvedValueOnce({ size: 500 } as any);
    // readFile for package.json
    mockReadFile.mockResolvedValueOnce('{"name": "test"}');

    // src readdir
    mockReaddir.mockResolvedValueOnce([
      { name: 'index.ts', isFile: () => true, isDirectory: () => false } as any,
    ]);

    // stat for src/index.ts
    mockStat.mockResolvedValueOnce({ size: 200 } as any);
    // readFile for src/index.ts
    mockReadFile.mockResolvedValueOnce('export const x = 1;');

    const result = await scanCodebase('/test/project');

    expect(result.files.length).toBeGreaterThanOrEqual(1);
    expect(result.totalFiles).toBeGreaterThanOrEqual(1);
    // package.json should be prioritized
    expect(result.files[0]!.isPriority).toBe(true);
  });

  it('should skip node_modules directory', async () => {
    mockReadFile.mockResolvedValueOnce(''); // gitignore
    mockReaddir.mockResolvedValueOnce([
      { name: 'node_modules', isFile: () => false, isDirectory: () => true } as any,
    ]);

    const result = await scanCodebase('/test/project');

    expect(result.files).toHaveLength(0);
  });

  it('should skip files larger than max size', async () => {
    mockReadFile.mockResolvedValueOnce(''); // gitignore
    mockReaddir.mockResolvedValueOnce([
      { name: 'big.ts', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockResolvedValueOnce({ size: 200 * 1024 } as any); // 200KB > 100KB limit

    const result = await scanCodebase('/test/project');

    expect(result.files).toHaveLength(0);
  });

  it('should handle empty directory', async () => {
    mockReadFile.mockResolvedValueOnce(''); // gitignore
    mockReaddir.mockResolvedValueOnce([]);

    const result = await scanCodebase('/test/empty');

    expect(result.files).toEqual([]);
    expect(result.totalFiles).toBe(0);
  });
});
