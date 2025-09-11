import React from 'react';

interface TableHeaderProps {
  label: string;
  className?: string;
  sortable?: boolean;
  column?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (column: string) => void;
}

export default function TableHeader({
  label,
  className = '',
  sortable = false,
  column,
  sortBy,
  sortOrder,
  onSort
}: TableHeaderProps) {
  const isActive = sortable && sortBy === column;
  const isClickable = sortable && onSort && column;
  
  const handleClick = () => {
    if (isClickable) {
      onSort(column);
    }
  };
  
  const baseClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const clickableClasses = isClickable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none" : "";
  
  return (
    <th 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-blue-600 dark:text-blue-400">
            {sortOrder === 'ASC' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}
