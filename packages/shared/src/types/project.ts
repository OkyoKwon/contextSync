export interface Project {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly localDirectory: string | null;
  readonly joinCode: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly localDirectory?: string;
}

export interface UpdateProjectInput {
  readonly name?: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly localDirectory?: string | null;
}

export interface ProjectWithTeamInfo extends Project {
  readonly collaboratorCount: number;
  readonly isTeam: boolean;
  readonly myLocalDirectory?: string | null;
}
