export type PrdRequirementStatus = 'achieved' | 'partial' | 'not_started';
export type PrdAnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface PrdDocument {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly fileName: string;
  readonly createdAt: string;
}

export interface PrdAnalysis {
  readonly id: string;
  readonly prdDocumentId: string;
  readonly projectId: string;
  readonly status: PrdAnalysisStatus;
  readonly overallRate: number | null;
  readonly totalItems: number;
  readonly achievedItems: number;
  readonly partialItems: number;
  readonly notStartedItems: number;
  readonly scannedFilesCount: number;
  readonly modelUsed: string;
  readonly inputTokensUsed: number;
  readonly outputTokensUsed: number;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface PrdRequirement {
  readonly id: string;
  readonly prdAnalysisId: string;
  readonly requirementText: string;
  readonly category: string | null;
  readonly status: PrdRequirementStatus;
  readonly confidence: number;
  readonly evidence: string | null;
  readonly filePaths: readonly string[];
  readonly sortOrder: number;
  readonly createdAt: string;
}

export interface PrdAnalysisWithRequirements extends PrdAnalysis {
  readonly requirements: readonly PrdRequirement[];
  readonly documentTitle: string;
  readonly documentFileName: string;
}

export interface PrdAnalysisHistoryEntry {
  readonly id: string;
  readonly prdDocumentId: string;
  readonly documentTitle: string;
  readonly status: PrdAnalysisStatus;
  readonly overallRate: number | null;
  readonly totalItems: number;
  readonly achievedItems: number;
  readonly partialItems: number;
  readonly notStartedItems: number;
  readonly modelUsed: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
}
