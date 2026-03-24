export interface SupabaseProject {
  readonly ref: string;
  readonly name: string;
  readonly region: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface SupabaseOrganization {
  readonly id: string;
  readonly name: string;
}

export interface CreateSupabaseProjectInput {
  readonly name: string;
  readonly dbPassword: string;
  readonly region: string;
  readonly organizationId: string;
}

export interface AutoSetupExistingInput {
  readonly supabaseProjectRef: string;
  readonly dbPassword: string;
  readonly projectId: string;
}

export interface AutoSetupNewInput {
  readonly name: string;
  readonly dbPassword: string;
  readonly region: string;
  readonly organizationId: string;
  readonly projectId: string;
}
