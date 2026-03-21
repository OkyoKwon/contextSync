export type AiEvaluationStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export type ProficiencyTier = 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';

export type EvaluationDimension =
  | 'prompt_quality'
  | 'task_complexity'
  | 'iteration_pattern'
  | 'context_utilization'
  | 'ai_capability_leverage';

export type EvidenceSentiment = 'positive' | 'negative' | 'neutral';

export interface AiEvaluation {
  readonly id: string;
  readonly projectId: string;
  readonly targetUserId: string;
  readonly triggeredByUserId: string;
  readonly status: AiEvaluationStatus;
  readonly overallScore: number | null;
  readonly promptQualityScore: number | null;
  readonly taskComplexityScore: number | null;
  readonly iterationPatternScore: number | null;
  readonly contextUtilizationScore: number | null;
  readonly aiCapabilityLeverageScore: number | null;
  readonly proficiencyTier: ProficiencyTier | null;
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
  readonly modelUsed: string;
  readonly inputTokensUsed: number;
  readonly outputTokensUsed: number;
  readonly errorMessage: string | null;
  readonly improvementSummary: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface AiEvaluationDimensionDetail {
  readonly id: string;
  readonly evaluationId: string;
  readonly dimension: EvaluationDimension;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly suggestions: readonly string[];
  readonly sortOrder: number;
}

export interface AiEvaluationEvidence {
  readonly id: string;
  readonly dimensionId: string;
  readonly messageId: string | null;
  readonly sessionId: string | null;
  readonly excerpt: string;
  readonly sentiment: EvidenceSentiment;
  readonly annotation: string;
  readonly sortOrder: number;
}

export interface AiEvaluationWithDetails extends AiEvaluation {
  readonly dimensions: readonly AiEvaluationDimensionDetail[];
  readonly evidence: readonly AiEvaluationEvidence[];
  readonly targetUserName?: string;
  readonly targetUserAvatarUrl?: string | null;
}

export interface AiEvaluationHistoryEntry {
  readonly id: string;
  readonly status: AiEvaluationStatus;
  readonly overallScore: number | null;
  readonly proficiencyTier: ProficiencyTier | null;
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface TeamEvaluationSummaryEntry {
  readonly userId: string;
  readonly userName: string;
  readonly userAvatarUrl: string | null;
  readonly latestEvaluation: AiEvaluation | null;
}

export interface TriggerEvaluationInput {
  readonly targetUserId: string;
  readonly dateRangeStart?: string;
  readonly dateRangeEnd?: string;
  readonly maxSessions?: number;
}
