import { TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Textarea({ 
  label, 
  error, 
  helperText,
  className = '', 
  ...props 
}: TextareaProps) {
  const baseTextareaClasses = "w-full px-4 py-2.5 rounded-lg border shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200";
  const textareaClasses = twMerge(
    baseTextareaClasses,
    "bg-white dark:bg-gray-800",
    "border-gray-300 dark:border-gray-600",
    "text-gray-900 dark:text-white",
    "placeholder-gray-500 dark:placeholder-gray-400",
    "focus:border-primary-500 dark:focus:border-primary-400",
    "focus:ring-primary-500/20 dark:focus:ring-primary-400/20",
    error ? "border-red-500 dark:border-red-400" : "",
    className
  );

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        className={textareaClasses}
        {...props}
      />
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
} 