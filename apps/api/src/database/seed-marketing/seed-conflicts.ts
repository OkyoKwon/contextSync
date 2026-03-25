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
      conflict_type: 'file',
      severity: 'critical',
      status: 'detected',
      description:
        'Both sessions modified database configuration files — potential config divergence',
      overlapping_paths: ['src/config/database.ts', 'src/config/env.ts'],
      reviewer_id: null,
      review_notes: null,
    },
    {
      session_a_id: sessions[1]!.id,
      session_b_id: sessions[6]!.id,
      conflict_type: 'file',
      severity: 'critical',
      status: 'reviewing',
      description:
        'Critical overlap in conflict detection module — two developers modifying the same core logic',
      overlapping_paths: ['src/modules/conflicts/detector.ts', 'src/modules/conflicts/types.ts'],
      reviewer_id: users[1]!.id,
      review_notes:
        'Need to coordinate changes to detector algorithm before merging either branch.',
    },
    {
      session_a_id: sessions[4]!.id,
      session_b_id: sessions[8]!.id,
      conflict_type: 'dependency',
      severity: 'warning',
      status: 'resolved',
      description:
        'Dashboard module modifications overlap — PRD dashboard and analytics dashboard share stats utilities',
      overlapping_paths: ['src/modules/dashboard/stats.service.ts'],
      reviewer_id: users[0]!.id,
      review_notes: 'Resolved by extracting shared stats functions into a common utility module.',
    },
    {
      session_a_id: sessions[3]!.id,
      session_b_id: sessions[0]!.id,
      conflict_type: 'file',
      severity: 'warning',
      status: 'detected',
      description: 'Validation schemas refactored while auth module also touches shared validators',
      overlapping_paths: ['src/utils/validate.ts'],
      reviewer_id: null,
      review_notes: null,
    },
    {
      session_a_id: sessions[12]!.id,
      session_b_id: sessions[13]!.id,
      conflict_type: 'file',
      severity: 'warning',
      status: 'reviewing',
      description:
        'Design token changes and dark mode accessibility fix both modify shared style files',
      overlapping_paths: ['src/styles/tokens.css', 'src/components/ui/Button.tsx'],
      reviewer_id: users[3]!.id,
      review_notes: 'Checking if CSS custom property changes are compatible.',
    },
    {
      session_a_id: sessions[11]!.id,
      session_b_id: sessions[16]!.id,
      conflict_type: 'dependency',
      severity: 'info',
      status: 'detected',
      description:
        'Onboarding wizard and notification preferences both reference notification service',
      overlapping_paths: ['src/modules/notifications/service.ts'],
      reviewer_id: null,
      review_notes: null,
    },
    {
      session_a_id: sessions[9]!.id,
      session_b_id: sessions[14]!.id,
      conflict_type: 'file',
      severity: 'info',
      status: 'resolved',
      description:
        'API docs and CI pipeline both modify configuration files with no logic conflict',
      overlapping_paths: ['scripts/ci.yml'],
      reviewer_id: users[2]!.id,
      review_notes: 'No actual conflict — changes are in separate sections of the file.',
    },
    {
      session_a_id: sessions[7]!.id,
      session_b_id: sessions[17]!.id,
      conflict_type: 'dependency',
      severity: 'info',
      status: 'dismissed',
      description:
        'Fastify migration and query optimization both touch app.ts but changes are independent',
      overlapping_paths: ['src/app.ts'],
      reviewer_id: users[0]!.id,
      review_notes:
        'False positive — changes are in completely different plugin registration blocks.',
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
        resolved_by:
          c.status === 'resolved' || c.status === 'dismissed' ? (c.reviewer_id ?? null) : null,
        resolved_at:
          c.status === 'resolved' ? daysAgo(1) : c.status === 'dismissed' ? daysAgo(2) : null,
      })
      .execute();
  }
}
