import type { Db } from '../../database/client.js';
import type {
  Session,
  Conflict,
  DetectedConflict,
  ConflictFilterQuery,
  ConflictOverviewAnalysis,
} from '@context-sync/shared';
import { CONFLICT_DETECTION_WINDOW_DAYS, AI_VERIFY_COOLDOWN_MINUTES } from '@context-sync/shared';
import { NotFoundError, ForbiddenError, AppError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { detectFileConflicts } from './conflict-detector.js';
import * as conflictRepo from './conflict.repository.js';
import {
  findRecentSessionsByProject,
  findSessionById,
  findMessagesBySessionId,
} from '../sessions/session.repository.js';
import { logActivity } from '../activity/activity.service.js';
import { analyzeConflict, analyzeConflictOverview } from './conflict-ai-analyzer.js';

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
      logActivity(db, {
        projectId,
        userId: conflict.sessionAId,
        action: 'conflict_detected',
        entityType: 'conflict',
        entityId: created.id,
        metadata: { severity: conflict.severity, type: conflict.conflictType },
      });
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
  const updated = await conflictRepo.updateConflictStatus(db, conflictId, status, userId);
  if (status === 'resolved' || status === 'dismissed') {
    logActivity(db, {
      projectId: conflict.projectId,
      userId,
      action: 'conflict_resolved',
      entityType: 'conflict',
      entityId: conflictId,
      metadata: { status },
    });
  }
  return updated;
}

export async function batchResolveConflicts(
  db: Db,
  projectId: string,
  userId: string,
  status: 'resolved' | 'dismissed',
): Promise<{ count: number }> {
  await assertProjectAccess(db, projectId, userId);
  const count = await conflictRepo.batchUpdateConflictStatus(
    db,
    projectId,
    ['detected', 'reviewing'],
    status,
    userId,
  );
  if (count > 0) {
    logActivity(db, {
      projectId,
      userId,
      action: 'conflict_resolved',
      entityType: 'conflict',
      entityId: projectId,
      metadata: { status, count },
    });
  }
  return { count };
}

export async function aiVerifyConflict(
  db: Db,
  apiKey: string,
  model: string,
  conflictId: string,
  userId: string,
): Promise<Conflict> {
  const conflict = await conflictRepo.findConflictById(db, conflictId);
  if (!conflict) throw new NotFoundError('Conflict');
  await assertProjectAccess(db, conflict.projectId, userId);

  // Cooldown check
  if (conflict.aiAnalyzedAt) {
    const cooldownEnd = new Date(conflict.aiAnalyzedAt);
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + AI_VERIFY_COOLDOWN_MINUTES);
    if (new Date() < cooldownEnd) {
      const remainingMs = cooldownEnd.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60_000);
      throw new ForbiddenError(`AI 분석 쿨다운 중입니다. ${remainingMin}분 후 다시 시도해주세요`);
    }
  }

  // Fetch both sessions with user info
  const [sessionA, sessionB] = await Promise.all([
    findSessionById(db, conflict.sessionAId),
    findSessionById(db, conflict.sessionBId),
  ]);
  if (!sessionA || !sessionB) {
    throw new AppError('충돌에 연결된 세션을 찾을 수 없습니다', 400);
  }

  // Fetch messages for both sessions
  const [messagesA, messagesB] = await Promise.all([
    findMessagesBySessionId(db, conflict.sessionAId),
    findMessagesBySessionId(db, conflict.sessionBId),
  ]);

  const analysis = await analyzeConflict(
    apiKey,
    model,
    sessionA,
    messagesA,
    sessionB,
    messagesB,
    conflict,
  );

  return conflictRepo.updateAiAnalysis(db, conflictId, analysis);
}

export async function assignReviewer(
  db: Db,
  conflictId: string,
  userId: string,
  reviewerId: string,
): Promise<Conflict> {
  const conflict = await conflictRepo.findConflictById(db, conflictId);
  if (!conflict) throw new NotFoundError('Conflict');
  await assertProjectAccess(db, conflict.projectId, userId);
  return conflictRepo.assignReviewer(db, conflictId, reviewerId);
}

export async function addReviewNotes(
  db: Db,
  conflictId: string,
  userId: string,
  reviewNotes: string,
): Promise<Conflict> {
  const conflict = await conflictRepo.findConflictById(db, conflictId);
  if (!conflict) throw new NotFoundError('Conflict');
  await assertProjectAccess(db, conflict.projectId, userId);
  return conflictRepo.updateReviewNotes(db, conflictId, reviewNotes);
}

export async function getConflictOverview(
  db: Db,
  apiKey: string,
  model: string,
  projectId: string,
  userId: string,
): Promise<ConflictOverviewAnalysis> {
  await assertProjectAccess(db, projectId, userId);

  const { conflicts } = await conflictRepo.findConflictsByProjectId(db, projectId, {
    limit: 100,
  });

  if (conflicts.length === 0) {
    throw new AppError('분석할 충돌이 없습니다', 400);
  }

  return analyzeConflictOverview(apiKey, model, conflicts);
}
