import { useState } from 'react';
import type { DbProvider } from '@context-sync/shared';
import { useTestConnection } from '../../../hooks/use-db-config';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

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
}

export function DbSetupStep({
  projectId,
  connectionUrl,
  provider,
  sslEnabled,
  onConnectionInfoChange,
  onNext,
}: DbSetupStepProps) {
  const testMutation = useTestConnection(projectId);
  const [tested, setTested] = useState(false);

  const handleTest = () => {
    testMutation.mutate(
      { connectionUrl, provider, sslEnabled },
      { onSuccess: () => setTested(true) },
    );
  };

  const testResult = testMutation.data?.data ?? null;
  const testSuccess = tested && testResult?.success === true;

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border-default bg-bg-secondary p-3">
        <p className="text-sm text-text-secondary">
          Connect a remote PostgreSQL database to enable team collaboration.
        </p>
        <ol className="list-inside list-decimal space-y-1 text-xs text-text-tertiary">
          <li>Select a provider (Supabase or Self-Hosted)</li>
          <li>Enter your database connection URL</li>
          <li>Verify the connection with Test Connection, then proceed to the next step</li>
        </ol>
        <p className="text-xs text-text-tertiary">
          {provider === 'supabase'
            ? 'Supabase: Find the URI under Project Settings → Database → Connection string'
            : 'Self-Hosted: Use the format postgresql://user:password@host:5432/dbname'}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Provider</label>
        <div className="flex gap-2">
          {(['supabase', 'self-hosted'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onConnectionInfoChange({ connectionUrl, provider: p, sslEnabled });
                setTested(false);
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                provider === p
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-border-hover'
              }`}
            >
              {p === 'supabase' ? 'Supabase' : 'Self-Hosted'}
            </button>
          ))}
        </div>
      </div>

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
            onConnectionInfoChange({ connectionUrl, provider, sslEnabled: e.target.checked });
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
                {testResult.version && ` | ${testResult.version.split('(')[0].trim()}`}
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
        >
          {testMutation.isPending ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={onNext} disabled={!testSuccess}>
          Next
        </Button>
      </div>
    </div>
  );
}
