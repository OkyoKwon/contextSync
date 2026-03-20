import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#D4D4D8]">{label}</label>
        )}
        <input
          ref={ref}
          className={`block w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-sm text-[#FAFAFA]
            placeholder:text-[#71717A]
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            disabled:bg-[#252525] disabled:text-[#71717A]
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
