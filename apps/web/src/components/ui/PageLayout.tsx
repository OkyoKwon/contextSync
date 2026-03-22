import type { ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl';

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
};

interface PageLayoutProps {
  readonly children: ReactNode;
  readonly maxWidth?: MaxWidth;
  readonly className?: string;
}

export function PageLayout({ children, maxWidth = 'md', className = '' }: PageLayoutProps) {
  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} space-y-6 p-6 ${className}`}>
      {children}
    </div>
  );
}
