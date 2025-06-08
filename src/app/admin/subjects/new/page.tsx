"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import SubjectForm, { SubjectFormData } from '@/components/admin/SubjectForm';

// API functions
const createSubject = async (data: SubjectFormData) => {
  const response = await axiosClient.post('/api/subjects', data);
  return response.data;
};

export default function NewSubject() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create subject mutation
  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (!variables.createNew) {
        router.push('/admin/subjects');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: SubjectFormData, createNew?: boolean) => {
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
          <h1 className="text-2xl font-bold">New Subject</h1>
          <Link
            href="/admin/subjects"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Subjects
          </Link>
        </div>

        <SubjectForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          error={error}
          submitButtonText="Create Subject"
          showCreateNewButton={true}
        />
      </div>
    </div>
  );
} 