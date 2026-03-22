import type {
  SupabaseProject,
  SupabaseOrganization,
  DbConfig,
  AutoSetupExistingInput,
  AutoSetupNewInput,
} from '@context-sync/shared';
import { api } from './client';

export const supabaseOnboardingApi = {
  listProjects: (projectId: string) =>
    api.get<readonly SupabaseProject[]>(`/projects/${projectId}/supabase/projects`),

  listOrganizations: (projectId: string) =>
    api.get<readonly SupabaseOrganization[]>(`/projects/${projectId}/supabase/organizations`),

  autoSetup: (projectId: string, input: AutoSetupExistingInput) =>
    api.post<DbConfig>(`/projects/${projectId}/supabase/auto-setup`, input),

  createAndSetup: (projectId: string, input: AutoSetupNewInput) =>
    api.post<DbConfig>(`/projects/${projectId}/supabase/create-and-setup`, input),
};
