import { useState } from 'react';
import type { ReactNode } from 'react';
import { useT } from '../../i18n/use-translation';
import { StepIndicator } from './StepIndicator';
import {
  CreateProjectIllustration,
  SyncSessionIllustration,
  DashboardIllustration,
  InviteTeamIllustration,
} from './DocsIllustrations';
import { ScreenshotImage } from '../ui/ScreenshotImage';
import type { TranslationKey } from '../../i18n/types';

interface StepConfig {
  readonly illustration: () => ReactNode;
  readonly screenshot: string | null;
  readonly screenshotAltKey: TranslationKey | null;
}

const STEP_CONFIGS: readonly StepConfig[] = [
  { illustration: CreateProjectIllustration, screenshot: null, screenshotAltKey: null },
  {
    illustration: SyncSessionIllustration,
    screenshot: '/screenshots/session-conversation.png',
    screenshotAltKey: 'screenshot.alt.sessionConversation',
  },
  {
    illustration: DashboardIllustration,
    screenshot: '/screenshots/dashboard-full.png',
    screenshotAltKey: 'screenshot.alt.dashboard',
  },
  {
    illustration: InviteTeamIllustration,
    screenshot: '/screenshots/settings-team.png',
    screenshotAltKey: 'screenshot.alt.settingsTeam',
  },
];

const STEP_COUNT = 4;

export function GettingStartedSection() {
  const t = useT();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="getting-started" className="scroll-mt-24 pb-16">
      <h2 className="text-2xl font-bold text-text-primary">{t('docs.gettingStarted.title')}</h2>

      <div className="mt-8 flex gap-8">
        {/* Step indicator */}
        <div className="hidden shrink-0 sm:block">
          <StepIndicator stepCount={STEP_COUNT} activeStep={activeStep} />
        </div>

        {/* Step content */}
        <div className="flex-1 space-y-6">
          {([0, 1, 2, 3] as const).map((i) => {
            const config = STEP_CONFIGS[i]!;
            const hasScreenshot = config.screenshot !== null && config.screenshotAltKey !== null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`flex w-full flex-col gap-4 rounded-xl border p-5 text-left transition-colors sm:flex-row sm:items-center ${
                  i === activeStep
                    ? 'border-blue-400/30 bg-blue-500/5'
                    : 'border-border-default bg-surface hover:bg-surface-hover'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 sm:hidden">
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {t(`docs.gettingStarted.step.${i}.title`)}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {t(`docs.gettingStarted.step.${i}.desc`)}
                  </p>
                </div>
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-40">
                  {hasScreenshot ? (
                    <ScreenshotImage
                      src={config.screenshot!}
                      alt={t(config.screenshotAltKey!)}
                      className="h-full w-full"
                    />
                  ) : (
                    <config.illustration />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
