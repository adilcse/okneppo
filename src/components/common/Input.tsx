import { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({ 
  label, 
  error, 
  helperText,
  leftIcon,
  rightIcon,
  className = '', 
  ...props 
}: InputProps) {
  const baseInputClasses = "w-full px-4 py-2.5 rounded-lg border shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200";
  const inputClasses = twMerge(
    baseInputClasses,
    "bg-white dark:bg-gray-800",
    "border-gray-300 dark:border-gray-600",
    "text-gray-900 dark:text-white",
    "placeholder-gray-500 dark:placeholder-gray-400",
    "focus:border-primary-500 dark:focus:border-primary-400",
    "focus:ring-primary-500/20 dark:focus:ring-primary-400/20",
    error ? "border-red-500 dark:border-red-400" : "",
    leftIcon ? "pl-10" : "",
    rightIcon ? "pr-10" : "",
    className
  );

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
} 