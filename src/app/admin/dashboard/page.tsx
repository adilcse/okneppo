"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

// API functions
const fetchProductStats = async () => {
  const response = await fetch('/api/stats/products');
  if (!response.ok) {
    throw new Error('Failed to fetch product stats');
  }
  return response.json();
};

const fetchCategoryStats = async () => {
  const response = await fetch('/api/stats/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch category stats');
  }
  return response.json();
};

const fetchFeaturedStats = async () => {
  const response = await fetch('/api/stats/featured');
  if (!response.ok) {
    throw new Error('Failed to fetch featured stats');
  }
  return response.json();
};

const fetchCourseStats = async () => {
  const response = await fetch('/api/stats/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch course stats');
  }
  return response.json();
};

const fetchSubjectStats = async () => {
  const response = await fetch('/api/stats/subjects');
  if (!response.ok) {
    throw new Error('Failed to fetch subject stats');
  }
  return response.json();
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

  const handleLogout = () => {
    Cookies.remove('admin-token', { path: '/' });
    router.push('/admin/login');
  };

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Ok Neppo Admin</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-1 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Admin Main Content */}
      <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Total Products</h3>
              {isLoadingProducts ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{productStats?.count || 0}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Categories</h3>
              {isLoadingCategories ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{categoryStats?.count || 0}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Featured Products</h3>
              {isLoadingFeatured ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{featuredStats?.count || 0}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Total Courses</h3>
              {isLoadingCourses ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{courseStats?.count || 0}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Total Subjects</h3>
              {isLoadingSubjects ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{subjectStats?.count || 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Products Management</h2>
            <p className="text-gray-600 mb-4">
              Manage your products inventory - add new products, edit existing ones, or remove products from your store.
            </p>
            <Link
              href="/admin/products"
              className="inline-block px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Manage Products
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Courses Management</h2>
            <p className="text-gray-600 mb-4">
              Manage your courses - create new courses, edit existing ones, or remove courses from your platform.
            </p>
            <Link
              href="/admin/courses"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Manage Courses
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Subjects Management</h2>
            <p className="text-gray-600 mb-4">
              Manage your subjects - add new subjects, edit existing ones, or remove subjects from your platform.
            </p>
            <Link
              href="/admin/subjects"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Manage Subjects
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 