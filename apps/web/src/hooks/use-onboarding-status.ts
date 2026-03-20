import { useAuthStore } from '../stores/auth.store';

export type OnboardingStatus = 'needs-team' | 'needs-project' | 'ready';

export function useOnboardingStatus(): OnboardingStatus {
  const teamId = useAuthStore((s) => s.currentTeamId);
  const projectId = useAuthStore((s) => s.currentProjectId);

  if (!teamId) return 'needs-team';
  if (!projectId) return 'needs-project';
  return 'ready';
}
