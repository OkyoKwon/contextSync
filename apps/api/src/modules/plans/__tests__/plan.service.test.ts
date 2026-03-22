import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('../plan-project.service.js', () => ({
  getPlanProjectMapping: vi.fn(),
}));

import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { getPlanProjectMapping } from '../plan-project.service.js';
import { listPlans, getPlanDetail, deletePlan } from '../plan.service.js';

const mockReaddir = readdir as ReturnType<typeof vi.fn>;
const mockReadFile = readFile as ReturnType<typeof vi.fn>;
const mockStat = stat as ReturnType<typeof vi.fn>;
const mockUnlink = unlink as ReturnType<typeof vi.fn>;
const mockGetPlanProjectMapping = getPlanProjectMapping as ReturnType<typeof vi.fn>;

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPlanProjectMapping.mockResolvedValue(new Map());
});

describe('listPlans', () => {
  it('should return list of plan summaries', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'plan-a.md', isFile: () => true },
      { name: 'plan-b.md', isFile: () => true },
    ]);
    mockStat.mockResolvedValue({ size: 1024, mtimeMs: Date.now() });
    mockReadFile.mockResolvedValue('# My Plan\n\nContent here');

    const result = await listPlans(db);

    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe('My Plan');
    expect(result[0]?.sizeBytes).toBe(1024);
  });

  it('should skip non-markdown files', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'readme.txt', isFile: () => true },
      { name: 'plan.md', isFile: () => true },
    ]);
    mockStat.mockResolvedValue({ size: 512, mtimeMs: Date.now() });
    mockReadFile.mockResolvedValue('# Plan Title\n');

    const result = await listPlans(db);

    expect(result).toHaveLength(1);
    expect(result[0]?.filename).toBe('plan.md');
  });

  it('should skip directories', async () => {
    mockReaddir.mockResolvedValue([{ name: 'subdir', isFile: () => false }]);

    const result = await listPlans(db);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when plans directory does not exist', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT'));

    const result = await listPlans(db);

    expect(result).toEqual([]);
  });

  it('should extract title as Untitled when no heading found', async () => {
    mockReaddir.mockResolvedValue([{ name: 'no-title.md', isFile: () => true }]);
    mockStat.mockResolvedValue({ size: 100, mtimeMs: Date.now() });
    mockReadFile.mockResolvedValue('Just some content without a heading');

    const result = await listPlans(db);

    expect(result[0]?.title).toBe('Untitled');
  });

  it('should include project associations from mapping', async () => {
    const mapping = new Map([
      ['plan-a.md', [{ projectId: 'p1', projectName: 'Project 1', projectDirectory: '/dir' }]],
    ]);
    mockGetPlanProjectMapping.mockResolvedValue(mapping);
    mockReaddir.mockResolvedValue([{ name: 'plan-a.md', isFile: () => true }]);
    mockStat.mockResolvedValue({ size: 256, mtimeMs: Date.now() });
    mockReadFile.mockResolvedValue('# Plan A\n');

    const result = await listPlans(db);

    expect(result[0]?.projects).toEqual([
      { projectId: 'p1', projectName: 'Project 1', projectDirectory: '/dir' },
    ]);
  });

  it('should sort plans by lastModifiedAt descending', async () => {
    const now = Date.now();
    mockReaddir.mockResolvedValue([
      { name: 'old.md', isFile: () => true },
      { name: 'new.md', isFile: () => true },
    ]);

    let callCount = 0;
    mockStat.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        size: 100,
        mtimeMs: callCount === 1 ? now - 100000 : now,
      });
    });
    mockReadFile.mockResolvedValue('# Title\n');

    const result = await listPlans(db);

    expect(result[0]?.filename).toBe('new.md');
    expect(result[1]?.filename).toBe('old.md');
  });
});

describe('getPlanDetail', () => {
  it('should return plan detail for valid filename', async () => {
    mockStat.mockResolvedValue({ size: 2048, mtimeMs: Date.now() });
    mockReadFile.mockResolvedValue('# Detailed Plan\n\nLong content...');

    const result = await getPlanDetail(db, 'my-plan.md');

    expect(result.filename).toBe('my-plan.md');
    expect(result.title).toBe('Detailed Plan');
    expect(result.content).toBe('# Detailed Plan\n\nLong content...');
    expect(result.sizeBytes).toBe(2048);
  });

  it('should throw 400 for invalid filename', async () => {
    await expect(getPlanDetail(db, '../etc/passwd')).rejects.toThrow('Invalid plan filename');
  });

  it('should throw 400 for filename with spaces', async () => {
    await expect(getPlanDetail(db, 'my plan.md')).rejects.toThrow('Invalid plan filename');
  });

  it('should throw 404 when plan file does not exist', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockGetPlanProjectMapping.mockRejectedValue(new Error('ENOENT'));

    await expect(getPlanDetail(db, 'nonexistent.md')).rejects.toThrow(/Plan not found/);
  });
});

describe('deletePlan', () => {
  it('should delete plan file for valid filename', async () => {
    mockUnlink.mockResolvedValue(undefined);

    await deletePlan('my-plan.md');

    expect(mockUnlink).toHaveBeenCalled();
  });

  it('should throw 400 for invalid filename', async () => {
    await expect(deletePlan('../../etc/passwd')).rejects.toThrow('Invalid plan filename');
  });

  it('should throw 404 when file does not exist', async () => {
    mockUnlink.mockRejectedValue(new Error('ENOENT'));

    await expect(deletePlan('nonexistent.md')).rejects.toThrow(/Plan not found/);
  });
});
