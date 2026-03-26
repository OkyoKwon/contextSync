import crypto from 'node:crypto';
import type { Db } from '../../database/client.js';
import type {
  AiEvaluation,
  AiEvaluationWithDetails,
  AiEvaluationHistoryEntry,
  TeamEvaluationSummaryEntry,
  TriggerEvaluationInput,
  TriggerEvaluationGroupResult,
  EvaluationPerspective,
  EvaluationGroupResult,
  EvaluationGroupHistoryEntry,
} from '@context-sync/shared';
import {
  EVALUATION_PERSPECTIVES,
  PERSPECTIVE_WEIGHTS,
  PERSPECTIVE_TIER_RANGES,
  MIN_MESSAGES_FOR_EVALUATION,
  DEFAULT_MAX_SESSIONS,
  DEFAULT_DATE_RANGE_DAYS,
} from '@context-sync/shared';
import { ForbiddenError, NotFoundError } from '../../plugins/error-handler.plugin.js';
import { toAppError, delay } from '../../lib/claude-utils.js';
import { assertProjectAccess, getUserRoleInProject } from '../projects/project.service.js';
import * as evalRepo from './ai-evaluation.repository.js';
import { analyzeEvaluation } from './claude-client.js';

export async function triggerEvaluation(
  db: Db,
  apiKey: string,
  model: string,
  projectId: string,
  requestingUserId: string,
  input: TriggerEvaluationInput,
): Promise<TriggerEvaluationGroupResult> {
  await assertProjectAccess(db, projectId, requestingUserId);

  // Check concurrent execution (group-based)
  const existing = await evalRepo.findPendingOrAnalyzingGroup(db, projectId, input.targetUserId);
  if (existing) {
    throw new ForbiddenError('An evaluation is already in progress for this user');
  }

  const now = new Date();
  const dateRangeEnd = input.dateRangeEnd ? new Date(input.dateRangeEnd) : now;
  const dateRangeStart = input.dateRangeStart
    ? new Date(input.dateRangeStart)
    : new Date(now.getTime() - DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000);
  const maxSessions = input.maxSessions ?? DEFAULT_MAX_SESSIONS;

  // Fetch user messages (once — shared across all perspectives)
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

  const groupId = crypto.randomUUID();
  const sampledMessages = messages.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    content: m.content,
    createdAt: m.createdAt,
  }));

  // Create 3 evaluation records (one per perspective)
  const evaluations = await Promise.all(
    EVALUATION_PERSPECTIVES.map((perspective) =>
      evalRepo.createEvaluation(db, {
        projectId,
        targetUserId: input.targetUserId,
        triggeredByUserId: requestingUserId,
        dateRangeStart,
        dateRangeEnd,
        modelUsed: model,
        perspective,
        evaluationGroupId: groupId,
      }),
    ),
  );

  // Run 3 analyses in parallel with staggered start (rate-limit protection)
  const analysisPromises = EVALUATION_PERSPECTIVES.map((perspective, i) =>
    delay(i * 150).then(() =>
      analyzeAndSavePerspective(
        db,
        evaluations[i]!,
        perspective,
        sampledMessages,
        apiKey,
        model,
        sessionCount,
        messages.length,
      ),
    ),
  );
  // Use allSettled so partial failures don't block other perspectives
  await Promise.allSettled(analysisPromises);

  return {
    groupId,
    evaluationIds: evaluations.map((e) => e.id),
  };
}

async function analyzeAndSavePerspective(
  db: Db,
  evaluation: AiEvaluation,
  perspective: EvaluationPerspective,
  sampledMessages: readonly { id: string; sessionId: string; content: string; createdAt: string }[],
  apiKey: string,
  model: string,
  sessionCount: number,
  totalMessages: number,
): Promise<void> {
  try {
    await evalRepo.updateEvaluation(db, evaluation.id, { status: 'analyzing' });

    const result = await analyzeEvaluation(
      apiKey,
      model,
      sampledMessages,
      sessionCount,
      perspective,
    );

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

    // Calculate scores using perspective-specific weights
    const weights = PERSPECTIVE_WEIGHTS[perspective] as Record<string, number>;
    const overallScore = calculateOverallScoreForPerspective(result.dimensions, weights);
    const proficiencyTier = determineProficiencyTierForPerspective(overallScore, perspective);

    // Build update — only fill Claude-specific score columns for claude perspective
    const updateData: Record<string, unknown> = {
      status: 'completed',
      overallScore,
      proficiencyTier,
      sessionsAnalyzed: sessionCount,
      messagesAnalyzed: totalMessages,
      inputTokensUsed: result.inputTokens,
      outputTokensUsed: result.outputTokens,
      improvementSummary: result.improvementSummary,
      completedAt: new Date(),
    };

    if (perspective === 'claude') {
      const dimScores = buildDimensionScoreMap(result.dimensions);
      updateData['promptQualityScore'] = dimScores['prompt_quality'] ?? null;
      updateData['taskComplexityScore'] = dimScores['task_complexity'] ?? null;
      updateData['iterationPatternScore'] = dimScores['iteration_pattern'] ?? null;
      updateData['contextUtilizationScore'] = dimScores['context_utilization'] ?? null;
      updateData['aiCapabilityLeverageScore'] = dimScores['ai_capability_leverage'] ?? null;
    }

    await evalRepo.updateEvaluation(db, evaluation.id, updateData);
  } catch (error) {
    const appError = toAppError(error);
    await evalRepo.updateEvaluation(db, evaluation.id, {
      status: 'failed',
      errorMessage: appError.message,
    });
    // Don't re-throw — allSettled handles this
  }
}

// === Query functions ===

export async function getLatestEvaluationGroup(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
): Promise<EvaluationGroupResult | null> {
  await assertProjectAccess(db, projectId, requestingUserId);
  await assertViewPermission(db, projectId, requestingUserId, targetUserId);

  return evalRepo.findLatestEvaluationGroup(db, projectId, targetUserId);
}

export async function getEvaluationGroup(
  db: Db,
  projectId: string,
  groupId: string,
  requestingUserId: string,
): Promise<EvaluationGroupResult | null> {
  await assertProjectAccess(db, projectId, requestingUserId);

  const group = await evalRepo.findEvaluationGroup(db, groupId);
  if (!group) return null;

  // Check view permission for any of the evaluations in the group
  const anyEval = group.claude ?? group.chatgpt ?? group.gemini;
  if (anyEval) {
    await assertViewPermission(db, projectId, requestingUserId, anyEval.targetUserId);
  }

  return group;
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

export async function getEvaluationGroupHistory(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
  page: number,
  limit: number,
): Promise<{ entries: readonly EvaluationGroupHistoryEntry[]; total: number }> {
  await assertProjectAccess(db, projectId, requestingUserId);
  await assertViewPermission(db, projectId, requestingUserId, targetUserId);

  return evalRepo.findEvaluationGroupHistory(db, projectId, targetUserId, page, limit);
}

export async function getTeamSummary(
  db: Db,
  projectId: string,
  requestingUserId: string,
): Promise<readonly TeamEvaluationSummaryEntry[]> {
  await assertProjectAccess(db, projectId, requestingUserId);

  const role = await getUserRoleInProject(db, projectId, requestingUserId);
  if (role !== 'owner') {
    throw new ForbiddenError('Only project owners and admins can view team summary');
  }

  return evalRepo.findTeamEvaluationSummary(db, projectId);
}

// === Helpers ===

async function assertViewPermission(
  db: Db,
  projectId: string,
  requestingUserId: string,
  targetUserId: string,
): Promise<void> {
  if (requestingUserId === targetUserId) return;

  const role = await getUserRoleInProject(db, projectId, requestingUserId);
  if (role !== 'owner') {
    throw new ForbiddenError('You can only view your own evaluations');
  }
}

function buildDimensionScoreMap(
  dimensions: readonly { dimension: string; score: number }[],
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const d of dimensions) {
    scores[d.dimension] = d.score;
  }
  return scores;
}

function calculateOverallScoreForPerspective(
  dimensions: readonly { dimension: string; score: number }[],
  weights: Record<string, number>,
): number {
  let total = 0;
  for (const [dimension, weight] of Object.entries(weights)) {
    const dim = dimensions.find((d) => d.dimension === dimension);
    total += (dim?.score ?? 0) * weight;
  }
  return Math.round(total * 100) / 100;
}

function determineProficiencyTierForPerspective(
  score: number,
  perspective: EvaluationPerspective,
): string {
  const tierRanges = PERSPECTIVE_TIER_RANGES[perspective];
  for (const [tier, range] of Object.entries(tierRanges)) {
    if (score >= range.min && score <= range.max) {
      return tier;
    }
  }
  // Fallback to first tier
  return Object.keys(tierRanges)[0] ?? 'novice';
}
