import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--ink-secondary)] mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 text-sm rounded-md border bg-[var(--surface-elevated)]
              focus:outline-none focus:ring-2 focus:border-transparent
              placeholder:text-[var(--ink-muted)]
              ${leftIcon ? 'pl-10' : ''}
              ${error ? 'border-[var(--error)]' : 'border-[var(--border-standard)]'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';