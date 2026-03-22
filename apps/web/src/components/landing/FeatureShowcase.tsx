import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';
import { ScreenshotImage } from '../ui/ScreenshotImage';
import { assetUrl } from '@/lib/asset-url';

interface HeroFeature {
  readonly label: string;
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly detailKeys: readonly TranslationKey[];
  readonly screenshot: string;
  readonly screenshotAltKey: TranslationKey;
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
    screenshot: assetUrl('/screenshots/session-conversation.png'),
    screenshotAltKey: 'screenshot.alt.sessionConversation',
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
    screenshot: assetUrl('/screenshots/conflicts-list.png'),
    screenshotAltKey: 'screenshot.alt.conflictsList',
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
    screenshot: assetUrl('/screenshots/prd-analysis.png'),
    screenshotAltKey: 'screenshot.alt.prdAnalysis',
  },
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
      <div className="flex-1 overflow-hidden rounded-lg border border-border-default">
        <ScreenshotImage
          src={feature.screenshot}
          alt={t(feature.screenshotAltKey)}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function FeatureShowcase() {
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
      </div>
    </section>
  );
}
