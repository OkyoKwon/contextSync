import type { Db } from '../../database/client.js';
import type { Session, Message, SessionFilterQuery } from '@context-sync/shared';

export async function createSession(
  db: Db,
  input: {
    projectId: string;
    userId: string;
    title: string;
    source?: string;
    branch?: string;
    tags?: readonly string[];
    filePaths?: readonly string[];
    moduleNames?: readonly string[];
    metadata?: Record<string, unknown>;
  },
): Promise<Session> {
  const row = await db
    .insertInto('sessions')
    .values({
      project_id: input.projectId,
      user_id: input.userId,
      title: input.title,
      source: input.source ?? 'manual',
      file_paths: (input.filePaths as string[]) ?? [],
      module_names: (input.moduleNames as string[]) ?? [],
      branch: input.branch ?? null,
      tags: (input.tags as string[]) ?? [],
      metadata: JSON.stringify(input.metadata ?? {}),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toSession(row);
}

export async function createMessages(
  db: Db,
  sessionId: string,
  messages: readonly {
    role: string;
    content: string;
    contentType?: string;
    tokensUsed?: number;
    modelUsed?: string;
  }[],
): Promise<readonly Message[]> {
  if (messages.length === 0) return [];

  const values = messages.map((msg, index) => ({
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
    content_type: msg.contentType ?? 'prompt',
    tokens_used: msg.tokensUsed ?? null,
    model_used: msg.modelUsed ?? null,
    sort_order: index,
  }));

  const rows = await db
    .insertInto('messages')
    .values(values)
    .returningAll()
    .execute();

  return rows.map(toMessage);
}

export async function findSessionsByProjectId(
  db: Db,
  projectId: string,
  filter: SessionFilterQuery = {},
): Promise<{ sessions: readonly Session[]; total: number }> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = db
    .selectFrom('sessions')
    .leftJoin('users', 'users.id', 'sessions.user_id')
    .where('sessions.project_id', '=', projectId);

  if (filter.status) query = query.where('sessions.status', '=', filter.status);
  if (filter.userId) query = query.where('sessions.user_id', '=', filter.userId);
  if (filter.startDate) query = query.where('sessions.created_at', '>=', new Date(filter.startDate));
  if (filter.endDate) query = query.where('sessions.created_at', '<=', new Date(filter.endDate));

  const sortBy = filter.sortBy === 'updatedAt' ? 'sessions.updated_at' : 'sessions.created_at';
  const sortOrder = filter.sortOrder === 'asc' ? 'asc' : 'desc';

  const [rows, countResult] = await Promise.all([
    query
      .select([
        'sessions.id',
        'sessions.project_id',
        'sessions.user_id',
        'sessions.title',
        'sessions.source',
        'sessions.status',
        'sessions.file_paths',
        'sessions.module_names',
        'sessions.branch',
        'sessions.tags',
        'sessions.metadata',
        'sessions.created_at',
        'sessions.updated_at',
        'users.name as user_name',
        'users.avatar_url as user_avatar_url',
      ])
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute(),
    query
      .select(db.fn.countAll().as('count'))
      .executeTakeFirstOrThrow(),
  ]);

  return {
    sessions: rows.map((row) => toSessionWithUser(row)),
    total: Number(countResult.count),
  };
}

export async function findSessionById(db: Db, id: string): Promise<Session | null> {
  const row = await db
    .selectFrom('sessions')
    .leftJoin('users', 'users.id', 'sessions.user_id')
    .select([
      'sessions.id',
      'sessions.project_id',
      'sessions.user_id',
      'sessions.title',
      'sessions.source',
      'sessions.status',
      'sessions.file_paths',
      'sessions.module_names',
      'sessions.branch',
      'sessions.tags',
      'sessions.metadata',
      'sessions.created_at',
      'sessions.updated_at',
      'users.name as user_name',
      'users.avatar_url as user_avatar_url',
    ])
    .where('sessions.id', '=', id)
    .executeTakeFirst();

  return row ? toSessionWithUser(row) : null;
}

export async function findMessagesBySessionId(db: Db, sessionId: string): Promise<readonly Message[]> {
  const rows = await db
    .selectFrom('messages')
    .selectAll()
    .where('session_id', '=', sessionId)
    .orderBy('sort_order', 'asc')
    .execute();

  return rows.map(toMessage);
}

export async function updateSession(
  db: Db,
  id: string,
  input: { title?: string; status?: string; tags?: string[] },
): Promise<Session> {
  const row = await db
    .updateTable('sessions')
    .set({
      ...(input.title && { title: input.title }),
      ...(input.status && { status: input.status }),
      ...(input.tags && { tags: input.tags }),
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toSession(row);
}

export async function deleteSession(db: Db, id: string): Promise<void> {
  await db.deleteFrom('sessions').where('id', '=', id).execute();
}

export async function findRecentSessionsByProject(
  db: Db,
  projectId: string,
  excludeUserId: string,
  withinDays: number,
): Promise<readonly Session[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);

  const rows = await db
    .selectFrom('sessions')
    .selectAll()
    .where('project_id', '=', projectId)
    .where('user_id', '!=', excludeUserId)
    .where('created_at', '>=', cutoff)
    .execute();

  return rows.map(toSession);
}

function toSession(row: Record<string, unknown>): Session {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    userId: row['user_id'] as string,
    title: row['title'] as string,
    source: row['source'] as Session['source'],
    status: row['status'] as Session['status'],
    filePaths: (row['file_paths'] as string[]) ?? [],
    moduleNames: (row['module_names'] as string[]) ?? [],
    branch: (row['branch'] as string) ?? null,
    tags: (row['tags'] as string[]) ?? [],
    metadata: typeof row['metadata'] === 'string' ? JSON.parse(row['metadata'] as string) : (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

function toSessionWithUser(row: Record<string, unknown>): Session {
  return {
    ...toSession(row),
    userName: (row['user_name'] as string) ?? undefined,
    userAvatarUrl: (row['user_avatar_url'] as string | null) ?? null,
  };
}

function toMessage(row: Record<string, unknown>): Message {
  return {
    id: row['id'] as string,
    sessionId: row['session_id'] as string,
    role: row['role'] as Message['role'],
    content: row['content'] as string,
    contentType: row['content_type'] as Message['contentType'],
    tokensUsed: (row['tokens_used'] as number) ?? null,
    modelUsed: (row['model_used'] as string) ?? null,
    sortOrder: row['sort_order'] as number,
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}
