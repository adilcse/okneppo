"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { Card, Button } from '@/components/common';
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

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</h3>
              {isLoadingProducts ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{productStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</h3>
              {isLoadingCategories ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{categoryStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Featured Products</h3>
              {isLoadingFeatured ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{featuredStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</h3>
              {isLoadingCourses ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{courseStats?.count || 0}</p>
              )}
        </Card>
        
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Subjects</h3>
              {isLoadingSubjects ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{subjectStats?.count || 0}</p>
              )}
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your products inventory - add new products, edit existing ones, or remove products from your store.
            </p>
          <Link href="/admin/products">
            <Button variant="primary">Manage Products</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Courses Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your courses - create new courses, edit existing ones, or remove courses from your platform.
            </p>
          <Link href="/admin/courses">
            <Button variant="primary">Manage Courses</Button>
            </Link>
        </Card>

        <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subjects Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your subjects - create new subjects, edit existing ones, or remove subjects from your platform.
            </p>
          <Link href="/admin/subjects">
            <Button variant="primary">Manage Subjects</Button>
            </Link>
        </Card>
      </div>
    </div>
  );
} 