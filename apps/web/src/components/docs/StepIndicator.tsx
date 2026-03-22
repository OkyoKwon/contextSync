interface StepIndicatorProps {
  readonly stepCount: number;
  readonly activeStep: number;
}

export function StepIndicator({ stepCount, activeStep }: StepIndicatorProps) {
  return (
    <div className="flex h-full flex-col items-center py-5">
      {Array.from({ length: stepCount }, (_, i) => (
        <div key={i} className={`flex flex-col items-center ${i < stepCount - 1 ? 'flex-1' : ''}`}>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              i === activeStep
                ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-400/30'
                : i < activeStep
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-surface-hover text-text-tertiary'
            }`}
          >
            {i < activeStep ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < stepCount - 1 && <div className="w-px flex-1 bg-border-default" />}
        </div>
      ))}
    </div>
  );
}
