import { useT } from '../../i18n/use-translation';
import { useInView } from './use-in-view';

export function Contributing() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section
      id="contributing"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('contributing.sectionLabel')}
        </p>
        <h2 className="mb-3 font-mono text-xl font-semibold text-text-primary md:text-2xl">
          {t('contributing.title')}
        </h2>
        <p className="mb-10 font-mono text-sm text-text-secondary">{t('contributing.subtitle')}</p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/OkyoKwon/contextSync"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-btn-primary-bg px-6 py-3 font-mono text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
          >
            Star on GitHub
          </a>
          <a
            href="https://github.com/OkyoKwon/contextSync/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border-default px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-hover"
          >
            {t('contributing.guide')}
          </a>
        </div>

        <a
          href="https://github.com/OkyoKwon/contextSync/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block font-mono text-xs text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {t('contributing.issues')} →
        </a>
      </div>
    </section>
  );
}
