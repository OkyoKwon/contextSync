type BadgeVariant = 'default' | 'info' | 'warning' | 'critical' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
};

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const variant = severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info';
  return <Badge variant={variant}>{severity.toUpperCase()}</Badge>;
}
