import { sql } from 'kysely';
import type { Db } from '../../database/client.js';

export interface ModelBreakdownRow {
  readonly model_used: string;
  readonly total_tokens: string;
  readonly message_count: string;
}

export interface DailyUsageRow {
  readonly date: string;
  readonly model_used: string;
  readonly total_tokens: string;
}

export async function getModelBreakdown(
  db: Db,
  projectId: string,
  startDate: Date,
  endDate: Date,
): Promise<readonly ModelBreakdownRow[]> {
  const rows = await db
    .selectFrom('messages')
    .innerJoin('sessions', 'sessions.id', 'messages.session_id')
    .select([
      'messages.model_used',
      sql<string>`COALESCE(SUM(messages.tokens_used), 0)`.as('total_tokens'),
      sql<string>`COUNT(*)`.as('message_count'),
    ])
    .where('sessions.project_id', '=', projectId)
    .where('messages.tokens_used', 'is not', null)
    .where('messages.model_used', 'is not', null)
    .where('messages.created_at', '>=', startDate)
    .where('messages.created_at', '<=', endDate)
    .groupBy('messages.model_used')
    .orderBy(sql`SUM(messages.tokens_used)`, 'desc')
    .execute();

  return rows as readonly ModelBreakdownRow[];
}

export async function getDailyUsage(
  db: Db,
  projectId: string,
  startDate: Date,
  endDate: Date,
): Promise<readonly DailyUsageRow[]> {
  const rows = await db
    .selectFrom('messages')
    .innerJoin('sessions', 'sessions.id', 'messages.session_id')
    .select([
      sql<string>`TO_CHAR(messages.created_at, 'YYYY-MM-DD')`.as('date'),
      'messages.model_used',
      sql<string>`COALESCE(SUM(messages.tokens_used), 0)`.as('total_tokens'),
    ])
    .where('sessions.project_id', '=', projectId)
    .where('messages.tokens_used', 'is not', null)
    .where('messages.model_used', 'is not', null)
    .where('messages.created_at', '>=', startDate)
    .where('messages.created_at', '<=', endDate)
    .groupBy([sql`TO_CHAR(messages.created_at, 'YYYY-MM-DD')`, 'messages.model_used'])
    .orderBy('date', 'asc')
    .execute();

  return rows as readonly DailyUsageRow[];
}

export async function getTotalMessageCount(
  db: Db,
  projectId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ total: number; measured: number }> {
  const result = await db
    .selectFrom('messages')
    .innerJoin('sessions', 'sessions.id', 'messages.session_id')
    .select([
      sql<string>`COUNT(*)`.as('total'),
      sql<string>`COUNT(messages.tokens_used)`.as('measured'),
    ])
    .where('sessions.project_id', '=', projectId)
    .where('messages.created_at', '>=', startDate)
    .where('messages.created_at', '<=', endDate)
    .executeTakeFirstOrThrow();

  return {
    total: Number(result.total),
    measured: Number(result.measured),
  };
}
