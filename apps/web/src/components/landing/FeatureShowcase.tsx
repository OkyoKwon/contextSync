import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';

interface HeroFeature {
  readonly label: string;
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly detailKeys: readonly TranslationKey[];
}

interface SubFeature {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly icon: string;
}

const HERO_FEATURES: readonly HeroFeature[] = [
  {
    label: '01',
    titleKey: 'features.hero.0.title',
    descriptionKey: 'features.hero.0.description',
    detailKeys: [
      'features.hero.0.detail.0',
      'features.hero.0.detail.1',
      'features.hero.0.detail.2',
      'features.hero.0.detail.3',
    ],
  },
  {
    label: '02',
    titleKey: 'features.hero.1.title',
    descriptionKey: 'features.hero.1.description',
    detailKeys: [
      'features.hero.1.detail.0',
      'features.hero.1.detail.1',
      'features.hero.1.detail.2',
      'features.hero.1.detail.3',
    ],
  },
  {
    label: '03',
    titleKey: 'features.hero.2.title',
    descriptionKey: 'features.hero.2.description',
    detailKeys: [
      'features.hero.2.detail.0',
      'features.hero.2.detail.1',
      'features.hero.2.detail.2',
      'features.hero.2.detail.3',
    ],
  },
];

const SUB_FEATURES: readonly SubFeature[] = [
  { titleKey: 'features.sub.0.title', descriptionKey: 'features.sub.0.description', icon: '📊' },
  { titleKey: 'features.sub.1.title', descriptionKey: 'features.sub.1.description', icon: '🔍' },
  { titleKey: 'features.sub.2.title', descriptionKey: 'features.sub.2.description', icon: '👥' },
  { titleKey: 'features.sub.3.title', descriptionKey: 'features.sub.3.description', icon: '⚡' },
];

function HeroFeatureCard({
  feature,
  index,
}: {
  readonly feature: HeroFeature;
  readonly index: number;
}) {
  const { ref, isVisible } = useInView();
  const t = useT();
  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-8 md:flex-row md:items-center ${isReversed ? 'md:flex-row-reverse' : ''} transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default font-mono text-xs text-text-muted">
            {feature.label}
          </span>
          <h3 className="font-mono text-base font-medium text-text-primary">
            {t(feature.titleKey)}
          </h3>
        </div>
        <p className="font-mono text-sm text-text-secondary">{t(feature.descriptionKey)}</p>
      </div>
      <div className="flex-1 rounded-lg border-l-2 border-text-muted bg-surface p-6">
        <ul className="space-y-2">
          {feature.detailKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 font-mono text-xs text-text-tertiary">
              <span className="mt-0.5 text-text-muted">›</span>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SubFeatureCard({ feature }: { readonly feature: SubFeature }) {
  const t = useT();

  return (
    <div className="rounded-lg border border-border-default bg-surface p-6 transition-colors hover:border-text-muted">
      <div className="mb-3 text-lg">{feature.icon}</div>
      <h4 className="mb-2 font-mono text-sm font-medium text-text-primary">
        {t(feature.titleKey)}
      </h4>
      <p className="font-mono text-xs leading-relaxed text-text-tertiary">
        {t(feature.descriptionKey)}
      </p>
    </div>
  );
}

export function FeatureShowcase() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section id="features" className="bg-page py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-16 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('features.sectionLabel')}
        </p>

        <div className="space-y-16">
          {HERO_FEATURES.map((feature, i) => (
            <HeroFeatureCard key={feature.label} feature={feature} index={i} />
          ))}
        </div>

        <div
          ref={ref}
          className={`mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {SUB_FEATURES.map((feature) => (
            <SubFeatureCard key={feature.titleKey} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
