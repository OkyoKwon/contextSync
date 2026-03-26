export interface Conflict {
  readonly id: string;
  readonly projectId: string;
  readonly sessionAId: string;
  readonly sessionBId: string;
  readonly conflictType: ConflictType;
  readonly severity: ConflictSeverity;
  readonly status: ConflictStatus;
  readonly description: string;
  readonly overlappingPaths: readonly string[];
  readonly diffData: Record<string, unknown>;
  readonly resolvedBy: string | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly sessionATitle?: string;
  readonly sessionBTitle?: string;
  readonly sessionAUserName?: string;
  readonly sessionBUserName?: string;
  readonly reviewerId: string | null;
  readonly reviewerName?: string | null;
  readonly reviewNotes: string | null;
  readonly assignedAt: string | null;
  readonly aiVerdict: AiVerdict | null;
  readonly aiConfidence: number | null;
  readonly aiOverlapType: AiOverlapType | null;
  readonly aiSummary: string | null;
  readonly aiRiskAreas: readonly string[] | null;
  readonly aiRecommendation: AiRecommendation | null;
  readonly aiRecommendationDetail: string | null;
  readonly aiAnalyzedAt: string | null;
  readonly aiModelUsed: string | null;
}

export type ConflictType = 'file' | 'design' | 'dependency' | 'plan';
export type ConflictSeverity = 'info' | 'warning' | 'critical';
export type ConflictStatus = 'detected' | 'reviewing' | 'resolved' | 'dismissed';
export type AiVerdict = 'real_conflict' | 'likely_conflict' | 'low_risk' | 'false_positive';
export type AiOverlapType = 'same_function' | 'same_feature' | 'shared_utility' | 'independent';
export type AiRecommendation = 'coordinate' | 'review_together' | 'no_action' | 'merge_carefully';

export interface ConflictFilterQuery {
  readonly severity?: ConflictSeverity;
  readonly status?: ConflictStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface UpdateConflictInput {
  readonly status: 'reviewing' | 'resolved' | 'dismissed';
}

export interface ConflictOverviewAnalysis {
  readonly riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  readonly summary: string;
  readonly verdictDistribution: {
    readonly realConflict: number;
    readonly likelyConflict: number;
    readonly lowRisk: number;
    readonly falsePositive: number;
    readonly notAnalyzed: number;
  };
  readonly hotspotFiles: readonly string[];
  readonly teamRecommendations: readonly string[];
  readonly memberPairs: readonly {
    readonly userA: string;
    readonly userB: string;
    readonly conflictCount: number;
    readonly recommendation: string;
  }[];
  readonly analyzedCount: number;
  readonly totalCount: number;
}

export interface DetectedConflict {
  readonly sessionAId: string;
  readonly sessionBId: string;
  readonly conflictType: ConflictType;
  readonly severity: ConflictSeverity;
  readonly description: string;
  readonly overlappingPaths: readonly string[];
}
