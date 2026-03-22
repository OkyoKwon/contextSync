import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClaudePlan } from '@context-sync/shared';
import { CLAUDE_PLANS, CLAUDE_PLAN_LABELS } from '@context-sync/shared';
import { useAuthStore } from '../stores/auth.store';
import { useCurrentProject } from '../hooks/use-current-project';
import { useRequireProject } from '../hooks/use-require-project';
import { usePermissions } from '../hooks/use-permissions';
import { useMigrationWizard } from '../hooks/use-migration-wizard';
import { projectsApi } from '../api/projects.api';
import { authApi } from '../api/auth.api';
import { CollaboratorList } from '../components/projects/CollaboratorList';
import { RemoteDbSection } from '../components/settings/RemoteDbSection';
import { MigrationWizardModal } from '../components/settings/MigrationWizardModal';
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
          <UserPlanSection />
          <NoProjectState pageName="Settings" />
        </div>
      </div>
    );
  }

  return <SettingsContent projectId={currentProjectId} />;
}

function SettingsContent({ projectId }: { readonly projectId: string }) {
  const wizard = useMigrationWizard();

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageName="Settings" />
      </div>
      <div className="space-y-6">
        <UserPlanSection />
        <ProjectInfoSection projectId={projectId} />
        <RemoteDbSection projectId={projectId} onConnectClick={wizard.open} />
        <CollaboratorSection projectId={projectId} />
        <DangerZoneSection projectId={projectId} />
      </div>

      <MigrationWizardModal
        isOpen={wizard.isOpen}
        onClose={wizard.close}
        projectId={projectId}
        step={wizard.step}
        connectionUrl={wizard.connectionUrl}
        provider={wizard.provider}
        sslEnabled={wizard.sslEnabled}
        onStepChange={wizard.setStep}
        onConnectionInfoChange={wizard.setConnectionInfo}
      />
    </div>
  );
}

function UserPlanSection() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const planMutation = useMutation({
    mutationFn: (plan: ClaudePlan) => authApi.updatePlan(plan),
    onSuccess: (response) => {
      if (response.data && token) {
        setAuth(token, response.data);
      }
    },
  });

  const currentPlan = user?.claudePlan ?? 'free';

  return (
    <Card>
      <h3 className="text-lg font-semibold">Claude Plan</h3>
      <p className="mt-1 text-sm text-text-tertiary">
        Select your current Claude subscription plan.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {CLAUDE_PLANS.map((plan) => (
          <button
            key={plan}
            type="button"
            disabled={planMutation.isPending}
            onClick={() => planMutation.mutate(plan)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              currentPlan === plan
                ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary'
            }`}
          >
            {CLAUDE_PLAN_LABELS[plan]}
          </button>
        ))}
      </div>
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

function CollaboratorSection({ projectId }: { readonly projectId: string }) {
  const { canManageCollaborators } = usePermissions();
  return <CollaboratorList projectId={projectId} canManage={canManageCollaborators} />;
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
