import type { Db } from '../../database/client.js';
import type { ActivityAction, ActivityEntry } from '@context-sync/shared';

export async function insertActivity(
  db: Db,
  input: {
    readonly projectId: string;
    readonly userId: string;
    readonly action: ActivityAction;
    readonly entityType: string;
    readonly entityId?: string;
    readonly metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .insertInto('activity_log')
    .values({
      project_id: input.projectId,
      user_id: input.userId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
    })
    .execute();
}

export async function findActivitiesByProjectId(
  db: Db,
  projectId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly ActivityEntry[]; total: number }> {
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .selectFrom('activity_log')
      .innerJoin('users', 'users.id', 'activity_log.user_id')
      .select([
        'activity_log.id',
        'activity_log.project_id',
        'activity_log.user_id',
        'users.name as user_name',
        'users.avatar_url as user_avatar_url',
        'activity_log.action',
        'activity_log.entity_type',
        'activity_log.entity_id',
        'activity_log.metadata',
        'activity_log.created_at',
      ])
      .where('activity_log.project_id', '=', projectId)
      .orderBy('activity_log.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom('activity_log')
      .select(db.fn.countAll().as('count'))
      .where('project_id', '=', projectId)
      .executeTakeFirstOrThrow(),
  ]);

  return {
    entries: rows.map(toActivityEntry),
    total: Number(countResult.count),
  };
}

function toActivityEntry(row: {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: string;
  created_at: Date;
}): ActivityEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatarUrl: row.user_avatar_url,
    action: row.action as ActivityEntry['action'],
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata as Record<string, unknown>),
    createdAt: row.created_at.toISOString(),
  };
}
