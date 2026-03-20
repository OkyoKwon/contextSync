import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { useOnboardingStatus } from '../hooks/use-onboarding-status';
import { TeamSettings } from '../components/teams/TeamSettings';
import { ProjectSettingsInline } from './ProjectSettingsPage';

export function OnboardingPage() {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/login" replace />;
  if (status === 'ready') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <StepIndicator current={status === 'needs-team' ? 1 : 2} />

        {status === 'needs-team' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to ContextSync!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating your first team.
              </p>
            </div>
            <TeamSettings />
          </div>
        )}

        {status === 'needs-project' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Almost there!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Now create a project to get started.
              </p>
            </div>
            <ProjectSettingsInline />
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { readonly current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <StepDot step={1} current={current} label="Team" />
      <div className="h-px w-8 bg-gray-300" />
      <StepDot step={2} current={current} label="Project" />
    </div>
  );
}

function StepDot({
  step,
  current,
  label,
}: {
  readonly step: number;
  readonly current: number;
  readonly label: string;
}) {
  const isActive = step === current;
  const isComplete = step < current;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          isComplete
            ? 'bg-green-500 text-white'
            : isActive
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isComplete ? '✓' : step}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
