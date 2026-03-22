interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly showPercentage?: boolean;
}

export function ProgressBar({ value, max = 100, label, showPercentage = true }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-text-secondary">{label}</span>}
          {showPercentage && <span className="text-text-tertiary">{percentage}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="h-full rounded-full bg-accent-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
