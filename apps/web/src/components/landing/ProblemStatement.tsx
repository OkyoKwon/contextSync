import { useT } from '../../i18n/use-translation';
import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

export function ProblemStatement() {
  const { ref, isVisible } = useInView();
  const t = useT();

  const terminalLines = [
    { type: 'prompt', user: 'dev-A', text: t('problem.terminal.prompt1') },
    { type: 'output', text: t('problem.terminal.output1') },
    { type: 'output', text: t('problem.terminal.output2') },
    { type: 'spacer', text: '' },
    { type: 'prompt', user: 'dev-B', text: t('problem.terminal.prompt2') },
    { type: 'output', text: t('problem.terminal.output3') },
    { type: 'output', text: t('problem.terminal.output4') },
    { type: 'spacer', text: '' },
    { type: 'conflict', text: t('problem.terminal.conflict') },
    { type: 'spacer', text: '' },
    { type: 'solution', text: '$ contextsync detect --project team-alpha' },
    { type: 'solution', text: t('problem.terminal.resolved') },
  ] as const;

  return (
    <section
      id="problem"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('problem.sectionLabel')}
        </p>

        <TerminalWindow title="~/team-project" className="mx-auto max-w-2xl">
          <div className="space-y-1">
            {terminalLines.map((line, i) => {
              if (line.type === 'spacer') {
                return <div key={i} className="h-3" />;
              }
              if (line.type === 'prompt') {
                return (
                  <div key={i}>
                    <span className="text-green-400">{line.user}@project</span>
                    <span className="text-zinc-500">:~$ </span>
                    <span className="text-zinc-200">{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'conflict') {
                return (
                  <div key={i} className="text-red-400 font-medium">
                    {line.text}
                  </div>
                );
              }
              if (line.type === 'solution') {
                return (
                  <div key={i} className="text-emerald-400">
                    {line.text}
                  </div>
                );
              }
              return (
                <div key={i} className="text-zinc-500">
                  {line.text}
                </div>
              );
            })}
          </div>
        </TerminalWindow>

        <p className="mt-12 text-center font-mono text-sm text-text-tertiary">
          {t('problem.conclusion')}
          <span className="text-text-primary font-medium">{t('problem.conclusionHighlight')}</span>
          {t('problem.conclusionEnd')}
        </p>
      </div>
    </section>
  );
}
