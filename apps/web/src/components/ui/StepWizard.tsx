interface Step {
  readonly id: string;
  readonly label: string;
}

interface StepWizardProps {
  readonly steps: readonly Step[];
  readonly currentStepId: string;
}

export function StepWizard({ steps, currentStepId }: StepWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-6 ${isCompleted ? 'bg-accent-primary' : 'bg-border-default'}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-accent-primary text-white'
                    : isCompleted
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-bg-tertiary text-text-tertiary'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs ${
                  isActive ? 'font-medium text-text-primary' : 'text-text-tertiary'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
