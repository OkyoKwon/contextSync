import type { Db } from '../../database/client.js';
import type {
  AiEvaluation,
  AiEvaluationStatus,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  EvaluationPerspective,
  EvaluationGroupResult,
  EvaluationGroupHistoryEntry,
} from '@context-sync/shared';
import { EVALUATION_PERSPECTIVES } from '@context-sync/shared';
import { toDimension, toEvidence } from './ai-evaluation-detail.repository.js';
export {
  createDimensions,
  createEvidence,
  updateDimensionTranslation,
  updateEvidenceTranslations,
} from './ai-evaluation-detail.repository.js';

interface CreateEvaluationInput {
  readonly projectId: string;
  readonly targetUserId: string;
  readonly triggeredByUserId: string;
  readonly dateRangeStart: Date;
  readonly dateRangeEnd: Date;
  readonly modelUsed: string;
  readonly perspective: EvaluationPerspective;
  readonly evaluationGroupId: string;
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
  readonly improvementSummaryKo?: string | null;
  readonly completedAt?: Date;
  readonly [key: string]: unknown;
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
      perspective: input.perspective,
      evaluation_group_id: input.evaluationGroupId,
      overall_score: null,
      error_message: null,
      improvement_summary: null,
      improvement_summary_ko: null,
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
  if (updates.improvementSummaryKo !== undefined)
    setValues['improvement_summary_ko'] = updates.improvementSummaryKo;
  if (updates.completedAt !== undefined) setValues['completed_at'] = updates.completedAt;

  const row = await db
    .updateTable('ai_evaluations')
    .set(setValues)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toEvaluation(row);
}

// === Group-aware guards ===

export async function findPendingOrAnalyzingGroup(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<boolean> {
  // Stuck 방지: 10분 이상 pending/analyzing 상태인 레코드는 자동으로 failed 처리
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000);

  await db
    .updateTable('ai_evaluations')
    .set({ status: 'failed', error_message: 'Timed out after 10 minutes' })
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', 'in', ['pending', 'analyzing'])
    .where('created_at', '<', stuckThreshold)
    .execute();

  const row = await db
    .selectFrom('ai_evaluations')
    .select('id')
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', 'in', ['pending', 'analyzing'])
    .executeTakeFirst();

  return !!row;
}

export async function findLatestCompletedGroupTime(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom('ai_evaluations')
    .select('completed_at')
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('status', '=', 'completed')
    .orderBy('completed_at', 'desc')
    .executeTakeFirst();

  if (!row?.completed_at) return null;
  return (row.completed_at as Date).toISOString();
}

// === Group queries ===

export async function findEvaluationGroup(
  db: Db,
  groupId: string,
): Promise<EvaluationGroupResult | null> {
  const rows = await db
    .selectFrom('ai_evaluations')
    .selectAll()
    .where('evaluation_group_id', '=', groupId)
    .execute();

  if (rows.length === 0) return null;

  const evaluationsMap = new Map<string, AiEvaluation>();
  for (const row of rows) {
    const eval_ = toEvaluation(row);
    evaluationsMap.set(eval_.perspective, eval_);
  }

  // Fetch details for each perspective
  let claude: AiEvaluationWithDetails | null = null;
  let chatgpt: AiEvaluationWithDetails | null = null;
  let gemini: AiEvaluationWithDetails | null = null;

  for (const perspective of EVALUATION_PERSPECTIVES) {
    const eval_ = evaluationsMap.get(perspective);
    const detail: AiEvaluationWithDetails | null = eval_
      ? eval_.status === 'completed'
        ? ((await findEvaluationById(db, eval_.id)) ?? null)
        : { ...eval_, dimensions: [], evidence: [] }
      : null;

    if (perspective === 'claude') claude = detail;
    else if (perspective === 'chatgpt') chatgpt = detail;
    else gemini = detail;
  }

  return { groupId, claude, chatgpt, gemini };
}

export async function findLatestEvaluationGroup(
  db: Db,
  projectId: string,
  targetUserId: string,
): Promise<EvaluationGroupResult | null> {
  // Find the most recent group_id
  const row = await db
    .selectFrom('ai_evaluations')
    .select('evaluation_group_id')
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('evaluation_group_id', 'is not', null)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();

  if (!row?.evaluation_group_id) {
    // Fallback: check for legacy single evaluations (no group_id)
    const legacyEval = await findLatestEvaluationWithDetails(db, projectId, targetUserId);
    if (!legacyEval) return null;
    return {
      groupId: legacyEval.id, // Use evaluation id as pseudo-group
      claude: legacyEval,
      chatgpt: null,
      gemini: null,
    };
  }

  return findEvaluationGroup(db, row.evaluation_group_id as string);
}

export async function findEvaluationGroupHistory(
  db: Db,
  projectId: string,
  targetUserId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly EvaluationGroupHistoryEntry[]; total: number }> {
  const offset = (page - 1) * limit;

  // Get distinct group_ids ordered by creation
  const groupRows = await db
    .selectFrom('ai_evaluations')
    .select(['evaluation_group_id', db.fn.max('created_at').as('latest_created_at')])
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('evaluation_group_id', 'is not', null)
    .groupBy('evaluation_group_id')
    .orderBy('latest_created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  // Count total groups
  const countResult = await db
    .selectFrom('ai_evaluations')
    .select(db.fn.count<number>('evaluation_group_id').distinct().as('count'))
    .where('project_id', '=', projectId)
    .where('target_user_id', '=', targetUserId)
    .where('evaluation_group_id', 'is not', null)
    .executeTakeFirstOrThrow();

  if (groupRows.length === 0) {
    return { entries: [], total: Number(countResult.count) };
  }

  const groupIds = groupRows.map((r) => r.evaluation_group_id as string);

  // Fetch all evaluations for these groups
  const evalRows = await db
    .selectFrom('ai_evaluations')
    .select([
      'id',
      'evaluation_group_id',
      'perspective',
      'status',
      'overall_score',
      'proficiency_tier',
      'sessions_analyzed',
      'messages_analyzed',
      'date_range_start',
      'date_range_end',
      'created_at',
    ])
    .where('evaluation_group_id', 'in', groupIds)
    .orderBy('created_at', 'desc')
    .execute();

  // Group by evaluation_group_id
  const grouped = new Map<string, typeof evalRows>();
  for (const row of evalRows) {
    const gid = row.evaluation_group_id as string;
    const existing = grouped.get(gid) ?? [];
    grouped.set(gid, [...existing, row]);
  }

  const entries: EvaluationGroupHistoryEntry[] = groupIds.map((gid) => {
    const evals = grouped.get(gid) ?? [];
    const first = evals[0];
    return {
      groupId: gid,
      createdAt: first ? (first.created_at as Date).toISOString() : '',
      perspectives: evals.map((e) => ({
        perspective: e.perspective as string as EvaluationPerspective,
        evaluationId: e.id as string,
        overallScore: e.overall_score != null ? Number(e.overall_score) : null,
        proficiencyTier: (e.proficiency_tier as string) ?? null,
        status: e.status as AiEvaluationStatus,
      })),
      sessionsAnalyzed: first ? Number(first.sessions_analyzed) : 0,
      messagesAnalyzed: first ? Number(first.messages_analyzed) : 0,
      dateRangeStart: first ? (first.date_range_start as Date).toISOString() : '',
      dateRangeEnd: first ? (first.date_range_end as Date).toISOString() : '',
    };
  });

  return { entries, total: Number(countResult.count) };
}

// === Existing queries (backward compatible) ===

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
      'ai_evaluations.improvement_summary_ko',
      'ai_evaluations.perspective',
      'ai_evaluations.evaluation_group_id',
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
        'perspective',
        'evaluation_group_id',
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
      id: row.id as string,
      status: row.status as AiEvaluationStatus,
      overallScore: row.overall_score != null ? Number(row.overall_score) : null,
      proficiencyTier: (row.proficiency_tier as string) ?? null,
      sessionsAnalyzed: Number(row.sessions_analyzed),
      messagesAnalyzed: Number(row.messages_analyzed),
      dateRangeStart: (row.date_range_start as Date).toISOString(),
      dateRangeEnd: (row.date_range_end as Date).toISOString(),
      perspective: (row.perspective as EvaluationPerspective) ?? 'claude',
      evaluationGroupId: (row.evaluation_group_id as string) ?? null,
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

  // Get all completed evaluations for members
  const evaluations = await db
    .selectFrom('ai_evaluations')
    .select([
      'id',
      'target_user_id',
      'overall_score',
      'proficiency_tier',
      'perspective',
      'evaluation_group_id',
      'status',
      'created_at',
    ])
    .where('project_id', '=', projectId)
    .where('target_user_id', 'in', memberIds)
    .where('status', '=', 'completed')
    .orderBy('created_at', 'desc')
    .execute();

  // For each member, find the latest group and extract perspective scores
  return members.map((m) => {
    const userId = m.id as string;
    const userEvals = evaluations.filter((e) => (e.target_user_id as string) === userId);

    // Find latest group_id (or latest single eval)
    const latestEval = userEvals[0];
    const latestGroupId = latestEval ? ((latestEval.evaluation_group_id as string) ?? null) : null;

    // Collect perspective scores from the latest group
    let claudeScore: { readonly score: number; readonly tier: string } | null = null;
    let chatgptScore: { readonly score: number; readonly tier: string } | null = null;
    let geminiScore: { readonly score: number; readonly tier: string } | null = null;

    if (latestGroupId) {
      for (const e of userEvals) {
        if ((e.evaluation_group_id as string) === latestGroupId) {
          const entry = {
            score: Number(e.overall_score),
            tier: (e.proficiency_tier as string) ?? '',
          };
          const p = e.perspective as string;
          if (p === 'claude') claudeScore = entry;
          else if (p === 'chatgpt') chatgptScore = entry;
          else if (p === 'gemini') geminiScore = entry;
        }
      }
    } else if (latestEval) {
      claudeScore = {
        score: Number(latestEval.overall_score),
        tier: (latestEval.proficiency_tier as string) ?? '',
      };
    }

    const perspectiveScores = {
      claude: claudeScore,
      chatgpt: chatgptScore,
      gemini: geminiScore,
    };

    // Build legacy latestEvaluation for backward compat (use the claude one)
    const claudeEval = latestGroupId
      ? userEvals.find(
          (e) =>
            (e.evaluation_group_id as string) === latestGroupId &&
            (e.perspective as string) === 'claude',
        )
      : latestEval;

    return {
      userId,
      userName: m.name as string,
      userAvatarUrl: (m.avatar_url as string) ?? null,
      latestEvaluation: claudeEval
        ? ({
            id: claudeEval.id as string,
            overallScore: Number(claudeEval.overall_score),
            proficiencyTier: (claudeEval.proficiency_tier as string) ?? null,
            status: claudeEval.status as AiEvaluationStatus,
          } as AiEvaluation)
        : null,
      latestGroupId,
      perspectives: perspectiveScores,
    };
  });
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

export async function findEvaluationsNeedingBackfill(
  db: Db,
  projectId: string,
  limit: number,
): Promise<readonly string[]> {
  const rows = await db
    .selectFrom('ai_evaluations')
    .select('id')
    .where('project_id', '=', projectId)
    .where('status', '=', 'completed')
    .where('improvement_summary', 'is not', null)
    .where('improvement_summary_ko', 'is', null)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute();

  return rows.map((r) => r.id as string);
}

export async function updateDimensionMainText(
  db: Db,
  dimensionId: string,
  update: {
    readonly summary: string;
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly suggestions: readonly string[];
  },
): Promise<void> {
  await db
    .updateTable('ai_evaluation_dimensions')
    .set({
      summary: update.summary,
      strengths: update.strengths as string[],
      weaknesses: update.weaknesses as string[],
      suggestions: update.suggestions as string[],
    })
    .where('id', '=', dimensionId)
    .execute();
}

export async function updateEvidenceMainAnnotations(
  db: Db,
  dimensionId: string,
  annotations: readonly string[],
): Promise<void> {
  const evidenceRows = await db
    .selectFrom('ai_evaluation_evidence')
    .select(['id'])
    .where('dimension_id', '=', dimensionId)
    .orderBy('sort_order', 'asc')
    .execute();

  for (let i = 0; i < evidenceRows.length; i++) {
    const row = evidenceRows[i]!;
    const annotation = annotations[i];
    if (annotation) {
      await db
        .updateTable('ai_evaluation_evidence')
        .set({ annotation })
        .where('id', '=', row.id)
        .execute();
    }
  }
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
    proficiencyTier: (row['proficiency_tier'] as string) ?? null,
    sessionsAnalyzed: Number(row['sessions_analyzed'] ?? 0),
    messagesAnalyzed: Number(row['messages_analyzed'] ?? 0),
    dateRangeStart: (row['date_range_start'] as Date).toISOString(),
    dateRangeEnd: (row['date_range_end'] as Date).toISOString(),
    modelUsed: row['model_used'] as string,
    inputTokensUsed: Number(row['input_tokens_used'] ?? 0),
    outputTokensUsed: Number(row['output_tokens_used'] ?? 0),
    errorMessage: (row['error_message'] as string) ?? null,
    improvementSummary: (row['improvement_summary'] as string) ?? null,
    improvementSummaryKo: (row['improvement_summary_ko'] as string) ?? null,
    perspective: ((row['perspective'] as string) ?? 'claude') as EvaluationPerspective,
    evaluationGroupId: (row['evaluation_group_id'] as string) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
    completedAt: row['completed_at'] ? (row['completed_at'] as Date).toISOString() : null,
  };
}
