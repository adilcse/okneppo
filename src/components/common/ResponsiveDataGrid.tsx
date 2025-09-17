import React, { useState, useEffect, useRef, useCallback } from 'react';
import TableHeader from './TableHeader';
import TableBody, { ColumnDef } from './TableBody';
import Pagination from './Pagination';

export type { ColumnDef };

// Backward compatibility for admin DataGrid
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Backward compatibility for admin DataGrid pagination
interface AdminPaginationData {
  page: number;
  limit: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ResponsiveDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[] | Column<T>[];
  pagination?: PaginationInfo | AdminPaginationData;
  loading?: boolean;
  error?: string | null;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  onSort?: (column: string) => void;
  
  // Pagination
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;
  
  // Infinite loading
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  
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
  
  // Card layout
  cardLayout?: boolean;
  cardClassName?: string;
  cardItemClassName?: string;
  
  // Title and actions
  title?: string;
  actions?: React.ReactNode;
  showTitle?: boolean;
  
  // Backward compatibility props
  isLoading?: boolean;
}

// Card component for mobile layout
function DataCard<T>({ 
  item, 
  columns, 
  onRowClick, 
  className = '' 
}: { 
  item: T; 
  columns: ColumnDef<T>[]; 
  onRowClick?: (item: T) => void;
  className?: string;
}) {
  const normalizedColumns = columns.map((col: ColumnDef<T> | Column<T>) => {
    if ('header' in col) {
      return {
        key: col.key,
        label: col.header,
        sortable: col.sortable,
        render: col.render,
        className: col.width ? `w-${col.width}` : undefined
      };
    }
    return col;
  });

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-4 hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={() => onRowClick?.(item)}
    >
      {normalizedColumns.map((column) => {
        // Skip actions column in card view, we'll handle it separately
        if (column.key === 'actions') return null;
        
        const value = column.render ? column.render(item, 0) : String((item as Record<string, unknown>)[column.key] || '');
        
        return (
          <div key={column.key} className="mb-3 last:mb-0">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {column.label}
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {value}
            </div>
          </div>
        );
      })}
      
      {/* Actions for card view */}
      {normalizedColumns.find(col => col.key === 'actions') && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          {normalizedColumns
            .find(col => col.key === 'actions')
            ?.render?.(item, 0)}
        </div>
      )}
    </div>
  );
}

// Infinite scroll hook
function useInfiniteScroll(
  callback: () => void,
  hasNextPage: boolean,
  isFetchingNextPage: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        callback();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, callback]);

  return { loadMoreRef: lastElementRef };
}

export default function ResponsiveDataGrid<T>({
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
  
  // Infinite loading
  enableInfiniteScroll = false,
  onLoadMore,
  hasNextPage = false,
  isFetchingNextPage = false,
  
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
  
  // Card layout
  cardLayout = false,
  cardClassName = '',
  cardItemClassName = '',
  
  // Title and actions
  title,
  actions,
  showTitle = true,
  
  // Backward compatibility
  isLoading: adminIsLoading = false
}: ResponsiveDataGridProps<T>) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isMobile, setIsMobile] = useState(false);

  // Use admin loading state if provided
  const isActuallyLoading = loading || adminIsLoading;

  // Convert admin columns to common format if needed
  const normalizedColumns: ColumnDef<T>[] = columns.map((col: ColumnDef<T> | Column<T>) => {
    if ('header' in col) {
      // This is an admin column, convert it
      return {
        key: col.key,
        label: col.header,
        sortable: col.sortable,
        render: col.render,
        className: col.width ? `w-${col.width}` : undefined
      };
    }
    return col;
  });

  // Normalize pagination data
  const normalizedPagination: PaginationInfo | undefined = pagination ? {
    page: pagination.page,
    limit: pagination.limit,
    totalCount: pagination.totalCount,
    totalPages: 'totalPages' in pagination ? pagination.totalPages : Math.ceil(pagination.totalCount / pagination.limit),
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage
  } : undefined;

  // Normalize sort order
  const normalizedSortOrder = sortOrder?.toUpperCase() as 'ASC' | 'DESC' || 'DESC';

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Infinite scroll setup
  const { loadMoreRef } = useInfiniteScroll(
    () => onLoadMore?.(),
    hasNextPage,
    isFetchingNextPage || false
  );

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

  if (error) {
    return (
      <div className={`container mx-auto px-4 py-8 ${className}`}>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  // Mobile card layout
  if (isMobile || cardLayout) {
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

        {/* Cards */}
        <div className={`space-y-4 ${cardClassName}`}>
          {isActuallyLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {loadingMessage}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </div>
          ) : (
            <>
              {data.map((item, index) => (
                <DataCard
                  key={index}
                  item={item}
                  columns={normalizedColumns}
                  onRowClick={onRowClick}
                  className={cardItemClassName}
                />
              ))}
              
              {/* Infinite scroll trigger - only for mobile cards */}
              {enableInfiniteScroll && (isMobile || cardLayout) && (
                <div ref={loadMoreRef} className="h-10">
                  {isFetchingNextPage && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Loading more...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Traditional pagination for mobile when infinite scroll is disabled */}
        {!enableInfiniteScroll && normalizedPagination && onPageChange && (
          <Pagination
            pagination={normalizedPagination}
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

  // Desktop table layout
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
              {normalizedColumns.map((column) => (
                <TableHeader
                  key={column.key}
                  column={column.key}
                  label={column.label}
                  sortable={column.sortable}
                  sortBy={sortBy}
                  sortOrder={normalizedSortOrder}
                  onSort={handleSort}
                  className={column.headerClassName}
                />
              ))}
            </tr>
          </thead>
          <TableBody
            data={data}
            columns={normalizedColumns}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
            loading={isActuallyLoading}
            loadingMessage={loadingMessage}
            className={bodyClassName}
            rowClassName={rowClassName}
          />
        </table>
      </div>

      {/* Pagination */}
      {normalizedPagination && onPageChange && (
        <Pagination
          pagination={normalizedPagination}
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
