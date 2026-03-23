import type { Db } from '../../database/client.js';
import type {
  AiEvaluation,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
} from '@context-sync/shared';
import {
  DIMENSION_WEIGHTS,
  EVALUATION_COOLDOWN_HOURS,
  MIN_MESSAGES_FOR_EVALUATION,
  DEFAULT_MAX_SESSIONS,
  DEFAULT_DATE_RANGE_DAYS,
  PROFICIENCY_TIER_RANGES,
} from '@context-sync/shared';
import type { ProficiencyTier, EvaluationDimension } from '@context-sync/shared';
import { NotFoundError, ForbiddenError } from '../../plugins/error-handler.plugin.js';
import { assertProjectAccess, getUserRoleInProject } from '../projects/project.service.js';
import * as evalRepo from './ai-evaluation.repository.js';
import { analyzeEvaluation } from './claude-client.js';
import { saveRateLimitSnapshot } from '../quota/quota.service.js';

export async function triggerEvaluation(
  db: Db,
  apiKey: string,
  model: string,
  projectId: string,
  requestingUserId: string,
  input: TriggerEvaluationInput,
): Promise<AiEvaluation> {
  await assertProjectAccess(db, projectId, requestingUserId);

  // Any member with a registered API key can trigger evaluations

  // Check concurrent execution
  const existing = await evalRepo.findPendingOrAnalyzing(db, projectId, input.targetUserId);
  if (existing) {
    throw new ForbiddenError('An evaluation is already in progress for this user');
  }

  // Check cooldown
  const latest = await evalRepo.findLatestCompleted(db, projectId, input.targetUserId);
  if (latest?.completedAt) {
    const cooldownEnd = new Date(latest.completedAt);
    cooldownEnd.setHours(cooldownEnd.getHours() + EVALUATION_COOLDOWN_HOURS);
    if (new Date() < cooldownEnd) {
      throw new ForbiddenError(
        `Evaluation cooldown active. Next evaluation available after ${cooldownEnd.toISOString()}`,
      );
    }
  }

  const now = new Date();
  const dateRangeEnd = input.dateRangeEnd ? new Date(input.dateRangeEnd) : now;
  const dateRangeStart = input.dateRangeStart
    ? new Date(input.dateRangeStart)
    : new Date(now.getTime() - DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const maxSessions = input.maxSessions ?? DEFAULT_MAX_SESSIONS;

  // Fetch user messages
  const { messages, sessionCount } = await evalRepo.findUserMessagesForEvaluation(
    db,
    projectId,
    input.targetUserId,
    dateRangeStart,
    dateRangeEnd,
    maxSessions,
  );

  if (messages.length < MIN_MESSAGES_FOR_EVALUATION) {
    throw new ForbiddenError(
      `Insufficient messages for evaluation. Found ${messages.length}, minimum is ${MIN_MESSAGES_FOR_EVALUATION}`,
    );
  }

  // Create pending evaluation
  const evaluation = await evalRepo.createEvaluation(db, {
    projectId,
    targetUserId: input.targetUserId,
    triggeredByUserId: requestingUserId,
    dateRangeStart,
    dateRangeEnd,
    modelUsed: model,
  });

  try {
    await evalRepo.updateEvaluation(db, evaluation.id, { status: 'analyzing' });

    const result = await analyzeEvaluation(
      apiKey,
      model,
      messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        content: m.content,
        createdAt: m.createdAt,
      })),
      sessionCount,
    );

    // Fire-and-forget: save rate limit snapshot
    if (result.rateLimits) {
      saveRateLimitSnapshot(db, requestingUserId, result.rateLimits).catch(() => {});
    }

    // Create dimension records
    const dimensions = await evalRepo.createDimensions(
      db,
      evaluation.id,
      result.dimensions.map((d, index) => ({
        dimension: d.dimension,
        score: d.score,
        confidence: d.confidence,
        summary: d.summary,
        strengths: d.strengths,
        weaknesses: d.weaknesses,
        suggestions: d.suggestions,
        sortOrder: index,
      })),
    );

    // Create evidence records
    const evidenceInputs = result.dimensions.flatMap((d, dimIndex) => {
      const dim = dimensions[dimIndex];
      if (!dim) return [];
      return d.evidence.map((e, evIndex) => ({
        dimensionId: dim.id,
        messageId: e.messageId,
        sessionId: e.sessionId,
        excerpt: e.excerpt,
        sentiment: e.sentiment,
        annotation: e.annotation,
        sortOrder: evIndex,
      }));
    });
    await evalRepo.createEvidence(db, evidenceInputs);

    // Calculate scores
    const dimensionScores = buildDimensionScores(result.dimensions);
    const overallScore = calculateOverallScore(dimensionScores);
    const proficiencyTier = determineProficiencyTier(overallScore);

    const updatedEvaluation = await evalRepo.updateEvaluation(db, evaluation.id, {
      status: 'completed',
      overallScore,
      promptQualityScore: dimensionScores.prompt_quality,
      taskComplexityScore: dimensionScores.task_complexity,
      iterationPatternScore: dimensionScores.iteration_pattern,
      contextUtilizationScore: dimensionScores.context_utilization,
      aiCapabilityLeverageScore: dimensionScores.ai_capability_leverage,
      proficiencyTier,
      sessionsAnalyzed: sessionCount,
      messagesAnalyzed: messages.length,
      inputTokensUsed: result.inputTokens,
      outputTokensUsed: result.outputTokens,
      improvementSummary: result.improvementSummary,
      completedAt: new Date(),
    });

    return updatedEvaluation;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await evalRepo.updateEvaluation(db, evaluation.id, {
      status: 'failed',
      errorMessage,
    });
    throw error;
  }
}

export async function getLatestEvaluation(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
): Promise<AiEvaluationWithDetails | null> {
  await assertProjectAccess(db, projectId, requestingUserId);
  await assertViewPermission(db, projectId, requestingUserId, targetUserId);

  return evalRepo.findLatestEvaluationWithDetails(db, projectId, targetUserId);
}

export async function getEvaluationDetail(
  db: Db,
  projectId: string,
  evaluationId: string,
  requestingUserId: string,
): Promise<AiEvaluationWithDetails> {
  await assertProjectAccess(db, projectId, requestingUserId);

  const evaluation = await evalRepo.findEvaluationById(db, evaluationId);
  if (!evaluation) throw new NotFoundError('Evaluation');
  if (evaluation.projectId !== projectId)
    throw new ForbiddenError('Evaluation does not belong to this project');

  await assertViewPermission(db, projectId, requestingUserId, evaluation.targetUserId);

  return evaluation;
}

export async function getEvaluationHistory(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly AiEvaluationHistoryEntry[]; total: number }> {
  await assertProjectAccess(db, projectId, requestingUserId);
  await assertViewPermission(db, projectId, requestingUserId, targetUserId);

  return evalRepo.findEvaluationHistory(db, projectId, targetUserId, page, limit);
}

export async function getTeamSummary(
  db: Db,
  projectId: string,
  requestingUserId: string,
): Promise<readonly TeamEvaluationSummaryEntry[]> {
  await assertProjectAccess(db, projectId, requestingUserId);

  const role = await getUserRoleInProject(db, projectId, requestingUserId);
  if (role !== 'owner' && role !== 'admin') {
    throw new ForbiddenError('Only project owners and admins can view team summary');
  }

  return evalRepo.findTeamEvaluationSummary(db, projectId);
}

async function assertViewPermission(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
): Promise<void> {
  if (requestingUserId === targetUserId) return;

  const role = await getUserRoleInProject(db, projectId, requestingUserId);
  if (role !== 'owner' && role !== 'admin') {
    throw new ForbiddenError('You can only view your own evaluations');
  }
}

function buildDimensionScores(
  dimensions: readonly { dimension: EvaluationDimension; score: number }[],
): Record<EvaluationDimension, number> {
  const scores: Record<string, number> = {};
  for (const d of dimensions) {
    scores[d.dimension] = d.score;
  }
  return scores as Record<EvaluationDimension, number>;
}

function calculateOverallScore(scores: Record<EvaluationDimension, number>): number {
  let total = 0;
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    total += (scores[dimension as EvaluationDimension] ?? 0) * weight;
  }
  return Math.round(total * 100) / 100;
}

function determineProficiencyTier(score: number): ProficiencyTier {
  for (const [tier, range] of Object.entries(PROFICIENCY_TIER_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return tier as ProficiencyTier;
    }
  }
  return 'novice';
}
