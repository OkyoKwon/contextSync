import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Db } from '../../database/client.js';
import type { ClaudePlan, QuotaStatus, PlanDetectionSource } from '@context-sync/shared';
import { CLAUDE_PLANS } from '@context-sync/shared';
import * as quotaRepo from './quota.repository.js';

export async function getQuotaStatus(db: Db, userId: string): Promise<QuotaStatus> {
  const cliPlan = await detectClaudePlanFromCli();
  if (cliPlan !== 'free') {
    return { inferredPlan: cliPlan, detectionSource: 'cli' };
  }

  const dbPlan = await getStoredPlan(db, userId);
  const source = await quotaRepo.getUserPlanDetectionSource(db, userId);

  return {
    inferredPlan: dbPlan,
    detectionSource: (source as PlanDetectionSource) ?? 'manual',
  };
}

export async function detectPlan(
  db: Db,
  userId: string,
): Promise<{ readonly plan: ClaudePlan; readonly source: PlanDetectionSource }> {
  const cliPlan = await detectClaudePlanFromCli();
  if (cliPlan !== 'free') {
    await quotaRepo.updateUserPlanDetection(db, userId, cliPlan, 'cli');
    return { plan: cliPlan, source: 'cli' };
  }

  const dbPlan = await getStoredPlan(db, userId);
  return { plan: dbPlan, source: 'manual' };
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

/**
 * Detect Claude plan from local CLI configuration files.
 *
 * Priority:
 * 1. ~/.claude/.credentials.json — claudeAiOauth.subscriptionType (claude.ai OAuth)
 * 2. ~/.claude.json — oauthAccount fields (Claude Code native auth)
 */
async function detectClaudePlanFromCli(): Promise<ClaudePlan> {
  // Try ~/.claude/.credentials.json first (claude.ai OAuth flow)
  const credentialsPlan = await detectFromCredentials();
  if (credentialsPlan !== 'free') return credentialsPlan;

  // Fallback: ~/.claude.json (Claude Code native auth)
  return detectFromClaudeJson();
}

async function detectFromCredentials(): Promise<ClaudePlan> {
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

async function detectFromClaudeJson(): Promise<ClaudePlan> {
  try {
    const claudeJsonPath = join(homedir(), '.claude.json');
    const raw = await readFile(claudeJsonPath, 'utf-8');
    const config = JSON.parse(raw) as {
      oauthAccount?: {
        organizationUuid?: string;
        billingType?: string;
      };
    };

    const { organizationUuid, billingType } = config.oauthAccount ?? {};

    // Organization present → team plan (orgs use team or enterprise)
    if (organizationUuid) return 'team';

    // Individual with active subscription → pro
    if (billingType === 'stripe_subscription') return 'pro';

    return 'free';
  } catch {
    return 'free';
  }
}
