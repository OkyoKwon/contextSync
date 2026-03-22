import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from '../hooks/use-current-project';
import { useRequireProject } from '../hooks/use-require-project';
import { usePermissions } from '../hooks/use-permissions';
import { useUpgradeModal } from '../hooks/use-upgrade-modal';
import { useT } from '../i18n/use-translation';
import { projectsApi } from '../api/projects.api';
import { authApi } from '../api/auth.api';
import { CollaboratorList } from '../components/projects/CollaboratorList';
import { CollaborationSection } from '../components/settings/CollaborationSection';
import { SupabaseAutoSetup } from '../components/settings/supabase-setup/SupabaseAutoSetup';
import { NoProjectState } from '../components/shared/NoProjectState';
import { PageBreadcrumb } from '../components/layout/PageBreadcrumb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';

export function SettingsPage() {
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { isProjectSelected, isLoading: isProjectLoading } = useRequireProject();

  if (isProjectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isProjectSelected || !currentProjectId) {
    return (
      <div>
        <div className="mb-6">
          <PageBreadcrumb pageName="Settings" />
        </div>
        <div className="space-y-6">
          <NoProjectState pageName="Settings" />
        </div>
      </div>
    );
  }

  return <SettingsContent projectId={currentProjectId} />;
}

function SettingsContent({ projectId }: { readonly projectId: string }) {
  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Settings" />
      </div>
      <div className="space-y-6">
        <AccountUpgradeSection />
        <ProjectInfoSection projectId={projectId} />
        <CollaborationSection projectId={projectId} />
        <CollaboratorSection projectId={projectId} />
        <ApiKeySection />
        <DatabaseRemoteSection />
        <DangerZoneSection projectId={projectId} />
      </div>
    </div>
  );
}

function AccountUpgradeSection() {
  const user = useAuthStore((s) => s.user);
  const openUpgradeModal = useUpgradeModal((s) => s.openUpgradeModal);
  const t = useT();

  if (!user?.isAuto) return null;

  const benefits = [
    t('upgrade.settings.benefit.invite'),
    t('upgrade.settings.benefit.notification'),
    t('upgrade.settings.benefit.multiDevice'),
  ] as const;

  return (
    <Card className="border-blue-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('upgrade.settings.title')}</h3>
        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
          {t('user.localUser')}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-tertiary">{t('upgrade.settings.description')}</p>
      <ul className="mt-3 space-y-1.5">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-text-secondary">
            <svg
              className="h-4 w-4 shrink-0 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>
      <Button className="mt-4" onClick={() => openUpgradeModal()}>
        {t('upgrade.settings.cta')}
      </Button>
    </Card>
  );
}

function ProjectInfoSection({ projectId }: { readonly projectId: string }) {
  const { data: projectData, isLoading } = useCurrentProject();
  const { canEditProject } = usePermissions();
  const queryClient = useQueryClient();

  const project = projectData?.data ?? null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      projectsApi.update(projectId, {
        name: name || undefined,
        description: description || undefined,
        repoUrl: repoUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditing(false);
    },
  });

  if (isLoading) return <Spinner />;
  if (!project) return null;

  const handleEdit = () => {
    setName(project.name);
    setDescription(project.description ?? '');
    setRepoUrl(project.repoUrl ?? '');
    setIsEditing(true);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Info</h3>
          {!isEditing && canEditProject && (
            <Button size="sm" variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>
        {isEditing ? (
          <div className="mt-4 space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Repository URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <InfoRow label="Name" value={project.name} />
            <InfoRow label="Description" value={project.description ?? 'None'} />
            <InfoRow label="Repository" value={project.repoUrl ?? 'None'} />
          </div>
        )}
      </Card>
    </>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function ApiKeySection() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const hasKey = user?.hasAnthropicApiKey ?? false;

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateApiKey(apiKey),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
      setApiKey('');
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteApiKey(),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
    },
  });

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Anthropic API Key</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            hasKey ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {hasKey ? 'Configured' : 'Not Set'}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-tertiary">
        Set your Anthropic API Key for PRD Tracker and AI Evaluation. Sonnet or above is recommended
        (claude-sonnet-4-20250514).
      </p>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <Input
            label="API Key"
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !apiKey.trim()}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setApiKey('');
              }}
            >
              Cancel
            </Button>
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-red-400">{saveMutation.error.message}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
            {hasKey ? 'Change Key' : 'Set Key'}
          </Button>
          {hasKey && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove Key'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function CollaboratorSection({ projectId }: { readonly projectId: string }) {
  const { canManageCollaborators } = usePermissions();
  return <CollaboratorList projectId={projectId} canManage={canManageCollaborators} />;
}

function DatabaseRemoteSection() {
  const [setupComplete, setSetupComplete] = useState(false);

  return (
    <Card>
      <h3 className="text-lg font-semibold">Database Remote (Supabase)</h3>
      <p className="mt-2 text-sm text-text-tertiary">
        Connect a Supabase project to use as your remote database. This replaces the local Docker
        PostgreSQL with a cloud-hosted instance.
      </p>
      {setupComplete ? (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <p className="text-sm font-medium text-green-400">Setup complete</p>
          <p className="mt-1 text-xs text-green-400/70">
            The server .env has been updated. Please restart the API server for changes to take
            effect.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <SupabaseAutoSetup onAutoSetupComplete={() => setSetupComplete(true)} />
        </div>
      )}
    </Card>
  );
}

function DangerZoneSection({ projectId }: { readonly projectId: string }) {
  const { canDeleteProject } = usePermissions();
  const { data: projectData } = useCurrentProject();
  const project = projectData?.data ?? null;
  const setCurrentProject = useAuthStore((s) => s.setCurrentProject);
  const queryClient = useQueryClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCurrentProject(null);
      setShowDeleteModal(false);
    },
  });

  if (!canDeleteProject) return null;

  return (
    <>
      <Card className="border-red-500/30">
        <h3 className="text-lg font-semibold text-red-400">Delete Project</h3>
        <p className="mt-2 text-sm text-text-tertiary">
          Deleting this project will permanently remove all sessions, messages, and conflict
          records.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setShowDeleteModal(true)}>
          Delete {project?.name} Project
        </Button>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <p className="mb-2 text-sm text-text-secondary">
          Are you sure you want to delete{' '}
          <strong className="text-text-primary">{project?.name}</strong>?
        </p>
        <p className="mb-6 text-sm text-red-400">
          All linked sessions, messages, conflict records, and sync history will be permanently
          deleted.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
