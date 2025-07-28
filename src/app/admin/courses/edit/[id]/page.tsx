"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import CourseForm, { CourseFormData } from '@/components/admin/CourseForm';
import { Course } from '@/types/course';
import { GetSubjectsResponse } from '@/types/api';
import { use } from 'react';
import axios from 'axios';

// API functions
const fetchCourse = async (id: string): Promise<Course> => {
  try {
    const response = await axiosClient.get(`/api/courses/${id}`);
    return response.data as Course;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch course');
    }
    throw error;
  }
};

const updateCourse = async ({ id, data }: { id: string; data: CourseFormData }) => {
  try {
    const response = await axiosClient.put(`/api/courses/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to update course');
    }
    throw error;
  }
};

const fetchSubjects = async (page: number): Promise<GetSubjectsResponse> => {
  const response = await axiosClient.get(`/api/subjects?page=${page}&limit=100`);
  return response.data;
};

export default function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch course query
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id),
  });

  // Fetch subjects query
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<GetSubjectsResponse>({
    queryKey: ['subjects', 1],
    queryFn: () => fetchSubjects(1),
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.push('/admin/courses');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: CourseFormData) => {
    setError(null); // Clear any previous errors
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch {
      // Error is already handled by onError in the mutation
      // We don't need to set it again here
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" role="status" aria-label="Loading"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError || !courseData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Course</h1>
            <Link
              href="/admin/courses"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Back to Courses
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-red-500 text-lg font-medium mb-4">Course not found</p>
              <p className="text-gray-600 dark:text-gray-400">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform course data to match CourseFormData format
  const initialFormData: CourseFormData = {
    title: courseData.title,
    description: courseData.description,
    max_price: Number(courseData.max_price),
    discounted_price: Number(courseData.discounted_price),
    discount_percentage: Number(courseData.discount_percentage),
    images: courseData.images,
    subjects: (courseData.subjects || []).map(subject => ({
      id: subject.id,
      order: 0 // Default order if not specified
    }))
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Courses
          </Link>
        </div>

        <CourseForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          error={error}
          submitButtonText="Update Course"
          subjects={subjectsData?.subjects || []}
          isLoadingSubjects={isLoadingSubjects}
        />
      </div>
    </div>
  );
} 