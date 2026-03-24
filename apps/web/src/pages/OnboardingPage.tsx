import { lazy, Suspense, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { projectsApi } from '../api/projects.api';
import { sessionsApi } from '../api/sessions.api';
import { Card } from '../components/ui/Card';
import { IdentifyStep } from '../components/onboarding/IdentifyStep';
import { ProjectStep } from '../components/onboarding/ProjectStep';
import { DirectoryStep } from '../components/onboarding/DirectoryStep';
import type { User } from '@context-sync/shared';

const LiquidGradientBackground = lazy(() =>
  import('../components/ui/LiquidGradientBackground').then((m) => ({
    default: m.LiquidGradientBackground,
  })),
);

type WizardStep = 'identify' | 'project' | 'directory';

export function OnboardingPage() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [wizardStep, setWizardStep] = useState<WizardStep>(token ? 'project' : 'identify');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);
  const [checkingProjects, setCheckingProjects] = useState(false);
  const projectNameRef = useRef('');

  const { data: dirData } = useQuery({
    queryKey: ['local-directories'],
    queryFn: () => sessionsApi.listLocalDirectories(),
    enabled: token !== null,
  });

  const directories = useMemo(() => dirData?.data ?? [], [dirData?.data]);
  const hasDirectories = directories.length > 0;

  const { data: existingProjectsData, isLoading: isCheckingExisting } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: !!token && !currentProjectId,
  });

  useEffect(() => {
    const projects = existingProjectsData?.data ?? [];
    if (projects.length > 0 && projects[0] && !currentProjectId) {
      setCurrentProject(projects[0].id);
    }
  }, [existingProjectsData?.data, currentProjectId, setCurrentProject]);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name: projectNameRef.current,
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

  const handleIdentifyComplete = useCallback(
    async (newToken: string, user: User) => {
      setAuth(newToken, user);
      setCheckingProjects(true);

      try {
        const response = await projectsApi.list();
        const projects = response.data ?? [];
        if (projects.length > 0) {
          setCurrentProject(projects[0]!.id);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch {
        // No projects or error — continue to project step
      }

      setCheckingProjects(false);
      setWizardStep('project');
    },
    [setAuth, setCurrentProject, navigate],
  );

  const handleProjectNext = useCallback(
    (name: string) => {
      projectNameRef.current = name;
      if (hasDirectories) {
        const firstActive = directories.find((d) => d.isActive);
        if (firstActive) {
          setLocalDirectory(firstActive.path);
        }
        setWizardStep('directory');
      } else {
        createMutation.mutate();
      }
    },
    [hasDirectories, directories, createMutation],
  );

  const handleSkip = useCallback(() => {
    setCurrentProject('skipped');
    navigate('/dashboard');
  }, [setCurrentProject, navigate]);

  // Early returns after all hooks
  if (token && currentProjectId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (checkingProjects || (token && !currentProjectId && isCheckingExisting)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const stepLabel = wizardStep === 'project' ? 1 : 2;
  const totalSteps = hasDirectories ? 2 : 1;

  const title =
    wizardStep === 'identify'
      ? 'Welcome to ContextSync!'
      : wizardStep === 'project'
        ? 'Create your first project'
        : 'Select project directory';

  const subtitle =
    wizardStep === 'identify'
      ? 'Enter your name to get started.'
      : wizardStep === 'project'
        ? 'Projects group your sessions, conflicts, and analytics.'
        : 'Link a local directory to scan for Claude Code sessions.';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <Suspense
        fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#141414] to-[#1e293b]" />
        }
      >
        <LiquidGradientBackground className="absolute inset-0" />
      </Suspense>
      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-tertiary">{subtitle}</p>
        </div>
        <Card>
          <div className="space-y-4">
            {wizardStep !== 'identify' && (
              <p className="text-xs font-medium text-text-tertiary">
                Step {stepLabel} of {totalSteps}
              </p>
            )}

            {wizardStep === 'identify' && <IdentifyStep onComplete={handleIdentifyComplete} />}

            {wizardStep === 'project' && (
              <ProjectStep
                onNext={handleProjectNext}
                onSkip={handleSkip}
                hasDirectories={hasDirectories}
                isPending={createMutation.isPending}
              />
            )}

            {wizardStep === 'directory' && (
              <DirectoryStep
                value={localDirectory}
                onChange={setLocalDirectory}
                onBack={() => setWizardStep('project')}
                onCreate={() => createMutation.mutate()}
                isPending={createMutation.isPending}
              />
            )}

            {createMutation.isError && (
              <p className="text-sm text-red-500">Failed to create project. Please try again.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
