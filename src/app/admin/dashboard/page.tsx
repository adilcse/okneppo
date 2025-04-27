"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if admin token exists in cookie
    const token = Cookies.get('admin-token');

    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    // In a real app, we'd verify the token here
    // For now, we're just checking if it exists
    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Remove the token from cookie
    Cookies.remove('admin-token', { path: '/' });
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading dashboard...</p>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <h2 className="text-xl font-semibold mb-4">Models Management</h2>
            <p className="text-gray-600 mb-4">
              Update model information, showcase images, and featured model products for your homepage.
            </p>
            <Link
              href="/admin/models"
              className="inline-block px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Manage Models
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Total Products</h3>
              <p className="text-2xl font-bold">42</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Categories</h3>
              <p className="text-2xl font-bold">5</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Model Images</h3>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm text-gray-500 uppercase">Featured Products</h3>
              <p className="text-2xl font-bold">6</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 