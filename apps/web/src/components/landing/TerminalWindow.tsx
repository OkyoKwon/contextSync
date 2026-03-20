interface TerminalWindowProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function TerminalWindow({ title, children, className = '' }: TerminalWindowProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 ${className}`}>
      <div className="flex items-center gap-2 border-b border-zinc-700 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-xs text-zinc-400">{title}</span>
      </div>
      <div className="p-4 font-mono text-sm leading-relaxed text-zinc-300">
        {children}
      </div>
    </div>
  );
}
