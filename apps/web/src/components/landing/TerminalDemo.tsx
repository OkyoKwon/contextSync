import { useT } from '../../i18n/use-translation';
import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

export function TerminalDemo() {
  const { ref, isVisible } = useInView(0.1);
  const t = useT();

  const demoLines = [
    { delay: 0, content: '$ contextsync sync --project team-alpha', style: 'text-zinc-200' },
    { delay: 1, content: t('demo.scanning'), style: 'text-zinc-500' },
    { delay: 2, content: t('demo.found'), style: 'text-emerald-400' },
    { delay: 3, content: t('demo.uploaded'), style: 'text-emerald-400' },
    { delay: 4, content: '', style: '' },
    { delay: 5, content: '┌─────────────────────────────────────────┐', style: 'text-zinc-500' },
    { delay: 5, content: '│  Dashboard Summary                      │', style: 'text-zinc-400' },
    { delay: 5, content: '├─────────────────────────────────────────┤', style: 'text-zinc-500' },
    { delay: 6, content: '│  Sessions today    12                   │', style: 'text-zinc-300' },
    { delay: 6, content: '│  Active members     4                   │', style: 'text-zinc-300' },
    { delay: 6, content: '│  Tokens used       847K                 │', style: 'text-zinc-300' },
    { delay: 7, content: '│  Conflicts found    2  ⚠                │', style: 'text-yellow-400' },
    { delay: 7, content: '└─────────────────────────────────────────┘', style: 'text-zinc-500' },
    { delay: 8, content: '', style: '' },
    { delay: 9, content: '$ contextsync conflicts --severity high', style: 'text-zinc-200' },
    { delay: 10, content: t('demo.conflict1'), style: 'text-red-400' },
    { delay: 11, content: t('demo.conflict2'), style: 'text-red-400' },
    { delay: 12, content: t('demo.notified'), style: 'text-emerald-400' },
  ];

  return (
    <section
      ref={ref}
      className={`bg-page py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('demo.sectionLabel')}
        </p>

        <TerminalWindow title="~/team-alpha — contextsync" className="mx-auto max-w-2xl">
          <div className="space-y-0.5">
            {demoLines.map((line, i) => {
              if (!line.content) {
                return <div key={i} className="h-3" />;
              }
              return (
                <div
                  key={i}
                  className={`${line.style} whitespace-pre ${
                    isVisible ? 'animate-[fadeIn_0.3s_ease-out_forwards]' : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: isVisible ? `${line.delay * 0.3}s` : '0s',
                    opacity: isVisible ? undefined : 0,
                  }}
                >
                  {line.content}
                </div>
              );
            })}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
