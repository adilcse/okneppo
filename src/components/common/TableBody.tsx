import React from 'react';

interface TableBodyProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export default function TableBody<T>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data found.',
  loading = false,
  loadingMessage = 'Loading...',
  className = '',
  rowClassName = ''
}: TableBodyProps<T>) {
  const getRowClassName = (item: T, index: number) => {
    const baseClasses = "bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700";
    const clickableClasses = onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150" : "";
    const customClasses = typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;
    
    return `${baseClasses} ${clickableClasses} ${customClasses}`.trim();
  };

  if (loading) {
    return (
      <tbody className={className}>
        <tr>
          <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            {loadingMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className={className}>
        <tr>
          <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={className}>
      {data.map((item, index) => (
        <tr
          key={index}
          onClick={() => onRowClick?.(item)}
          className={getRowClassName(item, index)}
        >
          {columns.map((column) => (
            <td
              key={column.key}
              className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 ${column.className || ''}`}
            >
              {column.render ? column.render(item, index) : String((item as Record<string, unknown>)[column.key] || '')}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
