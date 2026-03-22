interface StepNumberProps {
  readonly step: number;
  readonly completed: boolean;
  readonly active: boolean;
}

export function StepNumber({ step, completed, active }: StepNumberProps) {
  if (completed) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
        active ? 'bg-accent-primary/20 text-accent-primary' : 'bg-surface-hover text-text-muted'
      }`}
    >
      {step}
    </span>
  );
}
