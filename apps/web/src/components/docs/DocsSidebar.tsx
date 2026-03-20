import { useMemo } from 'react';
import { useT } from '../../i18n/use-translation';
import { useActiveSection } from '../../hooks/use-active-section';

const SECTION_IDS = ['getting-started', 'features', 'faq'] as const;

interface TocItem {
  readonly id: string;
  readonly labelKey: 'docs.toc.gettingStarted' | 'docs.toc.features' | 'docs.toc.faq';
}

const tocItems: readonly TocItem[] = [
  { id: 'getting-started', labelKey: 'docs.toc.gettingStarted' },
  { id: 'features', labelKey: 'docs.toc.features' },
  { id: 'faq', labelKey: 'docs.toc.faq' },
];

export function DocsSidebar() {
  const t = useT();
  const sectionIds = useMemo(() => SECTION_IDS, []);
  const activeId = useActiveSection(sectionIds);

  return (
    <nav className="sticky top-20 hidden w-56 shrink-0 lg:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {t('docs.toc.title')}
      </p>
      <ul className="space-y-1">
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeId === item.id
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-text-tertiary hover:bg-interactive-hover hover:text-text-primary'
              }`}
            >
              {t(item.labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileTocButton() {
  const t = useT();

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:hidden">
      <details className="group">
        <summary className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-blue-500/20 text-blue-400 shadow-lg backdrop-blur-sm transition-colors hover:bg-blue-500/30 list-none">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </summary>
        <div className="absolute bottom-14 right-0 w-48 rounded-xl border border-border-default bg-surface p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('docs.toc.title')}
          </p>
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary transition-colors hover:bg-interactive-hover hover:text-text-primary"
                >
                  {t(item.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
