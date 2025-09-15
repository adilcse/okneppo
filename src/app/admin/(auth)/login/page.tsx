"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/common';
import Image from 'next/image';
import Cookies from 'js-cookie';
import axiosClient from '@/lib/axios';

interface LoginFormData {
  username: string;
  password: string;
}

// API function
const login = async (data: LoginFormData) => {
  const response = await axiosClient.post('/api/admin/login', data);
  return response.data;
};

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.token) {
        // Store token in cookie
        Cookies.set('admin-token', data.token, { 
          expires: 7, // 7 days
          path: '/' 
        });
        router.push('/admin/dashboard');
      }
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/images/OkneppoLogo.jpeg"
            alt="Okneppo Logo"
            width={80}
            height={80}
            className="rounded-lg sm:w-[100px] sm:h-[100px]"
          />
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Login
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-6 px-4 shadow sm:rounded-lg sm:py-8 sm:px-10">
          {loginMutation.isError && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm" role="alert">
              <span className="block sm:inline">Invalid username or password.</span>
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm sm:text-base px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm sm:text-base px-3 py-2"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full text-sm sm:text-base"
                disabled={loginMutation.isPending}
                size="sm"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 