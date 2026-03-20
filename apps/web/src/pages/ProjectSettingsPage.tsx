import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { projectsApi } from '../api/projects.api';
import { useProjects } from '../hooks/use-projects';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export { ProjectSettingsInline };

function ProjectSettingsInline() {
  return <ProjectSettingsContent />;
}

export function ProjectSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">Project Settings</h1>
      <ProjectSettingsContent />
    </div>
  );
}

function ProjectSettingsContent() {
  const navigate = useNavigate();
  const teamId = useAuthStore((s) => s.currentTeamId);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const { data } = useProjects();
  const projects = data?.data ?? [];

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId);
    navigate('/dashboard');
  };

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(teamId!, { name, repoUrl: repoUrl || undefined }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setName('');
        setRepoUrl('');
        navigate('/dashboard');
      }
    },
  });

  if (!teamId) {
    return (
      <div className="py-12 text-center text-sm text-text-tertiary">
        Please create or select a team first.
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <h3 className="mb-4 text-lg font-semibold">Create Project</h3>
        <div className="space-y-3">
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
          />
          <Input
            label="Repository URL (optional)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
          >
            Create Project
          </Button>
        </div>
      </Card>

      {projects.length > 0 && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Projects</h3>
          <div className="space-y-2">
            {projects.map((project) => {
              const isSelected = currentProjectId === project.id;
              return (
                <div
                  key={project.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-border-default'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{project.name}</p>
                      {project.repoUrl && (
                        <p className="text-xs text-text-tertiary">{project.repoUrl}</p>
                      )}
                    </div>
                    {isSelected && <Badge variant="info">Selected</Badge>}
                  </div>
                  {!isSelected && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSelectProject(project.id)}
                    >
                      Select
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
