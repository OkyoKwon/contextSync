interface BaseProject {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly localDirectory: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PersonalProject extends BaseProject {
  readonly kind: 'personal';
  readonly ownerId: string;
  readonly teamId: null;
}

export interface TeamProject extends BaseProject {
  readonly kind: 'team';
  readonly teamId: string;
  readonly ownerId: null;
}

export type Project = PersonalProject | TeamProject;

export interface CreateProjectInput {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
}

export interface CreatePersonalProjectInput {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly localDirectory?: string;
}

export interface UpdateProjectInput {
  readonly name?: string;
  readonly description?: string;
  readonly repoUrl?: string;
}
