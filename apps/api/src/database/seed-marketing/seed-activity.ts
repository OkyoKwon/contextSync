import { db, hoursAgo } from './helpers.js';

export async function seedActivityLog(
  projectId: string,
  users: ReadonlyArray<{ id: string }>,
  sessions: ReadonlyArray<{ id: string }>,
) {
  const [alex, sarah, marcus, emily] = [users[0]!.id, users[1]!.id, users[2]!.id, users[3]!.id];

  const entries = [
    {
      user_id: alex,
      action: 'session.created',
      entity_type: 'session',
      entity_id: sessions[11]?.id ?? null,
      created_at: hoursAgo(2),
    },
    {
      user_id: sarah,
      action: 'conflict.detected',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(4),
    },
    {
      user_id: marcus,
      action: 'session.synced',
      entity_type: 'session',
      entity_id: sessions[6]?.id ?? null,
      created_at: hoursAgo(6),
    },
    {
      user_id: emily,
      action: 'session.created',
      entity_type: 'session',
      entity_id: sessions[8]?.id ?? null,
      created_at: hoursAgo(8),
    },
    {
      user_id: alex,
      action: 'prd.analyzed',
      entity_type: 'prd_document',
      entity_id: null,
      created_at: hoursAgo(24),
    },
    {
      user_id: sarah,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[9]?.id ?? null,
      created_at: hoursAgo(28),
    },
    {
      user_id: alex,
      action: 'conflict.resolved',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(30),
    },
    {
      user_id: marcus,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[10]?.id ?? null,
      created_at: hoursAgo(36),
    },
    {
      user_id: emily,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[3]?.id ?? null,
      created_at: hoursAgo(48),
    },
    {
      user_id: alex,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[7]?.id ?? null,
      created_at: hoursAgo(50),
    },
  ];

  for (const e of entries) {
    await db
      .insertInto('activity_log')
      .values({
        project_id: projectId,
        user_id: e.user_id,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        created_at: e.created_at,
      })
      .execute();
  }
}
