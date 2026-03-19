import { sql } from 'kysely';
import type { Db } from '../../database/client.js';

export interface SearchResult {
  readonly type: 'session' | 'message';
  readonly id: string;
  readonly sessionId: string;
  readonly title: string;
  readonly highlight: string;
  readonly createdAt: string;
}

export async function searchInProject(
  db: Db,
  projectId: string,
  query: string,
  type: 'all' | 'session' | 'message' = 'all',
  page = 1,
  limit = 20,
): Promise<{ results: readonly SearchResult[]; total: number }> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .map((w) => `${w}:*`)
    .join(' & ');

  const offset = (page - 1) * limit;
  const results: SearchResult[] = [];
  let total = 0;

  if (type === 'all' || type === 'session') {
    const sessionResults = await db
      .selectFrom('sessions')
      .select([
        'sessions.id',
        'sessions.title',
        'sessions.created_at',
        sql<string>`ts_headline('simple', sessions.title, to_tsquery('simple', ${tsQuery}))`.as('highlight'),
        sql<number>`ts_rank(sessions.search_vector, to_tsquery('simple', ${tsQuery}))`.as('rank'),
      ])
      .where('sessions.project_id', '=', projectId)
      .where((_eb) => sql`sessions.search_vector @@ to_tsquery('simple', ${tsQuery})`)
      .orderBy('rank', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    for (const row of sessionResults) {
      results.push({
        type: 'session',
        id: row.id,
        sessionId: row.id,
        title: row.title,
        highlight: row.highlight,
        createdAt: row.created_at.toISOString(),
      });
    }
  }

  if (type === 'all' || type === 'message') {
    const messageResults = await db
      .selectFrom('messages')
      .innerJoin('sessions', 'sessions.id', 'messages.session_id')
      .select([
        'messages.id',
        'messages.session_id',
        'sessions.title',
        'messages.created_at',
        sql<string>`ts_headline('simple', messages.content, to_tsquery('simple', ${tsQuery}), 'MaxFragments=2,MaxWords=30')`.as('highlight'),
        sql<number>`ts_rank(messages.search_vector, to_tsquery('simple', ${tsQuery}))`.as('rank'),
      ])
      .where('sessions.project_id', '=', projectId)
      .where((_eb) => sql`messages.search_vector @@ to_tsquery('simple', ${tsQuery})`)
      .orderBy('rank', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    for (const row of messageResults) {
      results.push({
        type: 'message',
        id: row.id,
        sessionId: row.session_id,
        title: row.title,
        highlight: row.highlight,
        createdAt: row.created_at.toISOString(),
      });
    }

    total = results.length;
  }

  return { results, total };
}
