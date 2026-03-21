import type { ReactNode } from 'react';

interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      {icon && <div className="mb-4 h-12 w-12 text-text-tertiary">{icon}</div>}
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-center text-sm text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
