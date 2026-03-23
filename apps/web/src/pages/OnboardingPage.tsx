import { lazy, Suspense, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { useOnboardingStatus } from '../hooks/use-onboarding-status';
import { projectsApi } from '../api/projects.api';
import { sessionsApi } from '../api/sessions.api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { DirectoryPicker } from '../components/projects/DirectoryPicker';

const LiquidGradientBackground = lazy(() =>
  import('../components/ui/LiquidGradientBackground').then((m) => ({
    default: m.LiquidGradientBackground,
  })),
);

export function OnboardingPage() {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/login" replace />;
  if (status === 'loading') return null;
  if (status === 'ready') return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <Suspense
        fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#141414] to-[#1e293b]" />
        }
      >
        <LiquidGradientBackground className="absolute inset-0" />
      </Suspense>
      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Welcome to ContextSync!</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Create your first project to get started.
          </p>
        </div>
        <CreateFirstProject />
      </div>
    </div>
  );
}

const TOTAL_STEPS = 2;

function CreateFirstProject() {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);

  const { data: dirData } = useQuery({
    queryKey: ['local-directories'],
    queryFn: () => sessionsApi.listLocalDirectories(),
  });

  const directories = dirData?.data ?? [];
  const hasDirectories = directories.length > 0;

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        navigate('/project');
      }
    },
  });

  const handleSkip = () => {
    setCurrentProject('skipped');
    navigate('/dashboard');
  };

  const handleNext = () => {
    if (hasDirectories) {
      const firstActive = directories.find((d) => d.isActive);
      if (firstActive) {
        setLocalDirectory(firstActive.path);
      }
      setStep(2);
    } else {
      createMutation.mutate();
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <p className="text-xs font-medium text-text-tertiary">
          Step {step} of {TOTAL_STEPS}
        </p>

        {step === 1 && (
          <>
            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-text-tertiary underline hover:text-text-secondary"
              >
                Skip for now
              </button>
              <Button onClick={handleNext} disabled={!name || createMutation.isPending}>
                {hasDirectories ? 'Next' : 'Create Project'}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} />
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Create Project
              </Button>
            </div>
          </>
        )}

        {createMutation.isError && (
          <p className="text-sm text-red-500">Failed to create project. Please try again.</p>
        )}
      </div>
    </Card>
  );
}
