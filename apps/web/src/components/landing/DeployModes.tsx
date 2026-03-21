import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';

interface DeployMode {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly detailKeys: readonly TranslationKey[];
  readonly icon: React.ReactNode;
}

const MonitorIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const ServerIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
  </svg>
);

const PlugIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22v-5M7 17h10M9 12V7M15 12V7M7 12h10M9 7V2M15 7V2" />
  </svg>
);

const DEPLOY_MODES: readonly DeployMode[] = [
  {
    titleKey: 'deployModes.0.title',
    descriptionKey: 'deployModes.0.description',
    detailKeys: ['deployModes.0.detail.0', 'deployModes.0.detail.1', 'deployModes.0.detail.2'],
    icon: <MonitorIcon />,
  },
  {
    titleKey: 'deployModes.1.title',
    descriptionKey: 'deployModes.1.description',
    detailKeys: ['deployModes.1.detail.0', 'deployModes.1.detail.1', 'deployModes.1.detail.2'],
    icon: <ServerIcon />,
  },
  {
    titleKey: 'deployModes.2.title',
    descriptionKey: 'deployModes.2.description',
    detailKeys: ['deployModes.2.detail.0', 'deployModes.2.detail.1', 'deployModes.2.detail.2'],
    icon: <PlugIcon />,
  },
];

export function DeployModes() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section className="bg-page py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-4 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('deployModes.sectionLabel')}
        </p>
        <h2 className="mb-2 text-center font-mono text-xl font-semibold text-text-primary md:text-2xl">
          {t('deployModes.title')}
        </h2>
        <p className="mb-16 text-center font-mono text-sm text-text-secondary">
          {t('deployModes.subtitle')}
        </p>

        <div
          ref={ref}
          className={`grid grid-cols-1 gap-6 md:grid-cols-3 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {DEPLOY_MODES.map((mode) => (
            <div
              key={mode.titleKey}
              className="rounded-lg border border-border-default bg-surface p-6 transition-colors hover:border-text-muted"
            >
              <div className="mb-4 text-text-muted">{mode.icon}</div>
              <h3 className="mb-1 font-mono text-sm font-medium text-text-primary">
                {t(mode.titleKey)}
              </h3>
              <p className="mb-4 font-mono text-xs text-text-secondary">{t(mode.descriptionKey)}</p>
              <ul className="space-y-2">
                {mode.detailKeys.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 font-mono text-xs text-text-tertiary"
                  >
                    <span className="mt-0.5 text-text-muted">›</span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
