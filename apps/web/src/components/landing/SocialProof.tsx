import { useT } from '../../i18n/use-translation';
import type { TranslationKey } from '../../i18n/types';
import { useInView } from './use-in-view';

const STATS: readonly { readonly value: string; readonly labelKey: TranslationKey }[] = [
  { value: '100+', labelKey: 'social.stat.0.label' },
  { value: '10,000+', labelKey: 'social.stat.1.label' },
  { value: '5,000+', labelKey: 'social.stat.2.label' },
  { value: '87%+', labelKey: 'social.stat.3.label' },
];

const TESTIMONIALS: readonly {
  readonly quoteKey: TranslationKey;
  readonly authorKey: TranslationKey;
}[] = [
  { quoteKey: 'social.testimonial.0.quote', authorKey: 'social.testimonial.0.author' },
  { quoteKey: 'social.testimonial.1.quote', authorKey: 'social.testimonial.1.author' },
];

export function SocialProof() {
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
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('social.sectionLabel')}
        </p>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <div className="font-mono text-2xl font-bold text-text-primary md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-xs text-text-muted">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.quoteKey} className="border-l-2 border-text-muted pl-4">
              <p className="font-mono text-sm leading-relaxed text-text-secondary">
                {t(item.quoteKey)}
              </p>
              <footer className="mt-3 font-mono text-xs text-text-muted">
                {t(item.authorKey)}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
