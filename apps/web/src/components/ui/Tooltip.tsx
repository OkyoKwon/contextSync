import type { ReactNode } from 'react';
import { InfoIcon } from './icons';

interface TooltipProps {
  readonly content: ReactNode;
  readonly position?: 'top' | 'bottom';
  readonly align?: 'left' | 'center' | 'right';
  readonly width?: string;
  readonly children?: ReactNode;
}

const alignClasses = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
} as const;

export function Tooltip({
  content,
  position = 'top',
  align = 'center',
  width = 'w-56',
  children,
}: TooltipProps) {
  const positionClasses =
    position === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  return (
    <span className="group/tooltip relative inline-flex" tabIndex={0}>
      {children ?? (
        <InfoIcon
          size={14}
          className="cursor-help text-text-tertiary transition-colors group-hover/tooltip:text-text-secondary"
        />
      )}
      <span
        className={`pointer-events-none absolute z-50 ${positionClasses} ${alignClasses[align]} ${width} rounded-lg border border-border-primary bg-bg-primary p-3 opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100 group-focus-within/tooltip:pointer-events-auto group-focus-within/tooltip:opacity-100`}
        role="tooltip"
      >
        <span className="text-xs leading-relaxed text-text-secondary">
          {content}
        </span>
      </span>
    </span>
  );
}
