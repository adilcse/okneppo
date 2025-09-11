import React, { useState } from 'react';
import TableHeader from './TableHeader';
import TableBody, { ColumnDef } from './TableBody';
import Pagination from './Pagination';

export { ColumnDef } from './TableBody';

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: PaginationInfo;
  loading?: boolean;
  error?: string | null;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (column: string) => void;
  
  // Pagination
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;
  
  // Row interactions
  onRowClick?: (item: T) => void;
  
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  
  // Empty state
  emptyMessage?: string;
  loadingMessage?: string;
  
  // Styling
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  
  // Title and actions
  title?: string;
  actions?: React.ReactNode;
  showTitle?: boolean;
}

export default function DataGrid<T>({
  data,
  columns,
  pagination,
  loading = false,
  error = null,
  
  // Sorting
  sortBy = '',
  sortOrder = 'DESC',
  onSort,
  
  // Pagination
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  showPageSizeSelector = true,
  showPaginationInfo = true,
  
  // Row interactions
  onRowClick,
  
  // Search
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  
  // Empty state
  emptyMessage = 'No data found.',
  loadingMessage = 'Loading...',
  
  // Styling
  className = '',
  tableClassName = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  
  // Title and actions
  title,
  actions,
  showTitle = true
}: DataGridProps<T>) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  const handlePageSizeChange = (size: number) => {
    onPageSizeChange?.(size);
  };

  if (error) {
    return (
      <div className={`container mx-auto px-4 py-8 ${className}`}>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      {/* Header */}
      {(showTitle && title) || actions ? (
        <div className="flex justify-between items-center mb-6">
          {showTitle && title && (
            <h1 className="text-2xl font-bold">{title}</h1>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      ) : null}

      {/* Search and Filters */}
      {showSearch && onSearchChange && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${tableClassName}`}>
          <thead className={`bg-gray-50 dark:bg-gray-700 ${headerClassName}`}>
            <tr>
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  column={column.key}
                  label={column.label}
                  sortable={column.sortable}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className={column.headerClassName}
                />
              ))}
            </tr>
          </thead>
          <TableBody
            data={data}
            columns={columns}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
            loading={loading}
            loadingMessage={loadingMessage}
            className={bodyClassName}
            rowClassName={rowClassName}
          />
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelector={showPageSizeSelector}
          showInfo={showPaginationInfo}
        />
      )}
    </div>
  );
}
