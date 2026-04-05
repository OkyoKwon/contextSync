import type { Db } from '../../database/client.js';
import type {
  Collaborator,
  CollaboratorDataSummary,
  DeletedDataSummary,
} from '@context-sync/shared';

export async function findCollaboratorsByProjectId(
  db: Db,
  projectId: string,
): Promise<readonly Collaborator[]> {
  const rows = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select([
      'project_collaborators.id',
      'project_collaborators.project_id',
      'project_collaborators.user_id',
      'project_collaborators.role',
      'project_collaborators.local_directory',
      'project_collaborators.added_at',
      'users.name as user_name',
      'users.email as user_email',
      'users.avatar_url as user_avatar_url',
    ])
    .where('project_collaborators.project_id', '=', projectId)
    .orderBy('project_collaborators.added_at', 'asc')
    .execute();

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as Collaborator['role'],
    localDirectory: row.local_directory,
    addedAt: row.added_at.toISOString(),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
  }));
}

export async function addCollaborator(
  db: Db,
  projectId: string,
  userId: string,
  role: string = 'member',
): Promise<void> {
  await db
    .insertInto('project_collaborators')
    .values({ project_id: projectId, user_id: userId, role })
    .execute();
}

export async function removeCollaborator(db: Db, projectId: string, userId: string): Promise<void> {
  await db
    .deleteFrom('project_collaborators')
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .execute();
}

export async function findCollaboratorByProjectAndUser(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Collaborator | null> {
  const row = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select([
      'project_collaborators.id',
      'project_collaborators.project_id',
      'project_collaborators.user_id',
      'project_collaborators.role',
      'project_collaborators.local_directory',
      'project_collaborators.added_at',
      'users.name as user_name',
      'users.email as user_email',
      'users.avatar_url as user_avatar_url',
    ])
    .where('project_collaborators.project_id', '=', projectId)
    .where('project_collaborators.user_id', '=', userId)
    .executeTakeFirst();

  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as Collaborator['role'],
    localDirectory: row.local_directory,
    addedAt: row.added_at.toISOString(),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
  };
}

export async function updateCollaboratorDirectory(
  db: Db,
  projectId: string,
  userId: string,
  localDirectory: string | null,
): Promise<void> {
  await db
    .updateTable('project_collaborators')
    .set({ local_directory: localDirectory })
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .execute();
}

export async function isCollaborator(db: Db, projectId: string, userId: string): Promise<boolean> {
  const row = await db
    .selectFrom('project_collaborators')
    .select('id')
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return !!row;
}

export async function getCollaboratorDataSummary(
  db: Db,
  projectId: string,
  userId: string,
): Promise<CollaboratorDataSummary['summary']> {
  const countQuery = <T extends keyof import('../../database/types.js').Database>(
    table: T,
    userCol: string,
  ) =>
    (db.selectFrom(table) as any)
      .select(db.fn.countAll<number>().as('count'))
      .where('project_id' as never, '=', projectId as never)
      .where(userCol as never, '=', userId as never)
      .executeTakeFirstOrThrow();

  const sessionIds = await db
    .selectFrom('sessions')
    .select('id')
    .where('project_id', '=', projectId)
    .where('user_id', '=', userId)
    .execute();
  const ids = sessionIds.map((s) => s.id);

  const [sessions, prdDocuments, aiEvaluations, activityLogs, promptTemplates] = await Promise.all([
    countQuery('sessions', 'user_id'),
    countQuery('prd_documents', 'user_id'),
    countQuery('ai_evaluations', 'target_user_id'),
    countQuery('activity_log', 'user_id'),
    db
      .selectFrom('prompt_templates')
      .select(db.fn.countAll<number>().as('count'))
      .where('project_id', '=', projectId)
      .where('author_id', '=', userId)
      .executeTakeFirstOrThrow(),
  ]);

  const [messages, conflicts, syncedSessions, prdAnalyses] = await Promise.all([
    ids.length > 0
      ? db
          .selectFrom('messages')
          .select(db.fn.countAll<number>().as('count'))
          .where('session_id', 'in', ids)
          .executeTakeFirstOrThrow()
      : { count: 0 },
    ids.length > 0
      ? db
          .selectFrom('conflicts')
          .select(db.fn.countAll<number>().as('count'))
          .where('project_id', '=', projectId)
          .where((eb) => eb.or([eb('session_a_id', 'in', ids), eb('session_b_id', 'in', ids)]))
          .executeTakeFirstOrThrow()
      : { count: 0 },
    ids.length > 0
      ? db
          .selectFrom('synced_sessions')
          .select(db.fn.countAll<number>().as('count'))
          .where('session_id', 'in', ids)
          .executeTakeFirstOrThrow()
      : { count: 0 },
    db
      .selectFrom('prd_analyses')
      .innerJoin('prd_documents', 'prd_documents.id', 'prd_analyses.prd_document_id')
      .select(db.fn.countAll<number>().as('count'))
      .where('prd_documents.project_id', '=', projectId)
      .where('prd_documents.user_id', '=', userId)
      .executeTakeFirstOrThrow(),
  ]);

  return {
    sessions: Number(sessions.count),
    messages: Number(messages.count),
    prdDocuments: Number(prdDocuments.count),
    prdAnalyses: Number(prdAnalyses.count),
    aiEvaluations: Number(aiEvaluations.count),
    activityLogs: Number(activityLogs.count),
    promptTemplates: Number(promptTemplates.count),
    conflicts: Number(conflicts.count),
    syncedSessions: Number(syncedSessions.count),
  };
}

export async function deleteCollaboratorData(
  db: Db,
  projectId: string,
  userId: string,
): Promise<DeletedDataSummary> {
  return db.transaction().execute(async (trx) => {
    // Count before deletion for audit log
    const sessionRows = await trx
      .selectFrom('sessions')
      .select('id')
      .where('project_id', '=', projectId)
      .where('user_id', '=', userId)
      .execute();
    const sessionIds = sessionRows.map((s) => s.id);

    // Nullify conflict references (resolved_by / reviewer_id have no ON DELETE rule)
    if (sessionIds.length > 0) {
      await trx
        .updateTable('conflicts')
        .set({ resolved_by: null })
        .where('project_id', '=', projectId)
        .where('resolved_by', '=', userId)
        .execute();

      await trx
        .updateTable('conflicts')
        .set({ reviewer_id: null })
        .where('project_id', '=', projectId)
        .where('reviewer_id', '=', userId)
        .execute();
    }

    // 1. Delete sessions (CASCADE: messages, synced_sessions, conflicts via session FK)
    const sessionsResult = await trx
      .deleteFrom('sessions')
      .where('project_id', '=', projectId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // 2. Delete PRD documents (CASCADE: prd_analyses → prd_requirements)
    const prdResult = await trx
      .deleteFrom('prd_documents')
      .where('project_id', '=', projectId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // 3. Delete AI evaluations targeting this user (CASCADE: dimensions → evidence)
    const evalResult = await trx
      .deleteFrom('ai_evaluations')
      .where('project_id', '=', projectId)
      .where('target_user_id', '=', userId)
      .executeTakeFirst();

    // 4. Delete activity logs
    const activityResult = await trx
      .deleteFrom('activity_log')
      .where('project_id', '=', projectId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    // 5. Delete project-scoped prompt templates (not global ones where project_id IS NULL)
    const templateResult = await trx
      .deleteFrom('prompt_templates')
      .where('project_id', '=', projectId)
      .where('author_id', '=', userId)
      .executeTakeFirst();

    // 6. Delete collaborator record
    await trx
      .deleteFrom('project_collaborators')
      .where('project_id', '=', projectId)
      .where('user_id', '=', userId)
      .execute();

    return {
      sessions: Number(sessionsResult.numDeletedRows),
      prdDocuments: Number(prdResult.numDeletedRows),
      aiEvaluations: Number(evalResult.numDeletedRows),
      activityLogs: Number(activityResult.numDeletedRows),
      promptTemplates: Number(templateResult.numDeletedRows),
    };
  });
}
