import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { SupabaseAutoSetup } from './supabase-setup/SupabaseAutoSetup';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export function IntegrationsTab() {
  return (
    <>
      <ApiKeySection />
      <DatabaseRemoteSection />
    </>
  );
}

function ApiKeySection() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

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
      setShowRemoveModal(false);
    },
  });

  return (
    <>
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
          Set your Anthropic API Key for PRD Tracker and AI Evaluation. Sonnet or above is
          recommended (claude-sonnet-4-20250514).
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
              <Button size="sm" variant="danger" onClick={() => setShowRemoveModal(true)}>
                Remove Key
              </Button>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove API Key"
      >
        <p className="mb-6 text-sm text-text-secondary">
          Are you sure you want to remove your Anthropic API Key? PRD analysis and AI evaluation
          features will be unavailable until a new key is set.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowRemoveModal(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function DatabaseRemoteSection() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="text-lg font-semibold">Database Remote (Supabase)</h3>
          <p className="mt-1 text-sm text-text-tertiary">
            {setupComplete
              ? 'Connected — restart the API server for changes to take effect.'
              : 'Connect a Supabase project as your remote database.'}
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <>
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
        </>
      )}
    </Card>
  );
}
