import { db, hoursAgo, daysAgo } from './helpers.js';

export async function seedActivityLog(
  projectId: string,
  users: ReadonlyArray<{ id: string }>,
  sessions: ReadonlyArray<{ id: string }>,
) {
  const [alex, sarah, marcus, emily, jason, mina] = [
    users[0]!.id,
    users[1]!.id,
    users[2]!.id,
    users[3]!.id,
    users[4]!.id,
    users[5]!.id,
  ];

  const entries = [
    {
      user_id: alex,
      action: 'session_created',
      entity_type: 'session',
      entity_id: sessions[10]?.id ?? null,
      created_at: hoursAgo(0.2),
    },
    {
      user_id: mina,
      action: 'session_synced',
      entity_type: 'session',
      entity_id: sessions[15]?.id ?? null,
      created_at: hoursAgo(0.6),
    },
    {
      user_id: jason,
      action: 'conflict_detected',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(1),
    },
    {
      user_id: sarah,
      action: 'conflict_detected',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(2),
    },
    {
      user_id: emily,
      action: 'session_completed',
      entity_type: 'session',
      entity_id: sessions[7]?.id ?? null,
      created_at: hoursAgo(3),
    },
    {
      user_id: alex,
      action: 'prd_analyzed',
      entity_type: 'prd_document',
      entity_id: null,
      created_at: hoursAgo(5),
    },
    {
      user_id: marcus,
      action: 'conflict_resolved',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(8),
    },
    {
      user_id: sarah,
      action: 'session_completed',
      entity_type: 'session',
      entity_id: sessions[5]?.id ?? null,
      created_at: hoursAgo(12),
    },
    {
      user_id: emily,
      action: 'evaluation_completed',
      entity_type: 'ai_evaluation',
      entity_id: null,
      created_at: daysAgo(1),
    },
    {
      user_id: alex,
      action: 'session_created',
      entity_type: 'session',
      entity_id: sessions[17]?.id ?? null,
      created_at: daysAgo(1),
    },
    {
      user_id: jason,
      action: 'collaborator_joined',
      entity_type: 'project',
      entity_id: null,
      created_at: daysAgo(2),
    },
    {
      user_id: mina,
      action: 'collaborator_joined',
      entity_type: 'project',
      entity_id: null,
      created_at: daysAgo(2),
    },
    {
      user_id: marcus,
      action: 'session_completed',
      entity_type: 'session',
      entity_id: sessions[9]?.id ?? null,
      created_at: daysAgo(2),
    },
    {
      user_id: emily,
      action: 'session_completed',
      entity_type: 'session',
      entity_id: sessions[3]?.id ?? null,
      created_at: daysAgo(3),
    },
    {
      user_id: alex,
      action: 'session_completed',
      entity_type: 'session',
      entity_id: sessions[6]?.id ?? null,
      created_at: daysAgo(4),
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
