import type { SupabaseProject } from '@context-sync/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';

interface ExistingProjectFormProps {
  readonly projects: readonly SupabaseProject[];
  readonly isLoading: boolean;
  readonly selectedRef: string;
  readonly dbPassword: string;
  readonly onSelectRef: (ref: string) => void;
  readonly onPasswordChange: (pw: string) => void;
  readonly onConnect: () => void;
  readonly isConnecting: boolean;
}

export function ExistingProjectForm({
  projects,
  isLoading,
  selectedRef,
  dbPassword,
  onSelectRef,
  onPasswordChange,
  onConnect,
  isConnecting,
}: ExistingProjectFormProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <Spinner size="sm" />
        <span className="text-sm text-text-tertiary">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-default py-6 text-center">
        <p className="text-sm text-text-tertiary">No projects found in your Supabase account.</p>
        <p className="mt-1 text-xs text-text-muted">
          Switch to the &ldquo;New Project&rdquo; tab to create one.
        </p>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.ref === selectedRef);
  const isInactive = selectedProject && selectedProject.status !== 'ACTIVE_HEALTHY';

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">
          Supabase Project
        </label>
        <select
          value={selectedRef}
          onChange={(e) => onSelectRef(e.target.value)}
          className="block w-full rounded-lg border border-border-input bg-page px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.ref} value={p.ref}>
              {p.name} ({p.region}){p.status !== 'ACTIVE_HEALTHY' ? ` — ${p.status}` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedRef && (
        <>
          {isInactive && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-2.5 text-xs text-yellow-400">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>This project is currently inactive. The connection may fail.</span>
            </div>
          )}
          <div>
            <Input
              label="Database Password"
              value={dbPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="The database password you set when creating this project"
              type="password"
            />
            <p className="mt-1 text-xs text-text-muted">
              You can find or reset this in Supabase Dashboard → Project Settings → Database.
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end pt-1">
        <Button
          onClick={onConnect}
          disabled={!selectedRef || !dbPassword || isConnecting}
          isLoading={isConnecting}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}
