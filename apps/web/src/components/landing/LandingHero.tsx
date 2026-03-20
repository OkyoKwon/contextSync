import { CONTEXT_SYNC_ASCII, CONTEXT_SYNC_ASCII_COMPACT } from '../auth/login-ascii';
import { useT } from '../../i18n/use-translation';

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

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

function handleLogin() {
  window.location.href = '/api/auth/github';
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingHero({ isAuthenticated }: { readonly isAuthenticated: boolean }) {
  const t = useT();

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
          <p className="max-w-md text-sm text-text-tertiary">{t('hero.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              Go to Dashboard
            </a>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              <GitHubIcon />
              {t('hero.cta.github')}
            </button>
          )}
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="cursor-pointer rounded-md border border-border-default px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-hover"
          >
            {t('hero.cta.features')}
          </button>
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
