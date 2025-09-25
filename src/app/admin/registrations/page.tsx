"use client"
import React, { useEffect, useState } from 'react';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedState } from '@/lib/clientUtils';
import ResponsiveDataGrid, { ColumnDef } from '@/components/common/ResponsiveDataGrid';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import StatusButton from '@/components/admin/StatusButton';

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

interface StatusCounts {
  all: number;
  pending: number;
  completed: number;
  failed: number;
  cancelled: number;
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

async function getStatusCounts() {
  const res = await fetch('/api/registrations/counts', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch status counts');
  }
  return res.json() as Promise<{ success: boolean; counts: StatusCounts }>;
}

export default function AdminRegistrationsPage() {
  const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState('', 1000);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  const [page, setPage] = useState(1);
  console.log(isMobile);
    // Check if mobile
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

  // Fetch status counts
  const { data: statusCountsData, isLoading: countsLoading } = useQuery({
    queryKey: ['registration-counts'],
    queryFn: getStatusCounts,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use regular query for desktop pagination
  const { data, isLoading: loading } = useQuery({
    queryKey: ['registrations', { page, searchQuery: debouncedSearchTerm, sortBy, sortOrder, statusFilter }],
    queryFn: () => getRegistrations(page, 10, debouncedSearchTerm, sortBy, sortOrder, statusFilter),
    enabled: !isMobile && isMobile !== null
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
    },
    enabled: !!isMobile && isMobile !== null
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
      {/* Header with Create New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Registrations</h1>
        <button
          onClick={() => router.push('/admin/registrations/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Registration
        </button>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <StatusButton
          statusFilter={statusFilter}
          handleStatusFilter={handleStatusFilter}
          status="all"
          label="All"
          count={statusCountsData?.counts?.all || 0}
          activeColor="bg-blue-600 text-white"
          inactiveColor="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          isLoading={countsLoading}
        />
        <StatusButton
          statusFilter={statusFilter}
          handleStatusFilter={handleStatusFilter}
          status="pending"
          label="Pending"
          count={statusCountsData?.counts?.pending || 0}
          activeColor="bg-yellow-600 text-white"
          inactiveColor="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          isLoading={countsLoading}
        />
        <StatusButton
          statusFilter={statusFilter}
          handleStatusFilter={handleStatusFilter}
          status="completed"
          label="Completed"
          count={statusCountsData?.counts?.completed || 0}
          activeColor="bg-green-600 text-white"
          inactiveColor="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          isLoading={countsLoading}
        />
        <StatusButton
          statusFilter={statusFilter}
          handleStatusFilter={handleStatusFilter}
          status="failed"
          label="Failed"
          count={statusCountsData?.counts?.failed || 0}
          activeColor="bg-red-600 text-white"
          inactiveColor="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          isLoading={countsLoading}
        />
        <StatusButton
          statusFilter={statusFilter}
          handleStatusFilter={handleStatusFilter}
          status="cancelled"
          label="Cancelled"
          count={statusCountsData?.counts?.cancelled || 0}
          activeColor="bg-gray-600 text-white"
          inactiveColor="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          isLoading={countsLoading}
        />
      </div>

      <ResponsiveDataGrid
        data={isMobile ? registrations || [] : data?.data || []}
        columns={columns}
        pagination={isMobile ? pagination : data?.pagination}
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
        enableInfiniteScroll={!!isMobile}
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