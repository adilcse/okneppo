"use client";

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiTrash2, FiEdit, FiEye } from 'react-icons/fi';
import appApi from '@/lib/appApi';
import ThumbnailUpload from '@/components/admin/ThumbnailUpload';
import Image from 'next/image';

interface CourseFormData {
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  isPublished: boolean;
  totalLessons: number;
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const { id } = use(params);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    price: 0,
    thumbnail: '',
    duration: 0,
    level: 'beginner',
    category: '',
    isPublished: false,
    totalLessons: 0,
  });

  // Fetch course data
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['app-course', id],
    queryFn: () => appApi.getCourse(id),
    enabled: !!id,
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: (data: Partial<CourseFormData>) => appApi.updateCourse(id, data),
    onSuccess: () => {
      toast.success('Course updated successfully');
      queryClient.invalidateQueries({ queryKey: ['app-course', id] });
      queryClient.invalidateQueries({ queryKey: ['app-courses'] });
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course';
      toast.error(errorMessage);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: () => appApi.deleteCourse(id),
    onSuccess: () => {
      toast.success('Course deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['app-courses'] });
      router.push('/admin/app/courses');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete course';
      toast.error(errorMessage);
    },
  });

  // Initialize form data when course is loaded
  React.useEffect(() => {
    if (course?.data) {
      setFormData({
        title: course.data.title || '',
        description: course.data.description || '',
        price: course.data.price || 0,
        thumbnail: course.data.thumbnail || '',
        duration: course.data.duration || 0,
        level: course.data.level || 'beginner',
        category: course.data.category || '',
        isPublished: course.data.isPublished || false,
        totalLessons: course.data.totalLessons || 0,
      });
    }
  }, [course]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : name === 'price' || name === 'duration' || name === 'totalLessons' 
          ? Number(value) 
          : value
    }));
  };

  const handleSave = () => {
    updateCourseMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteCourseMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Error loading course</div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error.message || 'Something went wrong'}
        </p>
        <button
          onClick={() => router.push('/admin/app/courses')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course?.data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 dark:text-gray-300 text-lg mb-4">Course not found</div>
        <button
          onClick={() => router.push('/admin/app/courses')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/app/courses')}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Course' : 'Course Details'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {isEditing ? 'Update course information' : 'View and manage course details'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCourseMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateCourseMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4 mr-2" />
                {updateCourseMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter course title"
                  />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{course.data.title}</p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter course description"
                  />
                  ) : (
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{course.data.description}</p>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{course.data.category || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level
                  </label>
                  {isEditing ? (
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.data.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      course.data.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {course.data.level?.charAt(0).toUpperCase() + course.data.level?.slice(1) || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Lessons
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="totalLessons"
                      value={formData.totalLessons}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter total lessons"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{course.data.totalLessons || 0}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Published Status
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formData.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.data.isPublished 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {course.data.isPublished ? 'Published' : 'Draft'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing & Duration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter price"
                  />
                  ) : (
                    <p className="text-gray-900 dark:text-white">₹{course.data.price.toLocaleString()}</p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter duration in minutes"
                  />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {course.data.duration ? `${Math.floor(course.data.duration / 60)}h ${course.data.duration % 60}m` : 'Not specified'}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Thumbnail</h2>
            {isEditing ? (
              <ThumbnailUpload
                value={formData.thumbnail}
                onChange={(url) => setFormData(prev => ({ ...prev, thumbnail: url }))}
                onError={(error) => toast.error(error)}
              />
            ) : (
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {course.data.thumbnail ? (
                  <Image
                    src={course.data.thumbnail}
                    alt={course.data.title}
                    className="w-full h-full object-cover"
                    width={200}
                    height={200}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiEye className="w-12 h-12" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Course Information</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Created</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(course.data.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Updated</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(course.data.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {course.data.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Published</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(course.data.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Course ID</span>
                <span className="text-gray-900 dark:text-white font-mono text-sm">
                  {course.data.id}
                </span>
              </div>
            </div>
          </div>

          {/* Course Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Lessons</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {course.data.totalLessons}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Students</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {course.data.totalStudents}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Rating</span>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {course.data.rating}
                  </span>
                  <span className="text-yellow-500">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
