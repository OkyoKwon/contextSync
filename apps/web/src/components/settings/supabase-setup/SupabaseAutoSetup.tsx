import { useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import {
  useSupabaseProjects,
  useSupabaseOrganizations,
  useSupabaseAutoSetup,
  useSupabaseCreateAndSetup,
  useSaveSupabaseToken,
  useDeleteSupabaseToken,
} from '../../../hooks/use-supabase-onboarding';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { StepNumber } from './StepNumber';
import { ExistingProjectForm } from './ExistingProjectForm';
import { NewProjectForm } from './NewProjectForm';

interface SupabaseAutoSetupProps {
  readonly onAutoSetupComplete: () => void;
}

type SetupTab = 'existing' | 'new';

export function SupabaseAutoSetup({ onAutoSetupComplete }: SupabaseAutoSetupProps) {
  const user = useAuthStore((s) => s.user);
  const hasToken = user?.hasSupabaseToken ?? false;

  // Step 1: Token
  const [tokenInput, setTokenInput] = useState('');
  const saveTokenMutation = useSaveSupabaseToken();
  const deleteTokenMutation = useDeleteSupabaseToken();
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Step 2: Project selection
  const [tab, setTab] = useState<SetupTab>('existing');
  const supabaseProjects = useSupabaseProjects(hasToken);
  const supabaseOrgs = useSupabaseOrganizations(hasToken && tab === 'new');

  // Existing project form
  const [selectedRef, setSelectedRef] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // New project form
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('us-east-1');
  const [newOrgId, setNewOrgId] = useState('');
  const [newDbPassword, setNewDbPassword] = useState('');

  // Mutations
  const autoSetupMutation = useSupabaseAutoSetup();
  const createAndSetupMutation = useSupabaseCreateAndSetup();

  const [error, setError] = useState<string | null>(null);

  const handleSaveToken = () => {
    setError(null);
    saveTokenMutation.mutate(tokenInput, {
      onSuccess: () => {
        setTokenInput('');
        setShowTokenInput(false);
      },
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to save token'),
    });
  };

  const handleDeleteToken = () => {
    setError(null);
    deleteTokenMutation.mutate(undefined, {
      onError: (err) => setError(err instanceof Error ? err.message : 'Failed to delete token'),
    });
  };

  const handleConnectExisting = () => {
    setError(null);
    autoSetupMutation.mutate(
      { supabaseProjectRef: selectedRef, dbPassword },
      {
        onSuccess: () => onAutoSetupComplete(),
        onError: (err) => setError(err instanceof Error ? err.message : 'Auto setup failed'),
      },
    );
  };

  const handleCreateAndConnect = () => {
    setError(null);
    createAndSetupMutation.mutate(
      { name: newName, dbPassword: newDbPassword, region: newRegion, organizationId: newOrgId },
      {
        onSuccess: () => onAutoSetupComplete(),
        onError: (err) => setError(err instanceof Error ? err.message : 'Create and setup failed'),
      },
    );
  };

  const isConnecting = autoSetupMutation.isPending || createAndSetupMutation.isPending;

  const projects = supabaseProjects.data?.data ?? [];
  const organizations = supabaseOrgs.data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Step 1: Token */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          hasToken
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StepNumber step={1} completed={hasToken} active={!hasToken} />
          <span className="text-sm font-medium text-text-primary">Supabase Access Token</span>
          {hasToken && <Badge variant="success">Connected</Badge>}
        </div>

        {hasToken && !showTokenInput ? (
          <div className="ml-7 mt-1 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">Your Supabase account is connected.</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowTokenInput(true)}>
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteToken}
                isLoading={deleteTokenMutation.isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="ml-7 mt-2 space-y-3">
            <p className="text-xs text-text-tertiary leading-relaxed">
              Generate an Access Token from the Supabase dashboard and paste it here. This token
              lets us list your projects and create new ones on your behalf. It will be stored
              securely with AES-256 encryption.
            </p>
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              type="password"
            />
            <div className="flex items-center justify-between">
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent-primary hover:underline"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
                Generate token on Supabase
              </a>
              <div className="flex gap-2">
                {showTokenInput && (
                  <Button variant="ghost" size="sm" onClick={() => setShowTokenInput(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveToken}
                  disabled={!tokenInput}
                  isLoading={saveTokenMutation.isPending}
                >
                  Save Token
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Project selection — only shown when token is configured */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          !hasToken
            ? 'border-border-default bg-bg-secondary opacity-50'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StepNumber step={2} completed={false} active={hasToken} />
          <span className="text-sm font-medium text-text-primary">Select Project</span>
        </div>

        {!hasToken ? (
          <p className="ml-7 mt-1 text-xs text-text-muted">
            Save your Access Token above to continue.
          </p>
        ) : (
          <div className="ml-7 mt-3 space-y-4">
            {/* Tab selector */}
            <div className="flex rounded-lg bg-page p-0.5">
              {(['existing', 'new'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t
                      ? 'bg-surface-hover text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {t === 'existing' ? 'Existing Project' : 'New Project'}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-tertiary">
              {tab === 'existing'
                ? 'Pick one of your existing Supabase projects and enter its database password to connect automatically.'
                : 'Create a brand-new Supabase project. The database password you set here will be used to connect instantly.'}
            </p>

            {tab === 'existing' && (
              <ExistingProjectForm
                projects={projects}
                isLoading={supabaseProjects.isLoading}
                selectedRef={selectedRef}
                dbPassword={dbPassword}
                onSelectRef={setSelectedRef}
                onPasswordChange={setDbPassword}
                onConnect={handleConnectExisting}
                isConnecting={isConnecting}
              />
            )}

            {tab === 'new' && (
              <NewProjectForm
                organizations={organizations}
                isLoadingOrgs={supabaseOrgs.isLoading}
                orgError={supabaseOrgs.isError}
                onRetryOrgs={() => supabaseOrgs.refetch()}
                name={newName}
                region={newRegion}
                orgId={newOrgId}
                dbPassword={newDbPassword}
                onNameChange={setNewName}
                onRegionChange={setNewRegion}
                onOrgChange={setNewOrgId}
                onPasswordChange={setNewDbPassword}
                onCreateAndConnect={handleCreateAndConnect}
                isConnecting={isConnecting}
              />
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Connecting progress */}
      {isConnecting && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <Spinner size="sm" />
          <div>
            <p className="text-sm font-medium text-blue-400">
              {createAndSetupMutation.isPending
                ? 'Creating project...'
                : 'Connecting to database...'}
            </p>
            <p className="mt-0.5 text-xs text-blue-400/70">
              {createAndSetupMutation.isPending
                ? 'Setting up the project and configuring the schema. This may take up to a minute.'
                : 'Verifying the connection and running schema migrations. Hang tight.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
