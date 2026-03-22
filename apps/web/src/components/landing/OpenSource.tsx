import { useT } from '../../i18n/use-translation';
import { useInView } from './use-in-view';

function ShieldIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function OpenSource() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section
      id="opensource"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('openSource.sectionLabel')}
        </p>
        <h2 className="mb-3 font-mono text-xl font-semibold text-text-primary md:text-2xl">
          {t('openSource.title')}
        </h2>
        <p className="mb-12 font-mono text-sm text-text-secondary">{t('openSource.subtitle')}</p>

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border-default bg-surface p-6 text-center">
            <div className="mb-4 flex justify-center text-text-tertiary">
              <ShieldIcon />
            </div>
            <h3 className="mb-2 font-mono text-sm font-medium text-text-primary">
              {t('openSource.license.title')}
            </h3>
            <p className="font-mono text-xs leading-relaxed text-text-tertiary">
              {t('openSource.license.description')}
            </p>
          </div>

          <div className="rounded-lg border border-border-default bg-surface p-6 text-center">
            <div className="mb-4 flex justify-center text-text-tertiary">
              <UsersIcon />
            </div>
            <h3 className="mb-2 font-mono text-sm font-medium text-text-primary">
              {t('openSource.community.title')}
            </h3>
            <p className="font-mono text-xs leading-relaxed text-text-tertiary">
              {t('openSource.community.description')}
            </p>
          </div>

          <div className="rounded-lg border border-border-default bg-surface p-6 text-center">
            <div className="mb-4 flex justify-center text-text-tertiary">
              <CodeIcon />
            </div>
            <h3 className="mb-2 font-mono text-sm font-medium text-text-primary">
              {t('openSource.contributors.title')}
            </h3>
            <p className="font-mono text-xs leading-relaxed text-text-tertiary">
              {t('openSource.contributors.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/OkyoKwon/contextSync"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            {t('openSource.cta.star')}
          </a>
          <a
            href="https://github.com/OkyoKwon/contextSync/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border-default px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-hover"
          >
            {t('openSource.cta.contributing')}
          </a>
        </div>

        <a
          href="https://github.com/OkyoKwon/contextSync/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {t('openSource.cta.issues')} →
        </a>
      </div>
    </section>
  );
}
