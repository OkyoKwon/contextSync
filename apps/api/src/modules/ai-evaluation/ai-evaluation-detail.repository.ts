import type { Db } from '../../database/client.js';
import type {
  AiEvaluationDimensionDetail,
  AiEvaluationEvidence,
  EvidenceSentiment,
} from '@context-sync/shared';

interface CreateDimensionInput {
  readonly dimension: string;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly suggestions: readonly string[];
  readonly sortOrder: number;
}

interface CreateEvidenceInput {
  readonly dimensionId: string;
  readonly messageId: string | null;
  readonly sessionId: string | null;
  readonly excerpt: string;
  readonly sentiment: string;
  readonly annotation: string;
  readonly sortOrder: number;
}

export async function createDimensions(
  db: Db,
  evaluationId: string,
  items: readonly CreateDimensionInput[],
): Promise<readonly AiEvaluationDimensionDetail[]> {
  if (items.length === 0) return [];

  const values = items.map((item) => ({
    evaluation_id: evaluationId,
    dimension: item.dimension,
    score: item.score,
    confidence: item.confidence,
    summary: item.summary,
    strengths: item.strengths as string[],
    weaknesses: item.weaknesses as string[],
    suggestions: item.suggestions as string[],
    sort_order: item.sortOrder,
  }));

  const rows = await db
    .insertInto('ai_evaluation_dimensions')
    .values(values)
    .returningAll()
    .execute();

  return rows.map(toDimension);
}

export async function createEvidence(
  db: Db,
  items: readonly CreateEvidenceInput[],
): Promise<readonly AiEvaluationEvidence[]> {
  if (items.length === 0) return [];

  // Validate that referenced message IDs actually exist to avoid FK violations
  const messageIds = [...new Set(items.map((i) => i.messageId).filter(Boolean))] as string[];
  const validMessageIds = new Set<string>();

  if (messageIds.length > 0) {
    const existingRows = await db
      .selectFrom('messages')
      .select('id')
      .where('id', 'in', messageIds)
      .execute();
    for (const row of existingRows) {
      validMessageIds.add(row.id);
    }
  }

  const values = items.map((item) => ({
    dimension_id: item.dimensionId,
    message_id: item.messageId && validMessageIds.has(item.messageId) ? item.messageId : null,
    session_id: item.messageId && validMessageIds.has(item.messageId) ? item.sessionId : null,
    excerpt: item.excerpt,
    sentiment: item.sentiment,
    annotation: item.annotation,
    sort_order: item.sortOrder,
  }));

  const rows = await db
    .insertInto('ai_evaluation_evidence')
    .values(values)
    .returningAll()
    .execute();

  return rows.map(toEvidence);
}

export function toDimension(row: Record<string, unknown>): AiEvaluationDimensionDetail {
  return {
    id: row['id'] as string,
    evaluationId: row['evaluation_id'] as string,
    dimension: row['dimension'] as string,
    score: Number(row['score']),
    confidence: Number(row['confidence']),
    summary: row['summary'] as string,
    summaryKo: (row['summary_ko'] as string) ?? null,
    strengths: (row['strengths'] as string[]) ?? [],
    strengthsKo: (row['strengths_ko'] as string[]) ?? null,
    weaknesses: (row['weaknesses'] as string[]) ?? [],
    weaknessesKo: (row['weaknesses_ko'] as string[]) ?? null,
    suggestions: (row['suggestions'] as string[]) ?? [],
    suggestionsKo: (row['suggestions_ko'] as string[]) ?? null,
    sortOrder: Number(row['sort_order'] ?? 0),
  };
}

export function toEvidence(row: Record<string, unknown>): AiEvaluationEvidence {
  return {
    id: row['id'] as string,
    dimensionId: row['dimension_id'] as string,
    messageId: (row['message_id'] as string) ?? null,
    sessionId: (row['session_id'] as string) ?? null,
    excerpt: row['excerpt'] as string,
    sentiment: row['sentiment'] as EvidenceSentiment,
    annotation: row['annotation'] as string,
    annotationKo: (row['annotation_ko'] as string) ?? null,
    sortOrder: Number(row['sort_order'] ?? 0),
  };
}

export async function updateDimensionTranslation(
  db: Db,
  dimensionId: string,
  translation: {
    readonly summaryKo: string;
    readonly strengthsKo: readonly string[];
    readonly weaknessesKo: readonly string[];
    readonly suggestionsKo: readonly string[];
  },
): Promise<void> {
  await db
    .updateTable('ai_evaluation_dimensions')
    .set({
      summary_ko: translation.summaryKo,
      strengths_ko: translation.strengthsKo as string[],
      weaknesses_ko: translation.weaknessesKo as string[],
      suggestions_ko: translation.suggestionsKo as string[],
    })
    .where('id', '=', dimensionId)
    .execute();
}

export async function updateEvidenceTranslations(
  db: Db,
  dimensionId: string,
  annotationsKo: readonly string[],
): Promise<void> {
  const evidenceRows = await db
    .selectFrom('ai_evaluation_evidence')
    .select(['id'])
    .where('dimension_id', '=', dimensionId)
    .orderBy('sort_order', 'asc')
    .execute();

  for (let i = 0; i < evidenceRows.length; i++) {
    const row = evidenceRows[i]!;
    const annotationKo = annotationsKo[i] ?? null;
    if (annotationKo) {
      await db
        .updateTable('ai_evaluation_evidence')
        .set({ annotation_ko: annotationKo })
        .where('id', '=', row.id)
        .execute();
    }
  }
}
