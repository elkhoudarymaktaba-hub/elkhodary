// components/ui/input.tsx
import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 text-right">
        {label && (
          <label className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-[12px] font-arabic placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2E7FD9] dark:focus:border-[#2E7FD9] focus:ring-4 focus:ring-[#2E7FD9]/10 transition-all duration-200',
            {
              'border-red-500 focus:border-red-500 focus:ring-red-500/10': error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
