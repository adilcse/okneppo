"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Course } from '@/types/course';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CoursesResponse {
  courses: Course[];
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
const fetchCourses = async (page: number): Promise<CoursesResponse> => {
  const response = await fetch(`/api/courses?page=${page}&limit=10`);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
};

const deleteCourse = async (id: string) => {
  const response = await fetch(`/api/courses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${Cookies.get('admin-token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete course');
  }
  return response.json();
};

export default function CoursesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch courses query
  const { data, isLoading, error } = useQuery<CoursesResponse>({
    queryKey: ['courses', currentPage],
    queryFn: () => fetchCourses(currentPage),
    placeholderData: (previousData) => previousData
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  // Check authentication
  const token = Cookies.get('admin-token');
  if (!token) {
    router.push('/admin/login');
    return null;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // Pagination logic (with page numbers)
  const renderPaginationButtons = () => {
    if (!data?.pagination) return null;
    
    const { totalPages } = data.pagination;
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Previous</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          aria-current={i === currentPage ? "page" : undefined}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            i === currentPage
              ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Next</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="mr-6 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold">Courses Management</h1>
          </div>
          <Link
            href="/admin/courses/new"
            className="px-4 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Add New Course
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">Failed to load courses. Please try again.</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading courses...</p>
          </div>
        ) : (
          <>
            {/* Courses Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subjects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.courses?.map((course) => (
                      <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative h-16 w-16">
                            {!!course.images?.length && <Image
                              src={course.images[0]}
                              alt={course.title}
                              fill
                              className="object-cover rounded"
                            />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{course.discounted_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{course.max_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {course.subjects?.length || 0} subjects
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/courses/edit/${course.id}`}
                            className="text-emerald-600 hover:text-emerald-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {!!data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {renderPaginationButtons()}
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 