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

  const values = items.map((item) => ({
    dimension_id: item.dimensionId,
    message_id: item.messageId,
    session_id: item.sessionId,
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
    strengths: (row['strengths'] as string[]) ?? [],
    weaknesses: (row['weaknesses'] as string[]) ?? [],
    suggestions: (row['suggestions'] as string[]) ?? [],
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
    sortOrder: Number(row['sort_order'] ?? 0),
  };
}
