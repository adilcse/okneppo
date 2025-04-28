import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10 dark:text-gray-200 dark:border-gray-200 dark:hover:bg-gray-800',
  };

  return (
    <button
      className={`px-4 py-2 rounded font-medium transition-colors cursor-pointer ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 