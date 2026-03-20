interface PrdRateDeltaProps {
  readonly currentRate: number;
  readonly previousRate: number | null;
}

export function PrdRateDelta({ currentRate, previousRate }: PrdRateDeltaProps) {
  if (previousRate === null) return null;

  const delta = currentRate - previousRate;

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-text-tertiary">
        No change
      </span>
    );
  }

  const isPositive = delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-sm font-medium ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`h-3 w-3 ${isPositive ? '' : 'rotate-180'}`}
        fill="currentColor"
      >
        <path d="M6 2L10 7H2L6 2Z" />
      </svg>
      {isPositive ? '+' : ''}
      {delta.toFixed(1)}%
    </span>
  );
}
