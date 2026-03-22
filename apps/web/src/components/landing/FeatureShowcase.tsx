import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';
import { ScreenshotImage } from '../ui/ScreenshotImage';

interface HeroFeature {
  readonly label: string;
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly detailKeys: readonly TranslationKey[];
  readonly screenshot: string;
  readonly screenshotAltKey: TranslationKey;
}

interface SubFeature {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly icon: string;
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
    screenshot: '/screenshots/session-conversation.png',
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
    screenshot: '/screenshots/conflicts-list.png',
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
    screenshot: '/screenshots/prd-analysis.png',
    screenshotAltKey: 'screenshot.alt.prdAnalysis',
  },
];

const SUB_FEATURES: readonly SubFeature[] = [
  {
    titleKey: 'features.sub.0.title',
    descriptionKey: 'features.sub.0.description',
    icon: '📊',
    screenshot: '/screenshots/dashboard-stats.png',
    screenshotAltKey: 'screenshot.alt.dashboard',
  },
  {
    titleKey: 'features.sub.1.title',
    descriptionKey: 'features.sub.1.description',
    icon: '🔍',
    screenshot: '/screenshots/search-overlay.png',
    screenshotAltKey: 'screenshot.alt.searchOverlay',
  },
  {
    titleKey: 'features.sub.2.title',
    descriptionKey: 'features.sub.2.description',
    icon: '👥',
    screenshot: '/screenshots/settings-team.png',
    screenshotAltKey: 'screenshot.alt.settingsTeam',
  },
  {
    titleKey: 'features.sub.3.title',
    descriptionKey: 'features.sub.3.description',
    icon: '⚡',
    screenshot: '/screenshots/token-usage-chart.png',
    screenshotAltKey: 'screenshot.alt.tokenUsageChart',
  },
  {
    titleKey: 'features.sub.4.title',
    descriptionKey: 'features.sub.4.description',
    icon: '📋',
    screenshot: '/screenshots/session-detail.png',
    screenshotAltKey: 'screenshot.alt.sessionDetail',
  },
  {
    titleKey: 'features.sub.5.title',
    descriptionKey: 'features.sub.5.description',
    icon: '🎯',
    screenshot: '/screenshots/ai-evaluation.png',
    screenshotAltKey: 'screenshot.alt.aiEvaluation',
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

function SubFeatureCard({ feature }: { readonly feature: SubFeature }) {
  const t = useT();

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface transition-colors hover:border-text-muted">
      <div className="aspect-video overflow-hidden border-b border-border-default">
        <ScreenshotImage
          src={feature.screenshot}
          alt={t(feature.screenshotAltKey)}
          className="h-full w-full"
        />
      </div>
      <div className="p-6">
        <div className="mb-3 text-lg">{feature.icon}</div>
        <h4 className="mb-2 font-mono text-sm font-medium text-text-primary">
          {t(feature.titleKey)}
        </h4>
        <p className="font-mono text-xs leading-relaxed text-text-tertiary">
          {t(feature.descriptionKey)}
        </p>
      </div>
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
          className={`mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-700 ${
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
