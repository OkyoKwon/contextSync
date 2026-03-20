import type { ReactNode } from 'react';
import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';

interface Step {
  readonly number: string;
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly icon: ReactNode;
}

const STEPS: readonly Step[] = [
  {
    number: '01',
    titleKey: 'howItWorks.step.0.title',
    descriptionKey: 'howItWorks.step.0.description',
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12l8-8 8 8" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    number: '02',
    titleKey: 'howItWorks.step.1.title',
    descriptionKey: 'howItWorks.step.1.description',
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-6" />
      </svg>
    ),
  },
  {
    number: '03',
    titleKey: 'howItWorks.step.2.title',
    descriptionKey: 'howItWorks.step.2.description',
    icon: (
      <svg
        className="h-6 w-6"
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
    ),
  },
];

export function HowItWorks() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-16 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('howItWorks.sectionLabel')}
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-6 hidden h-px w-full border-t border-dashed border-border-default md:block md:translate-x-1/2" />
              )}

              <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-surface">
                <span className="font-mono text-xs font-medium text-text-muted">{step.number}</span>
              </div>

              <div className="mb-3 text-text-tertiary">{step.icon}</div>

              <h3 className="mb-2 font-mono text-sm font-medium text-text-primary">
                {t(step.titleKey)}
              </h3>
              <p className="max-w-xs font-mono text-xs leading-relaxed text-text-tertiary">
                {t(step.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
