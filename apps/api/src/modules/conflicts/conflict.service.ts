import type { Db } from '../../database/client.js';
import type { Session, Conflict, DetectedConflict, ConflictFilterQuery } from '@context-sync/shared';
import { CONFLICT_DETECTION_WINDOW_DAYS } from '@context-sync/shared';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { detectFileConflicts } from './conflict-detector.js';
import * as conflictRepo from './conflict.repository.js';
import { findRecentSessionsByProject } from '../sessions/session.repository.js';

export async function detectConflicts(
  db: Db,
  newSession: Session,
): Promise<readonly DetectedConflict[]> {
  const recentSessions = await findRecentSessionsByProject(
    db,
    newSession.projectId,
    newSession.userId,
    CONFLICT_DETECTION_WINDOW_DAYS,
  );

  return detectFileConflicts(newSession, recentSessions);
}

export async function saveDetectedConflicts(
  db: Db,
  projectId: string,
  detected: readonly DetectedConflict[],
): Promise<readonly Conflict[]> {
  const saved: Conflict[] = [];

  for (const conflict of detected) {
    const exists = await conflictRepo.existsConflictBetweenSessions(
      db,
      conflict.sessionAId,
      conflict.sessionBId,
    );

    if (!exists) {
      const created = await conflictRepo.createConflict(db, projectId, conflict);
      saved.push(created);
    }
  }

  return saved;
}

export async function getConflictsByProject(
  db: Db,
  projectId: string,
  userId: string,
  filter: ConflictFilterQuery,
): Promise<{ conflicts: readonly Conflict[]; total: number }> {
  await assertProjectAccess(db, projectId, userId);
  return conflictRepo.findConflictsByProjectId(db, projectId, filter);
}

export async function getConflictDetail(
  db: Db,
  conflictId: string,
  userId: string,
): Promise<Conflict> {
  const conflict = await conflictRepo.findConflictById(db, conflictId);
  if (!conflict) throw new NotFoundError('Conflict');
  await assertProjectAccess(db, conflict.projectId, userId);
  return conflict;
}

export async function updateConflictStatus(
  db: Db,
  conflictId: string,
  userId: string,
  status: string,
): Promise<Conflict> {
  const conflict = await conflictRepo.findConflictById(db, conflictId);
  if (!conflict) throw new NotFoundError('Conflict');
  await assertProjectAccess(db, conflict.projectId, userId);
  return conflictRepo.updateConflictStatus(db, conflictId, status, userId);
}
