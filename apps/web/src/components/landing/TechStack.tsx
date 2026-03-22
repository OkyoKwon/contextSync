import { useT } from '../../i18n/use-translation';
import { useInView } from './use-in-view';

interface TechItem {
  readonly name: string;
  readonly version?: string;
}

interface TechCategory {
  readonly labelKey: 'techstack.frontend' | 'techstack.backend' | 'techstack.database';
  readonly items: readonly TechItem[];
}

const CATEGORIES: readonly TechCategory[] = [
  {
    labelKey: 'techstack.frontend',
    items: [
      { name: 'React', version: '19' },
      { name: 'Vite', version: '6' },
      { name: 'Tailwind CSS', version: '4' },
      { name: 'Zustand', version: '5' },
      { name: 'React Query', version: '5' },
      { name: 'React Router', version: '7' },
    ],
  },
  {
    labelKey: 'techstack.backend',
    items: [
      { name: 'Fastify', version: '5' },
      { name: 'Kysely', version: '0.27' },
      { name: 'Zod' },
      { name: 'JWT' },
    ],
  },
  {
    labelKey: 'techstack.database',
    items: [{ name: 'PostgreSQL', version: '16' }, { name: 'Full-Text Search' }],
  },
];

const TOOLING: readonly string[] = ['TypeScript 5.7', 'Turborepo', 'Vitest', 'pnpm'];

export function TechStack() {
  const { ref, isVisible } = useInView();
  const t = useT();

  return (
    <section id="techstack" className="bg-page py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-4 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('techstack.sectionLabel')}
        </p>

        <div
          ref={ref}
          className={`grid grid-cols-1 gap-6 md:grid-cols-3 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.labelKey}
              className="rounded-lg border border-border-default bg-surface p-6 transition-colors hover:border-text-muted"
            >
              <h3 className="mb-4 font-mono text-sm font-medium text-text-primary">
                {t(cat.labelKey)}
              </h3>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-2 font-mono text-xs text-text-tertiary"
                  >
                    <span className="text-text-muted">›</span>
                    <span>
                      {item.name}
                      {item.version && <span className="ml-1 text-text-muted">{item.version}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-mono text-xs text-text-tertiary">
          <span className="text-text-muted">{t('techstack.tooling')}:</span>{' '}
          {TOOLING.join(' \u00b7 ')}
        </p>
      </div>
    </section>
  );
}
