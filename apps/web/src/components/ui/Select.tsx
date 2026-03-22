import type { SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id: externalId, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = externalId ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`block w-full rounded-lg border border-border-input bg-page px-3 py-2 text-sm text-text-primary
            focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus
            disabled:bg-surface-hover disabled:text-text-muted
            ${error ? 'border-error focus:border-error focus:ring-error' : ''}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="text-sm text-error-muted" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
