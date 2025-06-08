import { SelectHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Select({ 
  label, 
  error, 
  helperText,
  options,
  leftIcon,
  rightIcon,
  className = '', 
  ...props 
}: SelectProps) {
  const baseSelectClasses = "w-full px-4 py-2.5 rounded-lg border shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 appearance-none";
  const selectClasses = twMerge(
    baseSelectClasses,
    "bg-white dark:bg-gray-800",
    "border-gray-300 dark:border-gray-600",
    "text-gray-900 dark:text-white",
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
        <select
          className={selectClasses}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
} 