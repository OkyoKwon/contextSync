import { useState } from 'react';
import type { DbProvider } from '@context-sync/shared';
import { useTestConnection } from '../../../hooks/use-db-config';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { SupabaseAutoSetup } from './SupabaseAutoSetup';

type SetupMode = 'auto' | 'manual';

interface DbSetupStepProps {
  readonly projectId: string;
  readonly connectionUrl: string;
  readonly provider: DbProvider;
  readonly sslEnabled: boolean;
  readonly onConnectionInfoChange: (info: {
    connectionUrl: string;
    provider: DbProvider;
    sslEnabled: boolean;
  }) => void;
  readonly onNext: () => void;
  readonly onAutoSetupComplete: () => void;
}

export function DbSetupStep({
  projectId,
  connectionUrl,
  provider,
  sslEnabled,
  onConnectionInfoChange,
  onNext,
  onAutoSetupComplete,
}: DbSetupStepProps) {
  const testMutation = useTestConnection(projectId);
  const [tested, setTested] = useState(false);
  const [setupMode, setSetupMode] = useState<SetupMode>('auto');

  const handleTest = () => {
    testMutation.mutate(
      { connectionUrl, provider, sslEnabled },
      { onSuccess: () => setTested(true) },
    );
  };

  const testResult = testMutation.data?.data ?? null;
  const testSuccess = tested && testResult?.success === true;
  const showManualForm =
    provider === 'self-hosted' || (provider === 'supabase' && setupMode === 'manual');

  return (
    <div className="space-y-5">
      {/* Provider Selection — card style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-primary">
          Where is your database hosted?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <ProviderCard
            selected={provider === 'supabase'}
            onClick={() => {
              onConnectionInfoChange({ connectionUrl, provider: 'supabase', sslEnabled });
              setTested(false);
            }}
            icon={
              <svg viewBox="0 0 109 113" className="h-5 w-5" fill="none">
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                  fill="url(#supabase-a)"
                />
                <path
                  d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                  fill="url(#supabase-b)"
                  fillOpacity="0.2"
                />
                <path
                  d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                  fill="#3ECF8E"
                />
                <defs>
                  <linearGradient
                    id="supabase-a"
                    x1="53.9738"
                    y1="54.974"
                    x2="94.1635"
                    y2="71.8295"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#249361" />
                    <stop offset="1" stopColor="#3ECF8E" />
                  </linearGradient>
                  <linearGradient
                    id="supabase-b"
                    x1="36.1558"
                    y1="30.578"
                    x2="54.4844"
                    y2="65.0806"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop />
                    <stop offset="1" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            }
            title="Supabase"
            description="Managed Postgres with auto-setup"
          />
          <ProviderCard
            selected={provider === 'self-hosted'}
            onClick={() => {
              onConnectionInfoChange({ connectionUrl, provider: 'self-hosted', sslEnabled });
              setTested(false);
            }}
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-text-secondary"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
                />
              </svg>
            }
            title="Self-Hosted"
            description="Your own PostgreSQL server"
          />
        </div>
      </div>

      {/* Supabase: Setup mode toggle integrated with description */}
      {provider === 'supabase' && (
        <div className="rounded-lg border border-border-default bg-bg-secondary p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Setup method:</span>
            <button
              type="button"
              onClick={() => setSetupMode('auto')}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                setupMode === 'auto'
                  ? 'bg-green-500/15 text-green-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Auto
            </button>
            <span className="text-text-muted">/</span>
            <button
              type="button"
              onClick={() => setSetupMode('manual')}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                setupMode === 'manual'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Manual
            </button>
          </div>
          <p className="mt-1.5 text-xs text-text-tertiary">
            {setupMode === 'auto'
              ? 'Automatically create or connect a Supabase project with just an Access Token. No need to copy connection strings manually.'
              : 'Paste a connection string directly from the Supabase dashboard. Find it under Project Settings → Database → Connection string.'}
          </p>
        </div>
      )}

      {/* Self-Hosted: inline guide */}
      {provider === 'self-hosted' && (
        <div className="rounded-lg border border-border-default bg-bg-secondary p-3">
          <p className="text-xs text-text-tertiary">
            Enter the connection URL for your PostgreSQL server.
            <span className="mt-1 block font-mono text-text-muted">
              postgresql://user:password@host:5432/dbname
            </span>
          </p>
        </div>
      )}

      {/* Auto Setup flow for Supabase */}
      {provider === 'supabase' && setupMode === 'auto' && (
        <SupabaseAutoSetup projectId={projectId} onAutoSetupComplete={onAutoSetupComplete} />
      )}

      {/* Manual flow */}
      {showManualForm && (
        <div className="space-y-4">
          <Input
            label="Connection URL"
            value={connectionUrl}
            onChange={(e) => {
              onConnectionInfoChange({ connectionUrl: e.target.value, provider, sslEnabled });
              setTested(false);
            }}
            placeholder={
              provider === 'supabase'
                ? 'postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'
                : 'postgresql://user:password@host:5432/dbname'
            }
            type="password"
          />

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={sslEnabled}
              onChange={(e) => {
                onConnectionInfoChange({
                  connectionUrl,
                  provider,
                  sslEnabled: e.target.checked,
                });
                setTested(false);
              }}
              className="rounded"
            />
            Enable SSL
          </label>

          {testResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {testResult.success ? (
                <div>
                  <p className="font-medium">Connection successful</p>
                  <p className="mt-1 text-xs opacity-80">
                    Latency: {testResult.latencyMs}ms
                    {testResult.version && ` | ${testResult.version.split('(')[0]?.trim()}`}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Connection failed</p>
                  <p className="mt-1 text-xs opacity-80">{testResult.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={!connectionUrl || testMutation.isPending}
              isLoading={testMutation.isPending}
            >
              {testMutation.isPending ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={onNext} disabled={!testSuccess}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProviderCardProps {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}

function ProviderCard({ selected, onClick, icon, title, description }: ProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? 'border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary/30'
          : 'border-border-primary bg-bg-secondary hover:border-border-hover hover:bg-surface-hover'
      }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${selected ? 'opacity-100' : 'opacity-60'}`}>
        {icon}
      </div>
      <div>
        <p
          className={`text-sm font-medium ${selected ? 'text-accent-primary' : 'text-text-secondary'}`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
      </div>
    </button>
  );
}
