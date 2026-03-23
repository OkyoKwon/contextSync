import { useState } from 'react';
import { authApi } from '@/api/auth.api';
import type { User } from '@context-sync/shared';

interface IdentifyStepProps {
  readonly onComplete: (token: string, user: User) => void;
}

type IdentifyState = 'input' | 'selecting' | 'loading';

export function IdentifyStep({ onComplete }: IdentifyStepProps) {
  const [name, setName] = useState('');
  const [state, setState] = useState<IdentifyState>('input');
  const [candidates, setCandidates] = useState<readonly User[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setState('loading');
    setError(null);

    try {
      const response = await authApi.identify(name.trim());
      if (!response.data) {
        setError('Failed to identify. Please try again.');
        setState('input');
        return;
      }

      if ('needsSelection' in response.data && response.data.needsSelection) {
        setCandidates(response.data.users);
        setState('selecting');
        return;
      }

      if ('token' in response.data) {
        onComplete(response.data.token, response.data.user);
      }
    } catch {
      setError('Connection failed. Please check your server.');
      setState('input');
    }
  }

  async function handleSelect(userId: string) {
    setState('loading');
    setError(null);

    try {
      const response = await authApi.identifySelect(userId);
      if (response.data) {
        onComplete(response.data.token, response.data.user);
      }
    } catch {
      setError('Failed to select user. Please try again.');
      setState('selecting');
    }
  }

  async function handleCreateNew() {
    setState('loading');
    setError(null);

    try {
      const uniqueName = `${name.trim()} (${Date.now().toString(36)})`;
      const response = await authApi.identify(uniqueName);
      if (response.data && 'token' in response.data) {
        onComplete(response.data.token, response.data.user);
      }
    } catch {
      setError('Failed to create user. Please try again.');
      setState('selecting');
    }
  }

  return (
    <div className="space-y-4">
      {state === 'selecting' ? (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Select your account</h2>
          <p className="text-sm text-text-secondary">
            Multiple users found with the name &quot;{name}&quot;. Select yours or create a new
            account:
          </p>
          <div className="space-y-2">
            {candidates.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                className="w-full rounded-lg border border-border-default bg-surface p-3 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="text-sm font-medium text-text-primary">{user.name}</div>
                <div className="text-xs text-text-tertiary">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="w-full rounded-lg border border-dashed border-border-default p-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Create new account with this name
          </button>
          <button
            type="button"
            onClick={() => setState('input')}
            className="w-full text-sm text-text-tertiary hover:text-text-secondary"
          >
            Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identify-name"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Your Name
            </label>
            <input
              id="identify-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              autoComplete="name"
              className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Your name identifies you across sessions and projects
            </p>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || state === 'loading'}
            className="w-full rounded-lg bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
          >
            {state === 'loading' ? 'Loading...' : 'Continue'}
          </button>
        </form>
      )}

      {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
    </div>
  );
}
