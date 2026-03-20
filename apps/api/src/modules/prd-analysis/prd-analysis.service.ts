import type { Db } from '../../database/client.js';
import type { Env } from '../../config/env.js';
import type {
  PrdDocument,
  PrdAnalysisWithRequirements,
  PrdAnalysisHistoryEntry,
} from '@context-sync/shared';
import { SUPPORTED_PRD_EXTENSIONS, MAX_PRD_FILE_SIZE } from '@context-sync/shared';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess } from '../projects/project.service.js';
import * as prdRepo from './prd-analysis.repository.js';
import { scanCodebase } from './codebase-scanner.js';
import { analyzePrd } from './claude-client.js';
import { extname } from 'node:path';

export async function uploadPrdDocument(
  db: Db,
  projectId: string,
  userId: string,
  fileName: string,
  content: string,
  title?: string,
): Promise<PrdDocument> {
  await assertProjectAccess(db, projectId, userId);

  const ext = extname(fileName).toLowerCase();
  if (!SUPPORTED_PRD_EXTENSIONS.includes(ext as typeof SUPPORTED_PRD_EXTENSIONS[number])) {
    throw new ForbiddenError(`Unsupported file extension: ${ext}. Supported: ${SUPPORTED_PRD_EXTENSIONS.join(', ')}`);
  }

  if (Buffer.byteLength(content, 'utf-8') > MAX_PRD_FILE_SIZE) {
    throw new ForbiddenError(`File exceeds maximum size of ${MAX_PRD_FILE_SIZE / 1024}KB`);
  }

  return prdRepo.createPrdDocument(db, {
    projectId,
    userId,
    title: title ?? fileName.replace(extname(fileName), ''),
    content,
    fileName,
  });
}

export async function listPrdDocuments(
  db: Db,
  projectId: string,
  userId: string,
): Promise<readonly PrdDocument[]> {
  await assertProjectAccess(db, projectId, userId);
  return prdRepo.findPrdDocumentsByProjectId(db, projectId);
}

export async function deletePrdDocument(
  db: Db,
  documentId: string,
  userId: string,
): Promise<void> {
  const doc = await prdRepo.findPrdDocumentById(db, documentId);
  if (!doc) throw new NotFoundError('PRD Document');
  await assertProjectAccess(db, doc.projectId, userId);
  await prdRepo.deletePrdDocument(db, documentId);
}

export async function startAnalysis(
  db: Db,
  env: Env,
  projectId: string,
  userId: string,
  prdDocumentId: string,
): Promise<PrdAnalysisWithRequirements> {
  const project = await assertProjectAccess(db, projectId, userId);

  if (!project.localDirectory) {
    throw new ForbiddenError('Project has no local_directory configured. Set it in project settings to enable codebase scanning.');
  }

  if (!env.ANTHROPIC_API_KEY) {
    throw new ForbiddenError('ANTHROPIC_API_KEY is not configured. Set it in the server environment.');
  }

  const document = await prdRepo.findPrdDocumentById(db, prdDocumentId);
  if (!document) throw new NotFoundError('PRD Document');
  if (document.projectId !== projectId) throw new ForbiddenError('Document does not belong to this project');

  const analysis = await prdRepo.createPrdAnalysis(db, {
    prdDocumentId,
    projectId,
    modelUsed: env.ANTHROPIC_MODEL,
  });

  try {
    await prdRepo.updatePrdAnalysis(db, analysis.id, { status: 'analyzing' });

    const codebaseSummary = await scanCodebase(project.localDirectory);

    const result = await analyzePrd(
      env.ANTHROPIC_API_KEY,
      env.ANTHROPIC_MODEL,
      document.content,
      codebaseSummary,
    );

    const requirementInputs = result.requirements.map((req, index) => ({
      requirementText: req.requirementText,
      category: req.category,
      status: req.status,
      confidence: req.confidence,
      evidence: req.evidence,
      filePaths: req.filePaths,
      sortOrder: index,
    }));

    const requirements = await prdRepo.createPrdRequirements(db, analysis.id, requirementInputs);

    const achieved = requirements.filter((r) => r.status === 'achieved').length;
    const partial = requirements.filter((r) => r.status === 'partial').length;
    const notStarted = requirements.filter((r) => r.status === 'not_started').length;

    const updatedAnalysis = await prdRepo.updatePrdAnalysis(db, analysis.id, {
      status: 'completed',
      overallRate: result.overallRate,
      totalItems: requirements.length,
      achievedItems: achieved,
      partialItems: partial,
      notStartedItems: notStarted,
      scannedFilesCount: codebaseSummary.totalFiles,
      inputTokensUsed: result.inputTokens,
      outputTokensUsed: result.outputTokens,
      completedAt: new Date(),
    });

    return {
      ...updatedAnalysis,
      requirements,
      documentTitle: document.title,
      documentFileName: document.fileName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await prdRepo.updatePrdAnalysis(db, analysis.id, {
      status: 'failed',
      errorMessage,
    });
    throw error;
  }
}

export async function getLatestAnalysis(
  db: Db,
  projectId: string,
  userId: string,
): Promise<PrdAnalysisWithRequirements | null> {
  await assertProjectAccess(db, projectId, userId);
  return prdRepo.findLatestAnalysisByProjectId(db, projectId);
}

export async function getAnalysisHistory(
  db: Db,
  projectId: string,
  userId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly PrdAnalysisHistoryEntry[]; total: number }> {
  await assertProjectAccess(db, projectId, userId);
  return prdRepo.findAnalysisHistory(db, projectId, page, limit);
}

export async function getAnalysisDetail(
  db: Db,
  analysisId: string,
  userId: string,
): Promise<PrdAnalysisWithRequirements> {
  const analysis = await prdRepo.findPrdAnalysisById(db, analysisId);
  if (!analysis) throw new NotFoundError('PRD Analysis');
  await assertProjectAccess(db, analysis.projectId, userId);
  return analysis;
}
