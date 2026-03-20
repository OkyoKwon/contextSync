type BadgeVariant = 'default' | 'info' | 'warning' | 'critical' | 'success';

interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-zinc-500/15 text-zinc-400',
  info: 'bg-blue-500/15 text-blue-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  critical: 'bg-red-500/15 text-red-400',
  success: 'bg-green-500/15 text-green-400',
};

export function Badge({ variant = 'default', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const variant = severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info';
  return <Badge variant={variant}>{severity.toUpperCase()}</Badge>;
}
