import type { Db } from '../../database/client.js';
import type {
  AiEvaluation,
  AiEvaluationStatus,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  ProficiencyTier,
} from '@context-sync/shared';
import { toDimension, toEvidence } from './ai-evaluation-detail.repository.js';
export { createDimensions, createEvidence } from './ai-evaluation-detail.repository.js';

interface CreateEvaluationInput {
  readonly projectId: string;
  readonly targetUserId: string;
  readonly triggeredByUserId: string;
  readonly dateRangeStart: Date;
  readonly dateRangeEnd: Date;
  readonly modelUsed: string;
}

interface UpdateEvaluationInput {
  readonly status?: string;
  readonly overallScore?: number;
  readonly promptQualityScore?: number;
  readonly taskComplexityScore?: number;
  readonly iterationPatternScore?: number;
  readonly contextUtilizationScore?: number;
  readonly aiCapabilityLeverageScore?: number;
  readonly proficiencyTier?: string;
  readonly sessionsAnalyzed?: number;
  readonly messagesAnalyzed?: number;
  readonly inputTokensUsed?: number;
  readonly outputTokensUsed?: number;
  readonly errorMessage?: string | null;
  readonly improvementSummary?: string | null;
  readonly completedAt?: Date;
}

export async function createEvaluation(
  db: Db,
  input: CreateEvaluationInput,
): Promise<AiEvaluation> {
  const row = await db
    .insertInto('ai_evaluations')
    .values({
      project_id: input.projectId,
      target_user_id: input.targetUserId,
      triggered_by_user_id: input.triggeredByUserId,
      date_range_start: input.dateRangeStart,
      date_range_end: input.dateRangeEnd,
      model_used: input.modelUsed,
      overall_score: null,
      error_message: null,
      improvement_summary: null,
      completed_at: null,
      prompt_quality_score: null,
      task_complexity_score: null,
      iteration_pattern_score: null,
      context_utilization_score: null,
      ai_capability_leverage_score: null,
      proficiency_tier: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toEvaluation(row);
}

export async function updateEvaluation(
  db: Db,
  id: string,
  updates: UpdateEvaluationInput,
): Promise<AiEvaluation> {
  const setValues: Record<string, unknown> = {};
  if (updates.status !== undefined) setValues['status'] = updates.status;
  if (updates.overallScore !== undefined) setValues['overall_score'] = updates.overallScore;
  if (updates.promptQualityScore !== undefined)
    setValues['prompt_quality_score'] = updates.promptQualityScore;
  if (updates.taskComplexityScore !== undefined)
    setValues['task_complexity_score'] = updates.taskComplexityScore;
  if (updates.iterationPatternScore !== undefined)
    setValues['iteration_pattern_score'] = updates.iterationPatternScore;
  if (updates.contextUtilizationScore !== undefined)
    setValues['context_utilization_score'] = updates.contextUtilizationScore;
  if (updates.aiCapabilityLeverageScore !== undefined)
    setValues['ai_capability_leverage_score'] = updates.aiCapabilityLeverageScore;
  if (updates.proficiencyTier !== undefined)
    setValues['proficiency_tier'] = updates.proficiencyTier;
  if (updates.sessionsAnalyzed !== undefined)
    setValues['sessions_analyzed'] = updates.sessionsAnalyzed;
  if (updates.messagesAnalyzed !== undefined)
    setValues['messages_analyzed'] = updates.messagesAnalyzed;
  if (updates.inputTokensUsed !== undefined)
    setValues['input_tokens_used'] = updates.inputTokensUsed;
  if (updates.outputTokensUsed !== undefined)
    setValues['output_tokens_used'] = updates.outputTokensUsed;
  if (updates.errorMessage !== undefined) setValues['error_message'] = updates.errorMessage;
  if (updates.improvementSummary !== undefined)
    setValues['improvement_summary'] = updates.improvementSummary;
  if (updates.completedAt !== undefined) setValues['completed_at'] = updates.completedAt;

  const row = await db
    .updateTable('ai_evaluations')
    .set(setValues)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toEvaluation(row);
}

export async function findPendingOrAnalyzing(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<AiEvaluation | null> {
  const row = await db
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', 'in', ['pending', 'analyzing'])
    .executeTakeFirst();

  return row ? toEvaluation(row) : null;
}

export async function findLatestCompleted(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<AiEvaluation | null> {
  const row = await db
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', '=', 'completed')
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  return row ? toEvaluation(row) : null;
}

export async function findEvaluationById(
  db: Db,
  id: string,
): Promise<AiEvaluationWithDetails | null> {
  const evalRow = await db
    .selectFrom('ai_evaluations')
    .leftJoin('users', 'users.id', 'ai_evaluations.target_user_id')
    .select([
      'ai_evaluations.id',
      'ai_evaluations.project_id',
      'ai_evaluations.target_user_id',
      'ai_evaluations.triggered_by_user_id',
      'ai_evaluations.status',
      'ai_evaluations.overall_score',
      'ai_evaluations.prompt_quality_score',
      'ai_evaluations.task_complexity_score',
      'ai_evaluations.iteration_pattern_score',
      'ai_evaluations.context_utilization_score',
      'ai_evaluations.ai_capability_leverage_score',
      'ai_evaluations.proficiency_tier',
      'ai_evaluations.sessions_analyzed',
      'ai_evaluations.messages_analyzed',
      'ai_evaluations.date_range_start',
      'ai_evaluations.date_range_end',
      'ai_evaluations.model_used',
      'ai_evaluations.input_tokens_used',
      'ai_evaluations.output_tokens_used',
      'ai_evaluations.error_message',
      'ai_evaluations.improvement_summary',
      'ai_evaluations.created_at',
      'ai_evaluations.completed_at',
      'users.name as target_user_name',
      'users.avatar_url as target_user_avatar_url',
    ])
    .where('ai_evaluations.id', '=', id)
    .executeTakeFirst();

  if (!evalRow) return null;

  const dimensionRows = await db
    .selectFrom('ai_evaluation_dimensions')
    .selectAll()
    .where('evaluation_id', '=', evalRow.id)
    .orderBy('sort_order', 'asc')
    .execute();

  const dimensionIds = dimensionRows.map((d) => d.id as string);
  let evidenceRows: Record<string, unknown>[] = [];
  if (dimensionIds.length > 0) {
    evidenceRows = await db
      .selectFrom('ai_evaluation_evidence')
      .selectAll()
      .where('dimension_id', 'in', dimensionIds)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  return {
    ...toEvaluation(evalRow),
    dimensions: dimensionRows.map(toDimension),
    evidence: evidenceRows.map(toEvidence),
    targetUserName: evalRow.target_user_name as string | undefined,
    targetUserAvatarUrl: (evalRow.target_user_avatar_url as string) ?? null,
  };
}

export async function findLatestEvaluationWithDetails(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<AiEvaluationWithDetails | null> {
  const evalRow = await db
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', '=', 'completed')
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (!evalRow) return null;

  return findEvaluationById(db, evalRow.id as string);
}

export async function findEvaluationHistory(
  db: Db,
  projectId: string,
  targetUserId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly AiEvaluationHistoryEntry[]; total: number }> {
  const offset = (page - 1) * limit;

  const baseQuery = db
    .selectFrom('ai_evaluations')
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId);

  const [rows, countResult] = await Promise.all([
    baseQuery
      .select([
        'id',
        'status',
        'overall_score',
        'proficiency_tier',
        'sessions_analyzed',
        'messages_analyzed',
        'date_range_start',
        'date_range_end',
        'created_at',
        'completed_at',
      ])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    baseQuery.select(db.fn.countAll().as('count')).executeTakeFirstOrThrow(),
  ]);

  return {
    entries: rows.map((row) => ({
      id: row.id,
      status: row.status as AiEvaluationStatus,
      overallScore: row.overall_score != null ? Number(row.overall_score) : null,
      proficiencyTier: (row.proficiency_tier as ProficiencyTier) ?? null,
      sessionsAnalyzed: Number(row.sessions_analyzed),
      messagesAnalyzed: Number(row.messages_analyzed),
      dateRangeStart: (row.date_range_start as Date).toISOString(),
      dateRangeEnd: (row.date_range_end as Date).toISOString(),
      createdAt: (row.created_at as Date).toISOString(),
      completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
    })),
    total: Number(countResult.count),
  };
}

export async function findTeamEvaluationSummary(
  db: Db,
  projectId: string,
): Promise<readonly TeamEvaluationSummaryEntry[]> {
  // Get all project members
  const owner = await db
    .selectFrom('projects')
    .innerJoin('users', 'users.id', 'projects.owner_id')
    .select(['users.id', 'users.name', 'users.avatar_url'])
    .where('projects.id', '=', projectId)
    .executeTakeFirst();

  const collaborators = await db
    .selectFrom('project_collaborators')
    .innerJoin('users', 'users.id', 'project_collaborators.user_id')
    .select(['users.id', 'users.name', 'users.avatar_url'])
    .where('project_collaborators.project_id', '=', projectId)
    .execute();

  const members = owner
    ? [{ id: owner.id, name: owner.name, avatar_url: owner.avatar_url }, ...collaborators]
    : collaborators;

  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.id as string);

  // Get latest completed evaluation for each member
  const evaluations = await db
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('project_id', '=', projectId)
    .where('target_user_id', 'in', memberIds)
    .where('status', '=', 'completed')
    .orderBy('created_at', 'desc')
    .execute();

  const latestByUser = new Map<string, AiEvaluation>();
  for (const row of evaluations) {
    const userId = row.target_user_id as string;
    if (!latestByUser.has(userId)) {
      latestByUser.set(userId, toEvaluation(row));
    }
  }

  return members.map((m) => ({
    userId: m.id as string,
    userName: m.name as string,
    userAvatarUrl: (m.avatar_url as string) ?? null,
    latestEvaluation: latestByUser.get(m.id as string) ?? null,
  }));
}

export async function findUserMessagesForEvaluation(
  db: Db,
  projectId: string,
  targetUserId: string,
  dateRangeStart: Date,
  dateRangeEnd: Date,
  maxSessions: number,
): Promise<{
  messages: readonly { id: string; sessionId: string; content: string; createdAt: string }[];
  sessionCount: number;
}> {
  // Get sessions in the date range, ordered by most recent
  const sessions = await db
    .selectFrom('sessions')
    .select(['id', 'created_at'])
    .where('project_id', '=', projectId)
    .where('user_id', '=', targetUserId)
    .where('created_at', '>=', dateRangeStart)
    .where('created_at', '<=', dateRangeEnd)
    .orderBy('created_at', 'desc')
    .limit(maxSessions)
    .execute();

  if (sessions.length === 0) {
    return { messages: [], sessionCount: 0 };
  }

  const sessionIds = sessions.map((s) => s.id as string);

  // Get user messages from those sessions
  const messageRows = await db
    .selectFrom('messages')
    .select(['id', 'session_id', 'content', 'created_at'])
    .where('session_id', 'in', sessionIds)
    .where('role', '=', 'user')
    .orderBy('created_at', 'asc')
    .execute();

  return {
    messages: messageRows.map((row) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      content: row.content as string,
      createdAt: (row.created_at as Date).toISOString(),
    })),
    sessionCount: sessions.length,
  };
}

function toEvaluation(row: Record<string, unknown>): AiEvaluation {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    targetUserId: row['target_user_id'] as string,
    triggeredByUserId: row['triggered_by_user_id'] as string,
    status: row['status'] as AiEvaluationStatus,
    overallScore: row['overall_score'] != null ? Number(row['overall_score']) : null,
    promptQualityScore:
      row['prompt_quality_score'] != null ? Number(row['prompt_quality_score']) : null,
    taskComplexityScore:
      row['task_complexity_score'] != null ? Number(row['task_complexity_score']) : null,
    iterationPatternScore:
      row['iteration_pattern_score'] != null ? Number(row['iteration_pattern_score']) : null,
    contextUtilizationScore:
      row['context_utilization_score'] != null ? Number(row['context_utilization_score']) : null,
    aiCapabilityLeverageScore:
      row['ai_capability_leverage_score'] != null
        ? Number(row['ai_capability_leverage_score'])
        : null,
    proficiencyTier: (row['proficiency_tier'] as ProficiencyTier) ?? null,
    sessionsAnalyzed: Number(row['sessions_analyzed'] ?? 0),
    messagesAnalyzed: Number(row['messages_analyzed'] ?? 0),
    dateRangeStart: (row['date_range_start'] as Date).toISOString(),
    dateRangeEnd: (row['date_range_end'] as Date).toISOString(),
    modelUsed: row['model_used'] as string,
    inputTokensUsed: Number(row['input_tokens_used'] ?? 0),
    outputTokensUsed: Number(row['output_tokens_used'] ?? 0),
    errorMessage: (row['error_message'] as string) ?? null,
    improvementSummary: (row['improvement_summary'] as string) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
    completedAt: row['completed_at'] ? (row['completed_at'] as Date).toISOString() : null,
  };
}
