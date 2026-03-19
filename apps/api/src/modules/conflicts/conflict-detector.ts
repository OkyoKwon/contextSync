import type { Session, DetectedConflict, ConflictSeverity } from '@context-sync/shared';
import { SEVERITY_THRESHOLDS } from '@context-sync/shared';

/**
 * Pure function: detects file-path-based conflicts between a new session
 * and existing sessions from other users.
 */
export function detectFileConflicts(
  newSession: Pick<Session, 'id' | 'userId' | 'filePaths'>,
  existingSessions: readonly Pick<Session, 'id' | 'userId' | 'filePaths' | 'title'>[],
): readonly DetectedConflict[] {
  if (newSession.filePaths.length === 0) return [];

  const conflicts: DetectedConflict[] = [];
  const newPaths = new Set(newSession.filePaths);

  for (const existing of existingSessions) {
    if (existing.userId === newSession.userId) continue;
    if (existing.id === newSession.id) continue;

    const overlapping = existing.filePaths.filter((p) => newPaths.has(p));

    if (overlapping.length === 0) continue;

    const severity = determineSeverity(overlapping.length);

    conflicts.push({
      sessionAId: newSession.id,
      sessionBId: existing.id,
      conflictType: 'file',
      severity,
      description: buildDescription(overlapping, severity),
      overlappingPaths: overlapping,
    });
  }

  return conflicts;
}

export function determineSeverity(overlapCount: number): ConflictSeverity {
  if (overlapCount >= SEVERITY_THRESHOLDS.critical.minOverlap) return 'critical';
  if (overlapCount >= SEVERITY_THRESHOLDS.warning.minOverlap) return 'warning';
  return 'info';
}

function buildDescription(overlapping: readonly string[], severity: ConflictSeverity): string {
  const count = overlapping.length;
  const preview = overlapping.slice(0, 3).join(', ');
  const more = count > 3 ? ` and ${count - 3} more` : '';

  const severityLabel = {
    info: 'Minor overlap',
    warning: 'Significant overlap',
    critical: 'Critical overlap',
  }[severity];

  return `${severityLabel}: ${count} file(s) modified by multiple users (${preview}${more})`;
}
