import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useT } from '../../i18n/use-translation';
import { StepIndicator } from './StepIndicator';
import {
  CreateProjectIllustration,
  SyncSessionIllustration,
  DashboardIllustration,
  InviteTeamIllustration,
} from './illustrations';
import { ScreenshotImage } from '../ui/ScreenshotImage';
import type { TranslationKey } from '../../i18n/types';
import { assetUrl } from '@/lib/asset-url';

interface StepConfig {
  readonly illustration: () => ReactNode;
  readonly screenshot: string | null;
  readonly screenshotAltKey: TranslationKey | null;
}

const STEP_CONFIGS: readonly StepConfig[] = [
  { illustration: CreateProjectIllustration, screenshot: null, screenshotAltKey: null },
  {
    illustration: SyncSessionIllustration,
    screenshot: assetUrl('/screenshots/session-conversation.png'),
    screenshotAltKey: 'screenshot.alt.sessionConversation',
  },
  {
    illustration: DashboardIllustration,
    screenshot: assetUrl('/screenshots/dashboard-full.png'),
    screenshotAltKey: 'screenshot.alt.dashboard',
  },
  {
    illustration: InviteTeamIllustration,
    screenshot: assetUrl('/screenshots/settings-team.png'),
    screenshotAltKey: 'screenshot.alt.settingsTeam',
  },
];

const STEP_COUNT = 4;

export function GettingStartedSection() {
  const t = useT();
  const [activeStep, setActiveStep] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxSrc, closeLightbox]);

  return (
    <section
      id="getting-started"
      className="scroll-mt-24 border-t border-border-default pb-16 pt-16"
    >
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
            const isActive = i === activeStep;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`flex w-full flex-col gap-4 rounded-xl border p-5 text-left transition-colors ${
                  !hasScreenshot || !isActive ? 'sm:flex-row sm:items-center' : ''
                } ${
                  isActive
                    ? 'border-blue-400/30 bg-blue-500/5 shadow-sm shadow-blue-500/5'
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
                {hasScreenshot && isActive ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxSrc(config.screenshot!);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setLightboxSrc(config.screenshot!);
                      }
                    }}
                    className="group relative w-full overflow-hidden rounded-lg border border-border-default"
                  >
                    <ScreenshotImage
                      src={config.screenshot!}
                      alt={t(config.screenshotAltKey!)}
                      className="h-auto max-h-48 w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <span className="rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        View full image
                      </span>
                    </div>
                  </div>
                ) : hasScreenshot ? null : (
                  <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-40">
                    <config.illustration />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox();
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <img src={lightboxSrc} alt="" className="max-h-[85vh] max-w-full rounded-xl shadow-2xl" />
        </div>
      )}
    </section>
  );
}
