"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiClock, FiTrendingUp, FiUsers, FiStar, FiBookOpen, FiGlobe } from 'react-icons/fi';
import DataGrid, { ColumnDef } from '@/components/common/DataGrid';
import appApi, { AppCourse } from '@/lib/appApi';
import Image from 'next/image';

export default function AppCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for pagination and search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch courses
  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['app-courses', page, limit, searchTerm, sortBy, sortOrder],
    queryFn: () => appApi.getCourses({
      page,
      limit,
      search: searchTerm || undefined,
      sortBy,
      sortOrder,
      all: "true"
    }),
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => appApi.deleteCourse(id),
    onSuccess: () => {
      toast.success('Course deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['app-courses'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete course');
    },
  });

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1); // Reset to first page when searching
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Handle row click
  const handleRowClick = (course: AppCourse) => {
    router.push(`/admin/app/courses/${course.id}`);
  };

  // Handle delete
  const handleDelete = (course: AppCourse, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
      deleteCourseMutation.mutate(course.id);
    }
  };

  // Define columns
  const columns: ColumnDef<AppCourse>[] = [
    {
      key: 'thumbnail',
      label: 'Thumbnail',
      sortable: false,
      render: (course: AppCourse) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
              width={48}
              height={48}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <FiEye className="w-6 h-6" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (course: AppCourse) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {course.title}
          </div>
          {course.category && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {course.category}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (course: AppCourse) => (
        <div className="flex items-center space-x-1">
          <span className="font-medium text-green-600">
            ₹{course.price.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'level',
      label: 'Level',
      sortable: true,
      render: (course: AppCourse) => {
        const levelColors = {
          beginner: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
        
        return course.level ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[course.level]}`}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (course: AppCourse) => (
        course.duration ? (
          <div className="flex items-center space-x-1">
            <FiClock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'isPublished',
      label: 'Status',
      sortable: true,
      render: (course: AppCourse) => (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            course.isPublished 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          }`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
          {course.isPublished && course.publishedAt && (
            <span className="text-xs text-gray-500">
              {new Date(course.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Stats',
      sortable: false,
      render: (course: AppCourse) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
            <FiBookOpen className="w-3 h-3" />
            <span>{course.totalLessons} lessons</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
            <FiUsers className="w-3 h-3" />
            <span>{course.totalStudents} students</span>
          </div>
          {course.rating > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
              <FiStar className="w-3 h-3 text-yellow-500" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (course: AppCourse) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/app/courses/${course.id}`}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => handleDelete(course, e)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            disabled={deleteCourseMutation.isPending}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">App Courses</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage courses for your mobile app
          </p>
        </div>
        <Link
          href="/admin/app/courses/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          New Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {coursesData?.pagination?.totalCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Courses</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiGlobe className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {coursesData?.data?.filter((course: AppCourse) => course.isPublished).length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Published</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <FiUsers className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {coursesData?.data?.reduce((sum: number, course: AppCourse) => sum + course.totalStudents, 0) || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* DataGrid */}
      <DataGrid
        data={coursesData?.data || []}
        columns={columns}
        pagination={coursesData?.pagination}
        loading={isLoading}
        error={error?.message}
        
        // Sorting
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        
        // Pagination
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        
        // Search
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search courses by title or category..."
        
        // Row interactions
        onRowClick={handleRowClick}
        
        // Customization
        title=""
        showSearch={true}
        showPageSizeSelector={true}
        emptyMessage="No courses found. Create your first course to get started."
        loadingMessage="Loading courses..."
      />
    </div>
  );
}
