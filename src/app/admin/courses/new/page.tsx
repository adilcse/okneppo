"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import CourseForm, { CourseFormData } from '@/components/admin/CourseForm';
import { Subject } from '@/types/course';

interface SubjectsResponse {
  subjects: Subject[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// API functions
const createCourse = async (data: CourseFormData) => {
  const response = await axiosClient.post('/api/courses', data);
  return response.data;
};

const fetchSubjects = async (page: number): Promise<SubjectsResponse> => {
  const response = await axiosClient.get(`/api/subjects?page=${page}&limit=100`);
  return response.data;
};

export default function NewCourse() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch subjects query
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<SubjectsResponse>({
    queryKey: ['subjects', 1],
    queryFn: () => fetchSubjects(1),
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (!variables.createNew) {
        router.push('/admin/courses');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: CourseFormData, createNew?: boolean) => {
    try {
      await createMutation.mutateAsync({ ...data, createNew });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Course</h1>
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Courses
          </Link>
        </div>

        <CourseForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          error={error}
          submitButtonText="Create Course"
          showCreateNewButton={true}
          subjects={subjectsData?.subjects || []}
          isLoadingSubjects={isLoadingSubjects}
        />
      </div>
    </div>
  );
} 