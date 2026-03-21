import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CONTEXT_SYNC_ASCII, CONTEXT_SYNC_ASCII_COMPACT } from './login-ascii';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

interface LoginHeroProps {
  readonly compact?: boolean;
}

export function LoginHero({ compact = false }: LoginHeroProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(name.trim(), email.trim());
      if (!response.data) {
        setError('Login failed');
        return;
      }
      const { token, user } = response.data;
      setAuth(token, user);

      const { currentProjectId } = useAuthStore.getState();
      const destination = currentProjectId ? '/dashboard' : '/onboarding';
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 font-mono">
      {!compact && (
        <>
          <pre
            className="hidden select-none text-text-primary leading-tight sm:block sm:text-[0.55rem] md:text-xs"
            aria-label="ContextSync"
          >
            {CONTEXT_SYNC_ASCII}
          </pre>
          <pre
            className="block select-none text-text-primary leading-tight text-[0.55rem] sm:hidden"
            aria-label="ContextSync"
          >
            {CONTEXT_SYNC_ASCII_COMPACT}
          </pre>

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-text-tertiary">Keep your team's Claude sessions in sync</p>
            <p className="text-xs text-text-tertiary/80">
              Sync CLAUDE.md across your team in real-time
            </p>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="rounded-md border border-border-default bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-tertiary/60 focus:border-btn-primary-bg focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="rounded-md border border-border-default bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-tertiary/60 focus:border-btn-primary-bg focus:outline-none"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Logging in...' : 'Get Started'}
        </button>
      </form>
    </div>
  );
}
