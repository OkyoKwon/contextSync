interface StepIndicatorProps {
  readonly stepCount: number;
  readonly activeStep: number;
}

export function StepIndicator({ stepCount, activeStep }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      {Array.from({ length: stepCount }, (_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              i === activeStep
                ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-400/30'
                : 'bg-surface-hover text-text-tertiary'
            }`}
          >
            {i + 1}
          </div>
          {i < stepCount - 1 && <div className="h-16 w-px bg-border-default" />}
        </div>
      ))}
    </div>
  );
}
