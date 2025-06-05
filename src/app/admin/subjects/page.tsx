"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ListingPage from '@/components/admin/ListingPage';
import { Button } from '@/components/common';
import { Subject } from '@/types/course';
import { GetSubjectsRequest, GetSubjectsResponse } from '@/types/api';
import { DataGrid, Column } from '@/components/admin/DataGrid';
import Image from 'next/image';
import axiosClient from '@/lib/axios';

// API function
const fetchSubjects = async (params: GetSubjectsRequest): Promise<GetSubjectsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await axiosClient.get(`/api/subjects?${queryParams.toString()}`);
  return response.data;
};

// Delete subject mutation
const deleteSubject = async (id: string) => {
  const response = await axiosClient.delete(`/api/subjects/${id}`);
  return response.data;
};

export default function SubjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', { page, searchQuery, sortBy, sortOrder }],
    queryFn: () => fetchSubjects({
      page,
      limit: 10,
      search: searchQuery,
      sortBy,
      sortOrder
    })
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      // Invalidate subjects query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<Subject>[] = [
    {
      key: 'title',
      header: 'Subject',
      sortable: true,
      render: (subject) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <Image
              className="h-10 w-10 rounded-lg object-cover"
              src={subject.images?.[0] || '/images/OkneppoLogo.jpeg'}
              alt={subject.title}
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {subject.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {subject.description?.length > 50 
                ? `${subject.description.substring(0, 50)}...` 
                : subject.description}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'courses',
      header: 'Courses',
      render: (subject) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {subject.courses?.length || 0} courses
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (subject) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(subject.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (subject) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/subjects/edit/${subject.id}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(subject.id.toString())}
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
      title="Subjects"
      description="Manage your subject catalog"
      addButtonText="Add Subject"
      onAddClick={() => router.push('/admin/subjects/new')}
      searchPlaceholder="Search subjects..."
      onSearch={setSearchQuery}
    >
      <DataGrid
        columns={columns}
        data={data?.subjects || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        emptyMessage="No subjects found"
      />
    </ListingPage>
  );
} 