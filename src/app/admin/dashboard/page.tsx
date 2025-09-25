"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { Card, Button } from '@/components/common';
import PaymentChart from '@/components/admin/PaymentChart';
import axiosClient from '@/lib/axios';

// API functions
const fetchProductStats = async () => {
  const response = await axiosClient.get('/api/stats/products');
  return response.data;
};

const fetchCategoryStats = async () => {
  const response = await axiosClient.get('/api/stats/categories');
  return response.data;
};

const fetchFeaturedStats = async () => {
  const response = await axiosClient.get('/api/stats/featured');
  return response.data;
};

const fetchCourseStats = async () => {
  const response = await axiosClient.get('/api/stats/courses');
  return response.data;
};

const fetchSubjectStats = async () => {
  const response = await axiosClient.get('/api/stats/subjects');
  return response.data;
};

const fetchRegistrationCounts = async () => {
  const response = await axiosClient.get('/api/registrations/counts');
  return response.data;
};

export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = Cookies.get('admin-token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  // Fetch stats using TanStack Query
  const { data: productStats, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['stats', 'products'],
    queryFn: fetchProductStats,
    enabled: isAuthorized
  });

  const { data: categoryStats, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['stats', 'categories'],
    queryFn: fetchCategoryStats,
    enabled: isAuthorized
  });

  const { data: featuredStats, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['stats', 'featured'],
    queryFn: fetchFeaturedStats,
    enabled: isAuthorized
  });

  const { data: courseStats, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['stats', 'courses'],
    queryFn: fetchCourseStats,
    enabled: isAuthorized
  });

  const { data: subjectStats, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['stats', 'subjects'],
    queryFn: fetchSubjectStats,
    enabled: isAuthorized
  });

  const { data: registrationCounts, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registration-counts'],
    queryFn: fetchRegistrationCounts,
    enabled: isAuthorized,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      {/* Stats Grid - Responsive layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</h3>
              {isLoadingProducts ? (
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16"></div>
                </div>
              ) : (
            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900 dark:text-white">{productStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Categories</h3>
              {isLoadingCategories ? (
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16"></div>
                </div>
              ) : (
            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900 dark:text-white">{categoryStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Featured Products</h3>
              {isLoadingFeatured ? (
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16"></div>
                </div>
              ) : (
            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900 dark:text-white">{featuredStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</h3>
              {isLoadingCourses ? (
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16"></div>
                </div>
              ) : (
            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900 dark:text-white">{courseStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Total Subjects</h3>
              {isLoadingSubjects ? (
                <div className="animate-pulse">
                  <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16"></div>
                </div>
              ) : (
            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-semibold text-gray-900 dark:text-white">{subjectStats?.count || 0}</p>
              )}
        </Card>
      </div>

      {/* Registration Statistics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Registration Statistics</h2>
          <Link href="/admin/registrations">
            <Button variant="secondary" className="text-sm">
              View All Registrations
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Total Registrations */}
          <Card variant="elevated" className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300">Total</h3>
                {isLoadingRegistrations ? (
                  <div className="animate-pulse">
                    <div className="h-6 md:h-8 bg-blue-200 dark:bg-blue-700 rounded w-12 md:w-16 mt-1 md:mt-2"></div>
                  </div>
                ) : (
                  <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {registrationCounts?.counts?.all || 0}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Pending Registrations */}
          <Card variant="elevated" className="p-4 md:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</h3>
                {isLoadingRegistrations ? (
                  <div className="animate-pulse">
                    <div className="h-6 md:h-8 bg-yellow-200 dark:bg-yellow-700 rounded w-12 md:w-16 mt-1 md:mt-2"></div>
                  </div>
                ) : (
                  <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                    {registrationCounts?.counts?.pending || 0}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Completed Registrations */}
          <Card variant="elevated" className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">Completed</h3>
                {isLoadingRegistrations ? (
                  <div className="animate-pulse">
                    <div className="h-6 md:h-8 bg-green-200 dark:bg-green-700 rounded w-12 md:w-16 mt-1 md:mt-2"></div>
                  </div>
                ) : (
                  <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-green-900 dark:text-green-100">
                    {registrationCounts?.counts?.completed || 0}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Failed Registrations */}
          <Card variant="elevated" className="p-4 md:p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-red-700 dark:text-red-300">Failed</h3>
                {isLoadingRegistrations ? (
                  <div className="animate-pulse">
                    <div className="h-6 md:h-8 bg-red-200 dark:bg-red-700 rounded w-12 md:w-16 mt-1 md:mt-2"></div>
                  </div>
                ) : (
                  <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-red-900 dark:text-red-100">
                    {registrationCounts?.counts?.failed || 0}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Cancelled Registrations */}
          <Card variant="elevated" className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Cancelled</h3>
                {isLoadingRegistrations ? (
                  <div className="animate-pulse">
                    <div className="h-6 md:h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 md:w-16 mt-1 md:mt-2"></div>
                  </div>
                ) : (
                  <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {registrationCounts?.counts?.cancelled || 0}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Analytics Chart */}
      <div className="space-y-4">
        <PaymentChart />
      </div>
      
      {/* Management Cards - Responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Products Management</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
              Manage your products inventory - add new products, edit existing ones, or remove products from your store.
            </p>
          <Link href="/admin/products">
            <Button variant="primary" className="w-full sm:w-auto">Manage Products</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Courses Management</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
              Manage your courses - create new courses, edit existing ones, or remove courses from your platform.
            </p>
          <Link href="/admin/courses">
            <Button variant="primary" className="w-full sm:w-auto">Manage Courses</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Subjects Management</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
            Manage your subjects - create new subjects, edit existing ones, or remove subjects from your platform.
            </p>
          <Link href="/admin/subjects">
            <Button variant="primary" className="w-full sm:w-auto">Manage Subjects</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Gallery Management</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
            Manage your image gallery - upload new images, reorder them, or remove images from your gallery.
            </p>
          <Link href="/admin/gallery">
            <Button variant="primary" className="w-full sm:w-auto">Manage Gallery</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-4 md:p-6 bg-white dark:bg-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Registration Management</h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">
            Manage course registrations - view all registrations, create new ones, or track payment status.
            </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/admin/registrations">
              <Button variant="primary" className="w-full sm:w-auto">View Registrations</Button>
            </Link>
            <Link href="/admin/registrations/new">
              <Button variant="secondary" className="w-full sm:w-auto">Create New</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
} 