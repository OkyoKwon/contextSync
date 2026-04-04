import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('../quota.repository.js', () => ({
  updateUserPlanDetection: vi.fn(),
  getUserPlanDetectionSource: vi.fn(),
}));

import * as quotaRepo from '../quota.repository.js';
import { getQuotaStatus, detectPlan } from '../quota.service.js';

const mockReadFile = vi.mocked(readFile);
const mockUpdatePlanDetection = vi.mocked(quotaRepo.updateUserPlanDetection);
const mockGetSource = vi.mocked(quotaRepo.getUserPlanDetectionSource);

function createMockDb() {
  const executeTakeFirst = vi.fn();
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.executeTakeFirst = executeTakeFirst;

  return {
    selectFrom: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _executeTakeFirst: executeTakeFirst,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getQuotaStatus', () => {
  it('should return CLI plan when detected from credentials', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'pro' },
      }),
    );

    const result = await getQuotaStatus(db, 'user-1');

    expect(result.inferredPlan).toBe('pro');
    expect(result.detectionSource).toBe('cli');
  });

  it('should fall back to DB plan when CLI returns free', async () => {
    const db = createMockDb();
    // Both CLI config reads fail → free
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    db._executeTakeFirst.mockResolvedValue({ claude_plan: 'pro' });
    mockGetSource.mockResolvedValue('manual');

    const result = await getQuotaStatus(db, 'user-1');

    expect(result.inferredPlan).toBe('pro');
    expect(result.detectionSource).toBe('manual');
  });

  it('should default detectionSource to manual when source is null', async () => {
    const db = createMockDb();
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    db._executeTakeFirst.mockResolvedValue({ claude_plan: 'free' });
    mockGetSource.mockResolvedValue(null);

    const result = await getQuotaStatus(db, 'user-1');

    expect(result.inferredPlan).toBe('free');
    expect(result.detectionSource).toBe('manual');
  });
});

describe('detectPlan', () => {
  it('should detect pro plan from credentials and update DB', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'pro' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('pro');
    expect(result.source).toBe('cli');
    expect(mockUpdatePlanDetection).toHaveBeenCalledWith(db, 'user-1', 'pro', 'cli');
  });

  it('should detect max_5x plan from credentials', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'max' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('max_5x');
    expect(result.source).toBe('cli');
  });

  it('should detect max_20x plan from credentials', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'max', rateLimitTier: '20x' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('max_20x');
    expect(result.source).toBe('cli');
  });

  it('should detect team plan from credentials', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'team' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('team');
  });

  it('should detect enterprise plan from credentials', async () => {
    const db = createMockDb();
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        claudeAiOauth: { subscriptionType: 'enterprise' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('enterprise');
  });

  it('should detect team plan from claude.json with org UUID', async () => {
    const db = createMockDb();
    // credentials.json fails
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    // claude.json succeeds
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        oauthAccount: { organizationUuid: 'org-123' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('team');
    expect(result.source).toBe('cli');
  });

  it('should detect pro plan from claude.json with stripe subscription', async () => {
    const db = createMockDb();
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        oauthAccount: { billingType: 'stripe_subscription' },
      }),
    );
    mockUpdatePlanDetection.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('pro');
    expect(result.source).toBe('cli');
  });

  it('should fall back to stored plan when no CLI config found', async () => {
    const db = createMockDb();
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    db._executeTakeFirst.mockResolvedValue({ claude_plan: 'pro' });

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('pro');
    expect(result.source).toBe('manual');
    expect(mockUpdatePlanDetection).not.toHaveBeenCalled();
  });

  it('should default to free when no config and no stored plan', async () => {
    const db = createMockDb();
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    db._executeTakeFirst.mockResolvedValue(undefined);

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('free');
    expect(result.source).toBe('manual');
  });

  it('should treat invalid stored plan as free', async () => {
    const db = createMockDb();
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    db._executeTakeFirst.mockResolvedValue({ claude_plan: 'unknown_plan' });

    const result = await detectPlan(db, 'user-1');

    expect(result.plan).toBe('free');
  });
});
