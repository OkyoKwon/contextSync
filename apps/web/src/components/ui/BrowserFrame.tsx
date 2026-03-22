import type { ReactNode } from 'react';

interface BrowserFrameProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function BrowserFrame({ children, className = '' }: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border-default bg-surface ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-border-default px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
      </div>
      <div>{children}</div>
    </div>
  );
}
