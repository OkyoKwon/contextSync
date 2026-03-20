import type { Db } from '../../database/client.js';
import type {
  PrdDocument,
  PrdAnalysis,
  PrdRequirement,
  PrdAnalysisWithRequirements,
  PrdAnalysisHistoryEntry,
  PrdRequirementStatus,
  PrdAnalysisStatus,
} from '@context-sync/shared';

interface CreatePrdDocumentInput {
  readonly projectId: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly fileName: string;
}

interface CreatePrdAnalysisInput {
  readonly prdDocumentId: string;
  readonly projectId: string;
  readonly modelUsed: string;
}

interface UpdatePrdAnalysisInput {
  readonly status?: string;
  readonly overallRate?: number;
  readonly totalItems?: number;
  readonly achievedItems?: number;
  readonly partialItems?: number;
  readonly notStartedItems?: number;
  readonly scannedFilesCount?: number;
  readonly inputTokensUsed?: number;
  readonly outputTokensUsed?: number;
  readonly errorMessage?: string | null;
  readonly completedAt?: Date;
}

interface CreatePrdRequirementInput {
  readonly requirementText: string;
  readonly category: string | null;
  readonly status: PrdRequirementStatus;
  readonly confidence: number;
  readonly evidence: string | null;
  readonly filePaths: readonly string[];
  readonly sortOrder: number;
}

export async function createPrdDocument(
  db: Db,
  input: CreatePrdDocumentInput,
): Promise<PrdDocument> {
  const row = await db
    .insertInto('prd_documents')
    .values({
      project_id: input.projectId,
      user_id: input.userId,
      title: input.title,
      content: input.content,
      file_name: input.fileName,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toPrdDocument(row);
}

export async function findPrdDocumentsByProjectId(
  db: Db,
  projectId: string,
): Promise<readonly PrdDocument[]> {
  const rows = await db
    .selectFrom('prd_documents')
    .selectAll()
    .where('project_id', '=', projectId)
    .orderBy('created_at', 'desc')
    .execute();

  return rows.map(toPrdDocument);
}

export async function findPrdDocumentById(
  db: Db,
  id: string,
): Promise<PrdDocument | null> {
  const row = await db
    .selectFrom('prd_documents')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  return row ? toPrdDocument(row) : null;
}

export async function deletePrdDocument(db: Db, id: string): Promise<void> {
  await db.deleteFrom('prd_documents').where('id', '=', id).execute();
}

export async function createPrdAnalysis(
  db: Db,
  input: CreatePrdAnalysisInput,
): Promise<PrdAnalysis> {
  const row = await db
    .insertInto('prd_analyses')
    .values({
      prd_document_id: input.prdDocumentId,
      project_id: input.projectId,
      model_used: input.modelUsed,
      error_message: null,
      completed_at: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toPrdAnalysis(row);
}

export async function updatePrdAnalysis(
  db: Db,
  id: string,
  updates: UpdatePrdAnalysisInput,
): Promise<PrdAnalysis> {
  const setValues: Record<string, unknown> = {};
  if (updates.status !== undefined) setValues['status'] = updates.status;
  if (updates.overallRate !== undefined) setValues['overall_rate'] = updates.overallRate;
  if (updates.totalItems !== undefined) setValues['total_items'] = updates.totalItems;
  if (updates.achievedItems !== undefined) setValues['achieved_items'] = updates.achievedItems;
  if (updates.partialItems !== undefined) setValues['partial_items'] = updates.partialItems;
  if (updates.notStartedItems !== undefined) setValues['not_started_items'] = updates.notStartedItems;
  if (updates.scannedFilesCount !== undefined) setValues['scanned_files_count'] = updates.scannedFilesCount;
  if (updates.inputTokensUsed !== undefined) setValues['input_tokens_used'] = updates.inputTokensUsed;
  if (updates.outputTokensUsed !== undefined) setValues['output_tokens_used'] = updates.outputTokensUsed;
  if (updates.errorMessage !== undefined) setValues['error_message'] = updates.errorMessage;
  if (updates.completedAt !== undefined) setValues['completed_at'] = updates.completedAt;

  const row = await db
    .updateTable('prd_analyses')
    .set(setValues)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return toPrdAnalysis(row);
}

export async function findLatestAnalysisByProjectId(
  db: Db,
  projectId: string,
): Promise<PrdAnalysisWithRequirements | null> {
  const analysisRow = await db
    .selectFrom('prd_analyses')
    .innerJoin('prd_documents', 'prd_documents.id', 'prd_analyses.prd_document_id')
    .select([
      'prd_analyses.id',
      'prd_analyses.prd_document_id',
      'prd_analyses.project_id',
      'prd_analyses.status',
      'prd_analyses.overall_rate',
      'prd_analyses.total_items',
      'prd_analyses.achieved_items',
      'prd_analyses.partial_items',
      'prd_analyses.not_started_items',
      'prd_analyses.scanned_files_count',
      'prd_analyses.model_used',
      'prd_analyses.input_tokens_used',
      'prd_analyses.output_tokens_used',
      'prd_analyses.error_message',
      'prd_analyses.created_at',
      'prd_analyses.completed_at',
      'prd_documents.title as document_title',
      'prd_documents.file_name as document_file_name',
    ])
    .where('prd_analyses.project_id', '=', projectId)
    .where('prd_analyses.status', '=', 'completed')
    .orderBy('prd_analyses.created_at', 'desc')
    .executeTakeFirst();

  if (!analysisRow) return null;

  const requirementRows = await db
    .selectFrom('prd_requirements')
    .selectAll()
    .where('prd_analysis_id', '=', analysisRow.id)
    .orderBy('sort_order', 'asc')
    .execute();

  return {
    ...toPrdAnalysis(analysisRow),
    requirements: requirementRows.map(toPrdRequirement),
    documentTitle: analysisRow.document_title as string,
    documentFileName: analysisRow.document_file_name as string,
  };
}

export async function findAnalysisHistory(
  db: Db,
  projectId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly PrdAnalysisHistoryEntry[]; total: number }> {
  const offset = (page - 1) * limit;

  const baseQuery = db
    .selectFrom('prd_analyses')
    .innerJoin('prd_documents', 'prd_documents.id', 'prd_analyses.prd_document_id')
    .where('prd_analyses.project_id', '=', projectId);

  const [rows, countResult] = await Promise.all([
    baseQuery
      .select([
        'prd_analyses.id',
        'prd_analyses.prd_document_id',
        'prd_documents.title as document_title',
        'prd_analyses.status',
        'prd_analyses.overall_rate',
        'prd_analyses.total_items',
        'prd_analyses.achieved_items',
        'prd_analyses.partial_items',
        'prd_analyses.not_started_items',
        'prd_analyses.model_used',
        'prd_analyses.created_at',
        'prd_analyses.completed_at',
      ])
      .orderBy('prd_analyses.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    baseQuery
      .select(db.fn.countAll().as('count'))
      .executeTakeFirstOrThrow(),
  ]);

  return {
    entries: rows.map((row) => ({
      id: row.id,
      prdDocumentId: row.prd_document_id,
      documentTitle: row.document_title as string,
      status: row.status as PrdAnalysisStatus,
      overallRate: row.overall_rate ? Number(row.overall_rate) : null,
      totalItems: row.total_items,
      achievedItems: row.achieved_items,
      partialItems: row.partial_items,
      notStartedItems: row.not_started_items,
      modelUsed: row.model_used,
      createdAt: (row.created_at as Date).toISOString(),
      completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
    })),
    total: Number(countResult.count),
  };
}

export async function findPrdAnalysisById(
  db: Db,
  id: string,
): Promise<PrdAnalysisWithRequirements | null> {
  const analysisRow = await db
    .selectFrom('prd_analyses')
    .innerJoin('prd_documents', 'prd_documents.id', 'prd_analyses.prd_document_id')
    .select([
      'prd_analyses.id',
      'prd_analyses.prd_document_id',
      'prd_analyses.project_id',
      'prd_analyses.status',
      'prd_analyses.overall_rate',
      'prd_analyses.total_items',
      'prd_analyses.achieved_items',
      'prd_analyses.partial_items',
      'prd_analyses.not_started_items',
      'prd_analyses.scanned_files_count',
      'prd_analyses.model_used',
      'prd_analyses.input_tokens_used',
      'prd_analyses.output_tokens_used',
      'prd_analyses.error_message',
      'prd_analyses.created_at',
      'prd_analyses.completed_at',
      'prd_documents.title as document_title',
      'prd_documents.file_name as document_file_name',
    ])
    .where('prd_analyses.id', '=', id)
    .executeTakeFirst();

  if (!analysisRow) return null;

  const requirementRows = await db
    .selectFrom('prd_requirements')
    .selectAll()
    .where('prd_analysis_id', '=', analysisRow.id)
    .orderBy('sort_order', 'asc')
    .execute();

  return {
    ...toPrdAnalysis(analysisRow),
    requirements: requirementRows.map(toPrdRequirement),
    documentTitle: analysisRow.document_title as string,
    documentFileName: analysisRow.document_file_name as string,
  };
}

export async function createPrdRequirements(
  db: Db,
  analysisId: string,
  items: readonly CreatePrdRequirementInput[],
): Promise<readonly PrdRequirement[]> {
  if (items.length === 0) return [];

  const values = items.map((item) => ({
    prd_analysis_id: analysisId,
    requirement_text: item.requirementText,
    category: item.category,
    status: item.status,
    confidence: item.confidence,
    evidence: item.evidence,
    file_paths: item.filePaths as string[],
    sort_order: item.sortOrder,
  }));

  const rows = await db
    .insertInto('prd_requirements')
    .values(values)
    .returningAll()
    .execute();

  return rows.map(toPrdRequirement);
}

function toPrdDocument(row: Record<string, unknown>): PrdDocument {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    userId: row['user_id'] as string,
    title: row['title'] as string,
    content: row['content'] as string,
    fileName: row['file_name'] as string,
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

function toPrdAnalysis(row: Record<string, unknown>): PrdAnalysis {
  return {
    id: row['id'] as string,
    prdDocumentId: row['prd_document_id'] as string,
    projectId: row['project_id'] as string,
    status: row['status'] as PrdAnalysisStatus,
    overallRate: row['overall_rate'] != null ? Number(row['overall_rate']) : null,
    totalItems: Number(row['total_items'] ?? 0),
    achievedItems: Number(row['achieved_items'] ?? 0),
    partialItems: Number(row['partial_items'] ?? 0),
    notStartedItems: Number(row['not_started_items'] ?? 0),
    scannedFilesCount: Number(row['scanned_files_count'] ?? 0),
    modelUsed: row['model_used'] as string,
    inputTokensUsed: Number(row['input_tokens_used'] ?? 0),
    outputTokensUsed: Number(row['output_tokens_used'] ?? 0),
    errorMessage: (row['error_message'] as string) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
    completedAt: row['completed_at'] ? (row['completed_at'] as Date).toISOString() : null,
  };
}

function toPrdRequirement(row: Record<string, unknown>): PrdRequirement {
  return {
    id: row['id'] as string,
    prdAnalysisId: row['prd_analysis_id'] as string,
    requirementText: row['requirement_text'] as string,
    category: (row['category'] as string) ?? null,
    status: row['status'] as PrdRequirementStatus,
    confidence: Number(row['confidence']),
    evidence: (row['evidence'] as string) ?? null,
    filePaths: (row['file_paths'] as string[]) ?? [],
    sortOrder: Number(row['sort_order'] ?? 0),
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}
