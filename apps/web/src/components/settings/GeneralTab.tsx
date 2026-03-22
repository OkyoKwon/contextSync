import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentProject } from '../../hooks/use-current-project';
import { usePermissions } from '../../hooks/use-permissions';
import { useUpgradeModal } from '../../hooks/use-upgrade-modal';
import { useAuthStore } from '../../stores/auth.store';
import { useT } from '../../i18n/use-translation';
import { projectsApi } from '../../api/projects.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';

interface GeneralTabProps {
  readonly projectId: string;
}

export function GeneralTab({ projectId }: GeneralTabProps) {
  return (
    <>
      <AccountUpgradeSection />
      <ProjectInfoSection projectId={projectId} />
    </>
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
          <InfoRow
            label="Description"
            value={project.description}
            emptyText="No description set"
            canEdit={canEditProject}
            onAdd={handleEdit}
          />
          <InfoRow
            label="Repository"
            value={project.repoUrl}
            emptyText="No repository linked"
            canEdit={canEditProject}
            onAdd={handleEdit}
          />
        </div>
      )}
    </Card>
  );
}

function InfoRow({
  label,
  value,
  emptyText,
  canEdit,
  onAdd,
}: {
  readonly label: string;
  readonly value?: string | null;
  readonly emptyText?: string;
  readonly canEdit?: boolean;
  readonly onAdd?: () => void;
}) {
  const isEmpty = !value;

  return (
    <div>
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      {isEmpty ? (
        <p className="text-sm italic text-text-tertiary">
          {emptyText ?? 'Not set'}
          {canEdit && onAdd && (
            <button onClick={onAdd} className="ml-2 text-blue-400 not-italic hover:text-blue-300">
              Add
            </button>
          )}
        </p>
      ) : (
        <p className="text-sm text-text-primary">{value}</p>
      )}
    </div>
  );
}
