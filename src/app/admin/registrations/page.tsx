"use client"
import React, { useEffect, useState } from 'react';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { Course } from '@/types/course';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedState } from '@/lib/clientUtils';
import ResponsiveDataGrid, { ColumnDef } from '@/components/common/ResponsiveDataGrid';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import StatusButton from '@/components/admin/StatusButton';
import axiosClient from '@/lib/axios';

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

async function getRegistrations(page: number = 1, limit: number = 10, search: string = '', sortBy: string = 'created_at', sortOrder: string = 'DESC', status: string = 'all', courseId: string = 'all') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...(status !== 'all' && { status }),
    ...(courseId !== 'all' && { courseId })
  });
  
  const res = await fetch(`/api/course-registrations?${params}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch registrations');
  }
  return res.json() as Promise<RegistrationsResponse>;
}

async function getCourses() {
  const response = await axiosClient.get('/api/courses?limit=100');
  const allCourses = response.data.courses as Course[];
  return allCourses.filter(course => course.is_online_course);
}

async function getStatusCounts(courseId: string = 'all') {
  const params = new URLSearchParams({
    ...(courseId !== 'all' && { courseId }),
  });
  
  const res = await fetch(`/api/registrations/counts?${params}`, { cache: 'no-store' });
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
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
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

  // Fetch courses for filter
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['online-courses'],
    queryFn: getCourses,
  });

  // Fetch status counts
  const { data: statusCountsData, isLoading: countsLoading } = useQuery({
    queryKey: ['registration-counts', courseFilter],
    queryFn: () => getStatusCounts(courseFilter),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use regular query for desktop pagination
  const { data, isLoading: loading } = useQuery({
    queryKey: ['registrations', { page, searchQuery: debouncedSearchTerm, sortBy, sortOrder, statusFilter, courseFilter }],
    queryFn: () => getRegistrations(page, 10, debouncedSearchTerm, sortBy, sortOrder, statusFilter, courseFilter),
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
    queryKey: ['registrations-infinite', { searchQuery: debouncedSearchTerm, sortBy, sortOrder, statusFilter, courseFilter }],
    queryFn: async (pageParam) => {
      const response = await getRegistrations(pageParam, 10, debouncedSearchTerm, sortBy, sortOrder, statusFilter, courseFilter);
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(courseFilter !== 'all' && { courseId: courseFilter }),
      });
      
      const response = await fetch(`/api/course-registrations/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export registrations');
      }
      
      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'registrations.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting registrations:', error);
      alert('Failed to export registrations. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
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
      </div>

      {/* Course Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <label htmlFor="courseFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Course
        </label>
        <select
          id="courseFilter"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={coursesLoading}
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
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