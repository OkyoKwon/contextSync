import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { useOnboardingStatus } from '../hooks/use-onboarding-status';
import { projectsApi } from '../api/projects.api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { DirectoryPicker } from '../components/projects/DirectoryPicker';

export function OnboardingPage() {
  const token = useAuthStore((s) => s.token);
  const status = useOnboardingStatus();

  if (!token) return <Navigate to="/login" replace />;
  if (status === 'ready') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome to ContextSync!
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Create your first project to get started.
          </p>
        </div>
        <CreateFirstProject />
      </div>
    </div>
  );
}

function CreateFirstProject() {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.createPersonal({
        name,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        navigate('/dashboard');
      }
    },
  });

  const handleSkip = () => {
    setCurrentProject('skipped');
    navigate('/dashboard');
  };

  return (
    <Card>
      <div className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
        />
        <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-text-tertiary underline hover:text-text-secondary"
          >
            Skip for now
          </button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
          >
            Create Project
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-sm text-red-500">
            Failed to create project. Please try again.
          </p>
        )}
      </div>
    </Card>
  );
}
