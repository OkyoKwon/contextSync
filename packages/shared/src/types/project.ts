export interface Project {
  readonly id: string;
  readonly teamId: string;
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
}

export interface UpdateProjectInput {
  readonly name?: string;
  readonly description?: string;
  readonly repoUrl?: string;
}
