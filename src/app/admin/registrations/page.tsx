"use client"
import React, { useState } from 'react';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedState } from '@/lib/clientUtils';
import ResponsiveDataGrid, { ColumnDef } from '@/components/common/ResponsiveDataGrid';
import { useInfiniteData } from '@/hooks/useInfiniteData';

interface RegistrationsResponse {
  data: CourseRegistration[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

async function getRegistrations(page: number = 1, limit: number = 10, search: string = '', sortBy: string = 'created_at', sortOrder: string = 'DESC', status: string = 'all') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...(status !== 'all' && { status })
  });
  
  const res = await fetch(`/api/course-registrations?${params}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch registrations');
  }
  return res.json() as Promise<RegistrationsResponse>;
}

export default function AdminRegistrationsPage() {
  const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState('', 1000);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
  const router = useRouter();
  
  const [page, setPage] = useState(1);

  // Use regular query for desktop pagination
  const { data, isLoading: loading } = useQuery({
    queryKey: ['registrations', { page, searchQuery: debouncedSearchTerm, sortBy, sortOrder, statusFilter }],
    queryFn: () => getRegistrations(page, 10, debouncedSearchTerm, sortBy, sortOrder, statusFilter)
  });

  // Infinite data hook for mobile
  const {
    data: registrations,
    pagination,
    isLoading: infiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteData<CourseRegistration>({
    queryKey: ['registrations-infinite', { searchQuery: debouncedSearchTerm, sortBy, sortOrder, statusFilter }],
    queryFn: async (pageParam) => {
      const response = await getRegistrations(pageParam, 10, debouncedSearchTerm, sortBy, sortOrder, statusFilter);
      return {
        data: response.data,
        pagination: response.pagination
      };
    }
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilter = (status: 'all' | 'pending' | 'completed' | 'failed' | 'cancelled') => {
    setStatusFilter(status);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new column and default to ASC
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleRowClick = (registration: CourseRegistration) => {
    router.push(`/admin/registrations/${registration.id}`);
  };

  // Define columns for the DataGrid
  const columns: ColumnDef<CourseRegistration>[] = [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{reg.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{reg.email}</span>
        </div>
      )
    },
    {
      key: 'courseTitle',
      label: 'Course',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{reg.courseTitle}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 dark:text-white">{reg.phone}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{reg.address || 'No address'}</span>
        </div>
      )
    },
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: false,
      render: (reg: CourseRegistration) => (
        <span className="font-mono text-sm">{reg.orderNumber || 'N/A'}</span>
      )
    },
    {
      key: 'amountDue',
      label: 'Amount',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">₹{reg.amountDue}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Registered',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div>{new Date(reg.createdAt).toLocaleDateString()}</div>
          <div className="text-xs">{new Date(reg.createdAt).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          reg.status === RegistrationStatus.COMPLETED ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          reg.status === RegistrationStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
          reg.status === RegistrationStatus.FAILED ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {reg.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilter('all')}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleStatusFilter('pending')}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleStatusFilter('completed')}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
            statusFilter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => handleStatusFilter('failed')}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
            statusFilter === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Failed
        </button>
        <button
          onClick={() => handleStatusFilter('cancelled')}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
            statusFilter === 'cancelled'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Cancelled
        </button>
      </div>

      <ResponsiveDataGrid
        data={data?.data || registrations || []}
        columns={columns}
        pagination={data?.pagination || pagination}
        loading={loading || infiniteLoading}
        
        // Sorting
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        
        // Row interactions
        onRowClick={handleRowClick}
        
        // Search
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by name, email, or phone..."
        showSearch={true}
        
        // Empty state
        emptyMessage={searchTerm ? 'No registrations found matching your search.' : 'No registrations found.'}
        loadingMessage="Loading registrations..."
        
        // Title
        title="Course Registrations"
        showTitle={true}
        
        // Infinite scroll
        enableInfiniteScroll={true}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        
        // Pagination
        onPageChange={setPage}
        pageSizeOptions={[5, 10, 25, 50]}
        showPageSizeSelector={true}
        showPaginationInfo={true}
      />
    </div>
  );
}