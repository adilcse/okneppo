"use client"
import React, { useState } from 'react';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDebouncedState } from '@/lib/clientUtils';
import DataGrid, { ColumnDef } from '@/components/common/DataGrid';

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RegistrationsResponse {
  data: CourseRegistration[];
  pagination: PaginationInfo;
}

async function getRegistrations(page: number = 1, limit: number = 10, search: string = '', sortBy: string = 'created_at', sortOrder: string = 'DESC') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder
  });
  
  const res = await fetch(`/api/course-registrations?${params}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch registrations');
  }
  return res.json() as Promise<RegistrationsResponse>;
}

export default function AdminRegistrationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState('', 1000);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const router = useRouter();
  
  const { data: response, isLoading: loading, error } = useQuery<RegistrationsResponse>({
    queryKey: ['registrations', currentPage, pageSize, debouncedSearchTerm, sortBy, sortOrder],
    queryFn: () => getRegistrations(currentPage, pageSize, debouncedSearchTerm, sortBy, sortOrder),
  });

  const registrations = response?.data || [];
  const pagination = response?.pagination;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
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
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleRowClick = (registration: CourseRegistration) => {
    router.push(`/admin/registrations/${registration.id}`);
  };

  // Define columns for the DataGrid
  const columns: ColumnDef<CourseRegistration>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <span className="font-medium text-gray-900 dark:text-white">{reg.name}</span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (reg: CourseRegistration) => reg.email || 'N/A'
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (reg: CourseRegistration) => reg.phone
    },
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: false,
      render: (reg: CourseRegistration) => (
        <span className="font-mono">{reg.orderNumber || 'N/A'}</span>
      )
    },
    {
      key: 'amountDue',
      label: 'Final Fee',
      sortable: true,
      render: (reg: CourseRegistration) => `₹${reg.amountDue}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (reg: CourseRegistration) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          reg.status === RegistrationStatus.COMPLETED ? 'bg-green-100 text-green-800' :
          reg.status === RegistrationStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {reg.status}
        </span>
      )
    }
  ];

  return (
    <DataGrid
      data={registrations}
      columns={columns}
      pagination={pagination}
      loading={loading}
      error={error?.message}
      
      // Sorting
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      
      // Pagination
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      pageSizeOptions={[5, 10, 25, 50]}
      showPageSizeSelector={true}
      showPaginationInfo={true}
      
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
    />
  );
}