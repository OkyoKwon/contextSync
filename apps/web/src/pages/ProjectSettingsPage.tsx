import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { projectsApi } from '../api/projects.api';
import { useProjects, usePersonalProjects } from '../hooks/use-projects';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DirectoryPicker } from '../components/projects/DirectoryPicker';

export { ProjectSettingsInline };

function ProjectSettingsInline() {
  return <PersonalProjectCreate />;
}

export function ProjectSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">Project Settings</h1>
      <ProjectSettingsContent />
    </div>
  );
}

function PersonalProjectCreate() {
  const navigate = useNavigate();
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [localDirectory, setLocalDirectory] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.createPersonal({
        name,
        repoUrl: repoUrl || undefined,
        localDirectory: localDirectory ?? undefined,
      }),
    onSuccess: (result) => {
      if (result.data) {
        setCurrentProject(result.data.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        setName('');
        setRepoUrl('');
        setLocalDirectory(null);
        navigate('/dashboard');
      }
    },
  });

  return (
    <Card className="mb-6">
      <h3 className="mb-4 text-lg font-semibold">Create Personal Project</h3>
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
        <DirectoryPicker value={localDirectory} onChange={setLocalDirectory} />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!name || createMutation.isPending}
        >
          Create Personal Project
        </Button>
      </div>
    </Card>
  );
}

function TeamProjectCreate() {
  const navigate = useNavigate();
  const teamId = useAuthStore((s) => s.currentTeamId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

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

  if (!teamId) return null;

  return (
    <Card className="mb-6">
      <h3 className="mb-4 text-lg font-semibold">Create Team Project</h3>
      <div className="space-y-3">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team Project"
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
          Create Team Project
        </Button>
      </div>
    </Card>
  );
}

function ProjectList({
  projects,
  label,
}: {
  readonly projects: readonly { id: string; name: string; repoUrl: string | null }[];
  readonly label: string;
}) {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const navigate = useNavigate();

  if (projects.length === 0) return null;

  const handleSelect = (projectId: string) => {
    setCurrentProject(projectId);
    navigate('/dashboard');
  };

  return (
    <Card className="mb-6">
      <h3 className="mb-4 text-lg font-semibold">{label}</h3>
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
                  onClick={() => handleSelect(project.id)}
                >
                  Select
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProjectSettingsContent() {
  const { data: personalData } = usePersonalProjects();
  const { data: teamData } = useProjects();

  const personalProjects = personalData?.data ?? [];
  const teamProjects = teamData?.data ?? [];

  return (
    <div>
      <PersonalProjectCreate />
      <TeamProjectCreate />
      <ProjectList projects={personalProjects} label="Personal Projects" />
      <ProjectList projects={teamProjects} label="Team Projects" />
    </div>
  );
}
