import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

vi.mock('../token-usage.repository.js', () => ({
  getModelBreakdown: vi.fn(),
  getDailyUsage: vi.fn(),
  getTotalMessageCount: vi.fn(),
}));

import { assertProjectAccess } from '../../projects/project.service.js';
import * as tokenUsageRepo from '../token-usage.repository.js';
import { getTokenUsageStats } from '../token-usage.service.js';

const mockAssertAccess = vi.mocked(assertProjectAccess);
const mockGetModelBreakdown = vi.mocked(tokenUsageRepo.getModelBreakdown);
const mockGetDailyUsage = vi.mocked(tokenUsageRepo.getDailyUsage);
const mockGetTotalMessageCount = vi.mocked(tokenUsageRepo.getTotalMessageCount);

const db = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAccess.mockResolvedValue(undefined as any);
});

describe('getTokenUsageStats', () => {
  it('should return aggregated token usage stats', async () => {
    mockGetModelBreakdown.mockResolvedValue([
      { model_used: 'claude-3-5-sonnet-20241022', total_tokens: '5000', message_count: '10' },
      { model_used: 'claude-3-5-haiku-20241022', total_tokens: '2000', message_count: '5' },
    ] as any);
    mockGetDailyUsage.mockResolvedValue([
      { date: '2025-01-01', model_used: 'claude-3-5-sonnet-20241022', total_tokens: '3000' },
      { date: '2025-01-01', model_used: 'claude-3-5-haiku-20241022', total_tokens: '1000' },
      { date: '2025-01-02', model_used: 'claude-3-5-sonnet-20241022', total_tokens: '2000' },
    ] as any);
    mockGetTotalMessageCount.mockResolvedValue({ total: 15, measured: 12 });

    const result = await getTokenUsageStats(db, 'proj-1', 'user-1', '7d');

    expect(result.totalTokens).toBe(7000);
    expect(result.totalMessages).toBe(15);
    expect(result.measuredMessages).toBe(12);
    expect(result.modelBreakdown).toHaveLength(2);
    expect(result.modelBreakdown[0]!.totalTokens).toBe(5000);
    expect(result.dailyUsage).toHaveLength(2);
    expect(result.periodStart).toBeDefined();
    expect(result.periodEnd).toBeDefined();
  });

  it('should handle empty data', async () => {
    mockGetModelBreakdown.mockResolvedValue([]);
    mockGetDailyUsage.mockResolvedValue([]);
    mockGetTotalMessageCount.mockResolvedValue({ total: 0, measured: 0 });

    const result = await getTokenUsageStats(db, 'proj-1', 'user-1', '30d');

    expect(result.totalTokens).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.modelBreakdown).toHaveLength(0);
    expect(result.dailyUsage).toHaveLength(0);
  });

  it('should check project access', async () => {
    mockGetModelBreakdown.mockResolvedValue([]);
    mockGetDailyUsage.mockResolvedValue([]);
    mockGetTotalMessageCount.mockResolvedValue({ total: 0, measured: 0 });

    await getTokenUsageStats(db, 'proj-1', 'user-1', '7d');

    expect(mockAssertAccess).toHaveBeenCalledWith(db, 'proj-1', 'user-1');
  });

  it('should normalize model names and merge duplicates', async () => {
    mockGetModelBreakdown.mockResolvedValue([
      { model_used: 'claude-3-5-sonnet-20241022', total_tokens: '3000', message_count: '5' },
      { model_used: 'claude-3.5-sonnet', total_tokens: '2000', message_count: '3' },
    ] as any);
    mockGetDailyUsage.mockResolvedValue([]);
    mockGetTotalMessageCount.mockResolvedValue({ total: 8, measured: 8 });

    const result = await getTokenUsageStats(db, 'proj-1', 'user-1', '7d');

    // Both should merge into the same normalized model name
    expect(result.totalTokens).toBe(5000);
  });

  it('should calculate percentage per model', async () => {
    mockGetModelBreakdown.mockResolvedValue([
      { model_used: 'claude-sonnet', total_tokens: '7500', message_count: '10' },
      { model_used: 'claude-haiku', total_tokens: '2500', message_count: '5' },
    ] as any);
    mockGetDailyUsage.mockResolvedValue([]);
    mockGetTotalMessageCount.mockResolvedValue({ total: 15, measured: 15 });

    const result = await getTokenUsageStats(db, 'proj-1', 'user-1', '7d');

    expect(result.modelBreakdown[0]!.percentage).toBe(75);
    expect(result.modelBreakdown[1]!.percentage).toBe(25);
  });
});
