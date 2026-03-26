import { sql } from 'kysely';
import type { Db } from '../../database/client.js';
import type {
  Session,
  SessionWithMessages,
  SessionFilterQuery,
  TimelineEntry,
  DashboardStats,
  MemberActivity,
} from '@context-sync/shared';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess } from '../projects/project.service.js';
import { logActivity } from '../activity/activity.service.js';
import * as sessionRepo from './session.repository.js';
import { countLocalSessionsByDate } from '../local-sessions/local-session.service.js';

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
  const updated = await sessionRepo.updateSession(db, sessionId, input);
  if (input.status === 'completed') {
    logActivity(db, {
      projectId: session.projectId,
      userId,
      action: 'session_completed',
      entityType: 'session',
      entityId: sessionId,
      metadata: { title: session.title },
    });
  }
  return updated;
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

async function countSessionsByDateFromDb(
  db: Db,
  projectId: string,
  todayStart: Date,
  weekStart: Date,
): Promise<{ readonly todaySessions: number; readonly weekSessions: number }> {
  const [todayResult, weekResult] = await Promise.all([
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
  ]);
  return {
    todaySessions: Number(todayResult.count),
    weekSessions: Number(weekResult.count),
  };
}

async function getDatabaseMode(metaDb: Db, projectId: string): Promise<string> {
  const project = await metaDb
    .selectFrom('projects')
    .select('database_mode')
    .where('id', '=', projectId)
    .executeTakeFirst();
  return project?.database_mode ?? 'local';
}

export async function getDashboardStats(
  db: Db,
  metaDb: Db,
  projectId: string,
  userId: string,
): Promise<DashboardStats> {
  await assertProjectAccess(db, projectId, userId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const dbMode = await getDatabaseMode(metaDb, projectId);

  const sessionCountsFn =
    dbMode === 'remote'
      ? countSessionsByDateFromDb(db, projectId, todayStart, weekStart)
      : countLocalSessionsByDate(metaDb, projectId);

  const [sessionCounts, conflictsResult, membersResult, hotFilesResult] = await Promise.all([
    sessionCountsFn,
    db
      .selectFrom('conflicts')
      .select(db.fn.countAll().as('count'))
      .where('project_id', '=', projectId)
      .where('status', 'in', ['detected', 'reviewing'])
      .executeTakeFirstOrThrow(),
    db
      .selectFrom('sessions')
      .select(db.fn.count('user_id').distinct().as('count'))
      .where('project_id', '=', projectId)
      .where('created_at', '>=', weekStart)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom('sessions')
      .select([sql<string>`unnest(file_paths)`.as('path'), db.fn.countAll().as('count')])
      .where('project_id', '=', projectId)
      .where('created_at', '>=', weekStart)
      .groupBy(sql`unnest(file_paths)`)
      .orderBy(sql`count(*)`, 'desc')
      .limit(10)
      .execute()
      .catch((err: unknown) => {
        console.warn(
          '[session] Failed to query hot file paths:',
          err instanceof Error ? err.message : err,
        );
        return [];
      }),
  ]);

  return {
    todaySessions: sessionCounts.todaySessions,
    weekSessions: sessionCounts.weekSessions,
    activeConflicts: Number(conflictsResult.count),
    activeMembers: Number(membersResult.count),
    hotFilePaths: hotFilesResult.map((r) => ({
      path: r.path as string,
      count: Number(r.count),
    })),
  };
}

export async function getTeamStats(
  db: Db,
  projectId: string,
  userId: string,
): Promise<readonly MemberActivity[]> {
  await assertProjectAccess(db, projectId, userId);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const rows = await db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.user_id')
    .select([
      'sessions.user_id',
      'users.name as user_name',
      'users.avatar_url as user_avatar_url',
      db.fn.countAll().as('session_count'),
      db.fn.max('sessions.created_at').as('last_active_at'),
    ])
    .where('sessions.project_id', '=', projectId)
    .where('sessions.created_at', '>=', weekStart)
    .groupBy(['sessions.user_id', 'users.name', 'users.avatar_url'])
    .orderBy(sql`count(*)`, 'desc')
    .limit(10)
    .execute();

  return rows.map((row) => ({
    userId: row.user_id,
    userName: row.user_name,
    userAvatarUrl: row.user_avatar_url,
    sessionCount: Number(row.session_count),
    lastActiveAt: (row.last_active_at as Date).toISOString(),
  }));
}
