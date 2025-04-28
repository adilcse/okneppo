import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-accent-light dark:bg-accent rounded-lg shadow-md dark:shadow-gray-700 p-6 transition-colors duration-300 ${className}`}>
      {title && <h3 className="text-foreground text-xl font-semibold mb-3">{title}</h3>}
      <div className="text-foreground">
        {children}
      </div>
    </div>
  );
}