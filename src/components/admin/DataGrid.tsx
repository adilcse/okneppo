import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Button } from '@/components/common';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  pagination?: PaginationData;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  emptyMessage?: string;
  loadingMessage?: string;
}

export function DataGrid<T extends object>({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading...'
}: DataGridProps<T>) {
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort(column.key, sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && <SortIcon field={column.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                {loadingMessage}
              </td>
            </tr>
          ) : !data.length ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="mt-4 flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="ml-4 relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 