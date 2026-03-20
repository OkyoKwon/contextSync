import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/use-translation';

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13 2 4" />
    </svg>
  );
}

const CONTACT_EMAIL = 'rnjsdhr23@gmail.com';

function ContactModal({
  isOpen,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border-default bg-surface p-6 font-mono">
        <div className="flex items-center gap-3 text-text-primary">
          <MailIcon />
          <h3 className="text-sm font-medium">Contact</h3>
        </div>
        <p className="mt-4 text-sm text-text-secondary">Feel free to reach out via email.</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-2 inline-block text-sm text-blue-400 transition-colors hover:text-blue-300"
        >
          {CONTACT_EMAIL}
        </a>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-border-default px-4 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function handleLogin() {
  window.location.href = '/api/auth/github';
}

export function LandingFooter() {
  const t = useT();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="bg-page">
      <div className="border-t border-border-default py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-mono text-lg font-medium text-text-primary md:text-xl">
            {t('footer.cta.title')}
          </h2>
          <p className="mt-3 font-mono text-sm text-text-tertiary">{t('footer.cta.subtitle')}</p>
          <button
            type="button"
            onClick={handleLogin}
            className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-md bg-btn-primary-bg px-8 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            <GitHubIcon />
            {t('footer.cta.button')}
          </button>
        </div>
      </div>

      <div className="border-t border-border-default px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between font-mono text-xs text-text-tertiary/60">
          <span>&copy; {new Date().getFullYear()} ContextSync</span>
          <div className="flex gap-6">
            <a href="/docs" className="transition-colors hover:text-text-secondary">
              {t('footer.link.docs')}
            </a>
            <a
              href="https://github.com/OkyoKwon/contextSync"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-text-secondary"
            >
              {t('footer.link.github')}
            </a>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="cursor-pointer transition-colors hover:text-text-secondary"
            >
              {t('footer.link.contact')}
            </button>
          </div>
        </div>
      </div>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </footer>
  );
}
