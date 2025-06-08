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
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md dark:bg-gray-800',
  };

  return (
    <div className={twMerge(baseStyles, variants[variant], className)}>
      {children}
    </div>
  );
} 