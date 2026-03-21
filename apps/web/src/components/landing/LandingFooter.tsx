import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/use-translation';

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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function LandingFooter({ isAuthenticated }: { readonly isAuthenticated: boolean }) {
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
          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-btn-primary-bg px-8 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              Go to Dashboard
            </a>
          ) : (
            <button
              type="button"
              onClick={scrollToTop}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-md bg-btn-primary-bg px-8 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              {t('footer.cta.button')}
            </button>
          )}
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
