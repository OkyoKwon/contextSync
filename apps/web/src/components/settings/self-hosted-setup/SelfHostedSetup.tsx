import { useState } from 'react';
import { useTestConnection, useSwitchToRemote } from '../../../hooks/use-self-hosted-setup';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { StepNumber } from '../supabase-setup/StepNumber';

interface SelfHostedSetupProps {
  readonly onSetupComplete: () => void;
}

export function SelfHostedSetup({ onSetupComplete }: SelfHostedSetupProps) {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [sslEnabled, setSslEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testMutation = useTestConnection();
  const switchMutation = useSwitchToRemote();

  const testResult = testMutation.data?.data ?? null;
  const testPassed = testResult?.success === true;

  const handleTestConnection = () => {
    setError(null);
    testMutation.mutate(
      { connectionUrl, sslEnabled },
      {
        onError: (err) => setError(err instanceof Error ? err.message : 'Connection test failed'),
      },
    );
  };

  const handleConnect = () => {
    setError(null);
    switchMutation.mutate(
      { connectionUrl, sslEnabled },
      {
        onSuccess: () => onSetupComplete(),
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'Failed to switch to remote database'),
      },
    );
  };

  const isConnecting = switchMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Step 1: Connection URL + Test */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          testPassed
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <StepNumber step={1} completed={testPassed} active={!testPassed} />
          <span className="text-sm font-medium text-text-primary">Connection Details</span>
          {testPassed && <Badge variant="success">Verified</Badge>}
        </div>

        <div className="ml-7 mt-2 space-y-3">
          <p className="text-xs leading-relaxed text-text-tertiary">
            Enter your PostgreSQL connection URL. The database must be accessible from this server.
          </p>

          <Input
            value={connectionUrl}
            onChange={(e) => {
              setConnectionUrl(e.target.value);
              // Reset test result when URL changes
              if (testPassed) {
                testMutation.reset();
              }
            }}
            placeholder="postgresql://user:password@host:5432/dbname"
            type="text"
          />

          {/* SSL Toggle */}
          <label className="flex cursor-pointer items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={sslEnabled}
              onClick={() => {
                setSslEnabled((prev) => !prev);
                if (testPassed) {
                  testMutation.reset();
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                sslEnabled ? 'bg-accent-primary' : 'bg-surface-hover'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  sslEnabled ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </button>
            <span className="text-xs text-text-secondary">SSL Connection</span>
          </label>

          {/* Test result display */}
          {testResult && !testResult.success && (
            <div className="rounded-md bg-red-500/10 p-2 text-xs text-red-400">
              Connection failed: {testResult.error}
            </div>
          )}

          {testResult && testResult.success && (
            <div className="rounded-md bg-green-500/10 p-2">
              <p className="text-xs font-medium text-green-400">Connection successful</p>
              <p className="mt-0.5 text-xs text-green-400/70">
                Latency: {testResult.latencyMs}ms
                {testResult.version && ` · ${testResult.version}`}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTestConnection}
              disabled={!connectionUrl.trim() || testMutation.isPending}
              isLoading={testMutation.isPending}
            >
              Test Connection
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2: Connect */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          !testPassed
            ? 'border-border-default bg-bg-secondary opacity-50'
            : 'border-accent-primary/30 bg-accent-primary/5'
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <StepNumber step={2} completed={false} active={testPassed} />
          <span className="text-sm font-medium text-text-primary">Connect Database</span>
        </div>

        {!testPassed ? (
          <p className="ml-7 mt-1 text-xs text-text-muted">
            Test the connection above to continue.
          </p>
        ) : (
          <div className="ml-7 mt-2 space-y-3">
            <p className="text-xs leading-relaxed text-text-tertiary">
              This will run schema migrations on the remote database and update the server .env
              file. You will need to restart the API server afterward.
            </p>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                isLoading={isConnecting}
              >
                Connect
              </Button>
            </div>
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
            <p className="text-sm font-medium text-blue-400">Connecting to database...</p>
            <p className="mt-0.5 text-xs text-blue-400/70">
              Running schema migrations on the remote database. This may take a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
