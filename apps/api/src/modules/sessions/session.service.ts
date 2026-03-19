import type { Db } from '../../database/client.js';
import type {
  Session,
  SessionWithMessages,
  SessionFilterQuery,
  TimelineEntry,
  DashboardStats,
} from '@context-sync/shared';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess } from '../projects/project.service.js';
import * as sessionRepo from './session.repository.js';

export async function getSessionsByProject(
  db: Db,
  projectId: string,
  userId: string,
  filter: SessionFilterQuery,
): Promise<{ sessions: readonly Session[]; total: number }> {
  await assertProjectAccess(db, projectId, userId);
  return sessionRepo.findSessionsByProjectId(db, projectId, filter);
}

export async function getSessionDetail(
  db: Db,
  sessionId: string,
  userId: string,
): Promise<SessionWithMessages> {
  const session = await sessionRepo.findSessionById(db, sessionId);
  if (!session) throw new NotFoundError('Session');
  await assertProjectAccess(db, session.projectId, userId);

  const messages = await sessionRepo.findMessagesBySessionId(db, sessionId);
  return { ...session, messages };
}

export async function updateSession(
  db: Db,
  sessionId: string,
  userId: string,
  input: { title?: string; status?: string; tags?: string[] },
): Promise<Session> {
  const session = await sessionRepo.findSessionById(db, sessionId);
  if (!session) throw new NotFoundError('Session');
  await assertProjectAccess(db, session.projectId, userId);
  return sessionRepo.updateSession(db, sessionId, input);
}

export async function deleteSession(db: Db, sessionId: string, userId: string): Promise<void> {
  const session = await sessionRepo.findSessionById(db, sessionId);
  if (!session) throw new NotFoundError('Session');
  await assertProjectAccess(db, session.projectId, userId);
  await sessionRepo.deleteSession(db, sessionId);
}

export async function getTimeline(
  db: Db,
  projectId: string,
  userId: string,
  filter: SessionFilterQuery,
): Promise<{ entries: readonly TimelineEntry[]; total: number }> {
  await assertProjectAccess(db, projectId, userId);
  const result = await sessionRepo.findSessionsByProjectId(db, projectId, filter);

  const entries: TimelineEntry[] = result.sessions.map((s) => ({
    id: s.id,
    title: s.title,
    source: s.source,
    filePaths: s.filePaths,
    userName: s.userName ?? 'Unknown',
    userAvatarUrl: s.userAvatarUrl ?? null,
    createdAt: s.createdAt,
  }));

  return { entries, total: result.total };
}

export async function getDashboardStats(
  db: Db,
  projectId: string,
  userId: string,
): Promise<DashboardStats> {
  await assertProjectAccess(db, projectId, userId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [todayResult, weekResult, conflictsResult] = await Promise.all([
    db
      .selectFrom('sessions')
      .select(db.fn.countAll().as('count'))
      .where('project_id', '=', projectId)
      .where('created_at', '>=', todayStart)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom('sessions')
      .select(db.fn.countAll().as('count'))
      .where('project_id', '=', projectId)
      .where('created_at', '>=', weekStart)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom('conflicts')
      .select(db.fn.countAll().as('count'))
      .where('project_id', '=', projectId)
      .where('status', 'in', ['detected', 'reviewing'])
      .executeTakeFirstOrThrow(),
  ]);

  return {
    todaySessions: Number(todayResult.count),
    weekSessions: Number(weekResult.count),
    activeConflicts: Number(conflictsResult.count),
    activeMembers: 0,
    hotFilePaths: [],
  };
}
