import type { Db } from '../../database/client.js';
import type { RateLimitSnapshot } from '@context-sync/shared';

export async function insertSnapshot(
  db: Db,
  userId: string,
  snapshot: RateLimitSnapshot,
): Promise<void> {
  await db
    .insertInto('rate_limit_snapshots')
    .values({
      user_id: userId,
      requests_limit: snapshot.requestsLimit,
      requests_remaining: snapshot.requestsRemaining,
      requests_reset: snapshot.requestsReset,
      tokens_limit: snapshot.tokensLimit,
      tokens_remaining: snapshot.tokensRemaining,
      tokens_reset: snapshot.tokensReset,
      input_tokens_limit: snapshot.inputTokensLimit,
      input_tokens_remaining: snapshot.inputTokensRemaining,
      input_tokens_reset: snapshot.inputTokensReset,
      output_tokens_limit: snapshot.outputTokensLimit,
      output_tokens_remaining: snapshot.outputTokensRemaining,
      output_tokens_reset: snapshot.outputTokensReset,
    })
    .execute();
}

export async function getLatestSnapshot(db: Db, userId: string): Promise<RateLimitSnapshot | null> {
  const row = await db
    .selectFrom('rate_limit_snapshots')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('captured_at', 'desc')
    .limit(1)
    .executeTakeFirst();

  if (!row) return null;

  return {
    requestsLimit: row.requests_limit,
    requestsRemaining: row.requests_remaining,
    requestsReset: row.requests_reset,
    tokensLimit: row.tokens_limit,
    tokensRemaining: row.tokens_remaining,
    tokensReset: row.tokens_reset,
    inputTokensLimit: row.input_tokens_limit,
    inputTokensRemaining: row.input_tokens_remaining,
    inputTokensReset: row.input_tokens_reset,
    outputTokensLimit: row.output_tokens_limit,
    outputTokensRemaining: row.output_tokens_remaining,
    outputTokensReset: row.output_tokens_reset,
    capturedAt: row.captured_at.toISOString(),
  };
}

export async function updateUserPlanDetection(
  db: Db,
  userId: string,
  plan: string,
  source: string,
): Promise<void> {
  await db
    .updateTable('users')
    .set({
      claude_plan: plan,
      plan_detection_source: source,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .execute();
}

export async function getUserPlanDetectionSource(db: Db, userId: string): Promise<string | null> {
  const row = await db
    .selectFrom('users')
    .select('plan_detection_source')
    .where('id', '=', userId)
    .executeTakeFirst();

  return row?.plan_detection_source ?? null;
}
