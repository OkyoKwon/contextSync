export interface PlanProjectAssociation {
  readonly projectId: string | null;
  readonly projectName: string | null;
  readonly projectDirectory: string;
}

export interface PlanSummary {
  readonly filename: string;
  readonly title: string;
  readonly sizeBytes: number;
  readonly lastModifiedAt: string;
  readonly projects: readonly PlanProjectAssociation[];
}

export interface PlanDetail {
  readonly filename: string;
  readonly title: string;
  readonly content: string;
  readonly sizeBytes: number;
  readonly lastModifiedAt: string;
  readonly projects: readonly PlanProjectAssociation[];
}
