import React from 'react';

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showInfo?: boolean;
  className?: string;
}

export default function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  showPageSizeSelector = true,
  showInfo = true,
  className = ''
}: PaginationProps) {
  const { page, totalPages, totalCount, limit, hasNextPage, hasPrevPage } = pagination;

  const generatePageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (page > 3) {
      pages.push(1);
      if (page > 4) pages.push('...');
    }
    
    // Show pages around current page
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (page < totalPages - 2) {
      if (page < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mt-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Previous
          </button>
          
          {generatePageNumbers().map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
              disabled={pageNum === '...'}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                pageNum === page
                  ? 'bg-blue-600 text-white'
                  : pageNum === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
              <select
                value={limit}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
          )}
          
          {showInfo && (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages} ({totalCount} total)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
