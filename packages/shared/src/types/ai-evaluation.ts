export type AiEvaluationStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export type ProficiencyTier = 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';

export type EvaluationPerspective = 'claude' | 'chatgpt' | 'gemini' | '4d_framework';

export type EvaluationDimension =
  | 'prompt_quality'
  | 'task_complexity'
  | 'iteration_pattern'
  | 'context_utilization'
  | 'ai_capability_leverage';

export type ChatGPTDimension =
  | 'problem_framing'
  | 'prompt_engineering'
  | 'output_validation'
  | 'efficiency'
  | 'tooling'
  | 'adaptability'
  | 'collaboration';

export type GeminiDimension =
  | 'technical_proficiency'
  | 'critical_thinking'
  | 'integration_problem_solving'
  | 'ethics_security';

export type FourDDimension = 'delegation' | 'description' | 'discernment' | 'diligence';

export type AnyDimension =
  | EvaluationDimension
  | ChatGPTDimension
  | GeminiDimension
  | FourDDimension;

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
  readonly proficiencyTier: string | null;
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
  readonly modelUsed: string;
  readonly inputTokensUsed: number;
  readonly outputTokensUsed: number;
  readonly errorMessage: string | null;
  readonly improvementSummary: string | null;
  readonly improvementSummaryKo: string | null;
  readonly perspective: EvaluationPerspective;
  readonly evaluationGroupId: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface AiEvaluationDimensionDetail {
  readonly id: string;
  readonly evaluationId: string;
  readonly dimension: string;
  readonly score: number;
  readonly confidence: number;
  readonly summary: string;
  readonly summaryKo: string | null;
  readonly strengths: readonly string[];
  readonly strengthsKo: readonly string[] | null;
  readonly weaknesses: readonly string[];
  readonly weaknessesKo: readonly string[] | null;
  readonly suggestions: readonly string[];
  readonly suggestionsKo: readonly string[] | null;
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
  readonly annotationKo: string | null;
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
  readonly proficiencyTier: string | null;
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
  readonly perspective: EvaluationPerspective;
  readonly evaluationGroupId: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface EvaluationGroupResult {
  readonly groupId: string;
  readonly claude: AiEvaluationWithDetails | null;
  readonly chatgpt: AiEvaluationWithDetails | null;
  readonly gemini: AiEvaluationWithDetails | null;
  readonly fourDFramework: AiEvaluationWithDetails | null;
}

export interface EvaluationGroupHistoryEntry {
  readonly groupId: string;
  readonly createdAt: string;
  readonly perspectives: readonly {
    readonly perspective: EvaluationPerspective;
    readonly evaluationId: string;
    readonly overallScore: number | null;
    readonly proficiencyTier: string | null;
    readonly status: AiEvaluationStatus;
  }[];
  readonly sessionsAnalyzed: number;
  readonly messagesAnalyzed: number;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
}

export interface TeamEvaluationSummaryEntry {
  readonly userId: string;
  readonly userName: string;
  readonly userAvatarUrl: string | null;
  readonly latestEvaluation: AiEvaluation | null;
  readonly latestGroupId: string | null;
  readonly perspectives: {
    readonly claude: { readonly score: number; readonly tier: string } | null;
    readonly chatgpt: { readonly score: number; readonly tier: string } | null;
    readonly gemini: { readonly score: number; readonly tier: string } | null;
    readonly '4d_framework': { readonly score: number; readonly tier: string } | null;
  };
}

export interface TriggerEvaluationInput {
  readonly targetUserId: string;
  readonly dateRangeStart?: string;
  readonly dateRangeEnd?: string;
  readonly maxSessions?: number;
}

export interface TriggerEvaluationGroupResult {
  readonly groupId: string;
  readonly evaluationIds: readonly string[];
}

// ── Learning Guide types ──

export type LearningResourceType =
  | 'video'
  | 'article'
  | 'documentation'
  | 'tutorial'
  | 'course'
  | 'tool';

export type LearningResourceLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningGuideStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface LearningResource {
  readonly id: string;
  readonly title: string;
  readonly titleKo: string | null;
  readonly url: string;
  readonly type: LearningResourceType;
  readonly level: LearningResourceLevel;
  readonly description: string;
  readonly descriptionKo: string | null;
  readonly estimatedMinutes: number | null;
  readonly sortOrder: number;
}

export interface LearningStep {
  readonly id: string;
  readonly stepNumber: number;
  readonly title: string;
  readonly titleKo: string | null;
  readonly objective: string;
  readonly objectiveKo: string | null;
  readonly targetDimensions: readonly string[];
  readonly keyActions: readonly string[];
  readonly keyActionsKo: readonly string[] | null;
  readonly resources: readonly LearningResource[];
  readonly practicePrompt: string | null;
  readonly practicePromptKo: string | null;
  readonly sortOrder: number;
}

export interface LearningGuide {
  readonly id: string;
  readonly evaluationGroupId: string;
  readonly targetUserId: string;
  readonly status: LearningGuideStatus;
  readonly currentTierSummary: string | null;
  readonly currentTierSummaryKo: string | null;
  readonly nextTierGoal: string | null;
  readonly nextTierGoalKo: string | null;
  readonly priorityAreas: readonly string[];
  readonly steps: readonly LearningStep[];
  readonly modelUsed: string;
  readonly inputTokensUsed: number;
  readonly outputTokensUsed: number;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}
