import { useT } from '../../i18n/use-translation';
import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

interface TerminalLine {
  readonly type: 'prompt' | 'output' | 'spacer' | 'conflict' | 'solution';
  readonly user?: string;
  readonly text: string;
}

function TerminalLines({ lines }: { readonly lines: readonly TerminalLine[] }) {
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.type === 'spacer') {
          return <div key={i} className="h-3" />;
        }
        if (line.type === 'prompt') {
          return (
            <div key={i}>
              <span className="text-green-400 dark:text-green-400">{line.user}@project</span>
              <span className="text-text-muted">:~$ </span>
              <span className="text-text-primary">{line.text}</span>
            </div>
          );
        }
        if (line.type === 'conflict') {
          return (
            <div key={i} className="font-medium text-red-400 dark:text-red-400">
              {line.text}
            </div>
          );
        }
        if (line.type === 'solution') {
          return (
            <div key={i} className="text-emerald-400 dark:text-emerald-400">
              {line.text}
            </div>
          );
        }
        return (
          <div key={i} className="text-text-muted">
            {line.text}
          </div>
        );
      })}
    </div>
  );
}

export function ProblemStatement() {
  const { ref, isVisible } = useInView();
  const t = useT();

  const soloLines: readonly TerminalLine[] = [
    { type: 'prompt', user: 'user', text: t('problem.solo.prompt1') },
    { type: 'output', text: t('problem.solo.output1') },
    { type: 'output', text: t('problem.solo.output2') },
    { type: 'spacer', text: '' },
    { type: 'conflict', text: '⚠ CONTEXT LOST: 3 hours of prior decisions, gone' },
    { type: 'spacer', text: '' },
    { type: 'solution', text: `$ ${t('problem.solo.prompt2')}` },
    { type: 'solution', text: t('problem.solo.output3') },
  ];

  const teamLines: readonly TerminalLine[] = [
    { type: 'prompt', user: 'dev-A', text: t('problem.team.prompt1') },
    { type: 'output', text: t('problem.team.output1') },
    { type: 'output', text: t('problem.team.output2') },
    { type: 'spacer', text: '' },
    { type: 'prompt', user: 'dev-B', text: t('problem.team.prompt2') },
    { type: 'output', text: t('problem.team.output3') },
    { type: 'output', text: t('problem.team.output4') },
    { type: 'spacer', text: '' },
    { type: 'conflict', text: t('problem.team.conflict') },
    { type: 'spacer', text: '' },
    { type: 'solution', text: '$ contextsync detect --project team-alpha' },
    { type: 'solution', text: t('problem.team.resolved') },
  ];

  return (
    <section
      id="problem"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('problem.sectionLabel')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-muted">
              {t('problem.solo.label')}
            </p>
            <TerminalWindow title="~/my-project">
              <TerminalLines lines={soloLines} />
            </TerminalWindow>
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-muted">
              {t('problem.team.label')}
            </p>
            <TerminalWindow title="~/team-project">
              <TerminalLines lines={teamLines} />
            </TerminalWindow>
          </div>
        </div>

        <p className="mt-12 text-center font-mono text-sm text-text-tertiary">
          {t('problem.conclusion')}
          <span className="text-text-primary font-medium">{t('problem.conclusionHighlight')}</span>
          {t('problem.conclusionEnd')}
        </p>
      </div>
    </section>
  );
}
