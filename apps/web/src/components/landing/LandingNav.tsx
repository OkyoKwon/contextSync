import { useEffect, useState } from 'react';
import { useT } from '../../i18n/use-translation';
import { LanguageSwitcher } from './LanguageSwitcher';

function handleLogin() {
  window.location.href = '/api/auth/github';
}

export function LandingNav({ isAuthenticated }: { readonly isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? 'bg-page/80 backdrop-blur-sm border-b border-border-default' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="/">
          <img src="/logo.png" alt="ContextSync" className="h-8" />
        </a>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="rounded-md border border-border-default px-4 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Dashboard
            </a>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="cursor-pointer rounded-md border border-border-default px-4 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-hover"
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
