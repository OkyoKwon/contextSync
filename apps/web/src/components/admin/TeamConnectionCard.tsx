import { useState } from 'react';
import type { AdminConfig, SslStatus } from '@context-sync/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface TeamConnectionCardProps {
  readonly config: AdminConfig | null;
  readonly ssl: SslStatus | null;
  readonly isLoading: boolean;
}

export function TeamConnectionCard({ config, ssl, isLoading }: TeamConnectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!config?.connectionString) return;
    await navigator.clipboard.writeText(config.connectionString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <ConnectionIcon />
        <h2 className="text-lg font-semibold text-text-primary">Team Connection</h2>
        {ssl && (
          <Badge variant={ssl.enabled ? 'success' : 'warning'}>
            SSL {ssl.enabled ? 'On' : 'Off'}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-48 animate-pulse rounded bg-surface-hover" />
          <div className="h-10 w-full animate-pulse rounded bg-surface-hover" />
        </div>
      ) : config ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
              Connection String (password masked)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-surface-hover px-3 py-2 text-xs font-mono text-text-secondary break-all">
                {config.connectionString}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 rounded-lg bg-surface-hover p-2 text-text-tertiary transition-colors hover:bg-zinc-700 hover:text-text-primary"
                title="Copy connection string"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
          {ssl && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-default">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{ssl.sslConnections}</p>
                <p className="text-xs text-text-tertiary">SSL Connections</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-400">{ssl.nonSslConnections}</p>
                <p className="text-xs text-text-tertiary">Non-SSL</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">Unable to load connection info</p>
      )}
    </Card>
  );
}

function ConnectionIcon() {
  return (
    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
