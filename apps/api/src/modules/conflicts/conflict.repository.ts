import type { Db } from '../../database/client.js';
import type { Conflict, ConflictFilterQuery, DetectedConflict } from '@context-sync/shared';
import type { ConflictAnalysisResult } from './conflict-ai-analyzer.js';

export async function createConflict(
  db: Db,
  projectId: string,
  detected: DetectedConflict,
): Promise<Conflict> {
  const row = await db
    .insertInto('conflicts')
    .values({
      project_id: projectId,
      session_a_id: detected.sessionAId,
      session_b_id: detected.sessionBId,
      conflict_type: detected.conflictType,
      severity: detected.severity,
      description: detected.description,
      overlapping_paths: detected.overlappingPaths as string[],
      diff_data: JSON.stringify({}),
      resolved_by: null,
      resolved_at: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toConflict(row);
}

export async function findConflictsByProjectId(
  db: Db,
  projectId: string,
  filter: ConflictFilterQuery = {},
): Promise<{ conflicts: readonly Conflict[]; total: number }> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = db.selectFrom('conflicts').where('conflicts.project_id', '=', projectId);

  if (filter.severity) query = query.where('conflicts.severity', '=', filter.severity);
  if (filter.status) query = query.where('conflicts.status', '=', filter.status);
  if (filter.since) query = query.where('conflicts.created_at', '>=', new Date(filter.since));

  const [rows, countResult] = await Promise.all([
    query.selectAll().orderBy('conflicts.created_at', 'desc').limit(limit).offset(offset).execute(),
    query.select(db.fn.countAll().as('count')).executeTakeFirstOrThrow(),
  ]);

  return {
    conflicts: rows.map(toConflict),
    total: Number(countResult.count),
  };
}

export async function findConflictById(db: Db, id: string): Promise<Conflict | null> {
  const row = await db.selectFrom('conflicts').selectAll().where('id', '=', id).executeTakeFirst();

  return row ? toConflict(row) : null;
}

export async function updateConflictStatus(
  db: Db,
  id: string,
  status: string,
  resolvedBy?: string,
): Promise<Conflict> {
  const isResolved = status === 'resolved' || status === 'dismissed';
  const row = await db
    .updateTable('conflicts')
    .set({
      status,
      ...(isResolved && { resolved_by: resolvedBy ?? null, resolved_at: new Date() }),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toConflict(row);
}

export async function existsConflictBetweenSessions(
  db: Db,
  sessionAId: string,
  sessionBId: string,
): Promise<boolean> {
  const row = await db
    .selectFrom('conflicts')
    .select('id')
    .where((eb) =>
      eb.or([
        eb.and([eb('session_a_id', '=', sessionAId), eb('session_b_id', '=', sessionBId)]),
        eb.and([eb('session_a_id', '=', sessionBId), eb('session_b_id', '=', sessionAId)]),
      ]),
    )
    .where('status', 'in', ['detected', 'reviewing'])
    .executeTakeFirst();

  return !!row;
}

export async function assignReviewer(db: Db, id: string, reviewerId: string): Promise<Conflict> {
  const row = await db
    .updateTable('conflicts')
    .set({
      reviewer_id: reviewerId,
      assigned_at: new Date(),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toConflict(row);
}

export async function updateReviewNotes(
  db: Db,
  id: string,
  reviewNotes: string,
): Promise<Conflict> {
  const row = await db
    .updateTable('conflicts')
    .set({ review_notes: reviewNotes })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toConflict(row);
}

export async function updateAiAnalysis(
  db: Db,
  id: string,
  analysis: ConflictAnalysisResult,
): Promise<Conflict> {
  const row = await db
    .updateTable('conflicts')
    .set({
      ai_verdict: analysis.verdict,
      ai_confidence: analysis.confidence,
      ai_overlap_type: analysis.overlapType,
      ai_summary: analysis.summary,
      ai_risk_areas: [...analysis.riskAreas],
      ai_recommendation: analysis.recommendation,
      ai_recommendation_detail: analysis.recommendationDetail,
      ai_analyzed_at: new Date(),
      ai_model_used: analysis.modelUsed,
      ai_input_tokens: analysis.inputTokens,
      ai_output_tokens: analysis.outputTokens,
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toConflict(row);
}

export async function batchUpdateConflictStatus(
  db: Db,
  projectId: string,
  fromStatuses: readonly string[],
  toStatus: string,
  resolvedBy: string,
): Promise<number> {
  const rows = await db
    .updateTable('conflicts')
    .set({
      status: toStatus,
      resolved_by: resolvedBy,
      resolved_at: new Date(),
    })
    .where('project_id', '=', projectId)
    .where('status', 'in', [...fromStatuses])
    .returningAll()
    .execute();

  return rows.length;
}

function toConflict(row: Record<string, unknown>): Conflict {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    sessionAId: row['session_a_id'] as string,
    sessionBId: row['session_b_id'] as string,
    conflictType: row['conflict_type'] as Conflict['conflictType'],
    severity: row['severity'] as Conflict['severity'],
    status: row['status'] as Conflict['status'],
    description: row['description'] as string,
    overlappingPaths: (row['overlapping_paths'] as string[]) ?? [],
    diffData:
      typeof row['diff_data'] === 'string'
        ? JSON.parse(row['diff_data'] as string)
        : ((row['diff_data'] as Record<string, unknown>) ?? {}),
    resolvedBy: (row['resolved_by'] as string) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
    resolvedAt: row['resolved_at'] ? (row['resolved_at'] as Date).toISOString() : null,
    reviewerId: (row['reviewer_id'] as string) ?? null,
    reviewNotes: (row['review_notes'] as string) ?? null,
    assignedAt: row['assigned_at'] ? (row['assigned_at'] as Date).toISOString() : null,
    aiVerdict: (row['ai_verdict'] as Conflict['aiVerdict']) ?? null,
    aiConfidence: (row['ai_confidence'] as number) ?? null,
    aiOverlapType: (row['ai_overlap_type'] as Conflict['aiOverlapType']) ?? null,
    aiSummary: (row['ai_summary'] as string) ?? null,
    aiRiskAreas: (row['ai_risk_areas'] as string[]) ?? null,
    aiRecommendation: (row['ai_recommendation'] as Conflict['aiRecommendation']) ?? null,
    aiRecommendationDetail: (row['ai_recommendation_detail'] as string) ?? null,
    aiAnalyzedAt: row['ai_analyzed_at'] ? (row['ai_analyzed_at'] as Date).toISOString() : null,
    aiModelUsed: (row['ai_model_used'] as string) ?? null,
  };
}
