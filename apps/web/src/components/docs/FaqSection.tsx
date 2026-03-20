import { useState } from 'react';
import { useT } from '../../i18n/use-translation';

const FAQ_COUNT = 6;

export function FaqSection() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="scroll-mt-24 pb-16">
      <h2 className="text-2xl font-bold text-text-primary">{t('docs.faq.title')}</h2>

      <div className="mt-8 divide-y divide-border-default rounded-xl border border-border-default">
        {Array.from({ length: FAQ_COUNT }, (_, i) => {
          const isOpen = openIndex === i;
          const idx = i as 0 | 1 | 2 | 3 | 4 | 5;

          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="text-sm font-medium text-text-primary">
                  {t(`docs.faq.${idx}.q`)}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">
                    {t(`docs.faq.${idx}.a`)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
