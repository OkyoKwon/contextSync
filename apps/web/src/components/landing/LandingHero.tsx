import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CONTEXT_SYNC_ASCII, CONTEXT_SYNC_ASCII_COMPACT } from '../auth/login-ascii';
import { useT } from '../../i18n/use-translation';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHero() {
  const t = useT();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAutoLogin() {
    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.autoLogin();
      if (!response.data) {
        setError('Failed to start');
        return;
      }
      const { token, user } = response.data;
      setAuth(token, user);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
      <div className="flex flex-col items-center gap-8 font-mono">
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

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-medium text-text-primary md:text-xl">{t('hero.title')}</h1>
          <p className="text-sm whitespace-nowrap text-text-tertiary">{t('hero.subtitle')}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleAutoLogin}
              disabled={isLoading}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? '...' : t('hero.cta.start')}
            </button>
            <a
              href="https://github.com/OkyoKwon/contextSync"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border-default px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-hover"
            >
              {t('hero.cta.viewOnGithub')}
            </a>
          </div>
          <a
            href="/login"
            className="font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary"
          >
            {t('hero.cta.loginExisting')}
          </a>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll down"
        onClick={() => scrollToSection('problem')}
        className="mt-16 animate-bounce cursor-pointer text-text-tertiary/60 transition-colors hover:text-text-tertiary"
      >
        <ChevronDownIcon />
      </button>
    </section>
  );
}
