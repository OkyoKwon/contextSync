import { useState } from 'react';
import { useT } from '../../i18n/use-translation';
import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

const COMMANDS = `git clone https://github.com/OkyoKwon/contextSync.git
cd contextSync && pnpm setup
pnpm dev`;

const TERMINAL_CONTENT = `$ git clone https://github.com/OkyoKwon/contextSync.git
$ cd contextSync && pnpm setup
$ pnpm dev

✓ API  → http://localhost:3001
✓ Web  → http://localhost:5173`;

function ClipboardIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function QuickStart() {
  const { ref, isVisible } = useInView();
  const t = useT();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(COMMANDS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section
      id="quickstart"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-4 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          {t('quickstart.sectionLabel')}
        </p>
        <h2 className="mb-12 text-center font-mono text-xl font-semibold text-text-primary md:text-2xl">
          {t('quickstart.title')}
        </h2>

        <TerminalWindow title="~/terminal" className="relative mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-12 cursor-pointer rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            aria-label="Copy commands"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckIcon />
                <span className="text-xs">{t('quickstart.copied')}</span>
              </span>
            ) : (
              <ClipboardIcon />
            )}
          </button>
          <div className="space-y-1">
            {TERMINAL_CONTENT.split('\n').map((line, i) => {
              if (line === '') return <div key={i} className="h-3" />;
              if (line.startsWith('$')) {
                return (
                  <div key={i}>
                    <span className="text-zinc-500">$ </span>
                    <span className="text-zinc-200">{line.slice(2)}</span>
                  </div>
                );
              }
              return (
                <div key={i} className="text-emerald-400">
                  {line}
                </div>
              );
            })}
          </div>
        </TerminalWindow>

        <p className="mt-8 text-center font-mono text-xs text-text-tertiary">
          {t('quickstart.prerequisites')}
        </p>
      </div>
    </section>
  );
}
