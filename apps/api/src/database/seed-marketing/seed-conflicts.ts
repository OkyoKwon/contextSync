import { db, daysAgo } from './helpers.js';

export async function seedConflicts(
  projectId: string,
  sessions: ReadonlyArray<{ id: string }>,
  users: ReadonlyArray<{ id: string }>,
) {
  const conflictData = [
    {
      session_a_id: sessions[0]!.id,
      session_b_id: sessions[2]!.id,
      conflict_type: 'file_overlap',
      severity: 'warning',
      status: 'reviewing',
      description:
        'Both sessions modified database configuration files — potential config divergence',
      overlapping_paths: ['src/config/database.ts'],
      reviewer_id: users[1]!.id,
      review_notes:
        'Auth changes may conflict with pool settings. Need to verify connection config is compatible.',
    },
    {
      session_a_id: sessions[1]!.id,
      session_b_id: sessions[6]!.id,
      conflict_type: 'file_overlap',
      severity: 'critical',
      status: 'open',
      description:
        'Critical overlap in conflict detection module — two developers modifying the same core logic',
      overlapping_paths: ['src/conflicts/detector.ts', 'src/conflicts/types.ts'],
      reviewer_id: null,
      review_notes: null,
    },
    {
      session_a_id: sessions[4]!.id,
      session_b_id: sessions[9]!.id,
      conflict_type: 'module_overlap',
      severity: 'info',
      status: 'resolved',
      description:
        'Dashboard module modifications overlap — PRD dashboard and analytics dashboard share stats utilities',
      overlapping_paths: ['src/dashboard/stats.ts'],
      reviewer_id: users[0]!.id,
      review_notes: 'Resolved by extracting shared stats functions into a common utility module.',
      resolved_by: users[0]!.id,
    },
    {
      session_a_id: sessions[7]!.id,
      session_b_id: sessions[3]!.id,
      conflict_type: 'file_overlap',
      severity: 'warning',
      status: 'open',
      description: 'Fastify 5 migration touched validation schemas that were also refactored',
      overlapping_paths: ['src/utils/validate.ts'],
      reviewer_id: null,
      review_notes: null,
    },
  ];

  for (const c of conflictData) {
    await db
      .insertInto('conflicts')
      .values({
        project_id: projectId,
        session_a_id: c.session_a_id,
        session_b_id: c.session_b_id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        status: c.status,
        description: c.description,
        overlapping_paths: c.overlapping_paths,
        reviewer_id: c.reviewer_id,
        review_notes: c.review_notes,
        resolved_by: ((c as Record<string, unknown>).resolved_by as string) ?? null,
        resolved_at: c.status === 'resolved' ? daysAgo(1) : null,
      })
      .execute();
  }
}
