"use client";

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Container } from '@/components/common';
import Cookies from 'js-cookie';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, error } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    Cookies.remove('admin-token', { path: '/' });
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
        if (error) {
            toast.error(error);
        }
      handleLogout();
    }
  }, [isAuthenticated, isLoading, handleLogout, error]);

  const isActive = (path: string) => {
    return pathname === path;
  };


  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Products', path: '/admin/products' },
    { name: 'Courses', path: '/admin/courses' },
    { name: 'Subjects', path: '/admin/subjects' },
    { name: 'Gallery', path: '/admin/gallery' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
              OKNEPPO Admin
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                View Site
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </Container>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`block px-4 py-2 rounded-md text-sm ${
                      isActive(item.path)
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Container>
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
} 