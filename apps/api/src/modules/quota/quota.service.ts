import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Db } from '../../database/client.js';
import type {
  ClaudePlan,
  QuotaStatus,
  RateLimitSnapshot,
  PlanDetectionSource,
} from '@context-sync/shared';
import { inferPlanFromRequestsLimit, CLAUDE_PLANS } from '@context-sync/shared';
import * as quotaRepo from './quota.repository.js';

const SNAPSHOT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function saveRateLimitSnapshot(
  db: Db,
  userId: string,
  snapshot: RateLimitSnapshot,
): Promise<void> {
  await quotaRepo.insertSnapshot(db, userId, snapshot);

  if (snapshot.requestsLimit !== null) {
    const inferredPlan = inferPlanFromRequestsLimit(snapshot.requestsLimit);
    await quotaRepo.updateUserPlanDetection(db, userId, inferredPlan, 'rate-limit');
  }
}

export async function getQuotaStatus(db: Db, userId: string): Promise<QuotaStatus> {
  const snapshot = await quotaRepo.getLatestSnapshot(db, userId);

  // Try rate-limit inference first (if snapshot is fresh enough)
  if (snapshot && isSnapshotFresh(snapshot)) {
    const inferredPlan =
      snapshot.requestsLimit !== null
        ? inferPlanFromRequestsLimit(snapshot.requestsLimit)
        : ('free' as ClaudePlan);

    return {
      snapshot,
      inferredPlan,
      detectionSource: 'rate-limit',
      snapshotAge: getSnapshotAgeMs(snapshot),
    };
  }

  // Fallback to CLI detection
  const cliPlan = await detectClaudePlanFromCli();
  if (cliPlan !== 'free') {
    return {
      snapshot,
      inferredPlan: cliPlan,
      detectionSource: 'cli',
      snapshotAge: snapshot ? getSnapshotAgeMs(snapshot) : null,
    };
  }

  // Fallback to DB stored value
  const dbPlan = await getStoredPlan(db, userId);
  const source = await quotaRepo.getUserPlanDetectionSource(db, userId);

  return {
    snapshot,
    inferredPlan: dbPlan,
    detectionSource: (source as PlanDetectionSource) ?? 'manual',
    snapshotAge: snapshot ? getSnapshotAgeMs(snapshot) : null,
  };
}

export async function detectPlan(
  db: Db,
  userId: string,
): Promise<{ readonly plan: ClaudePlan; readonly source: PlanDetectionSource }> {
  // Priority 1: Rate limit inference (fresh snapshot)
  const snapshot = await quotaRepo.getLatestSnapshot(db, userId);
  if (snapshot && isSnapshotFresh(snapshot) && snapshot.requestsLimit !== null) {
    const plan = inferPlanFromRequestsLimit(snapshot.requestsLimit);
    await quotaRepo.updateUserPlanDetection(db, userId, plan, 'rate-limit');
    return { plan, source: 'rate-limit' };
  }

  // Priority 2: CLI credentials
  const cliPlan = await detectClaudePlanFromCli();
  if (cliPlan !== 'free') {
    await quotaRepo.updateUserPlanDetection(db, userId, cliPlan, 'cli');
    return { plan: cliPlan, source: 'cli' };
  }

  // Priority 3: Keep current DB value
  const dbPlan = await getStoredPlan(db, userId);
  return { plan: dbPlan, source: 'manual' };
}

function isSnapshotFresh(snapshot: RateLimitSnapshot): boolean {
  return getSnapshotAgeMs(snapshot) < SNAPSHOT_MAX_AGE_MS;
}

function getSnapshotAgeMs(snapshot: RateLimitSnapshot): number {
  return Date.now() - new Date(snapshot.capturedAt).getTime();
}

async function getStoredPlan(db: Db, userId: string): Promise<ClaudePlan> {
  const row = await db
    .selectFrom('users')
    .select('claude_plan')
    .where('id', '=', userId)
    .executeTakeFirst();

  const plan = row?.claude_plan ?? 'free';
  return CLAUDE_PLANS.includes(plan as ClaudePlan) ? (plan as ClaudePlan) : 'free';
}

async function detectClaudePlanFromCli(): Promise<ClaudePlan> {
  try {
    const credentialsPath = join(homedir(), '.claude', '.credentials.json');
    const raw = await readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(raw) as {
      claudeAiOauth?: {
        subscriptionType?: string;
        rateLimitTier?: string;
      };
    };

    const { subscriptionType, rateLimitTier } = credentials.claudeAiOauth ?? {};

    if (subscriptionType === 'max') {
      if (rateLimitTier?.includes('20x')) return 'max_20x';
      return 'max_5x';
    }
    if (subscriptionType === 'pro') return 'pro';
    if (subscriptionType === 'team') return 'team';
    if (subscriptionType === 'enterprise') return 'enterprise';

    return 'free';
  } catch {
    return 'free';
  }
}
