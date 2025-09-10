import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({ children, className, variant = 'default' }: CardProps) {
  const baseStyles = 'rounded-lg p-4';
  
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-md',
  };

  return (
    <div className={twMerge(baseStyles, variants[variant], className)}>
      {children}
    </div>
  );
} 