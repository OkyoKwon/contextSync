interface TerminalWindowProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function TerminalWindow({ title, children, className = '' }: TerminalWindowProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border-default bg-surface-sunken ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border-default px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-xs text-text-muted">{title}</span>
      </div>
      <div className="p-4 font-mono text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}
