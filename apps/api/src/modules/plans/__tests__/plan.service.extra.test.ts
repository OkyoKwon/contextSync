import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdir, readFile, stat, unlink } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('../plan-project.service.js', () => ({
  getPlanProjectMapping: vi.fn(),
}));

import { listPlans, getPlanDetail, deletePlan } from '../plan.service.js';
import { getPlanProjectMapping } from '../plan-project.service.js';

const mockReaddir = vi.mocked(readdir);
const mockReadFile = vi.mocked(readFile);
const mockStat = vi.mocked(stat);
const mockUnlink = vi.mocked(unlink);
const mockGetMapping = vi.mocked(getPlanProjectMapping);

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMapping.mockResolvedValue(new Map());
});

describe('listPlans', () => {
  it('should return plan summaries from directory', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'plan-a.md', isFile: () => true, isDirectory: () => false } as any,
      { name: 'plan-b.md', isFile: () => true, isDirectory: () => false } as any,
      { name: 'not-md.txt', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() } as any);
    mockReadFile.mockResolvedValue('# My Plan\nContent here');

    const result = await listPlans(db);

    expect(result).toHaveLength(2);
    expect(result[0]!.title).toBe('My Plan');
    expect(result[0]!.sizeBytes).toBe(1024);
  });

  it('should return empty array when directory does not exist', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT'));

    const result = await listPlans(db);
    expect(result).toEqual([]);
  });

  it('should skip unreadable files', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'good.md', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockRejectedValue(new Error('Permission denied'));

    const result = await listPlans(db);
    expect(result).toEqual([]);
  });

  it('should use Untitled for plans without heading', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'no-title.md', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockResolvedValue({ size: 100, mtimeMs: Date.now() } as any);
    mockReadFile.mockResolvedValue('No heading here\nJust content');

    const result = await listPlans(db);
    expect(result[0]!.title).toBe('Untitled');
  });

  it('should include project mapping', async () => {
    const mapping = new Map([['plan.md', [{ id: 'p1', name: 'Project' }]]]);
    mockGetMapping.mockResolvedValue(mapping as any);
    mockReaddir.mockResolvedValue([
      { name: 'plan.md', isFile: () => true, isDirectory: () => false } as any,
    ]);
    mockStat.mockResolvedValue({ size: 100, mtimeMs: Date.now() } as any);
    mockReadFile.mockResolvedValue('# Plan');

    const result = await listPlans(db);
    expect(result[0]!.projects).toHaveLength(1);
  });
});

describe('getPlanDetail', () => {
  it('should return plan content and metadata', async () => {
    mockStat.mockResolvedValue({ size: 2048, mtimeMs: Date.now() } as any);
    mockReadFile.mockResolvedValue('# Detailed Plan\nStep 1...');

    const result = await getPlanDetail(db, 'my-plan.md');

    expect(result.filename).toBe('my-plan.md');
    expect(result.title).toBe('Detailed Plan');
    expect(result.content).toContain('Step 1');
    expect(result.sizeBytes).toBe(2048);
  });

  it('should throw 400 for invalid filename', async () => {
    await expect(getPlanDetail(db, '../../../etc/passwd')).rejects.toThrow();
    await expect(getPlanDetail(db, 'file with spaces.md')).rejects.toThrow();
  });

  it('should throw 404 when file not found', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));

    await expect(getPlanDetail(db, 'nonexistent.md')).rejects.toThrow();
  });
});

describe('deletePlan', () => {
  it('should unlink the plan file', async () => {
    mockUnlink.mockResolvedValue(undefined);

    await deletePlan('old-plan.md');

    expect(mockUnlink).toHaveBeenCalled();
  });

  it('should throw 404 when file not found', async () => {
    mockUnlink.mockRejectedValue(new Error('ENOENT'));

    await expect(deletePlan('nonexistent.md')).rejects.toThrow();
  });

  it('should throw 400 for invalid filename', async () => {
    await expect(deletePlan('../bad-path')).rejects.toThrow();
  });
});
