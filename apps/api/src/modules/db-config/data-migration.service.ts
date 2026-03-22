import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Db } from '../../database/client.js';
import type { TeamDatabase } from '../../database/types.js';
import type { TeamDb } from '../../database/pool-manager.js';
import { decrypt } from '../../lib/encryption.js';
import { AppError } from '../../plugins/error-handler.plugin.js';
import * as dbConfigRepo from './db-config.repository.js';
import { syncMultipleUsersToRemote } from './user-sync.service.js';

const SESSION_BATCH_SIZE = 100;
const MESSAGE_BATCH_SIZE = 500;

export interface MigrationProgress {
  readonly id: string;
  readonly status: string;
  readonly direction: string;
  readonly totalSessions: number;
  readonly migratedSessions: number;
  readonly totalMessages: number;
  readonly migratedMessages: number;
  readonly errorMessage: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export async function getMigrationProgress(
  db: Db,
  projectId: string,
): Promise<MigrationProgress | null> {
  const job = await dbConfigRepo.findLatestMigrationJob(db, projectId);
  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    direction: job.direction,
    totalSessions: job.totalSessions,
    migratedSessions: job.migratedSessions,
    totalMessages: job.totalMessages,
    migratedMessages: job.migratedMessages,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export async function startMigration(
  localDb: Db,
  projectId: string,
  _userId: string,
  jwtSecret: string,
): Promise<MigrationProgress> {
  // Verify config exists
  const config = await dbConfigRepo.findByProjectId(localDb, projectId);
  if (!config) {
    throw new AppError('No remote DB config found', 404);
  }
  if (config.status === 'active') {
    throw new AppError('Data has already been migrated', 400);
  }

  // Check no running migration
  const existingJob = await dbConfigRepo.findLatestMigrationJob(localDb, projectId);
  if (existingJob && existingJob.status === 'running') {
    throw new AppError('A migration is already in progress', 409);
  }

  // Count data to migrate
  const [sessionCount, messageCount] = await Promise.all([
    localDb
      .selectFrom('sessions')
      .select(localDb.fn.countAll<number>().as('count'))
      .where('project_id', '=', projectId)
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.count)),
    localDb
      .selectFrom('messages')
      .innerJoin('sessions', 'sessions.id', 'messages.session_id')
      .select(localDb.fn.countAll<number>().as('count'))
      .where('sessions.project_id', '=', projectId)
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.count)),
  ]);

  // Create job record
  const job = await dbConfigRepo.createMigrationJob(
    localDb,
    projectId,
    'to_remote',
    sessionCount,
    messageCount,
  );

  // Start async migration
  const connectionUrl = decrypt(config.connectionUrl, jwtSecret);
  runMigrationAsync(localDb, projectId, job.id, connectionUrl, config.sslEnabled).catch(() => {});

  return {
    id: job.id,
    status: 'running',
    direction: 'to_remote',
    totalSessions: sessionCount,
    migratedSessions: 0,
    totalMessages: messageCount,
    migratedMessages: 0,
    errorMessage: null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: null,
  };
}

async function runMigrationAsync(
  localDb: Db,
  projectId: string,
  jobId: string,
  connectionUrl: string,
  sslEnabled: boolean,
): Promise<void> {
  const remoteDb: TeamDb = new Kysely<TeamDatabase>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: connectionUrl,
        max: 5,
        connectionTimeoutMillis: 10_000,
        ssl: sslEnabled ? { rejectUnauthorized: true } : false,
      }),
    }),
  });

  try {
    // 1. Sync users involved in this project
    const userIds = await getProjectUserIds(localDb, projectId);
    await syncMultipleUsersToRemote(localDb, remoteDb, userIds);

    // 2. Migrate sessions in batches
    let sessionOffset = 0;
    let migratedSessions = 0;
    let migratedMessages = 0;

    while (true) {
      const sessions = await localDb
        .selectFrom('sessions')
        .selectAll()
        .where('project_id', '=', projectId)
        .orderBy('created_at', 'asc')
        .offset(sessionOffset)
        .limit(SESSION_BATCH_SIZE)
        .execute();

      if (sessions.length === 0) break;

      for (const session of sessions) {
        // Insert session (omit search_vector — trigger will rebuild it)
        await remoteDb
          .insertInto('sessions')
          .values({
            id: session.id,
            project_id: session.project_id,
            user_id: session.user_id,
            title: session.title,
            source: session.source,
            status: session.status,
            file_paths: session.file_paths,
            module_names: session.module_names,
            branch: session.branch,
            tags: session.tags,
            metadata: session.metadata,
            created_at: session.created_at,
            updated_at: session.updated_at,
          })
          .onConflict((oc) => oc.column('id').doNothing())
          .execute();

        migratedSessions++;

        // Migrate messages for this session in batches
        let msgOffset = 0;
        while (true) {
          const messages = await localDb
            .selectFrom('messages')
            .selectAll()
            .where('session_id', '=', session.id)
            .orderBy('sort_order', 'asc')
            .offset(msgOffset)
            .limit(MESSAGE_BATCH_SIZE)
            .execute();

          if (messages.length === 0) break;

          for (const msg of messages) {
            await remoteDb
              .insertInto('messages')
              .values({
                id: msg.id,
                session_id: msg.session_id,
                role: msg.role,
                content: msg.content,
                content_type: msg.content_type,
                tokens_used: msg.tokens_used,
                model_used: msg.model_used,
                sort_order: msg.sort_order,
                created_at: msg.created_at,
              })
              .onConflict((oc) => oc.column('id').doNothing())
              .execute();
          }

          migratedMessages += messages.length;
          msgOffset += MESSAGE_BATCH_SIZE;

          // Update progress
          await dbConfigRepo.updateMigrationJob(localDb, jobId, {
            migratedSessions,
            migratedMessages,
          });
        }
      }

      sessionOffset += SESSION_BATCH_SIZE;
    }

    // 3. Migrate conflicts
    await migrateConflicts(localDb, remoteDb, projectId);

    // 4. Migrate activity_log
    await migrateActivityLog(localDb, remoteDb, projectId);

    // 5. Migrate synced_sessions
    await migrateSyncedSessions(localDb, remoteDb, projectId);

    // 6. Migrate PRD data
    await migratePrdData(localDb, remoteDb, projectId);

    // 7. Migrate AI evaluations
    await migrateAiEvaluations(localDb, remoteDb, projectId);

    // Mark complete
    await dbConfigRepo.updateMigrationJob(localDb, jobId, {
      status: 'completed',
      migratedSessions,
      migratedMessages,
      completedAt: new Date(),
    });

    await dbConfigRepo.updateStatus(localDb, projectId, 'active');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Migration failed';
    await dbConfigRepo.updateMigrationJob(localDb, jobId, {
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    });
    await dbConfigRepo.updateStatus(localDb, projectId, 'failed');
  } finally {
    await remoteDb.destroy().catch(() => {});
  }
}

async function getProjectUserIds(db: Db, projectId: string): Promise<readonly string[]> {
  const owner = await db
    .selectFrom('projects')
    .select('owner_id')
    .where('id', '=', projectId)
    .executeTakeFirst();

  const collabs = await db
    .selectFrom('project_collaborators')
    .select('user_id')
    .where('project_id', '=', projectId)
    .execute();

  const ids = new Set<string>();
  if (owner) ids.add(owner.owner_id);
  for (const c of collabs) ids.add(c.user_id);
  return [...ids];
}

async function migrateConflicts(localDb: Db, remoteDb: TeamDb, projectId: string): Promise<void> {
  const conflicts = await localDb
    .selectFrom('conflicts')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const c of conflicts) {
    await remoteDb
      .insertInto('conflicts')
      .values({
        id: c.id,
        project_id: c.project_id,
        session_a_id: c.session_a_id,
        session_b_id: c.session_b_id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        status: c.status,
        description: c.description,
        overlapping_paths: c.overlapping_paths,
        diff_data: c.diff_data,
        resolved_by: c.resolved_by,
        created_at: c.created_at,
        resolved_at: c.resolved_at,
        reviewer_id: c.reviewer_id,
        review_notes: c.review_notes,
        assigned_at: c.assigned_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }
}

async function migrateActivityLog(localDb: Db, remoteDb: TeamDb, projectId: string): Promise<void> {
  const entries = await localDb
    .selectFrom('activity_log')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const e of entries) {
    await remoteDb
      .insertInto('activity_log')
      .values({
        id: e.id,
        project_id: e.project_id,
        user_id: e.user_id,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        metadata: e.metadata,
        created_at: e.created_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }
}

async function migrateSyncedSessions(
  localDb: Db,
  remoteDb: TeamDb,
  projectId: string,
): Promise<void> {
  const rows = await localDb
    .selectFrom('synced_sessions')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const r of rows) {
    await remoteDb
      .insertInto('synced_sessions')
      .values({
        id: r.id,
        project_id: r.project_id,
        session_id: r.session_id,
        external_session_id: r.external_session_id,
        source_path: r.source_path,
        synced_at: r.synced_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }
}

async function migratePrdData(localDb: Db, remoteDb: TeamDb, projectId: string): Promise<void> {
  const docs = await localDb
    .selectFrom('prd_documents')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const doc of docs) {
    await remoteDb
      .insertInto('prd_documents')
      .values({
        id: doc.id,
        project_id: doc.project_id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        file_name: doc.file_name,
        created_at: doc.created_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  const analyses = await localDb
    .selectFrom('prd_analyses')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const a of analyses) {
    await remoteDb
      .insertInto('prd_analyses')
      .values({
        id: a.id,
        prd_document_id: a.prd_document_id,
        project_id: a.project_id,
        status: a.status,
        overall_rate: a.overall_rate,
        total_items: a.total_items,
        achieved_items: a.achieved_items,
        partial_items: a.partial_items,
        not_started_items: a.not_started_items,
        scanned_files_count: a.scanned_files_count,
        model_used: a.model_used,
        input_tokens_used: a.input_tokens_used,
        output_tokens_used: a.output_tokens_used,
        error_message: a.error_message,
        created_at: a.created_at,
        completed_at: a.completed_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    const reqs = await localDb
      .selectFrom('prd_requirements')
      .selectAll()
      .where('prd_analysis_id', '=', a.id)
      .execute();

    for (const r of reqs) {
      await remoteDb
        .insertInto('prd_requirements')
        .values({
          id: r.id,
          prd_analysis_id: r.prd_analysis_id,
          requirement_text: r.requirement_text,
          category: r.category,
          status: r.status,
          confidence: r.confidence,
          evidence: r.evidence,
          file_paths: r.file_paths,
          sort_order: r.sort_order,
          created_at: r.created_at,
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();
    }
  }
}

async function migrateAiEvaluations(
  localDb: Db,
  remoteDb: TeamDb,
  projectId: string,
): Promise<void> {
  const evals = await localDb
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('project_id', '=', projectId)
    .execute();

  for (const e of evals) {
    await remoteDb
      .insertInto('ai_evaluations')
      .values({
        id: e.id,
        project_id: e.project_id,
        target_user_id: e.target_user_id,
        triggered_by_user_id: e.triggered_by_user_id,
        status: e.status,
        overall_score: e.overall_score,
        prompt_quality_score: e.prompt_quality_score,
        task_complexity_score: e.task_complexity_score,
        iteration_pattern_score: e.iteration_pattern_score,
        context_utilization_score: e.context_utilization_score,
        ai_capability_leverage_score: e.ai_capability_leverage_score,
        proficiency_tier: e.proficiency_tier,
        sessions_analyzed: e.sessions_analyzed,
        messages_analyzed: e.messages_analyzed,
        date_range_start: e.date_range_start,
        date_range_end: e.date_range_end,
        model_used: e.model_used,
        input_tokens_used: e.input_tokens_used,
        output_tokens_used: e.output_tokens_used,
        error_message: e.error_message,
        improvement_summary: e.improvement_summary,
        created_at: e.created_at,
        completed_at: e.completed_at,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    const dims = await localDb
      .selectFrom('ai_evaluation_dimensions')
      .selectAll()
      .where('evaluation_id', '=', e.id)
      .execute();

    for (const d of dims) {
      await remoteDb
        .insertInto('ai_evaluation_dimensions')
        .values({
          id: d.id,
          evaluation_id: d.evaluation_id,
          dimension: d.dimension,
          score: d.score,
          confidence: d.confidence,
          summary: d.summary,
          strengths: d.strengths,
          weaknesses: d.weaknesses,
          suggestions: d.suggestions,
          sort_order: d.sort_order,
        })
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

      const evidence = await localDb
        .selectFrom('ai_evaluation_evidence')
        .selectAll()
        .where('dimension_id', '=', d.id)
        .execute();

      for (const ev of evidence) {
        await remoteDb
          .insertInto('ai_evaluation_evidence')
          .values({
            id: ev.id,
            dimension_id: ev.dimension_id,
            message_id: ev.message_id,
            session_id: ev.session_id,
            excerpt: ev.excerpt,
            sentiment: ev.sentiment,
            annotation: ev.annotation,
            sort_order: ev.sort_order,
          })
          .onConflict((oc) => oc.column('id').doNothing())
          .execute();
      }
    }
  }
}
