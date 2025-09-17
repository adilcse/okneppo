"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import ListingPage from '@/components/admin/ListingPage';
import { Button } from '@/components/common';
import { Course } from '@/types/course';
import { GetCoursesRequest, GetCoursesResponse } from '@/types/api';
import ResponsiveDataGrid, { Column } from '@/components/common/ResponsiveDataGrid';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import Image from 'next/image';
import axiosClient from '@/lib/axios';
import { useDebouncedState } from '@/lib/clientUtils';

// API function
const fetchCourses = async (params: GetCoursesRequest): Promise<GetCoursesResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await axiosClient.get(`/api/courses?${queryParams.toString()}`);
  return response.data;
};

// Delete course mutation
const deleteCourse = async (id: string) => {
  const response = await axiosClient.delete(`/api/courses/${id}`);
  return response.data;
};

export default function CoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, setSearchQuery, debouncedSearchQuery] = useDebouncedState('', 1000);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);

  // Use regular query for desktop pagination
  const { data, isLoading } = useQuery({
    queryKey: ['courses', { page, searchQuery: debouncedSearchQuery, sortBy, sortOrder }],
    queryFn: () => fetchCourses({
      page,
      limit: 10,
      search: debouncedSearchQuery,
      sortBy,
      sortOrder
    })
  });

  // Infinite data hook for mobile
  const {
    data: coursesData,
    pagination,
    isLoading: infiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteData<Course>({
    queryKey: ['courses-infinite', { searchQuery: debouncedSearchQuery, sortBy, sortOrder }],
    queryFn: async (pageParam) => {
      const response = await fetchCourses({
        page: pageParam,
        limit: 10,
        search: debouncedSearchQuery,
        sortBy,
        sortOrder
      });
      return {
        data: response.courses,
        pagination: {
          ...response.pagination,
          totalPages: Math.ceil(response.pagination.totalCount / response.pagination.limit)
        }
      };
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to desc
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: 'Course',
      sortable: true,
      render: (course) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <Image
              className="h-10 w-10 rounded-lg object-cover"
              src={course.images?.[0] || '/images/OkneppoLogo.jpeg'}
              alt={course.title}
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {course.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 prose prose-sm dark:prose-invert">
              <div dangerouslySetInnerHTML={{ 
                __html: course.description?.length > 50 
                  ? `${course.description.substring(0, 50)}...` 
                  : course.description 
              }} />
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'discounted_price',
      header: 'Price',
      sortable: true,
      render: (course) => (
        <div className="flex flex-col">
          <div className="text-sm text-gray-900 dark:text-white">
            ₹{course.discounted_price}
          </div>
          {Number(course.discount_percentage) > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
              ₹{course.max_price}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'subjects',
      header: 'Subjects',
      sortable: false,
      render: (course) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {course.subjects?.length || 0} subjects
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (course) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(course.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (course) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/courses/${course.id}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/courses/edit/${course.id}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            data-testid={`edit-button-${course.id}`}
          >
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(course.id.toString())}
            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
            disabled={deleteMutation.isPending}
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <ListingPage
      title="Courses"
      description="Manage your course catalog"
      addButtonText="Add Course"
      onAddClick={() => router.push('/admin/courses/new')}
      searchPlaceholder="Search courses..."
      onSearch={setSearchQuery}
    >
      <ResponsiveDataGrid
        columns={columns}
        data={data?.courses || coursesData || []}
        loading={isLoading || infiniteLoading}
        pagination={data?.pagination || pagination}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        emptyMessage="No courses found"
        showTitle={false}
        showSearch={false}
        enableInfiniteScroll={true}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onPageChange={setPage}
        pageSizeOptions={[5, 10, 25, 50]}
        showPageSizeSelector={true}
        showPaginationInfo={true}
      />
    </ListingPage>
  );
} 