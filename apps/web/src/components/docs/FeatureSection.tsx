import { useState } from 'react';
import { useT } from '../../i18n/use-translation';
import { Card } from '../ui/Card';

const featureIcons = [
  SyncFeatureIcon,
  ConflictFeatureIcon,
  DashboardFeatureIcon,
  PrdFeatureIcon,
  PlansFeatureIcon,
  SearchFeatureIcon,
  TeamFeatureIcon,
] as const;

const FEATURE_COUNT = 7;

export function FeatureSection() {
  const t = useT();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  return (
    <section id="features" className="scroll-mt-24 pb-16">
      <h2 className="text-2xl font-bold text-text-primary">{t('docs.features.title')}</h2>

      <div className="mt-8 space-y-4">
        {Array.from({ length: FEATURE_COUNT }, (_, i) => {
          const Icon = featureIcons[i]!;
          const isExpanded = expandedIndex === i;
          const idx = i as 0 | 1 | 2 | 3 | 4 | 5 | 6;

          return (
            <Card key={i} padding="none" className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Icon />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text-primary">
                    {t(`docs.features.${idx}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-text-tertiary">
                    {t(`docs.features.${idx}.summary`)}
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 shrink-0 text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ${
                  isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-border-default px-5 py-4">
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {t(`docs.features.${idx}.detail`)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function SyncFeatureIcon() {
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

function ConflictFeatureIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
}

function DashboardFeatureIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function PrdFeatureIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l2 2 4-4" />
    </svg>
  );
}

function PlansFeatureIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function SearchFeatureIcon() {
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

function TeamFeatureIcon() {
  return (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
