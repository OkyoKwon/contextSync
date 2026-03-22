import type {
  SupabaseProject,
  SupabaseOrganization,
  AutoSetupExistingInput,
  AutoSetupNewInput,
} from '@context-sync/shared';
import { api } from './client';

export interface SwitchToRemoteResult {
  readonly requiresRestart: boolean;
  readonly migrationsApplied: readonly string[];
}

export const supabaseOnboardingApi = {
  listProjects: () => api.get<readonly SupabaseProject[]>('/supabase/projects'),

  listOrganizations: () => api.get<readonly SupabaseOrganization[]>('/supabase/organizations'),

  autoSetup: (input: AutoSetupExistingInput) =>
    api.post<SwitchToRemoteResult>('/supabase/auto-setup', input),

  createAndSetup: (input: AutoSetupNewInput) =>
    api.post<SwitchToRemoteResult>('/supabase/create-and-setup', input),
};
