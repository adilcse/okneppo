"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { Subject } from '@/types/course';
import SubjectForm, { SubjectFormData } from '@/components/admin/SubjectForm';

// API functions
const fetchSubject = async (id: string): Promise<Subject> => {
  const response = await axiosClient.get(`/api/subjects/${id}`);
  return response.data;
};

const updateSubject = async ({ id, data }: { id: string; data: SubjectFormData }) => {
  const response = await axiosClient.put(`/api/subjects/${id}`, data);
  return response.data;
};

export default function EditSubject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch subject query
  const { data: subject, isLoading, error: fetchError } = useQuery<Subject>({
    queryKey: ['subject', id],
    queryFn: () => fetchSubject(id)
  });

  // Update subject mutation
  const updateMutation = useMutation({
    mutationFn: updateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      router.push('/admin/subjects');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: SubjectFormData) => {
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading subject data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Subject</h1>
          <Link
            href="/admin/subjects"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Subjects
          </Link>
        </div>

        {fetchError && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6" role="alert">
            <span className="block sm:inline">Failed to load subject. Please try again.</span>
          </div>
        )}

        {subject && (
          <SubjectForm
            initialData={{
              title: subject.title,
              description: subject.description,
              images: subject.images || []
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            error={error}
            submitButtonText="Update Subject"
          />
        )}
      </div>
    </div>
  );
} 