import { useT } from '../../i18n/use-translation';
import { Card } from '../ui/Card';

const highlightIcons = [SyncIcon, ShieldIcon, SearchIcon] as const;

export function DocsHero() {
  const t = useT();

  return (
    <section className="pb-16 pt-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{t('docs.hero.title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-text-secondary">{t('docs.hero.subtitle')}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {([0, 1, 2] as const).map((i) => {
          const Icon = highlightIcons[i];
          return (
            <Card key={i} padding="md" className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Icon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {t(`docs.hero.highlight.${i}.title`)}
                </h3>
                <p className="mt-1 text-sm text-text-tertiary">
                  {t(`docs.hero.highlight.${i}.desc`)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <a
        href="#getting-started"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
      >
        {t('docs.hero.cta')}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </a>
    </section>
  );
}

function SyncIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
