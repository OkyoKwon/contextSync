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
import { Modal } from '../components/ui/Modal';
import { DirectoryPicker } from '../components/projects/DirectoryPicker';

export { ProjectSettingsInline };

function ProjectSettingsInline() {
  const { data: personalData } = usePersonalProjects();
  const { data: teamData } = useProjects();

  const personalProjects = personalData?.data ?? [];
  const teamProjects = teamData?.data ?? [];

  return (
    <>
      <PersonalProjectCreate />
      <ProjectList projects={personalProjects} label="Personal Projects" />
      <ProjectList projects={teamProjects} label="Team Projects" />
    </>
  );
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
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (currentProjectId === projectId) {
        setCurrentProject(null);
      }
      setDeleteTarget(null);
    },
  });

  if (projects.length === 0) return null;

  const handleSelect = (projectId: string) => {
    setCurrentProject(projectId);
    navigate('/dashboard');
  };

  return (
    <>
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
                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSelect(project.id)}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
      >
        <p className="mb-2 text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{deleteTarget?.name}</strong>?
        </p>
        <p className="mb-6 text-sm text-red-400">
          All linked sessions, messages, conflict records, and sync history will be permanently deleted.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
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
