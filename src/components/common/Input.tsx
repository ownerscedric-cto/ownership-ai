import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {label}
            {props.required && <span className="text-[var(--error)] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border rounded-lg text-[var(--text-primary)] bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent ${
            error
              ? 'border-[var(--error)] focus:ring-[var(--error)]'
              : 'border-[var(--border-gray)]'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[var(--error)]">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
